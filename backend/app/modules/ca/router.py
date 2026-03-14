from fastapi import APIRouter, Depends

from app.dependencies import DbSession, get_current_user, require_ca
from .service import CAService
from .schemas import (
    OnboardingVerificationRequest,
    OnboardingServicesRequest,
    OnboardingBookingRequest,
    CAProfileResponse,
    CAServiceDetailsResponse,
    CABookingDetailsResponse,
    CAFullProfileResponse,
    ToggleVisibilityRequest,
    PublicCAProfileResponse,
    CAProfilePreviewResponse,
)

router = APIRouter()


@router.post(
    "/onboarding/verification",
    response_model=CAProfileResponse,
    summary="Submit ICAI verification details (Page 1)",
)
async def submit_verification(
    payload: OnboardingVerificationRequest,
    db: DbSession,
    current_user=Depends(require_ca),
):
    return await CAService.submit_verification(db, current_user, payload)


@router.post(
    "/onboarding/services",
    response_model=CAServiceDetailsResponse,
    summary="Submit service details (Page 2)",
)
async def submit_services(
    payload: OnboardingServicesRequest,
    db: DbSession,
    current_user=Depends(require_ca),
):
    return await CAService.save_service_details(db, current_user, payload)


@router.post(
    "/onboarding/booking",
    response_model=CABookingDetailsResponse,
    summary="Submit booking details (Page 3)",
)
async def submit_booking(
    payload: OnboardingBookingRequest,
    db: DbSession,
    current_user=Depends(require_ca),
):
    return await CAService.save_booking_details(db, current_user, payload)


@router.get(
    "/profile",
    response_model=CAFullProfileResponse,
    summary="Get own full CA profile",
)
async def get_my_profile(db: DbSession, current_user=Depends(require_ca)):
    return await CAService.get_full_profile(db, current_user.id)


@router.get(
    "/profile/preview",
    response_model=CAProfilePreviewResponse,
    summary="Preview how your profile appears to clients",
)
async def get_my_profile_preview(db: DbSession, current_user=Depends(require_ca)):
    return await CAService.get_public_profile_preview(db, current_user.id)


@router.put(
    "/profile/visibility",
    response_model=CAProfileResponse,
    summary="Toggle profile visibility ON/OFF",
)
async def toggle_visibility(
    payload: ToggleVisibilityRequest,
    db: DbSession,
    current_user=Depends(require_ca),
):
    return await CAService.toggle_visibility(db, current_user, payload.is_visible)


@router.put(
    "/profile/services",
    response_model=CAServiceDetailsResponse,
    summary="Edit service details",
)
async def edit_services(
    payload: OnboardingServicesRequest,
    db: DbSession,
    current_user=Depends(require_ca),
):
    return await CAService.save_service_details(db, current_user, payload)


@router.put(
    "/profile/booking",
    response_model=CABookingDetailsResponse,
    summary="Edit booking details",
)
async def edit_booking(
    payload: OnboardingBookingRequest,
    db: DbSession,
    current_user=Depends(require_ca),
):
    return await CAService.save_booking_details(db, current_user, payload)


@router.get(
    "/profile/public/{ca_id}",
    response_model=PublicCAProfileResponse,
    summary="View public CA profile",
)
async def get_public_profile(ca_id: str, db: DbSession):
    return await CAService.get_public_profile(db, ca_id)
