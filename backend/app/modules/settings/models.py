import uuid
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base, TimestampMixin


class BankDetails(Base, TimestampMixin):
    __tablename__ = "bank_details"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ca_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ca_profiles.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True
    )
    account_holder_name: Mapped[str] = mapped_column(String(255), nullable=False)
    account_number: Mapped[str] = mapped_column(String(50), nullable=False)
    ifsc_code: Mapped[str] = mapped_column(String(20), nullable=False)
    bank_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    upi_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
