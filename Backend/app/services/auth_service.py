from typing import Tuple
import secrets
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from redis.asyncio import Redis
from app.models.user_model import User
from app.schemas.auth_schema import UserCreate
from app.core.config import settings
from app.utils.hashing import get_password_hashed, verify_password
from app.utils.jwt_handler import (
    create_access_token,
    create_refresh_token,
    create_reset_token,
    decode_token,
)
from app.core.exceptions import(AuthException, NotFoundException)
from app.db.redis import get_redis
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

REFRESH_TOKEN_TTL = 60*60*24*7
RESET_TOKEN_TTL = 60 * 30

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    user = User(
        name = user_in.name,
        email = user_in.email,
        password = get_password_hashed(user_in.password),
        role = user_in.role
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(db, email)
    if not user:
        raise AuthException("Invalid email or password")
    if not verify_password(password, user.password):
        raise AuthException("Invalid email or password")
    if user.is_blocked:
        raise AuthException("User is Blocked")
    return user

async def create_tokens_for_user(db: AsyncSession, user: User) -> Tuple[str, str]:
    redis: Redis = await get_redis()
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    await redis.set(
        f"refresh:{user.id}",
        refresh_token,
        ex=REFRESH_TOKEN_TTL
    )
    return access_token, refresh_token

async def refresh_access_token(db: AsyncSession, refresh_token: str) -> Tuple[str, str]:
    try:
        payload = decode_token(refresh_token)
    except ValueError: 
        raise AuthException("Invalid or Expired refresh token")
    if payload.get("type") != "refresh":
        raise AuthException("Invalid token type")
    
    user_id = int(payload["sub"])
    redis: Redis = await get_redis()
    stored_token = await redis.get(f"refresh:{user_id}")
    
    if not stored_token or stored_token != refresh_token:
        raise AuthException("Refresh token revoked")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise NotFoundException("User not found")
    
    new_access = create_access_token(user.id)
    new_refresh = create_refresh_token(user.id)
    
    await redis.set(
        f"refresh:{user.id}",
        new_refresh,
        ex=REFRESH_TOKEN_TTL
    )
    return new_access, new_refresh

async def logout_user(user: User) -> None:
    redis: Redis = await get_redis()
    await redis.delete(f"refresh:{user.id}")


async def request_password_reset(db: AsyncSession, email: str) -> tuple[str | None, User | None]:
    user = await get_user_by_email(db, email)
    if not user:
        return None, None
    token = create_reset_token(user.id)
    redis: Redis = await get_redis()
    await redis.set(f"reset:{user.id}", token, ex=RESET_TOKEN_TTL)
    return token, user


async def reset_password(db: AsyncSession, token: str, new_password: str) -> bool:
    try:
        payload = decode_token(token)
    except ValueError:
        return False
    if payload.get("type") != "reset":
        return False

    user_id = int(payload["sub"])
    redis: Redis = await get_redis()
    stored_token = await redis.get(f"reset:{user_id}")
    if not stored_token or stored_token != token:
        return False

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        return False

    user.password = get_password_hashed(new_password)
    await db.commit()
    await redis.delete(f"reset:{user_id}")
    return True


async def authenticate_google_user(
    db: AsyncSession,
    id_token: str,
    role: str | None = None,
) -> User:
    if not settings.GOOGLE_CLIENT_ID:
        raise AuthException("Google OAuth is not configured")
    try:
        payload = google_id_token.verify_oauth2_token(
            id_token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
        print(payload)
    except Exception as exc:
        raise AuthException("Invalid Google token") from exc

    email = payload.get("email")
    if not email:
        raise AuthException("Google account email not available")
    if payload.get("email_verified") is False:
        raise AuthException("Google email not verified")

    user = await get_user_by_email(db, email)
    if user:
        if user.is_blocked:
            raise AuthException("User is Blocked")
        return user

    name = payload.get("name") or payload.get("given_name") or email.split("@")[0]
    user = User(
        name=name,
        email=email,
        phone=None,
        password=get_password_hashed(secrets.token_urlsafe(24)),
        role=role or "buyer",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
