from pydantic import BaseModel, EmailStr


class UpdateProfileRequest(BaseModel):
    full_name: str | None = None


class UserProfileResponse(BaseModel):
    id: str
    email: str
    phone: str | None
    full_name: str | None
    role: str
    is_phone_verified: bool
    terms_accepted: bool

    model_config = {"from_attributes": True}
