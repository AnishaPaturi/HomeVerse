from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    name: str
    email: EmailStr
    plan: Optional[str] = "Free"

class UserCreate(UserBase):
    password: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: Optional[str] = None

class User(UserBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[User] = None

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None
