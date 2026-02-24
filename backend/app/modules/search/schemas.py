from pydantic import BaseModel
from typing import List
from app.modules.ca.models import ConsultationMode


class CASearchResult(BaseModel):
    id: str
    full_name: str
    icai_membership_number: str
    year_of_qualification: int | None
    firm_name: str | None
    services: List[str]
    consultation_mode: ConsultationMode
    languages: List[str]
    experience_years: int | None
    fee_online: float | None
    fee_inperson: float | None
    available_days: List[str]
    disclaimer: str = (
        "This platform is a neutral technology facilitator and does not endorse any Chartered Accountant."
    )


class CASearchResponse(BaseModel):
    items: List[CASearchResult]
    total: int
    page: int
    size: int
    pages: int
