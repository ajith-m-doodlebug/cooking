import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Integer, Float, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base, TimestampMixin
from app.modules.ca.models import VerificationStatus


class CAVerificationLog(Base):
    """Full audit trail of every ICAI verification attempt."""
    __tablename__ = "ca_verification_logs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ca_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ca_profiles.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[VerificationStatus] = mapped_column(
        SAEnum(VerificationStatus), nullable=False
    )
    icai_number_queried: Mapped[str] = mapped_column(String(10), nullable=False)
    submitted_name: Mapped[str] = mapped_column(String(255), nullable=False)
    extracted_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    match_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    raw_html: Mapped[str | None] = mapped_column(Text, nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
