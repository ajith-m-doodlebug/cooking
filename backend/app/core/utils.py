from datetime import datetime, timezone
import uuid
import math


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def generate_invoice_number(prefix: str = "INV") -> str:
    now = utcnow()
    uid = str(uuid.uuid4()).replace("-", "")[:8].upper()
    return f"{prefix}-{now.year}{now.month:02d}-{uid}"


def paginate(total: int, page: int, size: int) -> dict:
    return {
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if size > 0 else 0,
    }


def rupees_to_paise(amount: float) -> int:
    return int(round(amount * 100))


def paise_to_rupees(paise: int) -> float:
    return round(paise / 100, 2)


def calculate_gst(amount: float, gst_percent: float) -> float:
    return round(amount * gst_percent / 100, 2)


def calculate_platform_fee(ca_fee: float, platform_percent: float) -> float:
    return round(ca_fee * platform_percent / 100, 2)
