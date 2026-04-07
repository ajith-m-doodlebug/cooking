import hmac
import hashlib
import razorpay

from app.config import settings
from app.core.exceptions import ProviderError
from .base import PaymentProvider, PaymentOrder, PaymentVerification, RefundResult


class RazorpayProvider(PaymentProvider):
    def __init__(self):
        key_id = (settings.RAZORPAY_KEY_ID or "").strip()
        key_secret = (settings.RAZORPAY_KEY_SECRET or "").strip()
        if not key_id or not key_secret:
            raise ProviderError(
                "Razorpay",
                "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in the API environment, "
                "or set PAYMENT_PROVIDER=mock for local development.",
            )
        self._client = razorpay.Client(auth=(key_id, key_secret))

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
                # Razorpay requires note values to be strings.
                data["notes"] = {str(k): str(v) for k, v in metadata.items()}

            order = self._client.order.create(data=data)
            return PaymentOrder(
                order_id=order["id"],
                amount=order["amount"],
                currency=order["currency"],
                gateway_data={
                    "provider": "razorpay",
                    "key": (settings.RAZORPAY_KEY_ID or "").strip(),
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
