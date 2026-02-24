from datetime import datetime
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: str
    notification_type: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedNotificationsResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
    page: int
    size: int
    pages: int
