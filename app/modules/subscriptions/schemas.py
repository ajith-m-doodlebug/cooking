from datetime import datetime
from pydantic import BaseModel


class InitiateSubscriptionResponse(BaseModel):
    subscription_id: str
    gateway_data: dict
    amount: float
    gst_amount: float
    total_amount: float


class SubscriptionWebhookRequest(BaseModel):
    order_id: str
    payment_id: str
    signature: str


class SubscriptionStatusResponse(BaseModel):
    is_active: bool
    start_date: datetime | None
    end_date: datetime | None
    days_remaining: int | None

    model_config = {"from_attributes": True}


class SubscriptionInvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    amount: float
    gst_amount: float
    total_amount: float
    created_at: datetime
    pdf_path: str | None

    model_config = {"from_attributes": True}
