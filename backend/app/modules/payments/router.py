from fastapi import APIRouter, Depends

from app.dependencies import DbSession, get_current_user, require_user
from .service import PaymentService
from .schemas import (
    InitiatePaymentResponse,
    ConfirmPaymentRequest,
    InvoiceResponse,
)

router = APIRouter()


@router.post(
    "/booking/initiate/{booking_id}",
    response_model=InitiatePaymentResponse,
    summary="Initiate payment for a booking",
)
async def initiate_payment(
    booking_id: str,
    db: DbSession,
    current_user=Depends(require_user),
):
    return await PaymentService.initiate_booking_payment(db, booking_id, current_user.id)


@router.post(
    "/booking/webhook",
    summary="Confirm booking payment after gateway callback",
)
async def confirm_payment(payload: ConfirmPaymentRequest, db: DbSession):
    invoice = await PaymentService.confirm_booking_payment(
        db, payload.order_id, payload.payment_id, payload.signature
    )
    return {
        "message": "Payment confirmed",
        "invoice_number": invoice.invoice_number,
        "total_amount": invoice.total_amount,
    }


@router.get(
    "/invoices/{booking_id}",
    response_model=InvoiceResponse,
    summary="Get invoice for a booking",
)
async def get_invoice(
    booking_id: str,
    db: DbSession,
    current_user=Depends(get_current_user),
):
    return await PaymentService.get_invoice(db, booking_id, current_user.id)
