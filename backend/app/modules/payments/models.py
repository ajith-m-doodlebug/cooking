import uuid
import enum
from sqlalchemy import String, Float, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base, TimestampMixin


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED"


class InvoiceType(str, enum.Enum):
    BOOKING = "BOOKING"
    SUBSCRIPTION = "SUBSCRIPTION"


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    booking_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True
    )
    gateway_order_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    gateway_payment_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    gateway_refund_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    refunded_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True
    )
    raw_gateway_response: Mapped[str | None] = mapped_column(Text, nullable=True)


class Invoice(Base, TimestampMixin):
    __tablename__ = "invoices"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    payment_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("payments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    invoice_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    invoice_type: Mapped[InvoiceType] = mapped_column(SAEnum(InvoiceType), nullable=False)
    ca_fee: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    platform_fee: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    gst_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    pdf_path: Mapped[str | None] = mapped_column(String(500), nullable=True)


class Settlement(Base, TimestampMixin):
    __tablename__ = "settlements"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    booking_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ca_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ca_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ca_amount: Mapped[float] = mapped_column(Float, nullable=False)
    platform_amount: Mapped[float] = mapped_column(Float, nullable=False)
    is_settled: Mapped[bool] = mapped_column(default=False, nullable=False)
