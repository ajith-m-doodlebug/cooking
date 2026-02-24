from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.exceptions import NotFoundError, ForbiddenError, ConflictError
from app.modules.auth.models import User
from .models import CAProfile, CAServiceDetails, CABookingDetails, VerificationStatus
from .schemas import (
    OnboardingVerificationRequest,
    OnboardingServicesRequest,
    OnboardingBookingRequest,
    CAFullProfileResponse,
    CAProfileResponse,
    CAServiceDetailsResponse,
    CABookingDetailsResponse,
    PublicCAProfileResponse,
)


class CAService:

    @staticmethod
    async def get_profile_by_user(db: AsyncSession, user_id: str) -> CAProfile | None:
        result = await db.execute(
            select(CAProfile).where(CAProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def submit_verification(
        db: AsyncSession,
        user: User,
        payload: OnboardingVerificationRequest,
    ) -> CAProfile:
        existing = await CAService.get_profile_by_user(db, user.id)

        if existing and existing.verification_status == VerificationStatus.VERIFIED:
            raise ForbiddenError("Verification details are locked after approval")

        if existing:
            existing.full_name = payload.full_name
            existing.icai_membership_number = payload.icai_membership_number
            existing.cop_number = payload.cop_number
            existing.year_of_qualification = payload.year_of_qualification
            existing.firm_name = payload.firm_name
            existing.registered_office_address = payload.registered_office_address
            existing.verification_status = VerificationStatus.PENDING
            profile = existing
        else:
            profile = CAProfile(
                user_id=user.id,
                full_name=payload.full_name,
                icai_membership_number=payload.icai_membership_number,
                cop_number=payload.cop_number,
                year_of_qualification=payload.year_of_qualification,
                firm_name=payload.firm_name,
                registered_office_address=payload.registered_office_address,
                verification_status=VerificationStatus.PENDING,
            )
            db.add(profile)

        await db.flush()

        from app.modules.verification.tasks import verify_icai_membership
        verify_icai_membership.delay(profile.id, payload.icai_membership_number, payload.full_name)

        return profile

    @staticmethod
    async def save_service_details(
        db: AsyncSession,
        user: User,
        payload: OnboardingServicesRequest,
    ) -> CAServiceDetails:
        profile = await CAService.get_profile_by_user(db, user.id)
        if not profile:
            raise NotFoundError("CA Profile. Complete verification details first.")

        result = await db.execute(
            select(CAServiceDetails).where(CAServiceDetails.ca_id == profile.id)
        )
        details = result.scalar_one_or_none()

        if details:
            details.services = payload.services
            details.consultation_mode = payload.consultation_mode
            details.languages = payload.languages
            details.experience_years = payload.experience_years
        else:
            details = CAServiceDetails(
                ca_id=profile.id,
                services=payload.services,
                consultation_mode=payload.consultation_mode,
                languages=payload.languages,
                experience_years=payload.experience_years,
            )
            db.add(details)

        await db.flush()
        return details

    @staticmethod
    async def save_booking_details(
        db: AsyncSession,
        user: User,
        payload: OnboardingBookingRequest,
    ) -> CABookingDetails:
        profile = await CAService.get_profile_by_user(db, user.id)
        if not profile:
            raise NotFoundError("CA Profile")

        result = await db.execute(
            select(CABookingDetails).where(CABookingDetails.ca_id == profile.id)
        )
        details = result.scalar_one_or_none()

        slots_json = [s.model_dump() for s in payload.time_slots]

        if details:
            details.slot_duration_minutes = payload.slot_duration_minutes
            details.available_days = payload.available_days
            details.time_slots = slots_json
            details.fee_online = payload.fee_online
            details.fee_inperson = payload.fee_inperson
        else:
            details = CABookingDetails(
                ca_id=profile.id,
                slot_duration_minutes=payload.slot_duration_minutes,
                available_days=payload.available_days,
                time_slots=slots_json,
                fee_online=payload.fee_online,
                fee_inperson=payload.fee_inperson,
            )
            db.add(details)

        profile.onboarding_complete = True
        await db.flush()
        return details

    @staticmethod
    async def get_full_profile(db: AsyncSession, user_id: str) -> CAFullProfileResponse:
        profile = await CAService.get_profile_by_user(db, user_id)
        if not profile:
            raise NotFoundError("CA Profile")

        svc_result = await db.execute(
            select(CAServiceDetails).where(CAServiceDetails.ca_id == profile.id)
        )
        svc = svc_result.scalar_one_or_none()

        bk_result = await db.execute(
            select(CABookingDetails).where(CABookingDetails.ca_id == profile.id)
        )
        bk = bk_result.scalar_one_or_none()

        return CAFullProfileResponse(
            profile=CAProfileResponse.model_validate(profile),
            services=CAServiceDetailsResponse.model_validate(svc) if svc else None,
            booking=CABookingDetailsResponse.model_validate(bk) if bk else None,
        )

    @staticmethod
    async def toggle_visibility(
        db: AsyncSession,
        user: User,
        is_visible: bool,
    ) -> CAProfile:
        profile = await CAService.get_profile_by_user(db, user.id)
        if not profile:
            raise NotFoundError("CA Profile")
        if profile.verification_status != VerificationStatus.VERIFIED:
            raise ForbiddenError("Profile must be verified before enabling visibility")
        profile.is_visible = is_visible
        await db.flush()
        return profile

    @staticmethod
    async def get_public_profile(
        db: AsyncSession,
        ca_id: str,
    ) -> PublicCAProfileResponse:
        result = await db.execute(
            select(CAProfile).where(CAProfile.id == ca_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise NotFoundError("CA Profile")
        if profile.verification_status != VerificationStatus.VERIFIED or not profile.is_visible:
            raise NotFoundError("CA Profile")

        svc_result = await db.execute(
            select(CAServiceDetails).where(CAServiceDetails.ca_id == profile.id)
        )
        svc = svc_result.scalar_one_or_none()

        bk_result = await db.execute(
            select(CABookingDetails).where(CABookingDetails.ca_id == profile.id)
        )
        bk = bk_result.scalar_one_or_none()

        return PublicCAProfileResponse(
            id=profile.id,
            full_name=profile.full_name,
            icai_membership_number=profile.icai_membership_number,
            year_of_qualification=profile.year_of_qualification,
            firm_name=profile.firm_name,
            services=svc.services if svc else [],
            consultation_mode=svc.consultation_mode if svc else "BOTH",
            languages=svc.languages if svc else [],
            experience_years=svc.experience_years if svc else None,
            fee_online=bk.fee_online if bk else None,
            fee_inperson=bk.fee_inperson if bk else None,
            available_days=bk.available_days if bk else [],
        )
