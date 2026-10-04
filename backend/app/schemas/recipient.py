from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RecipientCreate(BaseModel):
    name: str
    age: int = Field(gt=0, le=120)
    organ_type: str
    blood_group: str
    urgency_level: int = Field(ge=1, le=5)
    pra_percentage: float = Field(ge=0, le=100)
    hospital_id: int


class RecipientResponse(BaseModel):
    id: int
    name: str
    age: int
    organ_type: str
    blood_group: str
    urgency_level: int
    pra_percentage: float
    hospital_id: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)