"""
Product Analytics API Router (Phase 45)
Exposes endpoints for event tracking, funnel analysis, drop-off diagnostics,
room popularity metrics, average budgets, and feature utility statistics.
"""
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User as UserModel
from app.core.security import decode_token
from app.core.analytics import (
    track_event,
    get_analytics_summary,
    get_funnel_analysis,
    get_product_insights,
    get_event_history,
    STANDARD_EVENT_NAMES,
)

router = APIRouter(prefix="/analytics", tags=["Product Analytics"])


class TrackEventRequest(BaseModel):
    event_name: str = Field(..., description="Standard product event name or custom action identifier")
    user_id: Optional[UUID] = Field(None, description="Optional user ID (inferred from auth token if omitted)")
    session_id: Optional[str] = Field(None, description="Optional client session or device ID")
    properties: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Metadata dictionary for event")


class AnalyticsEventResponse(BaseModel):
    id: str
    user_id: Optional[str]
    session_id: Optional[str]
    event_name: str
    properties: Dict[str, Any]
    created_at: str


def resolve_optional_user(
    request: Request,
    explicit_user_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
) -> Optional[UserModel]:
    """Resolves user from Bearer JWT, headers, or explicit ID if provided."""
    if explicit_user_id:
        u = db.query(UserModel).filter(UserModel.id == explicit_user_id).first()
        if u:
            return u

    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ", 1)[1].strip()
            payload = decode_token(token)
            sub = payload.get("sub")
            try:
                uid = UUID(sub)
                u = db.query(UserModel).filter(UserModel.id == uid).first()
                if u:
                    return u
            except (ValueError, TypeError):
                u = db.query(UserModel).filter(UserModel.email == sub).first()
                if u:
                    return u
        except Exception:
            pass

    hdr_id = request.headers.get("X-User-Id")
    if hdr_id:
        try:
            uid = UUID(hdr_id)
            u = db.query(UserModel).filter(UserModel.id == uid).first()
            if u:
                return u
        except (ValueError, TypeError):
            pass

    return None


@router.post("/track", status_code=status.HTTP_201_CREATED)
def record_product_event(
    req: TrackEventRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Records a product event from frontend or server components.
    Supported standard events:
    - user_registered, project_created, room_created, style_selected,
      design_generated, design_selected, budget_optimized, product_added,
      shopping_item_ordered, execution_started, project_completed
    """
    resolved_user = resolve_optional_user(request, req.user_id, db)
    user_id = resolved_user.id if resolved_user else req.user_id

    event = track_event(
        db=db,
        event_name=req.event_name,
        user_id=user_id,
        properties=req.properties,
        session_id=req.session_id,
    )

    return {
        "status": "recorded",
        "event_id": str(event.id),
        "event_name": event.event_name,
        "user_id": str(user_id) if user_id else None,
        "is_standard_event": req.event_name in STANDARD_EVENT_NAMES,
    }


@router.get("/summary")
def get_summary(
    days: int = Query(30, ge=1, le=365, description="Lookback window in days"),
    db: Session = Depends(get_db),
):
    """
    Returns an aggregated overview of all product events, active users, and sessions.
    """
    return get_analytics_summary(db=db, days=days)


@router.get("/funnel")
def get_funnel(
    days: int = Query(30, ge=1, le=365, description="Lookback window in days"),
    db: Session = Depends(get_db),
):
    """
    Returns conversion funnel analysis and identifies where users drop off across
    the 11 standard project phases.
    """
    return get_funnel_analysis(db=db, days=days)


@router.get("/insights")
def get_insights(
    days: int = Query(30, ge=1, le=365, description="Lookback window in days"),
    db: Session = Depends(get_db),
):
    """
    Returns deep product insights:
    - Popular rooms
    - Selected styles
    - Average, median, min, max budget
    - Average generations per user and per project
    - Feature utility ranking
    """
    return get_product_insights(db=db, days=days)


@router.get("/events", response_model=List[AnalyticsEventResponse])
def get_events(
    event_name: Optional[str] = Query(None, description="Filter by event name"),
    user_id: Optional[UUID] = Query(None, description="Filter by user UUID"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Returns paginated audit log of recorded product analytics events.
    """
    events = get_event_history(
        db=db,
        event_name=event_name,
        user_id=user_id,
        limit=limit,
        offset=offset,
    )

    return [
        AnalyticsEventResponse(
            id=str(e.id),
            user_id=str(e.user_id) if e.user_id else None,
            session_id=e.session_id,
            event_name=e.event_name,
            properties=e.properties or {},
            created_at=e.created_at.isoformat() if e.created_at else "",
        )
        for e in events
    ]
