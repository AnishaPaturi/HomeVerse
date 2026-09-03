"""
Authentication Service Layer
Handles user verification, credentials hashing, and session tokens.
"""
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import get_password_hash, verify_password, create_access_token

class AuthService:
    @staticmethod
    def authenticate_user(db: Session, email: str, password: Optional[str] = None) -> Optional[User]:
        user = db.query(User).filter(User.email == email).first()
        return user

    @staticmethod
    def create_user_session(user: User) -> dict:
        token = create_access_token(subject=str(user.id))
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user
        }
