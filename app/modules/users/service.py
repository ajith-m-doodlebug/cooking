from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.exceptions import NotFoundError
from app.modules.auth.models import User


class UserService:

    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: str) -> User | None:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def update_profile(
        db: AsyncSession,
        user_id: str,
        full_name: str | None,
    ) -> User:
        user = await UserService.get_by_id(db, user_id)
        if not user:
            raise NotFoundError("User")
        if full_name is not None:
            user.full_name = full_name
        await db.flush()
        return user
