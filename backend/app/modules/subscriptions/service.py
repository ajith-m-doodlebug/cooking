import json
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.core.utils import rupees_to_paise, calculate_gst, generate_invoice_number
from app.core.exceptions import NotFoundError, PaymentError, ForbiddenError
from app.modules.ca.models import CAProfile, VerificationStatus
from app.providers.payment.factory import get_payment_provider
from .models import Subscription
from .schemas import (
    InitiateSubscriptionResponse,
    SubscriptionStatusResponse,
)


class SubscriptionService:

    @staticmethod
    async def get_ca_profile(db: AsyncSession, user_id: str) -> CAProfile:
        result = await db.execute(
            select(CAProfile).where(CAProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise NotFoundError("CA Profile")
        return profile

    @staticmethod
    async def initiate(
        db: AsyncSession,
        user_id: str,
    ) -> InitiateSubscriptionResponse:
        profile = await SubscriptionService.get_ca_profile(db, user_id)

        if profile.verification_status != VerificationStatus.VERIFIED:
            raise ForbiddenError("CA must be verified before subscribing")

        base_amount = float(settings.CA_SUBSCRIPTION_FEE)
        gst_amount = calculate_gst(base_amount, settings.GST_PERCENT)
        total_amount = base_amount + gst_amount

        provider = get_payment_provider()
        order = provider.create_order(
            amount=rupees_to_paise(total_amount),
            currency="INR",
            metadata={"type": "subscription", "ca_id": profile.id},
        )

        subscription = Subscription(
            ca_id=profile.id,
            gateway_order_id=order.order_id,
            amount=base_amount,
            gst_amount=gst_amount,
            total_amount=total_amount,
            is_active=False,
        )
        db.add(subscription)
        await db.flush()

        return InitiateSubscriptionResponse(
            subscription_id=subscription.id,
            gateway_data=order.gateway_data,
            amount=base_amount,
            gst_amount=gst_amount,
            total_amount=total_amount,
        )

    @staticmethod
    async def confirm_payment(
        db: AsyncSession,
        user_id: str,
        order_id: str,
        payment_id: str,
        signature: str,
    ) -> Subscription:
        profile = await SubscriptionService.get_ca_profile(db, user_id)

        result = await db.execute(
            select(Subscription).where(
                Subscription.ca_id == profile.id,
                Subscription.gateway_order_id == order_id,
            )
        )
        subscription = result.scalar_one_or_none()
        if not subscription:
            raise NotFoundError("Subscription")

        provider = get_payment_provider()
        verification = provider.verify_payment(order_id, payment_id, signature)
        if not verification.is_valid:
            raise PaymentError("Payment signature verification failed")

        now = datetime.now(timezone.utc)
        subscription.gateway_payment_id = payment_id
        subscription.is_active = True
        subscription.start_date = now
        subscription.end_date = now + timedelta(days=settings.SUBSCRIPTION_VALIDITY_DAYS)
        subscription.raw_gateway_response = json.dumps({"order_id": order_id, "payment_id": payment_id})

        # Generate invoice number and store reference
        invoice_number = generate_invoice_number("SUB")
        subscription.invoice_id = invoice_number

        await db.flush()

        from app.modules.notifications.service import NotificationService
        await NotificationService.create(
            db=db,
            user_id=user_id,
            notification_type="SUBSCRIPTION_ACTIVATED",
            message=f"Your subscription is active until {subscription.end_date.strftime('%d %b %Y')}.",
        )

        return subscription

    @staticmethod
    async def get_status(db: AsyncSession, user_id: str) -> SubscriptionStatusResponse:
        profile = await SubscriptionService.get_ca_profile(db, user_id)

        result = await db.execute(
            select(Subscription)
            .where(Subscription.ca_id == profile.id, Subscription.is_active == True)
            .order_by(Subscription.end_date.desc())
            .limit(1)
        )
        subscription = result.scalar_one_or_none()

        if not subscription:
            return SubscriptionStatusResponse(
                is_active=False,
                start_date=None,
                end_date=None,
                days_remaining=None,
            )

        now = datetime.now(timezone.utc)
        days_remaining = max(0, (subscription.end_date - now).days) if subscription.end_date else None

        return SubscriptionStatusResponse(
            is_active=subscription.is_active,
            start_date=subscription.start_date,
            end_date=subscription.end_date,
            days_remaining=days_remaining,
        )

    @staticmethod
    async def list_invoices(db: AsyncSession, user_id: str) -> list[Subscription]:
        """List all subscription invoices (GST) for the CA, including expired."""
        profile = await SubscriptionService.get_ca_profile(db, user_id)
        result = await db.execute(
            select(Subscription)
            .where(
                Subscription.ca_id == profile.id,
                Subscription.invoice_id.isnot(None),
            )
            .order_by(Subscription.created_at.desc())
        )
        return result.scalars().all()
