"""
Authentication and Identity Router (Phases 42 & 43)
- Rate-limited registration and login
- Password hashing with bcrypt
- JWT token issuance and validation
- Input sanitization
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
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
    db_user = db.query(UserModel).filter(UserModel.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    pwd_hash = None
    if user_in.password:
        is_valid, err_msg = validate_password_strength(user_in.password)
        if not is_valid:
            raise ValidationErrorException(message=err_msg)
        pwd_hash = get_password_hash(user_in.password)

    user = UserModel(
        name=sanitize_text(user_in.name),
        email=user_in.email,
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
    target_email = credentials.email if credentials else email
    if not target_email:
        raise ValidationErrorException(message="Email address is required for login.")

    user = db.query(UserModel).filter(UserModel.email == target_email).first()

    # If logging in as demo email, auto-seed
    if not user and target_email.lower() in ["designer@homeverse.ai", "demo@homeverse.ai"]:
        return get_demo_user(db)

    if not user:
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
