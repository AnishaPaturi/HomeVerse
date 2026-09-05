from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User as UserModel
from app.schemas.user import User as UserSchema, UserCreate
from app.core.rate_limiter import rate_limit_login, rate_limit_register

router = APIRouter()

@router.post(
    "/register",
    response_model=UserSchema,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit_register)],
)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserModel).filter(UserModel.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = UserModel(
        name=user_in.name,
        email=user_in.email,
        plan=user_in.plan
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

from uuid import UUID

@router.post("/demo", response_model=UserSchema)
def get_demo_user(db: Session = Depends(get_db)):
    """Returns or seeds the official development/testing demo user."""
    demo_id = UUID("d0000000-0000-0000-0000-000000000000")
    demo_user = db.query(UserModel).filter(UserModel.id == demo_id).first()
    if not demo_user:
        demo_user = UserModel(
            id=demo_id,
            name="Anisha Paturi",
            email="designer@homeverse.ai",
            plan="Pro Designer"
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
def login_user(email: str, db: Session = Depends(get_db)):
    """Login endpoint for development and testing."""
    user = db.query(UserModel).filter(UserModel.email == email).first()
    if not user:
        # If logging in as demo email, auto-seed
        if email.lower() in ["designer@homeverse.ai", "demo@homeverse.ai"]:
            return get_demo_user(db)
        # Create lightweight session user
        user = UserModel(
            name=email.split("@")[0].capitalize(),
            email=email,
            plan="Pro Designer"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@router.get("/me", response_model=UserSchema)
def get_current_user(email: str, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user
