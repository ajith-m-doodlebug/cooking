from fastapi import APIRouter, Depends, Query

from app.dependencies import DbSession, get_current_user
from .service import NotificationService
from .schemas import PaginatedNotificationsResponse, NotificationResponse

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedNotificationsResponse,
    summary="Get paginated notifications",
)
async def get_notifications(
    db: DbSession,
    current_user=Depends(get_current_user),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    return await NotificationService.get_paginated(db, current_user.id, page, size)


@router.post(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark notification as read",
)
async def mark_read(
    notification_id: str,
    db: DbSession,
    current_user=Depends(get_current_user),
):
    return await NotificationService.mark_read(db, notification_id, current_user.id)


@router.post(
    "/read-all",
    summary="Mark all notifications as read",
)
async def mark_all_read(db: DbSession, current_user=Depends(get_current_user)):
    count = await NotificationService.mark_all_read(db, current_user.id)
    return {"message": f"{count} notifications marked as read"}
