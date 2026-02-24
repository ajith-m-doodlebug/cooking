import math
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from app.modules.ca.models import (
    CAProfile, CAServiceDetails, CABookingDetails, VerificationStatus, ConsultationMode
)
from app.modules.subscriptions.models import Subscription
from .schemas import CASearchResult, CASearchResponse


class SearchService:

    @staticmethod
    async def search_cas(
        db: AsyncSession,
        service: str | None = None,
        location: str | None = None,
        mode: ConsultationMode | None = None,
        language: str | None = None,
        fee_min: float | None = None,
        fee_max: float | None = None,
        experience_min: int | None = None,
        experience_max: int | None = None,
        sort_by: str = "fee_asc",
        page: int = 1,
        size: int = 20,
    ) -> CASearchResponse:
        # Base: only verified, visible, and actively subscribed CAs
        base_query = (
            select(CAProfile, CAServiceDetails, CABookingDetails)
            .join(CAServiceDetails, CAServiceDetails.ca_id == CAProfile.id, isouter=True)
            .join(CABookingDetails, CABookingDetails.ca_id == CAProfile.id, isouter=True)
            .join(
                Subscription,
                and_(
                    Subscription.ca_id == CAProfile.id,
                    Subscription.is_active == True,
                ),
                isouter=False,
            )
            .where(
                CAProfile.verification_status == VerificationStatus.VERIFIED,
                CAProfile.is_visible == True,
            )
        )

        if mode:
            base_query = base_query.where(
                or_(
                    CAServiceDetails.consultation_mode == mode,
                    CAServiceDetails.consultation_mode == ConsultationMode.BOTH,
                )
            )

        if experience_min is not None:
            base_query = base_query.where(
                CAServiceDetails.experience_years >= experience_min
            )

        if experience_max is not None:
            base_query = base_query.where(
                CAServiceDetails.experience_years <= experience_max
            )

        if fee_min is not None:
            base_query = base_query.where(
                or_(
                    CABookingDetails.fee_online >= fee_min,
                    CABookingDetails.fee_inperson >= fee_min,
                )
            )

        if fee_max is not None:
            base_query = base_query.where(
                or_(
                    CABookingDetails.fee_online <= fee_max,
                    CABookingDetails.fee_inperson <= fee_max,
                )
            )

        # Sorting
        if sort_by == "fee_asc":
            base_query = base_query.order_by(CABookingDetails.fee_online.asc().nullslast())
        elif sort_by == "fee_desc":
            base_query = base_query.order_by(CABookingDetails.fee_online.desc().nullslast())

        # Count
        count_query = select(func.count()).select_from(base_query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar_one()

        # Paginate
        paginated = base_query.offset((page - 1) * size).limit(size)
        result = await db.execute(paginated)
        rows = result.all()

        items = []
        for profile, svc, bk in rows:
            # Filter by service (JSON field — in-memory post-filter)
            if service and svc and service not in svc.services:
                continue
            # Filter by language
            if language and svc and language not in svc.languages:
                continue
            # Filter by location (office address text search)
            if location and profile.registered_office_address:
                if location.lower() not in profile.registered_office_address.lower():
                    continue

            items.append(
                CASearchResult(
                    id=profile.id,
                    full_name=profile.full_name,
                    icai_membership_number=profile.icai_membership_number,
                    year_of_qualification=profile.year_of_qualification,
                    firm_name=profile.firm_name,
                    services=svc.services if svc else [],
                    consultation_mode=svc.consultation_mode if svc else ConsultationMode.BOTH,
                    languages=svc.languages if svc else [],
                    experience_years=svc.experience_years if svc else None,
                    fee_online=bk.fee_online if bk else None,
                    fee_inperson=bk.fee_inperson if bk else None,
                    available_days=bk.available_days if bk else [],
                )
            )

        return CASearchResponse(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=math.ceil(total / size) if size > 0 else 0,
        )
