from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
import uuid

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=6)

class GoogleAuthRequest(BaseModel):
    credential: str
    client_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
