import json
import os
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.core.utils import (
    rupees_to_paise,
    calculate_gst,
    calculate_platform_fee,
    generate_invoice_number,
)
from app.core.exceptions import NotFoundError, PaymentError
from app.providers.payment.factory import get_payment_provider
from app.modules.bookings.models import Booking, BookingStatus
from .models import Payment, Invoice, Settlement, PaymentStatus, InvoiceType
from .schemas import InitiatePaymentResponse


class PaymentService:

    @staticmethod
    async def initiate_booking_payment(
        db: AsyncSession,
        booking_id: str,
        user_id: str,
    ) -> InitiatePaymentResponse:
        result = await db.execute(
            select(Booking).where(Booking.id == booking_id, Booking.user_id == user_id)
        )
        booking = result.scalar_one_or_none()
        if not booking:
            raise NotFoundError("Booking")

        ca_fee = booking.fee_ca
        platform_fee = calculate_platform_fee(ca_fee, settings.PLATFORM_FEE_PERCENT)
        subtotal = ca_fee + platform_fee
        gst_amount = calculate_gst(subtotal, settings.GST_PERCENT)
        total_amount = subtotal + gst_amount

        provider = get_payment_provider()
        order = provider.create_order(
            amount=rupees_to_paise(total_amount),
            currency="INR",
            metadata={"booking_id": booking_id, "user_id": user_id},
        )

        payment = Payment(
            booking_id=booking_id,
            gateway_order_id=order.order_id,
            amount=total_amount,
            status=PaymentStatus.PENDING,
        )
        db.add(payment)
        await db.flush()

        return InitiatePaymentResponse(
            payment_id=payment.id,
            booking_id=booking_id,
            gateway_data=order.gateway_data,
            ca_fee=ca_fee,
            platform_fee=platform_fee,
            gst_amount=gst_amount,
            total_amount=total_amount,
        )

    @staticmethod
    async def confirm_booking_payment(
        db: AsyncSession,
        order_id: str,
        payment_id: str,
        signature: str,
    ) -> Invoice:
        result = await db.execute(
            select(Payment).where(Payment.gateway_order_id == order_id)
        )
        payment = result.scalar_one_or_none()
        if not payment:
            raise NotFoundError("Payment")

        provider = get_payment_provider()
        verification = provider.verify_payment(order_id, payment_id, signature)
        if not verification.is_valid:
            payment.status = PaymentStatus.FAILED
            await db.flush()
            raise PaymentError("Payment signature verification failed")

        payment.gateway_payment_id = payment_id
        payment.status = PaymentStatus.SUCCESS
        payment.raw_gateway_response = json.dumps(
            {"order_id": order_id, "payment_id": payment_id}
        )

        # Update booking status
        if payment.booking_id:
            bk_result = await db.execute(
                select(Booking).where(Booking.id == payment.booking_id)
            )
            booking = bk_result.scalar_one_or_none()
            if booking:
                booking.status = BookingStatus.CONFIRMED
                ca_fee = booking.fee_ca
                platform_fee = calculate_platform_fee(ca_fee, settings.PLATFORM_FEE_PERCENT)
                gst_amount = calculate_gst(ca_fee + platform_fee, settings.GST_PERCENT)
                total_amount = ca_fee + platform_fee + gst_amount

                invoice_number = generate_invoice_number("INV")
                invoice = Invoice(
                    payment_id=payment.id,
                    invoice_number=invoice_number,
                    invoice_type=InvoiceType.BOOKING,
                    ca_fee=ca_fee,
                    platform_fee=platform_fee,
                    gst_amount=gst_amount,
                    total_amount=total_amount,
                )
                db.add(invoice)

                settlement = Settlement(
                    booking_id=booking.id,
                    ca_id=booking.ca_id,
                    ca_amount=ca_fee,
                    platform_amount=platform_fee,
                    is_settled=False,
                )
                db.add(settlement)

                await db.flush()

                # Generate meeting link for online bookings
                if booking.consultation_mode == "ONLINE" and not booking.meeting_join_url:
                    from app.providers.meeting.factory import get_meeting_provider
                    from app.modules.ca.models import CABookingDetails
                    bk_details_result = await db.execute(
                        select(CABookingDetails).where(CABookingDetails.ca_id == booking.ca_id)
                    )
                    bk_details = bk_details_result.scalar_one_or_none()
                    duration = bk_details.slot_duration_minutes if bk_details else 30

                    meeting_provider = get_meeting_provider()
                    meeting = meeting_provider.create_meeting(
                        title=f"CA Consultation - {booking.service}",
                        start_time=booking.booking_date,
                        duration_min=duration,
                    )
                    booking.meeting_id = meeting.meeting_id
                    booking.meeting_join_url = meeting.join_url

                from app.modules.notifications.service import NotificationService
                await NotificationService.create(
                    db=db,
                    user_id=booking.user_id,
                    notification_type="BOOKING_CONFIRMED",
                    message=f"Your booking has been confirmed. Invoice: {invoice_number}",
                )

                return invoice

        await db.flush()
        raise NotFoundError("Booking linked to payment")

    @staticmethod
    async def get_invoice(
        db: AsyncSession,
        booking_id: str,
        user_id: str,
    ) -> Invoice:
        bk_result = await db.execute(
            select(Booking).where(Booking.id == booking_id, Booking.user_id == user_id)
        )
        booking = bk_result.scalar_one_or_none()
        if not booking:
            raise NotFoundError("Booking")

        pmt_result = await db.execute(
            select(Payment).where(
                Payment.booking_id == booking_id,
                Payment.status == PaymentStatus.SUCCESS,
            )
        )
        payment = pmt_result.scalar_one_or_none()
        if not payment:
            raise NotFoundError("Payment")

        inv_result = await db.execute(
            select(Invoice).where(Invoice.payment_id == payment.id)
        )
        invoice = inv_result.scalar_one_or_none()
        if not invoice:
            raise NotFoundError("Invoice")

        return invoice
