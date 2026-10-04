from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.db.models import Organ, Recipient, MatchResult
from app.ai_engines.csp_engine import (
    blood_group_compatible,
    find_best_assignment
)
from app.schemas.matching import MatchResponse
from app.ai_engines.knowledge_engine import check_eligibility

router = APIRouter(
    prefix="/matching",
    tags=["Matching"]
)


@router.post(
    "/find-best-match/{organ_id}",
    response_model=MatchResponse
)
def find_best_organ_match(
    organ_id: int,
    db: Session = Depends(get_db)
):

    # -----------------------------------------
    # 1. Find requested organ
    # -----------------------------------------

    selected_organ = db.query(Organ).filter(
        Organ.id == organ_id
    ).first()

    if not selected_organ:
        raise HTTPException(
            status_code=404,
            detail="Organ not found"
        )

    # -----------------------------------------
    # 2. Get all available organs
    # -----------------------------------------

    organs = db.query(Organ).filter(
        Organ.status == "available"
    ).all()

    # -----------------------------------------
    # 3. Get all waiting recipients
    # -----------------------------------------

    recipients = db.query(Recipient).filter(
        Recipient.status == "waiting"
    ).all()

    if not recipients:
        return {
            "organ_id": selected_organ.id,
            "recipient_id": None,
            "blood_group_match": "No recipients",
            "pra_score": 0,
            "compatibility_score": 0,
            "decision": "no_match",
            "reason": "No waiting recipients available"
        }

    # -----------------------------------------
    # 4. Convert database organs to dictionaries
    # -----------------------------------------

    organ_data = []

    for organ in organs:

        organ_data.append({
            "id": organ.id,
            "organ_type": organ.organ_type,
            "blood_group": organ.blood_group,
            "donor_id": organ.donor_id,
            "hospital_id": organ.hospital_id,
            "status": organ.status
        })
    selected_organ_data = {
    "id": selected_organ.id,
    "organ_type": selected_organ.organ_type,
    "blood_group": selected_organ.blood_group,
    "donor_id": selected_organ.donor_id,
    "hospital_id": selected_organ.hospital_id,
    "status": selected_organ.status
}

    # -----------------------------------------
    # 5. Convert database recipients
    #    to dictionaries
    # -----------------------------------------

    recipient_data = []

    for recipient in recipients:

        recipient_info = {
            "id": recipient.id,
            "name": recipient.name,
            "age": recipient.age,
            "organ_type": recipient.organ_type,
            "blood_group": recipient.blood_group,
            "urgency_level": recipient.urgency_level,
            "pra_percentage": recipient.pra_percentage,
            "hospital_id": recipient.hospital_id,
            "status": recipient.status
        }

        # Apply Knowledge-Based Rules
        eligibility = check_eligibility(
            selected_organ_data,
            recipient_info
        )

        # Only eligible recipients go to CSP
        if eligibility["eligible"]:
            recipient_data.append(recipient_info)
    # -----------------------------------------
    # 6. Run CSP + Backtracking
    # -----------------------------------------

    best_assignment = find_best_assignment(
        organ_data,
        recipient_data
    )

    # -----------------------------------------
    # 7. No valid assignment
    # -----------------------------------------

    if not best_assignment:

        return {
            "organ_id": selected_organ.id,
            "recipient_id": None,
            "blood_group_match": "Incompatible",
            "pra_score": 0,
            "compatibility_score": 0,
            "decision": "no_match",
            "reason": "No valid CSP assignment found"
        }

    # -----------------------------------------
    # 8. Find assignment for requested organ
    # -----------------------------------------

    selected_assignment = None

    for assignment in best_assignment:

        if assignment["organ_id"] == selected_organ.id:

            selected_assignment = assignment
            break

    # -----------------------------------------
    # 9. Requested organ was not assigned
    # -----------------------------------------

    if not selected_assignment:

        return {
            "organ_id": selected_organ.id,
            "recipient_id": None,
            "blood_group_match": "No assignment",
            "pra_score": 0,
            "compatibility_score": 0,
            "decision": "no_match",
            "reason": "The selected organ was not assigned in the best CSP solution"
        }

    # -----------------------------------------
    # 10. Get matched recipient
    # -----------------------------------------

    matched_recipient = db.query(Recipient).filter(
        Recipient.id == selected_assignment["recipient_id"]
    ).first()

    if not matched_recipient:

        raise HTTPException(
            status_code=404,
            detail="Matched recipient not found"
        )

    # -----------------------------------------
    # 11. Check blood compatibility
    # -----------------------------------------

    blood_match = blood_group_compatible(
        selected_organ.blood_group,
        matched_recipient.blood_group
    )

    # -----------------------------------------
    # 12. Create match result
    # -----------------------------------------

    reason = (
        f"{selected_organ.organ_type} type compatible, "
        f"blood group compatible, "
        f"urgency level {matched_recipient.urgency_level}, "
        f"PRA {matched_recipient.pra_percentage}%"
    )

    match_result = MatchResult(
        organ_id=selected_organ.id,
        recipient_id=matched_recipient.id,
        blood_group_match=(
            "Compatible"
            if blood_match
            else "Incompatible"
        ),
        pra_score=matched_recipient.pra_percentage,
        compatibility_score=selected_assignment["score"],
        decision="recommended",
        reason=reason
    )

    db.add(match_result)
    db.commit()

    # -----------------------------------------
    # 13. Return AI decision
    # -----------------------------------------

    return {
        "organ_id": selected_organ.id,
        "recipient_id": matched_recipient.id,
        "blood_group_match": (
            "Compatible"
            if blood_match
            else "Incompatible"
        ),
        "pra_score": matched_recipient.pra_percentage,
        "compatibility_score": selected_assignment["score"],
        "decision": "recommended",
        "reason": reason
    }