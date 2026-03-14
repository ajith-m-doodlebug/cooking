from fastapi import APIRouter, Depends

from app.dependencies import DbSession, get_current_user
from app.modules.auth.models import UserRole
from .service import TermsService
from .schemas import (
    TermsContentResponse,
    AcceptTermsRequest,
    TermsAcceptanceResponse,
    TermsStatusResponse,
)

router = APIRouter()


@router.get("/{role}", response_model=TermsContentResponse, summary="Get latest T&C for a role")
async def get_terms(role: UserRole, db: DbSession):
    return await TermsService.get_latest(db, role)


@router.post("/accept", response_model=TermsAcceptanceResponse, summary="Accept T&C")
async def accept_terms(
    payload: AcceptTermsRequest,
    db: DbSession,
    current_user=Depends(get_current_user),
):
    return await TermsService.accept(db, current_user, payload.version)

@router.get("/status", response_model=TermsStatusResponse, summary="Check T&C acceptance status")
async def get_terms_status(db: DbSession, current_user=Depends(get_current_user)):
    return await TermsService.get_status(db, current_user)

