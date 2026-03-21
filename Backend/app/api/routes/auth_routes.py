from fastapi import APIRouter, Depends, status, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.auth_schema import (
    UserCreate,
    UserOut,
    TokenPair,
    UserIn,
    RefreshTokenIn,
    ForgotPasswordIn,
    ResetPasswordIn,
    GoogleTokenIn,
)
from app.db.postgres import get_db
from app.services.auth_service import (
    create_user,
    authenticate_user,
    create_tokens_for_user,
    refresh_access_token,
    logout_user,
    get_user_by_email,
    request_password_reset,
    reset_password,
    authenticate_google_user,
)
from app.api.deps.auth_deps import get_current_user
from app.models.user_model import User
from app.utils.rate_limiter import RateLimiter
from app.utils.email_handler import send_email_background
from app.utils.email_templates import password_reset_email, welcome_email

router = APIRouter(prefix="/auth", tags=["auth"])

register_rate_limit = RateLimiter(limit=3, window_seconds=300, key_prefix="register")
@router.post("/register", dependencies=[Depends(register_rate_limit)], response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await get_user_by_email(db, user_in.email)
    print(existing)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = await create_user(db, user_in)
    print(user)
    subject, body = welcome_email(user.name)
    send_email_background(user.email, subject, body)
    return user


login_rate_limit = RateLimiter(limit=5, window_seconds=60, key_prefix="login")
@router.post("/login", dependencies=[Depends(login_rate_limit)], response_model=TokenPair)
async def login(data: UserIn, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid Credentials")
    access, refresh = await create_tokens_for_user(db, user)
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}


google_rate_limit = RateLimiter(limit=5, window_seconds=60, key_prefix="google-login")
@router.post("/google", dependencies=[Depends(google_rate_limit)], response_model=TokenPair)
async def google_login(data: GoogleTokenIn, db: AsyncSession = Depends(get_db)):

    print("GOOGLE_AUTH request", {
        "role": data.role,
        "has_token": bool(data.id_token),
    })
    if data.role == "admin":
        print("GOOGLE_AUTH blocked: admin role")
        raise HTTPException(status_code=403, detail="Google sign-in not allowed for admin role")
    user = await authenticate_google_user(
        db,
        data.id_token,
        data.role,
    )
    access, refresh = await create_tokens_for_user(db, user)
    print("GOOGLE_AUTH success", {"user_id": user.id, "role": user.role})
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}


refresh_rate_limit = RateLimiter(limit=10, window_seconds=300, key_prefix="refresh")
@router.post("/refresh", dependencies=[Depends(refresh_rate_limit)], response_model=TokenPair)
async def refresh(tokens: RefreshTokenIn, db: AsyncSession = Depends(get_db)):
    access, new_refresh = await refresh_access_token(db, tokens.refresh_token)
    if not access:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    return TokenPair(access_token=access, refresh_token=new_refresh)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def logout(current_user: User = Depends(get_current_user)):
    await logout_user(current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordIn, db: AsyncSession = Depends(get_db)):
    token, user = await request_password_reset(db, data.email)
    if token and user:
        subject, body = password_reset_email(user.name, token)
        send_email_background(user.email, subject, body)
    # Never leak reset token in API response.
    return {"message": "If the email exists, reset instructions were generated."}


@router.post("/reset-password")
async def reset_password_route(data: ResetPasswordIn, db: AsyncSession = Depends(get_db)):
    ok = await reset_password(db, data.token, data.new_password)
    if not ok:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    return {"message": "Password reset successful"}

