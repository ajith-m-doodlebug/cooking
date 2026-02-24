from pydantic import BaseModel, field_validator
from typing import List
from .models import VerificationStatus, ConsultationMode


# ─── Onboarding Page 1 ───────────────────────────────────────────────────────

class OnboardingVerificationRequest(BaseModel):
    full_name: str
    icai_membership_number: str
    cop_number: str | None = None
    year_of_qualification: int | None = None
    firm_name: str | None = None
    registered_office_address: str | None = None

    @field_validator("icai_membership_number")
    @classmethod
    def validate_icai_number(cls, v: str) -> str:
        digits = v.strip()
        if not digits.isdigit() or len(digits) != 6:
            raise ValueError("ICAI membership number must be exactly 6 digits")
        return digits


# ─── Onboarding Page 2 ───────────────────────────────────────────────────────

class OnboardingServicesRequest(BaseModel):
    services: List[str]
    consultation_mode: ConsultationMode
    languages: List[str]
    experience_years: int | None = None


# ─── Onboarding Page 3 ───────────────────────────────────────────────────────

class TimeSlot(BaseModel):
    start: str  # "HH:MM"
    end: str    # "HH:MM"


class OnboardingBookingRequest(BaseModel):
    slot_duration_minutes: int = 30
    available_days: List[str]   # ["Monday", "Tuesday", ...]
    time_slots: List[TimeSlot]
    fee_online: float | None = None
    fee_inperson: float | None = None


# ─── Responses ───────────────────────────────────────────────────────────────

class CAProfileResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    icai_membership_number: str
    cop_number: str | None
    year_of_qualification: int | None
    firm_name: str | None
    registered_office_address: str | None
    verification_status: VerificationStatus
    is_visible: bool
    onboarding_complete: bool

    model_config = {"from_attributes": True}


class CAServiceDetailsResponse(BaseModel):
    services: List[str]
    consultation_mode: ConsultationMode
    languages: List[str]
    experience_years: int | None

    model_config = {"from_attributes": True}


class CABookingDetailsResponse(BaseModel):
    slot_duration_minutes: int
    available_days: List[str]
    time_slots: list
    fee_online: float | None
    fee_inperson: float | None

    model_config = {"from_attributes": True}


class CAFullProfileResponse(BaseModel):
    profile: CAProfileResponse
    services: CAServiceDetailsResponse | None
    booking: CABookingDetailsResponse | None


class ToggleVisibilityRequest(BaseModel):
    is_visible: bool


class PublicCAProfileResponse(BaseModel):
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
