"""
HomeVerse Notification Engine API (Phase 48)
- Notification registry for budget alerts, milestone handovers, and order deliveries
- Mark read, mark all read, delete, and list by project/user
"""

from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.notification import Notification as NotificationModel
from app.models.project import Project as ProjectModel

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

CANONICAL_NOTIFICATIONS = [
    {
        "title": "Budget Alert",
        "message": "65% of allocated living room budget has been utilized. Remaining contingency: ₹2.80L.",
        "type": "budget_alert",
        "read": False,
    },
    {
        "title": "Milestone Achieved",
        "message": "Civil and Demolition works completed ahead of schedule. Site ready for electrical rough-in.",
        "type": "milestone",
        "read": False,
    },
    {
        "title": "Order Dispatched",
        "message": "L-Shape Modular Sectional Sofa has been shipped by Havenly Living. Tracking ID: HV-88219.",
        "type": "delivery",
        "read": False,
    },
    {
        "title": "Value Engineering Tip",
        "message": "Switching to engineered walnut coffee table saves ₹9,500 without altering room aesthetics.",
        "type": "recommendation",
        "read": True,
    },
]

def seed_notifications_if_empty(db: Session, project_id: Optional[UUID] = None, user_id: Optional[UUID] = None):
    query = db.query(NotificationModel)
    if project_id:
        query = query.filter(NotificationModel.project_id == project_id)
    elif user_id:
        query = query.filter(NotificationModel.user_id == user_id)
    
    if query.count() == 0:
        for item in CANONICAL_NOTIFICATIONS:
            notif = NotificationModel(
                title=item["title"],
                message=item["message"],
                type=item["type"],
                read=item["read"],
                project_id=project_id,
                user_id=user_id,
            )
            db.add(notif)
        db.commit()


@router.get("", response_model=List[NotificationOut])
@router.get("/", response_model=List[NotificationOut])
def list_notifications(
    user_id: Optional[UUID] = None,
    project_id: Optional[UUID] = None,
    unread_only: bool = False,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Retrieves all notifications matching user/project filters, auto-seeding sample alerts if empty.
    """
    seed_notifications_if_empty(db, project_id=project_id, user_id=user_id)

    query = db.query(NotificationModel)
    if user_id:
        query = query.filter(NotificationModel.user_id == user_id)
    if project_id:
        query = query.filter(NotificationModel.project_id == project_id)
    if unread_only:
        query = query.filter(NotificationModel.read == False)

    return query.order_by(NotificationModel.created_at.desc()).limit(limit).all()


@router.get("/summary", response_model=NotificationSummaryOut)
def get_notifications_summary(
    user_id: Optional[UUID] = None,
    project_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
):
    """Provides unread count, total count, and notification items."""
    seed_notifications_if_empty(db, project_id=project_id, user_id=user_id)

    query = db.query(NotificationModel)
    if user_id:
        query = query.filter(NotificationModel.user_id == user_id)
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
    user_id: Optional[UUID] = None,
    project_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
):
    """Marks all matching notifications as read."""
    query = db.query(NotificationModel).filter(NotificationModel.read == False)
    if user_id:
        query = query.filter(NotificationModel.user_id == user_id)
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
