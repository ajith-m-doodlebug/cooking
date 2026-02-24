import math
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func

from app.core.exceptions import NotFoundError
from .models import Notification
from .schemas import NotificationResponse, PaginatedNotificationsResponse


class NotificationService:

    @staticmethod
    async def create(
        db: AsyncSession,
        user_id: str,
        notification_type: str,
        message: str,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            notification_type=notification_type,
            message=message,
        )
        db.add(notification)
        await db.flush()
        return notification

    @staticmethod
    async def get_paginated(
        db: AsyncSession,
        user_id: str,
        page: int = 1,
        size: int = 20,
    ) -> PaginatedNotificationsResponse:
        count_result = await db.execute(
            select(func.count()).where(Notification.user_id == user_id)
        )
        total = count_result.scalar_one()

        result = await db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        items = [NotificationResponse.model_validate(n) for n in result.scalars().all()]

        return PaginatedNotificationsResponse(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=math.ceil(total / size) if size > 0 else 0,
        )

    @staticmethod
    async def mark_read(
        db: AsyncSession,
        notification_id: str,
        user_id: str,
    ) -> Notification:
        result = await db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        )
        notification = result.scalar_one_or_none()
        if not notification:
            raise NotFoundError("Notification")
        notification.is_read = True
        await db.flush()
        return notification

    @staticmethod
    async def mark_all_read(db: AsyncSession, user_id: str) -> int:
        result = await db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True)
        )
        return result.rowcount
