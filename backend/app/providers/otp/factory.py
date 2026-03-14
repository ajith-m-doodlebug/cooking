from functools import lru_cache

from app.config import settings
from .base import OTPProvider


@lru_cache(maxsize=1)
def get_otp_provider() -> OTPProvider:
    provider = settings.OTP_PROVIDER.lower()
    if provider == "twilio":
        from .twilio import TwilioProvider
        return TwilioProvider()
    raise ValueError(f"Unknown OTP provider: '{provider}'. Add its implementation to app/providers/otp/")
