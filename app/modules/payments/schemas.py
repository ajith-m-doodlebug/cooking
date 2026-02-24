from datetime import datetime
from pydantic import BaseModel
from .models import PaymentStatus, InvoiceType


class InitiatePaymentResponse(BaseModel):
    payment_id: str
    booking_id: str
    gateway_data: dict
    ca_fee: float
    platform_fee: float
    gst_amount: float
    total_amount: float


class ConfirmPaymentRequest(BaseModel):
    order_id: str
    payment_id: str
    signature: str


class PaymentResponse(BaseModel):
    id: str
    booking_id: str | None
    gateway_order_id: str
    gateway_payment_id: str | None
    amount: float
    status: PaymentStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    invoice_type: InvoiceType
    ca_fee: float
    platform_fee: float
    gst_amount: float
    total_amount: float
    pdf_path: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SettlementResponse(BaseModel):
    id: str
    booking_id: str
    ca_amount: float
    platform_amount: float
    is_settled: bool
    created_at: datetime

    model_config = {"from_attributes": True}
