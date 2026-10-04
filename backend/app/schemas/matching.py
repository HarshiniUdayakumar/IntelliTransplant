from pydantic import BaseModel


class MatchResponse(BaseModel):
    organ_id: int
    recipient_id: int | None
    blood_group_match: str
    pra_score: float
    compatibility_score: float
    decision: str
    reason: str | None