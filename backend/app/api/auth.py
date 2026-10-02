"""
Authentication and Identity Router (Phases 42 & 43)
- Rate-limited registration and login
- Password hashing with bcrypt
- JWT token issuance and validation
- Input sanitization
"""
import random
import time
from typing import Optional, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User as UserModel
from app.schemas.user import User as UserSchema, UserCreate, UserLogin, Token
from app.core.rate_limiter import rate_limit_login, rate_limit_register
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_token,
    validate_password_strength,
)
from app.core.input_validation import sanitize_text
from app.core.exceptions import UnauthorizedException, ValidationErrorException, ResourceNotFoundException
from app.core.analytics import track_event
from app.services.email_service import send_password_reset_email
from app.services.account_purge import AccountPurgeService
from sqlalchemy import func

router = APIRouter()

DEMO_USER_ID = UUID("d0000000-0000-0000-0000-000000000000")


@router.post(
    "/register",
    response_model=UserSchema,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit_register)],
)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Registers a new user with optional password hashing and sanitized name."""
    clean_email = user_in.email.strip().lower()
    db_user = db.query(UserModel).filter(func.lower(UserModel.email) == clean_email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Purge any legacy orphaned traces for this email to guarantee a clean slate
    AccountPurgeService.purge_user(db, email=clean_email)

    pwd_hash = None
    if user_in.password:
        is_valid, err_msg = validate_password_strength(user_in.password)
        if not is_valid:
            raise ValidationErrorException(message=err_msg)
        pwd_hash = get_password_hash(user_in.password)

    user = UserModel(
        name=sanitize_text(user_in.name),
        email=clean_email,
        password_hash=pwd_hash,
        plan=user_in.plan or "Free",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Product analytics event (Phase 45)
    try:
        track_event(
            db=db,
            event_name="user_registered",
            user_id=user.id,
            properties={"email": user.email, "plan": user.plan},
        )
    except Exception:
        pass

    return user


@router.post("/demo", response_model=UserSchema)
def get_demo_user(db: Session = Depends(get_db)):
    """Returns or seeds the official development/testing demo user."""
    demo_user = db.query(UserModel).filter(UserModel.id == DEMO_USER_ID).first()
    if not demo_user:
        AccountPurgeService.purge_user(db, user_id=DEMO_USER_ID, email="designer@homeverse.ai")
        demo_user = UserModel(
            id=DEMO_USER_ID,
            name="Anisha Paturi",
            email="designer@homeverse.ai",
            plan="Pro Designer",
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
    return demo_user


@router.post(
    "/login",
    response_model=UserSchema,
    dependencies=[Depends(rate_limit_login)],
)
def login_user(
    email: Optional[str] = None,
    credentials: Optional[UserLogin] = None,
    db: Session = Depends(get_db),
):
    """
    Login endpoint supporting:
    1. Query param `email` for existing development/testing workflows.
    2. JSON body `credentials` (email + password) with bcrypt verification.
    """
    raw_email = credentials.email if credentials else email
    if not raw_email:
        raise ValidationErrorException(message="Email address is required for login.")
    target_email = raw_email.strip().lower()

    user = db.query(UserModel).filter(func.lower(UserModel.email) == target_email).first()

    # If logging in as demo email, auto-seed
    if not user and target_email in ["designer@homeverse.ai", "demo@homeverse.ai"]:
        return get_demo_user(db)

    if not user:
        # Purge any legacy orphaned traces for this email to guarantee a clean slate
        AccountPurgeService.purge_user(db, email=target_email)
        # Create lightweight session user for development
        user = UserModel(
            name=target_email.split("@")[0].capitalize(),
            email=target_email,
            plan="Pro Designer",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    # If user has a password and credentials provide a password, verify it
    if user.password_hash and credentials and credentials.password:
        if not verify_password(credentials.password, user.password_hash):
            raise UnauthorizedException(message="Incorrect email or password.")

    return user


@router.post(
    "/token",
    response_model=Token,
    dependencies=[Depends(rate_limit_login)],
)
def issue_access_token(
    credentials: UserLogin,
    db: Session = Depends(get_db),
):
    """
    Authenticates user and returns a signed JWT access token conforming to Phase 43.
    """
    user = db.query(UserModel).filter(UserModel.email == credentials.email).first()
    if not user and credentials.email.lower() in ["designer@homeverse.ai", "demo@homeverse.ai"]:
        user = get_demo_user(db)

    if not user:
        raise UnauthorizedException(message="Invalid credentials. User does not exist.")

    if user.password_hash and credentials.password:
        if not verify_password(credentials.password, user.password_hash):
            raise UnauthorizedException(message="Invalid credentials. Password mismatch.")

    access_token = create_access_token(
        subject=str(user.id),
        claims={"email": user.email, "plan": user.plan},
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user,
    )


@router.get("/me", response_model=UserSchema)
def get_current_user_profile(
    request: Request,
    email: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Retrieves current user identity either from Bearer JWT token or query parameter.
    """
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        payload = decode_token(token)
        sub = payload.get("sub")
        try:
            user_uuid = UUID(sub)
            user = db.query(UserModel).filter(UserModel.id == user_uuid).first()
        except (ValueError, TypeError):
            user = db.query(UserModel).filter(UserModel.email == sub).first()

        if user:
            return user

    # Fallback to query parameter
    if email:
        user = db.query(UserModel).filter(UserModel.email == email).first()
        if user:
            return user

    raise UnauthorizedException(message="User not found or unauthenticated.")


class ForgotPasswordRequest(BaseModel):
    email: str


class VerifyOtpRequest(BaseModel):
    email: str
    code: str


class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str


# In-memory OTP store: { email: { "code": "28541", "expires_at": timestamp } }
_RESET_OTP_STORE: Dict[str, Dict[str, Any]] = {}


@router.post("/forgot-password")
def request_password_reset(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generates a 5-digit verification code to reset the user's password.
    Code is valid for 10 minutes.
    """
    clean_email = payload.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid email address is required.",
        )

    # 5-digit verification code matching reference UI
    code = f"{random.randint(10000, 99999)}"
    _RESET_OTP_STORE[clean_email] = {
        "code": code,
        "expires_at": time.time() + 600,
    }

    # Dispatch code directly to the user's email inbox via SMTP
    email_delivered = send_password_reset_email(to_email=clean_email, code=code)

    return {
        "success": True,
        "message": f"Verification code sent to {clean_email}",
        "email": clean_email,
        "email_delivered": email_delivered,
    }


@router.post("/verify-otp")
def verify_reset_otp(payload: VerifyOtpRequest):
    """
    Cross-verifies the 5-digit verification code against the stored OTP.
    """
    clean_email = payload.email.strip().lower()
    code_entered = payload.code.strip()

    otp_info = _RESET_OTP_STORE.get(clean_email)
    if not otp_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active verification code found for this email. Please request a new code.",
        )

    if time.time() > otp_info["expires_at"]:
        _RESET_OTP_STORE.pop(clean_email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code.",
        )

    if otp_info["code"] != code_entered:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect verification code. Please check and enter the code again, or request a new code.",
        )

    return {
        "success": True,
        "valid": True,
        "message": "Verification code successfully verified.",
    }


@router.post("/reset-password")
def complete_password_reset(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Verifies the 5-digit code and securely updates the user's password.
    """
    clean_email = payload.email.strip().lower()
    code_entered = payload.code.strip()

    otp_info = _RESET_OTP_STORE.get(clean_email)
    if not otp_info or otp_info["code"] != code_entered:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    is_valid, err_msg = validate_password_strength(payload.new_password)
    if not is_valid:
        raise ValidationErrorException(message=err_msg)

    user = db.query(UserModel).filter(UserModel.email == clean_email).first()
    if user:
        user.password_hash = get_password_hash(payload.new_password)
        db.commit()
        db.refresh(user)
    else:
        # Create user record for demo or unregistered accounts
        user = UserModel(
            name=clean_email.split("@")[0].capitalize(),
            email=clean_email,
            password_hash=get_password_hash(payload.new_password),
            plan="Pro Designer",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Invalidate OTP once used
    _RESET_OTP_STORE.pop(clean_email, None)

    return {
        "success": True,
        "message": "Password successfully updated. You may now log in.",
    }


class DeleteUserAccountRequest(BaseModel):
    email: str


@router.delete("/delete-account")
def delete_user_account(payload: DeleteUserAccountRequest, db: Session = Depends(get_db)):
    """Permanently deletes user account and completely purges all associated data traces from the database."""
    clean_email = payload.email.strip().lower()
    user = db.query(UserModel).filter(func.lower(UserModel.email) == clean_email).first()
    if not user:
        AccountPurgeService.purge_user(db, email=clean_email)
        return {
            "success": True,
            "message": f"Account {clean_email} has been permanently deleted.",
            "projects_deleted": 0,
        }

    purge_result = AccountPurgeService.purge_user(db, user=user)

    return {
        "success": True,
        "message": f"Account {clean_email} has been permanently deleted.",
        "projects_deleted": purge_result.get("projects_purged", 0),
    }


