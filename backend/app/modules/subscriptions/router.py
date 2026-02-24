from fastapi import APIRouter, Depends

from app.dependencies import DbSession, require_ca
from .service import SubscriptionService
from .schemas import (
    InitiateSubscriptionResponse,
    SubscriptionWebhookRequest,
    SubscriptionStatusResponse,
)

router = APIRouter()


@router.post(
    "/initiate",
    response_model=InitiateSubscriptionResponse,
    summary="Initiate CA subscription payment",
)
async def initiate_subscription(db: DbSession, current_user=Depends(require_ca)):
    return await SubscriptionService.initiate(db, current_user.id)


@router.post("/webhook", summary="Subscription payment webhook / confirm payment")
async def subscription_webhook(
    payload: SubscriptionWebhookRequest,
    db: DbSession,
    current_user=Depends(require_ca),
):
    subscription = await SubscriptionService.confirm_payment(
        db,
        current_user.id,
        payload.order_id,
        payload.payment_id,
        payload.signature,
    )
    return {
        "message": "Subscription activated",
        "end_date": subscription.end_date,
        "invoice_id": subscription.invoice_id,
    }


@router.get(
    "/status",
    response_model=SubscriptionStatusResponse,
    summary="Get current subscription status",
)
async def get_subscription_status(db: DbSession, current_user=Depends(require_ca)):
    return await SubscriptionService.get_status(db, current_user.id)


@router.get("/invoices", summary="List subscription GST invoices")
async def list_invoices(db: DbSession, current_user=Depends(require_ca)):
    subscriptions = await SubscriptionService.list_invoices(db, current_user.id)
    return [
        {
            "id": s.id,
            "invoice_number": s.invoice_id,
            "amount": s.amount,
            "gst_amount": s.gst_amount,
            "total_amount": s.total_amount,
            "start_date": s.start_date,
            "end_date": s.end_date,
        }
        for s in subscriptions
    ]
