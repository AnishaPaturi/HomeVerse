"""
Authentication Service Layer
Handles user verification, credentials hashing, and session tokens.
"""
from typing import Optional
from uuid import UUID
import uuid
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import get_password_hash, verify_password
from app.services.auth.token_service import create_access_token

class AuthService:
    @staticmethod
    def authenticate_user(db: Session, email: str, password: Optional[str] = None) -> Optional[User]:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        if password and user.hashed_password:
            if not verify_password(password, user.hashed_password):
                return None
        return user

    @staticmethod
    def register_user(db: Session, name: str, email: str, password: str) -> User:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            raise ValueError("Email already registered")

        user = User(
            id=uuid.uuid4(),
            email=email,
            name=name,
            hashed_password=get_password_hash(password),
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def create_user_session(user: User) -> dict:
        token = create_access_token(subject=str(user.id))
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name or user.email.split("@")[0],
                "role": getattr(user, "role", "user")
            }
        }
