"""Mock payment provider for local/dev when Razorpay keys are not configured."""

import uuid

from .base import PaymentProvider, PaymentOrder, PaymentVerification, RefundResult


class MockPaymentProvider(PaymentProvider):
    """Creates fake orders and accepts any verify signature (dev only)."""

    def create_order(
        self,
        amount: int,
        currency: str = "INR",
        metadata: dict | None = None,
    ) -> PaymentOrder:
        order_id = f"order_mock_{uuid.uuid4().hex[:24]}"
        return PaymentOrder(
            order_id=order_id,
            amount=amount,
            currency=currency,
            gateway_data={
                "key": "mock_key_id",
                "order_id": order_id,
                "amount": amount,
                "currency": currency,
                "provider": "mock",
                "note": "Set PAYMENT_PROVIDER=razorpay and real keys for live payments.",
            },
        )

    def verify_payment(
        self,
        order_id: str,
        payment_id: str,
        signature: str,
    ) -> PaymentVerification:
        return PaymentVerification(
            is_valid=True,
            payment_id=payment_id or "pay_mock",
            order_id=order_id,
        )

    def initiate_refund(
        self,
        payment_id: str,
        amount: int,
        reason: str = "customer_request",
    ) -> RefundResult:
        return RefundResult(
            refund_id=f"rfnd_mock_{uuid.uuid4().hex[:12]}",
            amount=amount,
            status="processed",
        )
