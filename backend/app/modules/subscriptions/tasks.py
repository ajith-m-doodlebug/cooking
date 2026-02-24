import asyncio
from datetime import datetime, timezone, timedelta

from app.celery_app import celery_app


def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="app.modules.subscriptions.tasks.check_subscription_expiry")
def check_subscription_expiry():
    """Daily task: deactivate expired subscriptions and hide CA profiles."""

    async def _execute():
        from app.database import AsyncSessionLocal
        from app.modules.subscriptions.models import Subscription
        from app.modules.ca.models import CAProfile
        from app.modules.notifications.service import NotificationService
        from sqlalchemy import select, update

        async with AsyncSessionLocal() as db:
            now = datetime.now(timezone.utc)

            result = await db.execute(
                select(Subscription)
                .where(
                    Subscription.is_active == True,
                    Subscription.end_date <= now,
                )
            )
            expired = result.scalars().all()

            for sub in expired:
                sub.is_active = False

                ca_result = await db.execute(
                    select(CAProfile).where(CAProfile.id == sub.ca_id)
                )
                profile = ca_result.scalar_one_or_none()
                if profile:
                    profile.is_visible = False

                    await NotificationService.create(
                        db=db,
                        user_id=profile.user_id,
                        notification_type="SUBSCRIPTION_EXPIRED",
                        message="Your subscription has expired. Your profile is now hidden. Please renew to continue receiving bookings.",
                    )

            await db.commit()

    _run_async(_execute())


@celery_app.task(name="app.modules.subscriptions.tasks.send_expiry_reminders")
def send_expiry_reminders():
    """Daily task: send reminder to CAs whose subscription expires in 7 days."""

    async def _execute():
        from app.database import AsyncSessionLocal
        from app.modules.subscriptions.models import Subscription
        from app.modules.ca.models import CAProfile
        from app.modules.notifications.service import NotificationService
        from sqlalchemy import select

        async with AsyncSessionLocal() as db:
            now = datetime.now(timezone.utc)
            reminder_window = now + timedelta(days=7)

            result = await db.execute(
                select(Subscription)
                .where(
                    Subscription.is_active == True,
                    Subscription.end_date <= reminder_window,
                    Subscription.end_date > now,
                )
            )
            expiring_soon = result.scalars().all()

            for sub in expiring_soon:
                ca_result = await db.execute(
                    select(CAProfile).where(CAProfile.id == sub.ca_id)
                )
                profile = ca_result.scalar_one_or_none()
                if profile:
                    days_left = (sub.end_date - now).days
                    await NotificationService.create(
                        db=db,
                        user_id=profile.user_id,
                        notification_type="SUBSCRIPTION_EXPIRY_REMINDER",
                        message=f"Your subscription expires in {days_left} day(s). Please renew to keep your profile active.",
                    )

            await db.commit()

    _run_async(_execute())
