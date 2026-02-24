import json
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from redis.asyncio import Redis

from app.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    generate_otp,
    hash_otp,
    verify_otp_hash,
    verify_token,
)
from app.core.exceptions import UnauthorizedError, ConflictError, ValidationError, NotFoundError
from app.providers.otp.factory import get_otp_provider
from .models import User, UserRole
from .schemas import TokenResponse, UserResponse, AuthResponse

GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


class AuthService:

    @staticmethod
    async def google_auth(
        db: AsyncSession,
        id_token: str,
        role: UserRole,
    ) -> AuthResponse:
        google_data = await AuthService._verify_google_token(id_token)

        email = google_data.get("email")
        google_id = google_data.get("sub")
        name = google_data.get("name")

        if not email:
            raise ValidationError("Google token does not contain email")

        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        is_new = False

        if not user:
            user = User(
                email=email,
                google_id=google_id,
                full_name=name,
                role=role,
                is_active=True,
            )
            db.add(user)
            await db.flush()
            is_new = True
        else:
            if not user.google_id:
                user.google_id = google_id
            if not user.full_name and name:
                user.full_name = name

        tokens = TokenResponse(
            access_token=create_access_token(user.id, extra={"role": user.role}),
            refresh_token=create_refresh_token(user.id),
        )
        return AuthResponse(
            user=UserResponse.model_validate(user),
            tokens=tokens,
            is_new_user=is_new,
        )

    @staticmethod
    async def send_otp(redis: Redis, phone: str) -> bool:
        otp = generate_otp()
        otp_hash = hash_otp(otp, phone)
        key = f"otp:{phone}"

        await redis.setex(key, settings.OTP_EXPIRY_SECONDS, otp_hash)

        provider = get_otp_provider()
        return provider.send_otp(phone, otp)

    @staticmethod
    async def verify_otp(
        db: AsyncSession,
        redis: Redis,
        phone: str,
        otp: str,
        user_id: str,
    ) -> bool:
        key = f"otp:{phone}"
        stored_hash = await redis.get(key)

        if not stored_hash:
            raise ValidationError("OTP expired or not found. Please request a new one.")

        if not verify_otp_hash(otp, phone, stored_hash.decode()):
            raise ValidationError("Invalid OTP")

        await redis.delete(key)

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError("User")

        user.phone = phone
        user.is_phone_verified = True
        return True

    @staticmethod
    async def refresh_tokens(refresh_token: str) -> TokenResponse:
        user_id = verify_token(refresh_token, token_type="refresh")
        if not user_id:
            raise UnauthorizedError("Invalid or expired refresh token")
        return TokenResponse(
            access_token=create_access_token(user_id),
            refresh_token=create_refresh_token(user_id),
        )

    @staticmethod
    async def _verify_google_token(id_token: str) -> dict:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                GOOGLE_TOKENINFO_URL, params={"id_token": id_token}
            )
            if response.status_code != 200:
                raise UnauthorizedError("Invalid Google token")
            data = response.json()
            if data.get("aud") != settings.GOOGLE_CLIENT_ID:
                raise UnauthorizedError("Google token audience mismatch")
            return data
