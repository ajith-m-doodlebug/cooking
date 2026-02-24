import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Float, DateTime, ForeignKey, Enum as SAEnum, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base, TimestampMixin


class BookingStatus(str, enum.Enum):
    SLOT_LOCKED = "SLOT_LOCKED"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED_BY_USER = "CANCELLED_BY_USER"
    CANCELLED_BY_CA = "CANCELLED_BY_CA"
    COMPLETED = "COMPLETED"


class Booking(Base, TimestampMixin):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ca_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ca_profiles.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    service: Mapped[str] = mapped_column(String(255), nullable=False)
    consultation_mode: Mapped[str] = mapped_column(String(20), nullable=False)
    booking_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    slot_start: Mapped[str] = mapped_column(String(10), nullable=False)  # "HH:MM"
    slot_end: Mapped[str] = mapped_column(String(10), nullable=False)    # "HH:MM"
    fee_ca: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[BookingStatus] = mapped_column(
        SAEnum(BookingStatus), default=BookingStatus.SLOT_LOCKED, nullable=False, index=True
    )
    meeting_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    meeting_join_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_refunded: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
