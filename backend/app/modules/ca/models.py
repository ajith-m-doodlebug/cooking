import uuid
import enum
from sqlalchemy import (
    String, Boolean, Integer, Float, Text,
    ForeignKey, Enum as SAEnum, ARRAY, JSON
)
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base, TimestampMixin


class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    FAILED = "FAILED"


class ConsultationMode(str, enum.Enum):
    ONLINE = "ONLINE"
    IN_PERSON = "IN_PERSON"
    BOTH = "BOTH"


class CAProfile(Base, TimestampMixin):
    """Page 1 — Verification Details (locked after approval)."""
    __tablename__ = "ca_profiles"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    icai_membership_number: Mapped[str] = mapped_column(String(10), nullable=False, unique=True, index=True)
    cop_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    year_of_qualification: Mapped[int | None] = mapped_column(Integer, nullable=True)
    firm_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    registered_office_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        SAEnum(VerificationStatus), default=VerificationStatus.PENDING, nullable=False, index=True
    )
    is_visible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    onboarding_complete: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class CAServiceDetails(Base, TimestampMixin):
    """Page 2 — Service Details (editable)."""
    __tablename__ = "ca_service_details"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ca_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ca_profiles.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True
    )
    services: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    consultation_mode: Mapped[ConsultationMode] = mapped_column(
        SAEnum(ConsultationMode), nullable=False, default=ConsultationMode.BOTH
    )
    languages: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)


class CABookingDetails(Base, TimestampMixin):
    """Page 3 — Booking Details (editable)."""
    __tablename__ = "ca_booking_details"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ca_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ca_profiles.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True
    )
    slot_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    available_days: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    time_slots: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    fee_online: Mapped[float | None] = mapped_column(Float, nullable=True)
    fee_inperson: Mapped[float | None] = mapped_column(Float, nullable=True)
