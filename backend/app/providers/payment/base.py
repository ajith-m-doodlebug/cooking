from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class PaymentOrder:
    order_id: str
    amount: int          # in paise
    currency: str
    gateway_data: dict   # provider-specific data for client SDK


@dataclass
class PaymentVerification:
    is_valid: bool
    payment_id: str
    order_id: str


@dataclass
class RefundResult:
    refund_id: str
    amount: int          # in paise
    status: str


class PaymentProvider(ABC):
    """
    Abstract contract for all payment providers.
    All implementations must fulfil these methods exactly.
    Switching providers requires only adding a new file here and updating PAYMENT_PROVIDER env var.
    """

    @abstractmethod
    def create_order(
        self,
        amount: int,
        currency: str = "INR",
        metadata: dict | None = None,
    ) -> PaymentOrder:
        """Create a payment order. Returns order details for client-side payment initiation."""
        ...

    @abstractmethod
    def verify_payment(
        self,
        order_id: str,
        payment_id: str,
        signature: str,
    ) -> PaymentVerification:
        """Verify that a payment was genuine and successful."""
        ...

    @abstractmethod
    def initiate_refund(
        self,
        payment_id: str,
        amount: int,
        reason: str = "customer_request",
    ) -> RefundResult:
        """Initiate a refund for a given payment."""
        ...
