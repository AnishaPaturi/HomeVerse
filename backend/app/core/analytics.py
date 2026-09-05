"""
Product Analytics Engine (Phase 45)
Provides event tracking, conversion funnel computation, drop-off analysis,
room popularity rankings, budget statistics, and design generation metrics.
"""
from datetime import datetime, timedelta
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.models.analytics_event import AnalyticsEvent
from app.models.user import User as UserModel

logger = logging.getLogger("homeverse.analytics")

try:
    from app.monitoring.metrics import PRODUCT_ANALYTICS_EVENTS_TOTAL
except ImportError:
    PRODUCT_ANALYTICS_EVENTS_TOTAL = None

STANDARD_EVENT_NAMES = [
    "user_registered",
    "project_created",
    "room_created",
    "style_selected",
    "design_generated",
    "design_selected",
    "budget_optimized",
    "product_added",
    "shopping_item_ordered",
    "execution_started",
    "project_completed",
]

FUNNEL_STEPS = [
    "user_registered",
    "project_created",
    "room_created",
    "style_selected",
    "design_generated",
    "design_selected",
    "budget_optimized",
    "product_added",
    "shopping_item_ordered",
    "execution_started",
    "project_completed",
]


def track_event(
    db: Session,
    event_name: str,
    user_id: Optional[UUID] = None,
    properties: Optional[Dict[str, Any]] = None,
    session_id: Optional[str] = None,
) -> AnalyticsEvent:
    """
    Records a product analytics event into the `analytics_events` table.
    Increments Prometheus counter when monitoring is enabled.
    """
    clean_props = dict(properties or {})

    # Ensure all values in properties are JSON serializable
    for k, v in list(clean_props.items()):
        if isinstance(v, UUID):
            clean_props[k] = str(v)
        elif isinstance(v, datetime):
            clean_props[k] = v.isoformat()

    event = AnalyticsEvent(
        user_id=user_id,
        session_id=str(session_id) if session_id else None,
        event_name=event_name,
        properties=clean_props,
        created_at=datetime.utcnow(),
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Telemetry instrument
    if PRODUCT_ANALYTICS_EVENTS_TOTAL:
        try:
            PRODUCT_ANALYTICS_EVENTS_TOTAL.labels(event_name=event_name).inc()
        except Exception:
            pass

    logger.info(f"Analytics event recorded: '{event_name}', user_id={user_id}")
    return event


def get_analytics_summary(
    db: Session,
    days: int = 30,
) -> Dict[str, Any]:
    """
    Returns an aggregated overview of product events across the requested window.
    """
    window_start = datetime.utcnow() - timedelta(days=days)

    events_query = db.query(AnalyticsEvent).filter(AnalyticsEvent.created_at >= window_start)
    total_events = events_query.count()

    # Event counts by event_name
    breakdown_rows = (
        db.query(AnalyticsEvent.event_name, func.count(AnalyticsEvent.id))
        .filter(AnalyticsEvent.created_at >= window_start)
        .group_by(AnalyticsEvent.event_name)
        .all()
    )
    event_counts = {row[0]: row[1] for row in breakdown_rows}

    # Distinct users count
    unique_users = (
        db.query(func.count(func.distinct(AnalyticsEvent.user_id)))
        .filter(
            AnalyticsEvent.created_at >= window_start,
            AnalyticsEvent.user_id.isnot(None),
        )
        .scalar()
        or 0
    )

    # Distinct sessions count
    unique_sessions = (
        db.query(func.count(func.distinct(AnalyticsEvent.session_id)))
        .filter(
            AnalyticsEvent.created_at >= window_start,
            AnalyticsEvent.session_id.isnot(None),
        )
        .scalar()
        or 0
    )

    return {
        "window_days": days,
        "total_events": total_events,
        "unique_users": unique_users,
        "unique_sessions": unique_sessions,
        "event_counts": event_counts,
    }


def get_funnel_analysis(
    db: Session,
    days: int = 30,
) -> Dict[str, Any]:
    """
    Computes conversion and drop-off analysis across the key user journey stages.
    Answers: 'Where users drop off'.
    """
    window_start = datetime.utcnow() - timedelta(days=days)

    steps_data = []
    first_step_users = 0
    prev_step_users = 0

    for idx, step_name in enumerate(FUNNEL_STEPS):
        # Total event count for this step
        total_count = (
            db.query(func.count(AnalyticsEvent.id))
            .filter(
                AnalyticsEvent.event_name == step_name,
                AnalyticsEvent.created_at >= window_start,
            )
            .scalar()
            or 0
        )

        # Unique users count for this step
        step_users = (
            db.query(func.count(func.distinct(AnalyticsEvent.user_id)))
            .filter(
                AnalyticsEvent.event_name == step_name,
                AnalyticsEvent.created_at >= window_start,
                AnalyticsEvent.user_id.isnot(None),
            )
            .scalar()
            or 0
        )

        if idx == 0:
            first_step_users = step_users
            conversion_from_start = 100.0 if first_step_users > 0 else 0.0
            drop_off_from_prev = 0.0
        else:
            conversion_from_start = (
                round((step_users / first_step_users) * 100.0, 2)
                if first_step_users > 0
                else 0.0
            )
            if prev_step_users > 0:
                drop = max(0, prev_step_users - step_users)
                drop_off_from_prev = round((drop / prev_step_users) * 100.0, 2)
            else:
                drop_off_from_prev = 0.0

        steps_data.append({
            "step_number": idx + 1,
            "event_name": step_name,
            "total_events": total_count,
            "unique_users": step_users,
            "conversion_rate_from_start": conversion_from_start,
            "drop_off_rate_from_previous": drop_off_from_prev,
        })

        prev_step_users = step_users

    # Identify primary drop-off bottleneck
    worst_drop_step = None
    max_drop_rate = -1.0
    for s in steps_data[1:]:
        if s["drop_off_rate_from_previous"] > max_drop_rate and s["unique_users"] >= 0:
            max_drop_rate = s["drop_off_rate_from_previous"]
            worst_drop_step = s["event_name"]

    return {
        "window_days": days,
        "funnel_steps": steps_data,
        "primary_drop_off_stage": worst_drop_step,
        "overall_conversion_rate": steps_data[-1]["conversion_rate_from_start"] if steps_data else 0.0,
    }


def get_product_insights(
    db: Session,
    days: int = 30,
) -> Dict[str, Any]:
    """
    Extracts deep product insights:
    - Which rooms are popular
    - Popular styles selected
    - Average budget
    - Average number of generations
    - Feature utility ranking
    """
    window_start = datetime.utcnow() - timedelta(days=days)

    events = (
        db.query(AnalyticsEvent)
        .filter(AnalyticsEvent.created_at >= window_start)
        .all()
    )

    room_counts: Dict[str, int] = {}
    style_counts: Dict[str, int] = {}
    budgets: List[float] = []
    user_generations: Dict[str, int] = {}
    project_generations: Dict[str, int] = {}
    feature_counts: Dict[str, int] = {}

    for ev in events:
        feature_counts[ev.event_name] = feature_counts.get(ev.event_name, 0) + 1
        props = ev.properties or {}

        # 1. Popular Rooms
        if ev.event_name in ["room_created", "design_generated"]:
            rm = props.get("room_type") or props.get("room")
            if rm:
                rm_clean = str(rm).strip().title()
                room_counts[rm_clean] = room_counts.get(rm_clean, 0) + 1

        # 2. Selected Styles
        if ev.event_name in ["style_selected", "design_generated"]:
            st = props.get("style") or props.get("design_style")
            if st:
                st_clean = str(st).strip().title()
                style_counts[st_clean] = style_counts.get(st_clean, 0) + 1

        # 3. Average Budget
        if ev.event_name in ["project_created", "budget_optimized"]:
            b = props.get("budget")
            if b is not None:
                try:
                    b_val = float(b)
                    if b_val > 0:
                        budgets.append(b_val)
                except (ValueError, TypeError):
                    pass

        # 4. Number of Generations
        if ev.event_name == "design_generated":
            u_key = str(ev.user_id) if ev.user_id else "anonymous"
            user_generations[u_key] = user_generations.get(u_key, 0) + 1

            p_id = props.get("project_id")
            if p_id:
                project_generations[str(p_id)] = project_generations.get(str(p_id), 0) + 1

    # Format Room popularity
    total_room_records = sum(room_counts.values())
    popular_rooms = [
        {
            "room_type": room,
            "count": count,
            "percentage": round((count / total_room_records) * 100.0, 2) if total_room_records > 0 else 0.0,
        }
        for room, count in sorted(room_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    # Format Style popularity
    total_style_records = sum(style_counts.values())
    popular_styles = [
        {
            "style": style,
            "count": count,
            "percentage": round((count / total_style_records) * 100.0, 2) if total_style_records > 0 else 0.0,
        }
        for style, count in sorted(style_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    # Budget statistics
    if budgets:
        budgets.sort()
        avg_budget = round(sum(budgets) / len(budgets), 2)
        min_budget = min(budgets)
        max_budget = max(budgets)
        mid = len(budgets) // 2
        median_budget = (
            budgets[mid]
            if len(budgets) % 2 != 0
            else round((budgets[mid - 1] + budgets[mid]) / 2.0, 2)
        )
    else:
        avg_budget = 0.0
        min_budget = 0.0
        max_budget = 0.0
        median_budget = 0.0

    # Generation statistics
    total_gens = sum(user_generations.values())
    active_gen_users = len(user_generations)
    active_gen_projects = len(project_generations)

    avg_gens_per_user = (
        round(total_gens / active_gen_users, 2) if active_gen_users > 0 else 0.0
    )
    avg_gens_per_project = (
        round(total_gens / active_gen_projects, 2) if active_gen_projects > 0 else 0.0
    )

    # Feature utility ranked
    feature_utility = [
        {"feature_event": name, "count": cnt}
        for name, cnt in sorted(feature_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    return {
        "window_days": days,
        "popular_rooms": popular_rooms,
        "popular_styles": popular_styles,
        "budget_statistics": {
            "average_budget": avg_budget,
            "median_budget": median_budget,
            "min_budget": min_budget,
            "max_budget": max_budget,
            "total_data_points": len(budgets),
        },
        "generation_statistics": {
            "total_generations": total_gens,
            "active_generating_users": active_gen_users,
            "active_generating_projects": active_gen_projects,
            "average_generations_per_user": avg_gens_per_user,
            "average_generations_per_project": avg_gens_per_project,
        },
        "feature_utility": feature_utility,
    }


def get_event_history(
    db: Session,
    event_name: Optional[str] = None,
    user_id: Optional[UUID] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[AnalyticsEvent]:
    """
    Returns paginated event history for auditing and analysis.
    """
    query = db.query(AnalyticsEvent)
    if event_name:
        query = query.filter(AnalyticsEvent.event_name == event_name)
    if user_id:
        query = query.filter(AnalyticsEvent.user_id == user_id)

    return (
        query.order_by(desc(AnalyticsEvent.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )
