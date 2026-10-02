from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User as UserModel
from app.schemas.user import User as UserSchema

router = APIRouter()

class DeleteAccountRequest(BaseModel):
    email: Optional[str] = None
    confirmation: Optional[str] = None

@router.get("/me", response_model=UserSchema)
def get_current_user(email: Optional[str] = None, db: Session = Depends(get_db)):
    """Retrieve the currently authenticated user or user by email."""
    if email:
        user = db.query(UserModel).filter(UserModel.email == email.strip().lower()).first()
    else:
        user = db.query(UserModel).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

from sqlalchemy import func
from app.services.account_purge import AccountPurgeService

@router.delete("/me")
@router.delete("/account")
def delete_current_user(
    email: Optional[str] = None,
    payload: Optional[DeleteAccountRequest] = Body(default=None),
    db: Session = Depends(get_db)
):
    """
    Permanently deletes user account and completely purges all associated
    traces from the database (projects, budgets, rooms, scenes, objects,
    floorplans, preferences, analytics, notifications, and providers).
    """
    target_email = payload.email if payload and payload.email else email
    if not target_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is required to delete account.",
        )

    clean_email = target_email.strip().lower()
    user = db.query(UserModel).filter(func.lower(UserModel.email) == clean_email).first()

    if not user:
        # Also clean up any residual orphaned records for this email
        AccountPurgeService.purge_user(db, email=clean_email)
        return {
            "success": True,
            "message": f"Account {clean_email} and all associated data have been permanently deleted.",
            "deleted_email": clean_email,
            "projects_deleted": 0,
        }

    deleted_email = user.email
    purge_result = AccountPurgeService.purge_user(db, user=user)

    return {
        "success": True,
        "message": f"Account {deleted_email} and all associated data have been permanently deleted.",
        "deleted_email": deleted_email,
        "projects_deleted": purge_result.get("projects_purged", 0),
    }

@router.delete("/{user_id}")
def delete_user_by_id(user_id: UUID, db: Session = Depends(get_db)):
    """Permanently deletes a specific user by UUID and purges all traces."""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        AccountPurgeService.purge_user(db, user_id=user_id)
        return {
            "success": True,
            "message": f"User {user_id} and all associated data deleted successfully.",
            "user_id": str(user_id),
            "projects_deleted": 0,
        }

    deleted_email = user.email
    purge_result = AccountPurgeService.purge_user(db, user=user, user_id=user_id)

    return {
        "success": True,
        "message": f"User {deleted_email} and all associated data deleted successfully.",
        "user_id": str(user_id),
        "projects_deleted": purge_result.get("projects_purged", 0),
    }
