
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.db.models import Organ, Recipient, MatchResult
from app.ai_engines.csp_engine import (
    blood_group_compatible,
    calculate_match_score,
)
from app.ai_engines.knowledge_engine import check_eligibility
from app.schemas.matching import MatchResponse


router = APIRouter(
    prefix="/matching",
    tags=["Matching"],
)


@router.post(
    "/find-best-match/{organ_id}",
    response_model=MatchResponse,
)
def find_best_organ_match(
    organ_id: int,
    db: Session = Depends(get_db),
):
    # 1. Find the requested organ
    selected_organ = (
        db.query(Organ)
        .filter(Organ.id == organ_id)
        .first()
    )

    if not selected_organ:
        raise HTTPException(
            status_code=404,
            detail="Organ not found",
        )

    # 2. Ensure the organ is available
    if selected_organ.status != "available":
        return {
            "organ_id": selected_organ.id,
            "recipient_id": None,
            "blood_group_match": "Unavailable",
            "pra_score": 0,
            "compatibility_score": 0,
            "decision": "no_match",
            "reason": "Selected organ is not available",
        }

    # 3. Get waiting recipients
    recipients = (
        db.query(Recipient)
        .filter(Recipient.status == "waiting")
        .all()
    )

    if not recipients:
        return {
            "organ_id": selected_organ.id,
            "recipient_id": None,
            "blood_group_match": "No recipients",
            "pra_score": 0,
            "compatibility_score": 0,
            "decision": "no_match",
            "reason": "No waiting recipients available",
        }

    # 4. Convert selected organ to dictionary
    organ_data = {
        "id": selected_organ.id,
        "organ_type": selected_organ.organ_type,
        "blood_group": selected_organ.blood_group,
        "donor_id": selected_organ.donor_id,
        "donor_name": selected_organ.donor_name,
        "donor_contact": selected_organ.donor_contact,
        "hospital_id": selected_organ.hospital_id,
        "status": selected_organ.status,
    }

    # 5. Find eligible recipients for this organ only
    eligible_recipients = []

    for recipient in recipients:
        recipient_data = {
            "id": recipient.id,
            "name": recipient.name,
            "age": recipient.age,
            "organ_type": recipient.organ_type,
            "blood_group": recipient.blood_group,
            "urgency_level": recipient.urgency_level,
            "pra_percentage": recipient.pra_percentage,
            "hospital_id": recipient.hospital_id,
            "status": recipient.status,
        }

        eligibility = check_eligibility(
            organ_data,
            recipient_data,
        )

        if eligibility["eligible"]:
            score = calculate_match_score(
                organ_data,
                recipient_data,
            )

            eligible_recipients.append(
                (recipient, score)
            )

    # 6. Handle the case where no recipient is eligible
    if not eligible_recipients:
        return {
            "organ_id": selected_organ.id,
            "recipient_id": None,
            "blood_group_match": "Incompatible",
            "pra_score": 0,
            "compatibility_score": 0,
            "decision": "no_match",
            "reason": (
                "No eligible recipient found for this organ"
            ),
        }

    # 7. Select the highest-scoring eligible recipient
    matched_recipient, best_score = max(
        eligible_recipients,
        key=lambda item: item[1],
    )

    # 8. Confirm blood-group compatibility
    blood_match = blood_group_compatible(
        selected_organ.blood_group,
        matched_recipient.blood_group,
    )

    # 9. Build the explanation
    reason = (
        f"{selected_organ.organ_type} type compatible, "
        f"blood group compatible, "
        f"urgency level {matched_recipient.urgency_level}, "
        f"PRA {matched_recipient.pra_percentage}%"
    )

    # 10. Save the matching result
    match_result = MatchResult(
        organ_id=selected_organ.id,
        recipient_id=matched_recipient.id,
        blood_group_match=(
            "Compatible" if blood_match else "Incompatible"
        ),
        pra_score=matched_recipient.pra_percentage,
        compatibility_score=best_score,
        decision="recommended",
        reason=reason,
    )

    db.add(match_result)
    db.commit()

    # 11. Return the result
    return {
        "organ_id": selected_organ.id,
        "recipient_id": matched_recipient.id,
        "blood_group_match": (
            "Compatible" if blood_match else "Incompatible"
        ),
        "pra_score": matched_recipient.pra_percentage,
        "compatibility_score": best_score,
        "decision": "recommended",
        "reason": reason,
    }
