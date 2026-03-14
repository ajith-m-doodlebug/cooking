import httpx

from app.config import settings
from app.core.exceptions import ProviderError
from .base import OTPProvider


class TwilioProvider(OTPProvider):
    BASE_URL = "https://api.twilio.com/2010-04-01"

    def send_otp(self, phone: str, otp: str) -> bool:
        """Send OTP via Twilio Messages API."""
        try:
            url = f"{self.BASE_URL}/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
            # Twilio expects E.164; ensure leading + for To
            to = phone if phone.startswith("+") else f"+{phone}"
            body = f"Your OTP: {otp}"
            data = {
                "To": to,
                "From": settings.TWILIO_FROM_NUMBER,
                "Body": body,
            }
            auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            with httpx.Client(timeout=10) as client:
                response = client.post(url, data=data, auth=auth)
                response.raise_for_status()
                result = response.json()
                return result.get("status") in ("queued", "sent", "delivered")
        except httpx.HTTPStatusError as e:
            raise ProviderError("Twilio", f"{e.response.status_code}: {e.response.text}")
        except Exception as e:
            raise ProviderError("Twilio", str(e))
