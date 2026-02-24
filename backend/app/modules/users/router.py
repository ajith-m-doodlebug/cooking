from fastapi import APIRouter, Depends

from app.dependencies import DbSession, get_current_user
from .service import UserService
from .schemas import UpdateProfileRequest, UserProfileResponse

router = APIRouter()


@router.get("/me", response_model=UserProfileResponse, summary="Get current user profile")
async def get_me(current_user=Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserProfileResponse, summary="Update user profile")
async def update_me(
    payload: UpdateProfileRequest,
    db: DbSession,
    current_user=Depends(get_current_user),
):
    user = await UserService.update_profile(db, current_user.id, payload.full_name)
    return user
