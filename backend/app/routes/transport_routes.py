from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.db.models import Hospital, Organ, Transport, Recipient

from app.ai_engines.astar_engine import (
    a_star_search,
    calculate_distance
)

from app.ai_engines.ucs_engine import uniform_cost_search

from app.ai_engines.bayesian_engine import (
    calculate_risk_probability
)
from app.ai_engines.coordination_agent import (
    coordinate_transplant_decision
)

router = APIRouter(
    prefix="/transport",
    tags=["Transport"]
)


# ============================================================
# A* TRANSPORT OPTIMIZATION
# ============================================================

@router.post("/optimize/{organ_id}/{destination_hospital_id}")
def optimize_transport_astar(
    organ_id: int,
    destination_hospital_id: int,
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # 1. Find organ
    # --------------------------------------------------------

    organ = db.query(Organ).filter(
        Organ.id == organ_id
    ).first()

    if not organ:
        raise HTTPException(
            status_code=404,
            detail="Organ not found"
        )

    # --------------------------------------------------------
    # 2. Find source hospital
    # --------------------------------------------------------

    source_hospital = db.query(Hospital).filter(
        Hospital.id == organ.hospital_id
    ).first()

    if not source_hospital:
        raise HTTPException(
            status_code=404,
            detail="Source hospital not found"
        )

    # --------------------------------------------------------
    # 3. Find destination hospital
    # --------------------------------------------------------

    destination_hospital = db.query(Hospital).filter(
        Hospital.id == destination_hospital_id
    ).first()

    if not destination_hospital:
        raise HTTPException(
            status_code=404,
            detail="Destination hospital not found"
        )

    # --------------------------------------------------------
    # 4. Get hospitals
    # --------------------------------------------------------

    hospitals_db = db.query(Hospital).all()

    if len(hospitals_db) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least two hospitals are required"
        )

    # --------------------------------------------------------
    # 5. Create graph
    # --------------------------------------------------------

    graph = {}

    hospitals = {}

    for hospital in hospitals_db:

        hospitals[hospital.id] = {
            "id": hospital.id,
            "name": hospital.name,
            "latitude": hospital.latitude,
            "longitude": hospital.longitude
        }

        graph[hospital.id] = []

    # Complete graph
    for hospital in hospitals_db:

        for other_hospital in hospitals_db:

            if hospital.id == other_hospital.id:
                continue

            graph[hospital.id].append(
                other_hospital.id
            )

    # --------------------------------------------------------
    # 6. Run A*
    # --------------------------------------------------------

    result = a_star_search(
        hospitals,
        graph,
        source_hospital.id,
        destination_hospital.id
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="No route found"
        )

    # --------------------------------------------------------
    # 7. Convert path IDs to names
    # --------------------------------------------------------

    hospital_map = {
        hospital.id: hospital.name
        for hospital in hospitals_db
    }

    route_names = [
        hospital_map[hospital_id]
        for hospital_id in result["path"]
    ]

    # --------------------------------------------------------
    # 8. Estimate transport time
    # Average speed = 60 km/hour
    # --------------------------------------------------------

    estimated_time_minutes = round(
        (result["distance_km"] / 60) * 60
    )

    # --------------------------------------------------------
    # 9. Find a waiting recipient for Bayesian reasoning
    # --------------------------------------------------------

    matched_recipient = db.query(Recipient).filter(
        Recipient.status == "waiting",
        Recipient.organ_type == organ.organ_type
    ).order_by(
        Recipient.urgency_level.desc()
    ).first()

    # --------------------------------------------------------
    # 10. Bayesian reasoning
    # --------------------------------------------------------

    if matched_recipient:

        bayesian_result = calculate_risk_probability(
            urgency_level=matched_recipient.urgency_level,
            pra_percentage=matched_recipient.pra_percentage,
            transport_time_minutes=estimated_time_minutes
        )

    else:

        bayesian_result = {
            "success_probability": 0,
            "risk_probability": 100,
            "urgency_factor": 0,
            "pra_factor": 0,
            "transport_factor": 0
        }
    # --------------------------------------------------------
    # 11. Intelligent Coordination Agent
    # --------------------------------------------------------

    if matched_recipient:

        compatibility_score = (
            50
            + matched_recipient.urgency_level * 8
            + max(
                0,
                20 - (matched_recipient.pra_percentage / 5)
            )
        )

        coordination_result = coordinate_transplant_decision(
            compatibility_score=compatibility_score,
            success_probability=bayesian_result["success_probability"],
            risk_probability=bayesian_result["risk_probability"],
            transport_time_minutes=estimated_time_minutes
        )

    else:

        coordination_result = {
            "decision": "reassess",
            "compatibility_status": "unknown",
            "probability_status": "unknown",
            "transport_status": "unknown",
            "risk_probability": 100,
            "recommended_actions": [
                "No suitable waiting recipient found"
            ]
        }

    # --------------------------------------------------------
    # 11. Save transport record
    # --------------------------------------------------------

    transport = Transport(
        organ_id=organ.id,
        source_hospital_id=source_hospital.id,
        destination_hospital_id=destination_hospital.id,
        route=" → ".join(route_names),
        distance_km=result["distance_km"],
        estimated_time_minutes=estimated_time_minutes,
        status="planned"
    )

    db.add(transport)
    db.commit()
    db.refresh(transport)

    # --------------------------------------------------------
    # 12. Return result
    # --------------------------------------------------------

    return {
        "transport_id": transport.id,
        "organ_id": organ.id,
        "source_hospital": source_hospital.name,
        "destination_hospital": destination_hospital.name,
        "route": route_names,
        "distance_km": result["distance_km"],
        "estimated_time_minutes": estimated_time_minutes,
        "algorithm": "A* Search",

        "bayesian_analysis": bayesian_result,
        "coordination": coordination_result,
        "status": transport.status
    }


# ============================================================
# UNIFORM COST SEARCH TRANSPORT OPTIMIZATION
# ============================================================

@router.post("/ucs/{organ_id}/{destination_hospital_id}")
def optimize_transport_ucs(
    organ_id: int,
    destination_hospital_id: int,
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # 1. Find organ
    # --------------------------------------------------------

    organ = db.query(Organ).filter(
        Organ.id == organ_id
    ).first()

    if not organ:
        raise HTTPException(
            status_code=404,
            detail="Organ not found"
        )

    # --------------------------------------------------------
    # 2. Find source hospital
    # --------------------------------------------------------

    source_hospital = db.query(Hospital).filter(
        Hospital.id == organ.hospital_id
    ).first()

    if not source_hospital:
        raise HTTPException(
            status_code=404,
            detail="Source hospital not found"
        )

    # --------------------------------------------------------
    # 3. Find destination hospital
    # --------------------------------------------------------

    destination_hospital = db.query(Hospital).filter(
        Hospital.id == destination_hospital_id
    ).first()

    if not destination_hospital:
        raise HTTPException(
            status_code=404,
            detail="Destination hospital not found"
        )

    # --------------------------------------------------------
    # 4. Get hospitals
    # --------------------------------------------------------

    hospitals_db = db.query(Hospital).all()

    if len(hospitals_db) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least two hospitals are required"
        )

    # --------------------------------------------------------
    # 5. Create graph and edge costs
    # --------------------------------------------------------

    graph = {}
    edge_costs = {}

    for hospital in hospitals_db:

        graph[hospital.id] = []

        for other_hospital in hospitals_db:

            if hospital.id == other_hospital.id:
                continue

            graph[hospital.id].append(
                other_hospital.id
            )

            distance = calculate_distance(
                hospital.latitude,
                hospital.longitude,
                other_hospital.latitude,
                other_hospital.longitude
            )

            edge_costs[
                (hospital.id, other_hospital.id)
            ] = distance

    # --------------------------------------------------------
    # 6. Run UCS
    # --------------------------------------------------------

    result = uniform_cost_search(
        graph,
        edge_costs,
        source_hospital.id,
        destination_hospital.id
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="No route found"
        )

    # --------------------------------------------------------
    # 7. Convert path IDs to names
    # --------------------------------------------------------

    hospital_map = {
        hospital.id: hospital.name
        for hospital in hospitals_db
    }

    route_names = [
        hospital_map[hospital_id]
        for hospital_id in result["path"]
    ]

    # --------------------------------------------------------
    # 8. Estimate transport time
    # Average speed = 60 km/hour
    # --------------------------------------------------------

    estimated_time_minutes = round(
        (result["cost"] / 60) * 60
    )

    # --------------------------------------------------------
    # 9. Find waiting recipient
    # --------------------------------------------------------

    matched_recipient = db.query(Recipient).filter(
        Recipient.status == "waiting",
        Recipient.organ_type == organ.organ_type
    ).order_by(
        Recipient.urgency_level.desc()
    ).first()

    # --------------------------------------------------------
    # 10. Bayesian reasoning
    # --------------------------------------------------------

    if matched_recipient:

        bayesian_result = calculate_risk_probability(
            urgency_level=matched_recipient.urgency_level,
            pra_percentage=matched_recipient.pra_percentage,
            transport_time_minutes=estimated_time_minutes
        )

    else:

        bayesian_result = {
            "success_probability": 0,
            "risk_probability": 100,
            "urgency_factor": 0,
            "pra_factor": 0,
            "transport_factor": 0
        }
        # --------------------------------------------------------
    # 11. Intelligent Coordination Agent
    # --------------------------------------------------------

    if matched_recipient:

        compatibility_score = (
            50
            + matched_recipient.urgency_level * 8
            + max(
                0,
                20 - (matched_recipient.pra_percentage / 5)
            )
        )

        coordination_result = coordinate_transplant_decision(
            compatibility_score=compatibility_score,
            success_probability=bayesian_result["success_probability"],
            risk_probability=bayesian_result["risk_probability"],
            transport_time_minutes=estimated_time_minutes
        )

    else:

        coordination_result = {
            "decision": "reassess",
            "compatibility_status": "unknown",
            "probability_status": "unknown",
            "transport_status": "unknown",
            "risk_probability": 100,
            "recommended_actions": [
                "No suitable waiting recipient found"
            ]
        }
    # --------------------------------------------------------
    # 11. Save transport record
    # --------------------------------------------------------

    transport = Transport(
        organ_id=organ.id,
        source_hospital_id=source_hospital.id,
        destination_hospital_id=destination_hospital.id,
        route=" → ".join(route_names),
        distance_km=result["cost"],
        estimated_time_minutes=estimated_time_minutes,
        status="planned"
    )

    db.add(transport)
    db.commit()
    db.refresh(transport)

    # --------------------------------------------------------
    # 12. Return result
    # --------------------------------------------------------

    return {
        "transport_id": transport.id,
        "organ_id": organ.id,
        "source_hospital": source_hospital.name,
        "destination_hospital": destination_hospital.name,
        "route": route_names,
        "distance_km": result["cost"],
        "estimated_time_minutes": estimated_time_minutes,
        "algorithm": "Uniform Cost Search",
        "bayesian_analysis": bayesian_result,
        "coordination": coordination_result,
        "status": transport.status
    }