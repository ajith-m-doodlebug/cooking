from datetime import datetime
from pydantic import BaseModel
from .models import BookingStatus


class LockSlotRequest(BaseModel):
    ca_id: str
    service: str
    consultation_mode: str
    booking_date: datetime
    slot_start: str
    slot_end: str


class LockSlotResponse(BaseModel):
    booking_id: str
    slot_locked_until: datetime
    fee_ca: float
    platform_fee: float
    gst_amount: float
    total_amount: float


class BookingResponse(BaseModel):
    id: str
    ca_id: str
    user_id: str
    service: str
    consultation_mode: str
    booking_date: datetime
    slot_start: str
    slot_end: str
    fee_ca: float
    status: BookingStatus
    meeting_join_url: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CancelBookingRequest(BaseModel):
    reason: str | None = None


class BookingListResponse(BaseModel):
    items: list[BookingResponse]
    total: int
    page: int
    size: int
