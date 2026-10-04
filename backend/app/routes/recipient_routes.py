from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.db.models import Recipient
from app.schemas.recipient import (
    RecipientCreate,
    RecipientResponse,
)

router = APIRouter(
    prefix="/recipients",
    tags=["Recipients"]
)


@router.post("/", response_model=RecipientResponse)
def create_recipient(
    recipient_data: RecipientCreate,
    db: Session = Depends(get_db)
):
    new_recipient = Recipient(
        name=recipient_data.name,
        age=recipient_data.age,
        organ_type=recipient_data.organ_type,
        blood_group=recipient_data.blood_group,
        urgency_level=recipient_data.urgency_level,
        pra_percentage=recipient_data.pra_percentage,
        hospital_id=recipient_data.hospital_id
    )

    db.add(new_recipient)
    db.commit()
    db.refresh(new_recipient)

    return new_recipient


@router.get("/", response_model=list[RecipientResponse])
def get_recipients(db: Session = Depends(get_db)):
    return db.query(Recipient).all()