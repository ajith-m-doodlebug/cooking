import hmac
import hashlib
import razorpay

from app.config import settings
from app.core.exceptions import ProviderError
from .base import PaymentProvider, PaymentOrder, PaymentVerification, RefundResult


class RazorpayProvider(PaymentProvider):
    def __init__(self):
        self._client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )

    def create_order(
        self,
        amount: int,
        currency: str = "INR",
        metadata: dict | None = None,
    ) -> PaymentOrder:
        try:
            data = {
                "amount": amount,
                "currency": currency,
                "payment_capture": 1,
            }
            if metadata:
                data["notes"] = metadata

            order = self._client.order.create(data=data)
            return PaymentOrder(
                order_id=order["id"],
                amount=order["amount"],
                currency=order["currency"],
                gateway_data={
                    "key": settings.RAZORPAY_KEY_ID,
                    "order_id": order["id"],
                    "amount": order["amount"],
                    "currency": order["currency"],
                },
            )
        except Exception as e:
            raise ProviderError("Razorpay", str(e))

    def verify_payment(
        self,
        order_id: str,
        payment_id: str,
        signature: str,
    ) -> PaymentVerification:
        try:
            body = f"{order_id}|{payment_id}"
            expected = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode(),
                body.encode(),
                hashlib.sha256,
            ).hexdigest()
            is_valid = hmac.compare_digest(expected, signature)
            return PaymentVerification(
                is_valid=is_valid,
                payment_id=payment_id,
                order_id=order_id,
            )
        except Exception as e:
            raise ProviderError("Razorpay", str(e))

    def initiate_refund(
        self,
        payment_id: str,
        amount: int,
        reason: str = "customer_request",
    ) -> RefundResult:
        try:
            refund = self._client.payment.refund(
                payment_id,
                {"amount": amount, "notes": {"reason": reason}},
            )
            return RefundResult(
                refund_id=refund["id"],
                amount=refund["amount"],
                status=refund["status"],
            )
        except Exception as e:
            raise ProviderError("Razorpay", str(e))
