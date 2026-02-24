import uuid
from sqlalchemy import String, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base, TimestampMixin
import enum


class UserRole(str, enum.Enum):
    CA = "CA"
    USER = "USER"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True, index=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), nullable=False)
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_phone_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    terms_accepted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
