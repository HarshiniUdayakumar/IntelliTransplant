from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OrganCreate(BaseModel):
    organ_type: str
    blood_group: str
    donor_name: str
    donor_contact: str | None = None
    hospital_id: int


class OrganResponse(BaseModel):
    id: int
    organ_type: str
    blood_group: str
    donor_id: str
    donor_name: str
    donor_contact: str | None
    hospital_id: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)