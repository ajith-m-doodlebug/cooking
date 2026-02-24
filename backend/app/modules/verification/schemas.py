from datetime import datetime
from pydantic import BaseModel
from app.modules.ca.models import VerificationStatus


class VerificationStatusResponse(BaseModel):
    ca_id: str
    verification_status: VerificationStatus
    last_checked_at: datetime | None = None
    failure_reason: str | None = None


class VerificationLogEntry(BaseModel):
    id: str
    attempt_number: int
    status: VerificationStatus
    icai_number_queried: str
    submitted_name: str
    extracted_name: str | None
    match_score: float | None
    failure_reason: str | None
    checked_at: datetime

    model_config = {"from_attributes": True}


class RetryVerificationRequest(BaseModel):
    icai_membership_number: str
    full_name: str
