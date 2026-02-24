import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base, TimestampMixin


class Subscription(Base, TimestampMixin):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ca_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ca_profiles.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    gateway_order_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    gateway_payment_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    gst_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    invoice_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    raw_gateway_response: Mapped[str | None] = mapped_column(Text, nullable=True)
