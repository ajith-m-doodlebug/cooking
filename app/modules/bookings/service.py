import math
from datetime import datetime, timezone, timedelta

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.config import settings
from app.core.utils import calculate_gst, calculate_platform_fee
from app.core.exceptions import NotFoundError, ConflictError, ForbiddenError
from app.modules.ca.models import CAProfile, CABookingDetails, VerificationStatus
from app.modules.subscriptions.models import Subscription
from .models import Booking, BookingStatus
from .schemas import LockSlotRequest, LockSlotResponse, BookingListResponse

SLOT_LOCK_TTL_SECONDS = 600  # 10 minutes


def _slot_lock_key(ca_id: str, date: str, slot_start: str) -> str:
    return f"slot_lock:{ca_id}:{date}:{slot_start}"


class BookingService:

    @staticmethod
    async def lock_slot(
        db: AsyncSession,
        redis: Redis,
        user_id: str,
        payload: LockSlotRequest,
    ) -> LockSlotResponse:
        # Verify CA is active
        ca_result = await db.execute(
            select(CAProfile).where(CAProfile.id == payload.ca_id)
        )
        ca_profile = ca_result.scalar_one_or_none()
        if not ca_profile or ca_profile.verification_status != VerificationStatus.VERIFIED:
            raise NotFoundError("CA Profile")

        sub_result = await db.execute(
            select(Subscription).where(
                Subscription.ca_id == payload.ca_id,
                Subscription.is_active == True,
            )
        )
        if not sub_result.scalar_one_or_none():
            raise ConflictError("CA does not have an active subscription")

        # Check Redis lock
        date_str = payload.booking_date.strftime("%Y-%m-%d")
        lock_key = _slot_lock_key(payload.ca_id, date_str, payload.slot_start)
        if await redis.exists(lock_key):
            raise ConflictError("This slot is currently locked by another user. Please try a different slot.")

        # Check existing confirmed bookings for same slot
        existing = await db.execute(
            select(Booking).where(
                Booking.ca_id == payload.ca_id,
                Booking.booking_date == payload.booking_date,
                Booking.slot_start == payload.slot_start,
                Booking.status == BookingStatus.CONFIRMED,
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictError("This slot is already booked")

        # Get fee
        bk_details_result = await db.execute(
            select(CABookingDetails).where(CABookingDetails.ca_id == payload.ca_id)
        )
        bk_details = bk_details_result.scalar_one_or_none()

        if payload.consultation_mode == "ONLINE":
            fee_ca = bk_details.fee_online if bk_details else 0.0
        else:
            fee_ca = bk_details.fee_inperson if bk_details else 0.0

        platform_fee = calculate_platform_fee(fee_ca, settings.PLATFORM_FEE_PERCENT)
        gst_amount = calculate_gst(fee_ca + platform_fee, settings.GST_PERCENT)
        total_amount = fee_ca + platform_fee + gst_amount

        booking = Booking(
            ca_id=payload.ca_id,
            user_id=user_id,
            service=payload.service,
            consultation_mode=payload.consultation_mode,
            booking_date=payload.booking_date,
            slot_start=payload.slot_start,
            slot_end=payload.slot_end,
            fee_ca=fee_ca,
            status=BookingStatus.SLOT_LOCKED,
        )
        db.add(booking)
        await db.flush()

        # Set Redis lock with booking_id as value
        await redis.setex(lock_key, SLOT_LOCK_TTL_SECONDS, booking.id)

        slot_locked_until = datetime.now(timezone.utc) + timedelta(seconds=SLOT_LOCK_TTL_SECONDS)

        return LockSlotResponse(
            booking_id=booking.id,
            slot_locked_until=slot_locked_until,
            fee_ca=fee_ca,
            platform_fee=platform_fee,
            gst_amount=gst_amount,
            total_amount=total_amount,
        )

    @staticmethod
    async def get_booking(
        db: AsyncSession,
        booking_id: str,
        user_id: str,
    ) -> Booking:
        result = await db.execute(
            select(Booking).where(Booking.id == booking_id)
        )
        booking = result.scalar_one_or_none()
        if not booking:
            raise NotFoundError("Booking")
        # Both the user and the CA can view their own bookings
        if booking.user_id != user_id:
            ca_result = await db.execute(
                select(CAProfile).where(
                    CAProfile.id == booking.ca_id,
                    CAProfile.user_id == user_id,
                )
            )
            if not ca_result.scalar_one_or_none():
                raise ForbiddenError("You do not have access to this booking")
        return booking

    @staticmethod
    async def list_user_bookings(
        db: AsyncSession,
        user_id: str,
        page: int = 1,
        size: int = 20,
    ) -> BookingListResponse:
        count_result = await db.execute(
            select(func.count()).where(Booking.user_id == user_id)
        )
        total = count_result.scalar_one()

        result = await db.execute(
            select(Booking)
            .where(Booking.user_id == user_id)
            .order_by(Booking.booking_date.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        return BookingListResponse(
            items=result.scalars().all(),
            total=total,
            page=page,
            size=size,
        )

    @staticmethod
    async def list_ca_bookings(
        db: AsyncSession,
        user_id: str,
        page: int = 1,
        size: int = 20,
    ) -> BookingListResponse:
        ca_result = await db.execute(
            select(CAProfile).where(CAProfile.user_id == user_id)
        )
        ca_profile = ca_result.scalar_one_or_none()
        if not ca_profile:
            raise NotFoundError("CA Profile")

        count_result = await db.execute(
            select(func.count()).where(Booking.ca_id == ca_profile.id)
        )
        total = count_result.scalar_one()

        result = await db.execute(
            select(Booking)
            .where(Booking.ca_id == ca_profile.id)
            .order_by(Booking.booking_date.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        return BookingListResponse(
            items=result.scalars().all(),
            total=total,
            page=page,
            size=size,
        )

    @staticmethod
    async def cancel_booking(
        db: AsyncSession,
        redis: Redis,
        booking_id: str,
        user_id: str,
        reason: str | None,
        cancelled_by: str = "user",
    ) -> Booking:
        result = await db.execute(
            select(Booking).where(Booking.id == booking_id)
        )
        booking = result.scalar_one_or_none()
        if not booking:
            raise NotFoundError("Booking")

        if booking.status in (
            BookingStatus.CANCELLED_BY_USER,
            BookingStatus.CANCELLED_BY_CA,
            BookingStatus.COMPLETED,
        ):
            raise ConflictError("Booking cannot be cancelled in its current state")

        if cancelled_by == "user":
            if booking.user_id != user_id:
                raise ForbiddenError("Not your booking")
            booking.status = BookingStatus.CANCELLED_BY_USER
        else:
            ca_result = await db.execute(
                select(CAProfile).where(
                    CAProfile.id == booking.ca_id,
                    CAProfile.user_id == user_id,
                )
            )
            if not ca_result.scalar_one_or_none():
                raise ForbiddenError("Not your booking")
            booking.status = BookingStatus.CANCELLED_BY_CA

        booking.cancellation_reason = reason

        # Release Redis slot lock if still active
        date_str = booking.booking_date.strftime("%Y-%m-%d")
        lock_key = _slot_lock_key(booking.ca_id, date_str, booking.slot_start)
        await redis.delete(lock_key)

        # Initiate refund if payment was made
        if booking.status == BookingStatus.CONFIRMED:
            from app.modules.payments.models import Payment, PaymentStatus
            from app.providers.payment.factory import get_payment_provider
            from app.core.utils import rupees_to_paise

            pmt_result = await db.execute(
                select(Payment).where(
                    Payment.booking_id == booking.id,
                    Payment.status == PaymentStatus.SUCCESS,
                )
            )
            payment = pmt_result.scalar_one_or_none()
            if payment and payment.gateway_payment_id:
                provider = get_payment_provider()
                refund = provider.initiate_refund(
                    payment.gateway_payment_id,
                    rupees_to_paise(payment.amount),
                    reason="booking_cancelled",
                )
                payment.gateway_refund_id = refund.refund_id
                payment.refunded_amount = payment.amount
                payment.status = PaymentStatus.REFUNDED
                booking.is_refunded = True

        await db.flush()

        # Cancel Google Meet if applicable
        if booking.meeting_id:
            try:
                from app.providers.meeting.factory import get_meeting_provider
                get_meeting_provider().cancel_meeting(booking.meeting_id)
            except Exception:
                pass

        from app.modules.notifications.service import NotificationService
        await NotificationService.create(
            db=db,
            user_id=booking.user_id,
            notification_type="BOOKING_CANCELLED",
            message=f"Your booking on {booking.booking_date.strftime('%d %b %Y')} has been cancelled.",
        )

        return booking
