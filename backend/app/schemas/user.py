from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    name: str
    email: EmailStr
    plan: Optional[str] = "Free"

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
