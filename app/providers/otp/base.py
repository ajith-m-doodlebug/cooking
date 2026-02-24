from abc import ABC, abstractmethod


class OTPProvider(ABC):
    """
    Abstract contract for all OTP/SMS providers.
    OTP generation and Redis caching are handled in the auth service.
    This provider is responsible only for delivery.
    Switching providers requires only adding a new file here and updating OTP_PROVIDER env var.
    """

    @abstractmethod
    def send_otp(self, phone: str, otp: str) -> bool:
        """Send OTP to the given phone number. Returns True on success."""
        ...
