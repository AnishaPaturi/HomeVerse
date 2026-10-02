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

@router.delete("/me")
@router.delete("/account")
def delete_current_user(
    email: Optional[str] = None,
    payload: Optional[DeleteAccountRequest] = Body(default=None),
    db: Session = Depends(get_db)
):
    """
    Permanently deletes user account and cascades deletion to all associated
    projects, budgets, rooms, floorplans, and preferences.
    """
    target_email = payload.email if payload and payload.email else email
    if not target_email:
        user = db.query(UserModel).first()
    else:
        user = db.query(UserModel).filter(UserModel.email == target_email.strip().lower()).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    deleted_email = user.email
    db.delete(user)
    db.commit()

    return {
        "success": True,
        "message": f"Account {deleted_email} and all associated data have been permanently deleted.",
        "deleted_email": deleted_email
    }

@router.delete("/{user_id}")
def delete_user_by_id(user_id: UUID, db: Session = Depends(get_db)):
    """Permanently deletes a specific user by UUID."""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    deleted_email = user.email
    db.delete(user)
    db.commit()

    return {
        "success": True,
        "message": f"User {deleted_email} deleted successfully.",
        "user_id": str(user_id)
    }
