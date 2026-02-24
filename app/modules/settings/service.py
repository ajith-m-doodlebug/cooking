import csv
import io
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.exceptions import NotFoundError
from app.modules.ca.models import CAProfile
from app.modules.payments.models import Settlement
from .models import BankDetails
from .schemas import BankDetailsRequest


class SettingsService:

    @staticmethod
    async def _get_ca_profile(db: AsyncSession, user_id: str) -> CAProfile:
        result = await db.execute(
            select(CAProfile).where(CAProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise NotFoundError("CA Profile")
        return profile

    @staticmethod
    async def save_bank_details(
        db: AsyncSession,
        user_id: str,
        payload: BankDetailsRequest,
    ) -> BankDetails:
        profile = await SettingsService._get_ca_profile(db, user_id)

        result = await db.execute(
            select(BankDetails).where(BankDetails.ca_id == profile.id)
        )
        details = result.scalar_one_or_none()

        if details:
            details.account_holder_name = payload.account_holder_name
            details.account_number = payload.account_number
            details.ifsc_code = payload.ifsc_code
            details.bank_name = payload.bank_name
            details.upi_id = payload.upi_id
        else:
            details = BankDetails(
                ca_id=profile.id,
                account_holder_name=payload.account_holder_name,
                account_number=payload.account_number,
                ifsc_code=payload.ifsc_code,
                bank_name=payload.bank_name,
                upi_id=payload.upi_id,
            )
            db.add(details)

        await db.flush()
        return details

    @staticmethod
    async def get_bank_details(db: AsyncSession, user_id: str) -> BankDetails:
        profile = await SettingsService._get_ca_profile(db, user_id)

        result = await db.execute(
            select(BankDetails).where(BankDetails.ca_id == profile.id)
        )
        details = result.scalar_one_or_none()
        if not details:
            raise NotFoundError("Bank Details")
        return details

    @staticmethod
    async def list_settlements(
        db: AsyncSession,
        user_id: str,
        page: int = 1,
        size: int = 20,
    ) -> list[Settlement]:
        profile = await SettingsService._get_ca_profile(db, user_id)

        result = await db.execute(
            select(Settlement)
            .where(Settlement.ca_id == profile.id)
            .order_by(Settlement.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        return result.scalars().all()

    @staticmethod
    async def export_settlements_csv(
        db: AsyncSession,
        user_id: str,
    ) -> str:
        settlements = await SettingsService.list_settlements(db, user_id, page=1, size=10000)

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Booking ID", "CA Amount (INR)", "Platform Amount (INR)", "Settled", "Date"])

        for s in settlements:
            writer.writerow([
                s.id,
                s.booking_id,
                s.ca_amount,
                s.platform_amount,
                "Yes" if s.is_settled else "No",
                s.created_at.strftime("%Y-%m-%d %H:%M"),
            ])

        return output.getvalue()
