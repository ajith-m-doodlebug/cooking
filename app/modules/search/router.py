from fastapi import APIRouter, Query
from typing import Literal

from app.dependencies import DbSession
from app.modules.ca.models import ConsultationMode
from .service import SearchService
from .schemas import CASearchResponse

router = APIRouter()


@router.get("/ca", response_model=CASearchResponse, summary="Search verified CAs with filters")
async def search_cas(
    db: DbSession,
    service: str | None = Query(None, description="Service type filter"),
    location: str | None = Query(None, description="Location / city filter"),
    mode: ConsultationMode | None = Query(None, description="Consultation mode"),
    language: str | None = Query(None, description="Language filter"),
    fee_min: float | None = Query(None, ge=0, description="Minimum fee"),
    fee_max: float | None = Query(None, ge=0, description="Maximum fee"),
    experience_min: int | None = Query(None, ge=0, description="Minimum experience years"),
    experience_max: int | None = Query(None, ge=0, description="Maximum experience years"),
    sort_by: Literal["fee_asc", "fee_desc"] = Query("fee_asc", description="Sort order"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    return await SearchService.search_cas(
        db=db,
        service=service,
        location=location,
        mode=mode,
        language=language,
        fee_min=fee_min,
        fee_max=fee_max,
        experience_min=experience_min,
        experience_max=experience_max,
        sort_by=sort_by,
        page=page,
        size=size,
    )
