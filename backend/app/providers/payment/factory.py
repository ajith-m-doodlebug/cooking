import logging
from functools import lru_cache

from app.config import settings
from app.core.exceptions import ValidationError
from .base import PaymentProvider

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_payment_provider() -> PaymentProvider:
    provider = (settings.PAYMENT_PROVIDER or "razorpay").lower().strip()
    if provider == "mock":
        from .mock import MockPaymentProvider

        return MockPaymentProvider()
    if provider == "razorpay":
        key_id = (settings.RAZORPAY_KEY_ID or "").strip()
        key_secret = (settings.RAZORPAY_KEY_SECRET or "").strip()
        if settings.APP_ENV == "development" and (not key_id or not key_secret):
            logger.warning(
                "Razorpay keys missing — using mock payment provider for development. "
                "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env for real payments."
            )
            from .mock import MockPaymentProvider

            return MockPaymentProvider()
        from .razorpay import RazorpayProvider

        return RazorpayProvider()
    raise ValidationError(
        f"Unknown PAYMENT_PROVIDER '{settings.PAYMENT_PROVIDER}'. Use 'razorpay' or 'mock'."
    )
