from typing import Annotated
from fastapi import Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.security import verify_token
from app.core.exceptions import UnauthorizedError, ForbiddenError

bearer_scheme = HTTPBearer(auto_error=False)

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> str:
    if not credentials:
        raise UnauthorizedError("Bearer token required")
    user_id = verify_token(credentials.credentials, token_type="access")
    if not user_id:
        raise UnauthorizedError("Invalid or expired token")
    return user_id


async def get_current_user(
    user_id: Annotated[str, Depends(get_current_user_id)],
    db: DbSession,
):
    from app.modules.users.service import UserService
    user = await UserService.get_by_id(db, user_id)
    if not user or not user.is_active:
        raise UnauthorizedError("User not found or inactive")
    return user


async def require_ca(user=Depends(get_current_user)):
    if user.role != "CA":
        raise ForbiddenError("Only Chartered Accountants can access this resource")
    return user


async def require_user(user=Depends(get_current_user)):
    if user.role != "USER":
        raise ForbiddenError("Only clients can access this resource")
    return user


CurrentUser = Annotated[object, Depends(get_current_user)]
CurrentCA = Annotated[object, Depends(require_ca)]
CurrentClient = Annotated[object, Depends(require_user)]
