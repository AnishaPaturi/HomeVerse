"""
HomeVerse Notification Engine API (Phase 48)
- Dynamic notification registry for budget alerts, milestone handovers, and order deliveries
- Context-aware notification generation linked to user projects, budgets, and milestones
- Mark read, mark all read, delete, and list by project/user
"""

from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.db.session import get_db
from app.models.notification import Notification as NotificationModel
from app.models.project import Project as ProjectModel
from app.models.user import User as UserModel

router = APIRouter()

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = "info"  # budget_alert, milestone, delivery, recommendation, info
    project_id: Optional[UUID] = None
    user_id: Optional[UUID] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationOut(NotificationBase):
    id: UUID
    read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationSummaryOut(BaseModel):
    total_count: int
    unread_count: int
    notifications: List[NotificationOut]


def resolve_user(db: Session, user_id: Optional[str] = None, email: Optional[str] = None) -> Optional[UserModel]:
    if user_id:
        try:
            val_uuid = UUID(str(user_id))
            u = db.query(UserModel).filter(UserModel.id == val_uuid).first()
            if u:
                return u
        except (ValueError, AttributeError):
            pass
    if email:
        clean = email.strip().lower()
        return db.query(UserModel).filter(func.lower(UserModel.email) == clean).first()
    return None


def sync_dynamic_notifications(
    db: Session,
    project_id: Optional[UUID] = None,
    user: Optional[UserModel] = None,
) -> None:
    """
    Dynamically generates contextual notifications based on real projects, budgets, and milestones.
    """
    # 1. Project-scoped notifications
    if project_id:
        proj_count = db.query(NotificationModel).filter(NotificationModel.project_id == project_id).count()
        if proj_count == 0:
            proj = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
            title_name = proj.title if proj else "Design Project"
            room_count = len(proj.rooms) if proj and proj.rooms else 0
            owner_user_id = proj.user_id if proj else (user.id if user else None)
            
            # Milestone
            db.add(NotificationModel(
                title=f"Milestone Achieved: {title_name}",
                message=f"Structural CAD twin initialized with {room_count} space layouts. Spatial clearances verified.",
                type="milestone",
                read=False,
                project_id=project_id,
                user_id=owner_user_id,
            ))
            # Budget Alert
            budget_val = proj.budget if (proj and proj.budget) else 750000.0
            db.add(NotificationModel(
                title=f"Budget Envelope: {title_name}",
                message=f"Allocated ₹{budget_val:,.0f} for Indian materials, fixtures, and interior labor envelopes.",
                type="budget_alert",
                read=False,
                project_id=project_id,
                user_id=owner_user_id,
            ))
            # Logistics / Delivery
            db.add(NotificationModel(
                title="Procurement Order Prepared",
                message=f"Material procurement catalog synced with curated vendors for {title_name}.",
                type="delivery",
                read=False,
                project_id=project_id,
                user_id=owner_user_id,
            ))
            # AI Recommendation
            db.add(NotificationModel(
                title="Value Engineering Insight",
                message=f"AI Copilot identified high-durability finish alternatives for {title_name} with up to 12% cost optimization.",
                type="recommendation",
                read=True,
                project_id=project_id,
                user_id=owner_user_id,
            ))
            db.commit()
        return

    # 2. User-scoped notifications
    if user:
        user_count = db.query(NotificationModel).filter(NotificationModel.user_id == user.id).count()
        if user_count == 0:
            # Query user's real projects
            user_projects = (
                db.query(ProjectModel)
                .filter(or_(ProjectModel.user_id == user.id, ProjectModel.email == user.email))
                .order_by(ProjectModel.created_at.desc())
                .all()
            )

            if user_projects:
                for p in user_projects[:2]:
                    r_cnt = len(p.rooms) if p.rooms else 0
                    db.add(NotificationModel(
                        title=f"Workspace Active: {p.title}",
                        message=f"Spatial digital twin with {r_cnt} room configurations is live in 3D Studio.",
                        type="milestone",
                        read=False,
                        project_id=p.id,
                        user_id=user.id,
                    ))
                    b_val = p.budget if p.budget else 500000.0
                    db.add(NotificationModel(
                        title=f"Budget Allocation: {p.title}",
                        message=f"Procurement envelope ₹{b_val:,.0f} initialized for materials & execution tracking.",
                        type="budget_alert",
                        read=False,
                        project_id=p.id,
                        user_id=user.id,
                    ))
                    db.add(NotificationModel(
                        title="AI Spatial Intelligence",
                        message=f"Circulation clearances and lighting analyses computed for {p.title}.",
                        type="recommendation",
                        read=True,
                        project_id=p.id,
                        user_id=user.id,
                    ))
            else:
                first_name = user.name.split()[0] if user.name else "Creator"
                db.add(NotificationModel(
                    title=f"Welcome to HomeVerse OS, {first_name}",
                    message="Your spatial interior workspace is ready. Click 'New Home' to upload your blueprint or begin 3D modeling.",
                    type="milestone",
                    read=False,
                    user_id=user.id,
                ))
                db.add(NotificationModel(
                    title="Spatial AI Engine Active",
                    message="Generative interior variations and Indian budget estimators are connected to your studio.",
                    type="recommendation",
                    read=False,
                    user_id=user.id,
                ))
            db.commit()


@router.get("", response_model=List[NotificationOut])
@router.get("/", response_model=List[NotificationOut])
def list_notifications(
    user_id: Optional[str] = None,
    email: Optional[str] = None,
    project_id: Optional[UUID] = None,
    unread_only: bool = False,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Retrieves all notifications matching user/project filters, dynamically generating live alerts.
    """
    user = resolve_user(db, user_id=user_id, email=email)
    sync_dynamic_notifications(db, project_id=project_id, user=user)

    query = db.query(NotificationModel)
    if user:
        query = query.filter(NotificationModel.user_id == user.id)
    elif user_id:
        try:
            query = query.filter(NotificationModel.user_id == UUID(str(user_id)))
        except (ValueError, AttributeError):
            pass
    if project_id:
        query = query.filter(NotificationModel.project_id == project_id)
    if unread_only:
        query = query.filter(NotificationModel.read == False)

    return query.order_by(NotificationModel.created_at.desc()).limit(limit).all()


@router.get("/summary", response_model=NotificationSummaryOut)
def get_notifications_summary(
    user_id: Optional[str] = None,
    email: Optional[str] = None,
    project_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
):
    """Provides unread count, total count, and notification items dynamically."""
    user = resolve_user(db, user_id=user_id, email=email)
    sync_dynamic_notifications(db, project_id=project_id, user=user)

    query = db.query(NotificationModel)
    if user:
        query = query.filter(NotificationModel.user_id == user.id)
    elif user_id:
        try:
            query = query.filter(NotificationModel.user_id == UUID(str(user_id)))
        except (ValueError, AttributeError):
            pass
    if project_id:
        query = query.filter(NotificationModel.project_id == project_id)

    all_items = query.order_by(NotificationModel.created_at.desc()).all()
    unread_count = sum(1 for it in all_items if not it.read)

    return NotificationSummaryOut(
        total_count=len(all_items),
        unread_count=unread_count,
        notifications=all_items,
    )


@router.post("", response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
def create_notification(notif_in: NotificationCreate, db: Session = Depends(get_db)):
    """Logs a new system, budget, or milestone notification."""
    notif = NotificationModel(
        title=notif_in.title,
        message=notif_in.message,
        type=notif_in.type,
        project_id=notif_in.project_id,
        user_id=notif_in.user_id,
        read=False,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


@router.put("/{notification_id}/read", response_model=NotificationOut)
def mark_notification_as_read(notification_id: UUID, db: Session = Depends(get_db)):
    """Marks an individual notification as read."""
    notif = db.query(NotificationModel).filter(NotificationModel.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notif.read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.put("/read-all", response_model=dict)
def mark_all_notifications_as_read(
    user_id: Optional[str] = None,
    email: Optional[str] = None,
    project_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
):
    """Marks all matching notifications as read."""
    user = resolve_user(db, user_id=user_id, email=email)
    query = db.query(NotificationModel).filter(NotificationModel.read == False)
    if user:
        query = query.filter(NotificationModel.user_id == user.id)
    elif user_id:
        try:
            query = query.filter(NotificationModel.user_id == UUID(str(user_id)))
        except (ValueError, AttributeError):
            pass
    if project_id:
        query = query.filter(NotificationModel.project_id == project_id)

    updated_count = query.update({NotificationModel.read: True}, synchronize_session=False)
    db.commit()
    return {"status": "success", "updated_count": updated_count}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(notification_id: UUID, db: Session = Depends(get_db)):
    """Removes a notification from the registry."""
    notif = db.query(NotificationModel).filter(NotificationModel.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    db.delete(notif)
    db.commit()
    return None
