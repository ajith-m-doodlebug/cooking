from pydantic import BaseModel, EmailStr, field_validator
from app.modules.auth.models import UserRole


class RoleSelectRequest(BaseModel):
    role: UserRole


class GoogleAuthRequest(BaseModel):
    id_token: str
    role: UserRole
    pre_accepted_terms_version: str | None = None


class SendOTPRequest(BaseModel):
    phone: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = v.replace("+", "").replace(" ", "").replace("-", "")
        if not digits.isdigit():
            raise ValueError("Phone must contain only digits")
        if len(digits) < 10:
            raise ValueError("Phone number too short")
        return v


class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    phone: str | None
    full_name: str | None
    role: UserRole
    is_phone_verified: bool
    terms_accepted: bool

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse
    is_new_user: bool = False
