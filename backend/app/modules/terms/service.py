from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.exceptions import NotFoundError, ConflictError
from app.modules.auth.models import User, UserRole
from .models import TermsContent, TermsAcceptance
from .schemas import TermsStatusResponse


class TermsService:

    @staticmethod
    async def get_latest(db: AsyncSession, role: UserRole) -> TermsContent:
        result = await db.execute(
            select(TermsContent)
            .where(TermsContent.role == role, TermsContent.is_active == True)
            .order_by(TermsContent.created_at.desc())
            .limit(1)
        )
        terms = result.scalar_one_or_none()
        if not terms:
            raise NotFoundError(f"Terms & Conditions for {role}")
        return terms

    @staticmethod
    async def accept(
        db: AsyncSession,
        user: User,
        version: str,
    ) -> TermsAcceptance:
        latest = await TermsService.get_latest(db, user.role)
        if latest.version != version:
            raise ConflictError(f"Version mismatch. Current version is {latest.version}")

        existing = await db.execute(
            select(TermsAcceptance).where(
                TermsAcceptance.user_id == user.id,
                TermsAcceptance.version == version,
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictError("You have already accepted this version")

        acceptance = TermsAcceptance(
            user_id=user.id,
            role=user.role,
            version=version,
            accepted_at=datetime.now(timezone.utc),
        )
        db.add(acceptance)
        user.terms_accepted = True
        await db.flush()
        return acceptance

    @staticmethod
    async def get_status(db: AsyncSession, user: User) -> TermsStatusResponse:
        latest = await TermsService.get_latest(db, user.role)

        result = await db.execute(
            select(TermsAcceptance)
            .where(TermsAcceptance.user_id == user.id)
            .order_by(TermsAcceptance.accepted_at.desc())
            .limit(1)
        )
        last_acceptance = result.scalar_one_or_none()

        has_accepted = (
            last_acceptance is not None
            and last_acceptance.version == latest.version
        )
        return TermsStatusResponse(
            has_accepted=has_accepted,
            current_version=latest.version,
            accepted_version=last_acceptance.version if last_acceptance else None,
        )
