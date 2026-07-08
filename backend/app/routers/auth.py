import logging
from typing import Optional
from fastapi import APIRouter, Depends, Request, Response, Header, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.rbac import get_current_user_claims
from app.services.auth_service import AuthService
from app.services.token_service import TokenService
from app.services.user_service import UserService
from app.exceptions import AppException

logger = logging.getLogger("app.routers.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])


# Schemas
class GoogleLoginRequest(BaseModel):
    code: str
    redirect_uri: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    avatar_url: Optional[str] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


def set_refresh_cookie(response: Response, refresh_token: str):
    """
    Sets secure HttpOnly cookie containing the rotating refresh token.
    """
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True, # Production-ready HTTPS enforcement
        samesite="strict",
        path="/api/v1/auth", # Restrict cookies to auth routes
        max_age=604800 # 7 days
    )


@router.post("/google", response_model=LoginResponse)
async def google_login(
    payload: GoogleLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    logger.info(f"Received code: {payload.code!r}")
    logger.info(f"Received redirect_uri: {payload.redirect_uri!r}")
    auth_service = AuthService(db)
    access_token, refresh_token, user = await auth_service.login_with_google(payload.code, payload.redirect_uri)
    
    set_refresh_cookie(response, refresh_token)
    
    return {
        "access_token": access_token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "avatar_url": user.avatar_url
        }
    }


@router.post("/refresh")
async def rotate_session(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message="Session expired. Missing refresh token."
        )

    # Perform decoding to resolve user details (Owner/Developer permissions)
    # inside TokenService
    token_service = TokenService(db)
    user_service = UserService(db)
    
    try:
        # Unverified decode to fetch user id
        unverified = jwt = TokenService.create_session # We will use token service method to decapsulate
        from app.core.security import decode_token
        claims = decode_token(refresh_token)
        user_id = claims["sub"]
    except Exception:
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message="Session token is invalid or expired."
        )

    user = await user_service.get_user(user_id)
    if not user or not user.is_active:
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message="Your user profile has been disabled."
        )

    new_access, new_refresh = await token_service.rotate_refresh_token(
        refresh_token, 
        user.role, 
        str(user.organization_id)
    )
    
    # Save rotation transaction
    await db.commit()
    
    set_refresh_cookie(response, new_refresh)
    
    return {
        "access_token": new_access,
        "token_type": "bearer"
    }


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    refresh_token = request.cookies.get("refresh_token")
    access_token = None
    
    if authorization and authorization.startswith("Bearer "):
        access_token = authorization.split(" ")[1]

    if refresh_token:
        token_service = TokenService(db)
        await token_service.revoke_session(refresh_token, access_token)
        await db.commit()

    # Clear HttpOnly cookie
    response.delete_cookie(
        key="refresh_token",
        path="/api/v1/auth"
    )
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    claims: dict = Depends(get_current_user_claims),
    db: AsyncSession = Depends(get_db)
):
    user_service = UserService(db)
    user = await user_service.get_user(claims["sub"])
    if not user:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="USER_NOT_FOUND",
            message="User profile was not located."
        )
        
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "avatar_url": user.avatar_url
    }
