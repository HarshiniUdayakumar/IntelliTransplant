from pydantic import BaseModel, ConfigDict, Field


class HospitalCreate(BaseModel):
    name: str
    city: str
    latitude: float
    longitude: float
    contact_number: str | None = None


class HospitalResponse(BaseModel):
    id: int
    name: str
    city: str
    latitude: float
    longitude: float
    contact_number: str | None

    model_config = ConfigDict(from_attributes=True)