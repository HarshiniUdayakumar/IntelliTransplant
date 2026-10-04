from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.db.models import Hospital
from app.schemas.hospital import HospitalCreate, HospitalResponse

router = APIRouter(
    prefix="/hospitals",
    tags=["Hospitals"]
)


@router.post("/", response_model=HospitalResponse)
def create_hospital(
    hospital_data: HospitalCreate,
    db: Session = Depends(get_db)
):
    new_hospital = Hospital(
        name=hospital_data.name,
        city=hospital_data.city,
        latitude=hospital_data.latitude,
        longitude=hospital_data.longitude,
        contact_number=hospital_data.contact_number
    )

    db.add(new_hospital)
    db.commit()
    db.refresh(new_hospital)

    return new_hospital


@router.get("/", response_model=list[HospitalResponse])
def get_hospitals(db: Session = Depends(get_db)):
    return db.query(Hospital).all()