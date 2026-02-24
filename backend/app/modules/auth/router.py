from typing import Annotated
from fastapi import APIRouter, Depends
from redis.asyncio import Redis

from app.dependencies import DbSession, get_current_user
from .service import AuthService
from .schemas import (
    GoogleAuthRequest,
    SendOTPRequest,
    VerifyOTPRequest,
    RefreshTokenRequest,
    AuthResponse,
    TokenResponse,
)

router = APIRouter()


async def get_redis() -> Redis:
    from app.config import settings
    client = Redis.from_url(settings.REDIS_URL, decode_responses=False)
    try:
        yield client
    finally:
        await client.aclose()


RedisClient = Annotated[Redis, Depends(get_redis)]


@router.post("/google", response_model=AuthResponse, summary="Google OAuth login")
async def google_auth(payload: GoogleAuthRequest, db: DbSession):
    return await AuthService.google_auth(db, payload.id_token, payload.role)


@router.post("/phone/send-otp", summary="Send OTP to phone")
async def send_otp(payload: SendOTPRequest, redis: RedisClient):
    await AuthService.send_otp(redis, payload.phone)
    return {"message": "OTP sent successfully"}


@router.post("/phone/verify-otp", summary="Verify OTP and link phone to account")
async def verify_otp(
    payload: VerifyOTPRequest,
    db: DbSession,
    redis: RedisClient,
    current_user=Depends(get_current_user),
):
    await AuthService.verify_otp(db, redis, payload.phone, payload.otp, current_user.id)
    return {"message": "Phone verified successfully"}


@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token")
async def refresh_token(payload: RefreshTokenRequest):
    return await AuthService.refresh_tokens(payload.refresh_token)


@router.post("/logout", summary="Logout user")
async def logout():
    return {"message": "Logged out successfully"}
