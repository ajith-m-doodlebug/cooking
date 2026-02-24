from fastapi import APIRouter, Depends, Query

from app.dependencies import DbSession, require_ca
from app.modules.ca.service import CAService
from .service import ICAIVerificationService
from .schemas import (
    VerificationStatusResponse,
    VerificationLogEntry,
    RetryVerificationRequest,
)

router = APIRouter()


@router.get(
    "/status",
    response_model=VerificationStatusResponse,
    summary="Get current ICAI verification status",
)
async def get_verification_status(
    db: DbSession,
    current_user=Depends(require_ca),
):
    profile = await CAService.get_profile_by_user(db, current_user.id)
    if not profile:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("CA Profile")
    return await ICAIVerificationService.get_status(db, profile.id)


@router.post(
    "/retry",
    response_model=VerificationStatusResponse,
    summary="Re-submit ICAI details for re-verification",
)
async def retry_verification(
    payload: RetryVerificationRequest,
    db: DbSession,
    current_user=Depends(require_ca),
):
    from app.modules.ca.schemas import OnboardingVerificationRequest
    request = OnboardingVerificationRequest(
        full_name=payload.full_name,
        icai_membership_number=payload.icai_membership_number,
    )
    profile = await CAService.submit_verification(db, current_user, request)
    return await ICAIVerificationService.get_status(db, profile.id)


@router.get(
    "/log",
    response_model=list[VerificationLogEntry],
    summary="View verification attempt history",
)
async def get_verification_log(
    db: DbSession,
    current_user=Depends(require_ca),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    profile = await CAService.get_profile_by_user(db, current_user.id)
    if not profile:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("CA Profile")
    return await ICAIVerificationService.get_logs(db, profile.id, page, size)
