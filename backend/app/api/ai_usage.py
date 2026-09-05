"""
AI Cost Control and Usage API Router (Phase 44)
Exposes endpoints for user spending summaries, quota limits, and audit logs.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User as UserModel
from app.models.ai_usage import AIUsage
from app.core.ai_cost_tracker import (
    get_user_usage_summary,
    get_tier_cost_limit,
    get_user_monthly_spend,
)
from app.core.security import decode_token

router = APIRouter(prefix="/usage", tags=["AI Cost & Usage"])


def resolve_user_from_request(
    request: Request,
    email: Optional[str] = None,
    user_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
) -> Optional[UserModel]:
    """Helper to resolve authenticated user from Bearer JWT, headers, or query params."""
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

    # Header lookup
    hdr_id = request.headers.get("X-User-Id")
    hdr_email = request.headers.get("X-User-Email")
    target_id = user_id or (UUID(hdr_id) if hdr_id else None)
    target_email = email or hdr_email

    if target_id:
        u = db.query(UserModel).filter(UserModel.id == target_id).first()
        if u:
            return u

    if target_email:
        u = db.query(UserModel).filter(UserModel.email == target_email).first()
        if u:
            return u

    # Demo default fallback
    demo_id = UUID("d0000000-0000-0000-0000-000000000000")
    demo_user = db.query(UserModel).filter(UserModel.id == demo_id).first()
    return demo_user


@router.get("/summary")
def get_ai_usage_summary(
    request: Request,
    email: Optional[str] = None,
    user_id: Optional[UUID] = None,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """
    Returns aggregated AI spending, tokens, images, and model/operation breakdowns.
    """
    user = resolve_user_from_request(request, email, user_id, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found for AI usage summary.",
        )

    return get_user_usage_summary(db, user, days=days)


@router.get("/limits")
def get_ai_spending_limits(
    request: Request,
    email: Optional[str] = None,
    user_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
):
    """
    Returns user's current spending vs monthly limit.
    """
    user = resolve_user_from_request(request, email, user_id, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found for AI limits check.",
        )

    limit = get_tier_cost_limit(user.plan)
    spend = get_user_monthly_spend(db, user.id)
    remaining = max(0.0, limit - spend)
    pct = min(100.0, round((spend / limit) * 100, 2)) if limit > 0 else 0.0

    return {
        "user_id": str(user.id),
        "plan": user.plan or "Free",
        "monthly_limit_usd": limit,
        "current_spend_usd": round(spend, 4),
        "remaining_budget_usd": round(remaining, 4),
        "percentage_used": pct,
        "is_budget_exceeded": spend >= limit,
    }


@router.get("/history")
def get_ai_usage_history(
    request: Request,
    email: Optional[str] = None,
    user_id: Optional[UUID] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Returns audit history log of recent AI generation events for user.
    """
    user = resolve_user_from_request(request, email, user_id, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found for AI usage history.",
        )

    records = (
        db.query(AIUsage)
        .filter(AIUsage.user_id == user.id)
        .order_by(AIUsage.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": str(r.id),
            "generation_id": r.generation_id,
            "operation": r.operation,
            "model": r.model,
            "input_tokens": r.input_tokens,
            "output_tokens": r.output_tokens,
            "image_count": r.image_count,
            "cost_usd": round(r.cost, 6),
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]
