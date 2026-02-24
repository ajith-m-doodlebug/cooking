from celery import Celery
from celery.schedules import crontab

from app.config import settings

celery_app = Celery(
    "ca_marketplace",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.modules.verification.tasks",
        "app.modules.subscriptions.tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

celery_app.conf.beat_schedule = {
    "check-subscription-expiry": {
        "task": "app.modules.subscriptions.tasks.check_subscription_expiry",
        "schedule": crontab(hour=8, minute=0),
    },
    "send-subscription-expiry-reminders": {
        "task": "app.modules.subscriptions.tasks.send_expiry_reminders",
        "schedule": crontab(hour=9, minute=0),
    },
}
