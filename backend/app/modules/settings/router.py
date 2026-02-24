from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
import io

from app.dependencies import DbSession, require_ca
from app.modules.payments.schemas import SettlementResponse
from .service import SettingsService
from .schemas import BankDetailsRequest, BankDetailsResponse

router = APIRouter()


@router.put(
    "/bank",
    response_model=BankDetailsResponse,
    summary="Save or update bank details",
)
async def save_bank_details(
    payload: BankDetailsRequest,
    db: DbSession,
    current_user=Depends(require_ca),
):
    return await SettingsService.save_bank_details(db, current_user.id, payload)


@router.get(
    "/bank",
    response_model=BankDetailsResponse,
    summary="Get bank details",
)
async def get_bank_details(db: DbSession, current_user=Depends(require_ca)):
    return await SettingsService.get_bank_details(db, current_user.id)


@router.get(
    "/settlements",
    response_model=list[SettlementResponse],
    summary="List settlement records",
)
async def list_settlements(
    db: DbSession,
    current_user=Depends(require_ca),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    return await SettingsService.list_settlements(db, current_user.id, page, size)


@router.get(
    "/settlements/download",
    summary="Download settlements as CSV",
)
async def download_settlements(
    db: DbSession,
    current_user=Depends(require_ca),
):
    csv_content = await SettingsService.export_settlements_csv(db, current_user.id)
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=settlements.csv"},
    )
