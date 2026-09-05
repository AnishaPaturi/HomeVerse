"""
AI Cost Control and Usage Tracker (Phase 44)
Tracks tokens, image counts, operations, and estimated USD cost.
Enforces monthly tier spending caps to prevent runaway AI bills.
"""
from datetime import datetime, timedelta
import logging
from typing import Any, Dict, Optional, Tuple
from uuid import UUID
from sqlalchemy import func
from sqlalchemy.orm import Session

try:
    from app.config import settings
except ImportError:
    from app.core.config import settings

from app.models.ai_usage import AIUsage
from app.models.user import User as UserModel
from app.core.exceptions import AICostLimitExceededException

logger = logging.getLogger("homeverse.ai_cost")

# Pricing matrix per 1,000,000 tokens or per single generated image
MODEL_PRICING: Dict[str, Dict[str, float]] = {
    # Fast Gemini Flash variants
    "gemini-1.5-flash": {"input_per_m": 0.075, "output_per_m": 0.30, "image_unit": 0.0},
    "gemini-flash": {"input_per_m": 0.075, "output_per_m": 0.30, "image_unit": 0.0},
    "gemini-3.5-flash": {"input_per_m": 0.075, "output_per_m": 0.30, "image_unit": 0.0},

    # High-reasoning Gemini Pro variants
    "gemini-1.5-pro": {"input_per_m": 1.25, "output_per_m": 5.00, "image_unit": 0.0},
    "gemini-pro": {"input_per_m": 1.25, "output_per_m": 5.00, "image_unit": 0.0},

    # Multimodal Vision and Room Analysis
    "gemini-multimodal": {"input_per_m": 0.15, "output_per_m": 0.60, "image_unit": 0.002},

    # Dedicated Diffusion / Image Rendering
    "imagen-3": {"input_per_m": 0.0, "output_per_m": 0.0, "image_unit": 0.030},
    "dall-e-3": {"input_per_m": 0.0, "output_per_m": 0.0, "image_unit": 0.040},
}

# Fallback default pricing for unlisted models
DEFAULT_PRICING = {"input_per_m": 0.10, "output_per_m": 0.40, "image_unit": 0.025}


def calculate_ai_cost(
    model: str,
    input_tokens: int = 0,
    output_tokens: int = 0,
    image_count: int = 0,
) -> float:
    """
    Computes precise estimated cost in USD based on token counts and image outputs.
    """
    pricing = MODEL_PRICING.get(model.lower(), DEFAULT_PRICING)

    input_cost = (input_tokens / 1_000_000.0) * pricing.get("input_per_m", 0.0)
    output_cost = (output_tokens / 1_000_000.0) * pricing.get("output_per_m", 0.0)
    image_cost = image_count * pricing.get("image_unit", 0.0)

    total_cost = input_cost + output_cost + image_cost
    return round(total_cost, 6)


def get_tier_cost_limit(plan: Optional[str]) -> float:
    """
    Resolves the user's monthly spending limit in USD based on subscription tier.
    """
    plan_name = (plan or "Free").lower()
    if "pro" in plan_name or "designer" in plan_name:
        return getattr(settings, "AI_COST_PRO_LIMIT_MONTHLY", 60.00)
    elif "premium" in plan_name:
        return getattr(settings, "AI_COST_PREMIUM_LIMIT_MONTHLY", 15.00)
    else:
        return getattr(settings, "AI_COST_FREE_LIMIT_MONTHLY", 1.00)


def get_user_monthly_spend(
    db: Session,
    user_id: UUID,
    days: int = 30,
) -> float:
    """
    Calculates cumulative user AI expenditure over the rolling billing window (default 30 days).
    """
    window_start = datetime.utcnow() - timedelta(days=days)
    result = (
        db.query(func.coalesce(func.sum(AIUsage.cost), 0.0))
        .filter(AIUsage.user_id == user_id, AIUsage.created_at >= window_start)
        .scalar()
    )
    return float(result or 0.0)


def check_ai_cost_limit(
    db: Session,
    user: Optional[UserModel],
    projected_additional_cost: float = 0.0,
    raise_exception: bool = True,
) -> Tuple[bool, float, float, float]:
    """
    Verifies if user is within their monthly AI spending cap.

    Returns:
        Tuple of (is_allowed, current_spend, monthly_limit, remaining_budget)

    Raises:
        AICostLimitExceededException if user exceeds cap and raise_exception is True.
    """
    if not getattr(settings, "AI_COST_TRACKING_ENABLED", True):
        return True, 0.0, 999999.0, 999999.0

    if not user:
        # Anonymous or demo user: permit standard execution
        return True, 0.0, 1.00, 1.00

    limit = get_tier_cost_limit(user.plan)
    current_spend = get_user_monthly_spend(db, user.id)
    remaining = max(0.0, limit - current_spend)

    if current_spend + projected_additional_cost > limit:
        if raise_exception:
            raise AICostLimitExceededException(
                message=(
                    f"Monthly AI generation spending limit of ${limit:.2f} reached for {user.plan} tier "
                    f"(Current spend: ${current_spend:.4f}). "
                    f"Please upgrade your subscription tier to continue generating designs."
                ),
                current_spend=current_spend,
                limit=limit,
                details={"remaining_budget_usd": remaining},
            )
        return False, current_spend, limit, remaining

    return True, current_spend, limit, remaining


def record_ai_usage(
    db: Session,
    user_id: UUID,
    operation: str,
    model: str,
    input_tokens: int = 0,
    output_tokens: int = 0,
    image_count: int = 0,
    generation_id: Optional[str] = None,
    explicit_cost: Optional[float] = None,
) -> AIUsage:
    """
    Records an AI operation event into the `ai_usage` table.
    """
    cost = explicit_cost if explicit_cost is not None else calculate_ai_cost(
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        image_count=image_count,
    )

    usage_record = AIUsage(
        user_id=user_id,
        generation_id=str(generation_id) if generation_id else None,
        operation=operation,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        image_count=image_count,
        cost=cost,
    )
    db.add(usage_record)
    db.commit()
    db.refresh(usage_record)

    logger.info(
        f"Recorded AI Usage: user={user_id}, op={operation}, model={model}, tokens={input_tokens}+{output_tokens}, images={image_count}, cost=${cost:.6f}"
    )
    return usage_record


def get_user_usage_summary(
    db: Session,
    user: UserModel,
    days: int = 30,
) -> Dict[str, Any]:
    """
    Aggregates comprehensive AI usage statistics for user dashboards and cost visibility.
    """
    window_start = datetime.utcnow() - timedelta(days=days)

    records = (
        db.query(AIUsage)
        .filter(AIUsage.user_id == user.id, AIUsage.created_at >= window_start)
        .all()
    )

    total_cost = sum(r.cost for r in records)
    total_tokens = sum(r.input_tokens + r.output_tokens for r in records)
    total_images = sum(r.image_count for r in records)
    total_generations = len(records)

    limit = get_tier_cost_limit(user.plan)
    remaining = max(0.0, limit - total_cost)
    pct_used = min(100.0, round((total_cost / limit) * 100, 2)) if limit > 0 else 0.0

    # Breakdown by model
    by_model: Dict[str, float] = {}
    for r in records:
        by_model[r.model] = round(by_model.get(r.model, 0.0) + r.cost, 6)

    # Breakdown by operation
    by_op: Dict[str, float] = {}
    for r in records:
        by_op[r.operation] = round(by_op.get(r.operation, 0.0) + r.cost, 6)

    return {
        "user_id": str(user.id),
        "plan": user.plan or "Free",
        "monthly_limit_usd": round(limit, 2),
        "current_month_spend_usd": round(total_cost, 6),
        "remaining_budget_usd": round(remaining, 6),
        "percentage_used": pct_used,
        "total_generations": total_generations,
        "total_tokens": total_tokens,
        "total_images": total_images,
        "cost_by_model": by_model,
        "cost_by_operation": by_op,
        "window_days": days,
    }
