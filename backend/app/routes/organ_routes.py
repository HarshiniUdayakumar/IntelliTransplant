from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.db.models import Organ
from app.schemas.organ import OrganCreate, OrganResponse

router = APIRouter(
    prefix="/organs",
    tags=["Organs"]
)


@router.post("/", response_model=OrganResponse)
def create_organ(
    organ_data: OrganCreate,
    db: Session = Depends(get_db)
):
    new_organ = Organ(
        organ_type=organ_data.organ_type,
        blood_group=organ_data.blood_group,
        donor_id=organ_data.donor_id,
        hospital_id=organ_data.hospital_id
    )

    db.add(new_organ)
    db.commit()
    db.refresh(new_organ)

    return new_organ


@router.get("/", response_model=list[OrganResponse])
def get_organs(db: Session = Depends(get_db)):
    return db.query(Organ).all()