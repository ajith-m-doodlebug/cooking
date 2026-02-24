from typing import Annotated
from fastapi import APIRouter, Depends, Query
from redis.asyncio import Redis

from app.dependencies import DbSession, get_current_user, require_ca, require_user
from .service import BookingService
from .schemas import (
    LockSlotRequest,
    LockSlotResponse,
    BookingResponse,
    CancelBookingRequest,
    BookingListResponse,
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


@router.post(
    "/lock-slot",
    response_model=LockSlotResponse,
    summary="Lock a slot before payment (10-min TTL)",
)
async def lock_slot(
    payload: LockSlotRequest,
    db: DbSession,
    redis: RedisClient,
    current_user=Depends(require_user),
):
    return await BookingService.lock_slot(db, redis, current_user.id, payload)


@router.get(
    "/user",
    response_model=BookingListResponse,
    summary="List current user's bookings",
)
async def list_user_bookings(
    db: DbSession,
    current_user=Depends(require_user),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    return await BookingService.list_user_bookings(db, current_user.id, page, size)


@router.get(
    "/ca",
    response_model=BookingListResponse,
    summary="List CA's bookings",
)
async def list_ca_bookings(
    db: DbSession,
    current_user=Depends(require_ca),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    return await BookingService.list_ca_bookings(db, current_user.id, page, size)


@router.get(
    "/{booking_id}",
    response_model=BookingResponse,
    summary="Get booking details",
)
async def get_booking(
    booking_id: str,
    db: DbSession,
    current_user=Depends(get_current_user),
):
    return await BookingService.get_booking(db, booking_id, current_user.id)


@router.post(
    "/{booking_id}/cancel",
    response_model=BookingResponse,
    summary="Cancel a booking",
)
async def cancel_booking(
    booking_id: str,
    payload: CancelBookingRequest,
    db: DbSession,
    redis: RedisClient,
    current_user=Depends(get_current_user),
):
    cancelled_by = "ca" if current_user.role == "CA" else "user"
    return await BookingService.cancel_booking(
        db, redis, booking_id, current_user.id, payload.reason, cancelled_by
    )
