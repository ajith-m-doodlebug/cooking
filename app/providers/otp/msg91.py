import httpx

from app.config import settings
from app.core.exceptions import ProviderError
from .base import OTPProvider


class MSG91Provider(OTPProvider):
    BASE_URL = "https://api.msg91.com/api/v5"

    def send_otp(self, phone: str, otp: str) -> bool:
        """Send OTP via MSG91 flow API."""
        try:
            normalized = phone.lstrip("+")
            if not normalized.startswith("91"):
                normalized = f"91{normalized}"

            url = f"{self.BASE_URL}/flow/"
            payload = {
                "template_id": settings.MSG91_TEMPLATE_ID,
                "sender": settings.MSG91_SENDER_ID,
                "short_url": "0",
                "mobiles": normalized,
                "OTP": otp,
            }
            headers = {
                "authkey": settings.MSG91_AUTH_KEY,
                "Content-Type": "application/json",
            }
            with httpx.Client(timeout=10) as client:
                response = client.post(url, json=payload, headers=headers)
                data = response.json()
                return data.get("type") == "success"
        except Exception as e:
            raise ProviderError("MSG91", str(e))
