from datetime import datetime
from pydantic import BaseModel
from app.modules.auth.models import UserRole


class TermsContentResponse(BaseModel):
    id: str
    role: UserRole
    version: str
    content: str

    model_config = {"from_attributes": True}


class AcceptTermsRequest(BaseModel):
    version: str


class TermsAcceptanceResponse(BaseModel):
    user_id: str
    role: UserRole
    version: str
    accepted_at: datetime

    model_config = {"from_attributes": True}


class TermsStatusResponse(BaseModel):
    has_accepted: bool
    current_version: str
    accepted_version: str | None
