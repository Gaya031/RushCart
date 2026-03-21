from pydantic import BaseModel, EmailStr, Field
from app.models.user_model import UserRole

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8)
    role: UserRole = UserRole.buyer

class UserIn(BaseModel):
    email: EmailStr
    password: str
    
class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    wallet_balance: int
    
    class Config:
        from_attributes = True

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenIn(BaseModel):
    refresh_token: str


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class TokenPayload(BaseModel):
    sub: int
    exp: int


class GoogleTokenIn(BaseModel):
    id_token: str
    role: UserRole = UserRole.buyer
    
