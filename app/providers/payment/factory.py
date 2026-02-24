from functools import lru_cache

from app.config import settings
from .base import PaymentProvider


@lru_cache(maxsize=1)
def get_payment_provider() -> PaymentProvider:
    provider = settings.PAYMENT_PROVIDER.lower()
    if provider == "razorpay":
        from .razorpay import RazorpayProvider
        return RazorpayProvider()
    raise ValueError(f"Unknown payment provider: '{provider}'. Add its implementation to app/providers/payment/")
