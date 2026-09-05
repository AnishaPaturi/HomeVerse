"""
Unit and Integration Tests for Phase 45: Product Analytics
Validates:
- Direct tracking of product events (authenticated & anonymous)
- Standard event taxonomy validation
- Analytics summary aggregation
- Funnel analysis, conversion rates, and drop-off stage identification
- Product insights: popular rooms, styles, average budget, generation metrics
- API endpoints: /api/analytics/track, /api/analytics/summary, /api/analytics/funnel, /api/analytics/insights, /api/analytics/events
- Automatic event triggering from auth registration and project creation workflows
"""
from datetime import datetime, timedelta
import pytest
from uuid import uuid4
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.models.user import User as UserModel
from app.models.analytics_event import AnalyticsEvent
from app.core.analytics import (
    track_event,
    get_analytics_summary,
    get_funnel_analysis,
    get_product_insights,
    get_event_history,
    STANDARD_EVENT_NAMES,
    FUNNEL_STEPS,
)

client = TestClient(app, raise_server_exceptions=False)


# ============================================================================
# 1. Event Tracking Core Engine Tests
# ============================================================================

def test_track_event_authenticated_user():
    db = SessionLocal()
    try:
        user = UserModel(
            id=uuid4(),
            email=f"analytics_u_{uuid4().hex[:6]}@example.com",
            password_hash="hash",
            name="Analytics Tester",
            plan="Free",
        )
        db.add(user)
        db.commit()

        event = track_event(
            db=db,
            event_name="user_registered",
            user_id=user.id,
            properties={"plan": user.plan, "referral": "organic"},
            session_id="session_abc_123",
        )

        assert event.id is not None
        assert event.event_name == "user_registered"
        assert event.user_id == user.id
        assert event.session_id == "session_abc_123"
        assert event.properties["referral"] == "organic"

        # Verify DB query
        found = db.query(AnalyticsEvent).filter(AnalyticsEvent.id == event.id).first()
        assert found is not None
        assert found.event_name == "user_registered"

        db.delete(found)
        db.delete(user)
        db.commit()
    finally:
        db.close()


def test_track_event_anonymous():
    db = SessionLocal()
    try:
        event = track_event(
            db=db,
            event_name="style_selected",
            user_id=None,
            properties={"style": "scandinavian"},
            session_id="anon_sess_456",
        )

        assert event.id is not None
        assert event.user_id is None
        assert event.properties["style"] == "scandinavian"

        db.delete(event)
        db.commit()
    finally:
        db.close()


# ============================================================================
# 2. Analytics Summary Aggregations
# ============================================================================

def test_analytics_summary():
    db = SessionLocal()
    try:
        u_id = uuid4()
        ev1 = track_event(db, "user_registered", user_id=u_id, session_id="s1")
        ev2 = track_event(db, "project_created", user_id=u_id, session_id="s1")
        ev3 = track_event(db, "room_created", user_id=u_id, session_id="s2")

        summary = get_analytics_summary(db, days=30)
        assert summary["total_events"] >= 3
        assert summary["unique_users"] >= 1
        assert summary["unique_sessions"] >= 2
        assert "user_registered" in summary["event_counts"]
        assert "project_created" in summary["event_counts"]

        db.delete(ev1)
        db.delete(ev2)
        db.delete(ev3)
        db.commit()
    finally:
        db.close()


# ============================================================================
# 3. Funnel & Drop-off Diagnostics
# ============================================================================

def test_funnel_analysis_conversion_and_dropoff():
    db = SessionLocal()
    try:
        # Create 4 users through different steps
        u1, u2, u3, u4 = uuid4(), uuid4(), uuid4(), uuid4()

        events_to_clean = []

        # Step 1: 4 users register
        for u in [u1, u2, u3, u4]:
            events_to_clean.append(track_event(db, "user_registered", user_id=u))

        # Step 2: 3 users create project
        for u in [u1, u2, u3]:
            events_to_clean.append(track_event(db, "project_created", user_id=u))

        # Step 3: 2 users generate designs
        for u in [u1, u2]:
            events_to_clean.append(track_event(db, "room_created", user_id=u))
            events_to_clean.append(track_event(db, "design_generated", user_id=u))

        # Step 4: 1 user completes project
        events_to_clean.append(track_event(db, "project_completed", user_id=u1))

        funnel = get_funnel_analysis(db, days=30)
        assert "funnel_steps" in funnel
        steps = funnel["funnel_steps"]
        assert len(steps) == len(FUNNEL_STEPS)

        # Check step 1: user_registered
        step1 = next(s for s in steps if s["event_name"] == "user_registered")
        assert step1["unique_users"] >= 4
        assert step1["conversion_rate_from_start"] == 100.0
        assert step1["drop_off_rate_from_previous"] == 0.0

        # Check step 2: project_created
        step2 = next(s for s in steps if s["event_name"] == "project_created")
        assert step2["unique_users"] >= 3

        # Primary drop off stage identified
        assert funnel["primary_drop_off_stage"] is not None

        for e in events_to_clean:
            db.delete(e)
        db.commit()
    finally:
        db.close()


# ============================================================================
# 4. Product Insights: Popular Rooms, Styles, Budget & Generations
# ============================================================================

def test_product_insights():
    db = SessionLocal()
    try:
        events = [
            # Rooms
            track_event(db, "room_created", properties={"room_type": "Living Room"}),
            track_event(db, "room_created", properties={"room_type": "Living Room"}),
            track_event(db, "room_created", properties={"room_type": "Master Bedroom"}),
            # Styles
            track_event(db, "style_selected", properties={"style": "Scandinavian"}),
            track_event(db, "style_selected", properties={"style": "Scandinavian"}),
            track_event(db, "style_selected", properties={"style": "Modern Luxury"}),
            # Budgets
            track_event(db, "project_created", properties={"budget": 800000}),
            track_event(db, "project_created", properties={"budget": 1200000}),
            track_event(db, "project_created", properties={"budget": 400000}),
            # Generations
            track_event(db, "design_generated", user_id=uuid4(), properties={"project_id": str(uuid4()), "room_type": "Living Room", "style": "Scandinavian"}),
            track_event(db, "design_generated", user_id=uuid4(), properties={"project_id": str(uuid4()), "room_type": "Kitchen", "style": "Industrial"}),
        ]

        insights = get_product_insights(db, days=30)

        # Popular rooms check
        pop_rooms = insights["popular_rooms"]
        assert len(pop_rooms) >= 2
        assert pop_rooms[0]["room_type"] == "Living Room"
        assert pop_rooms[0]["count"] >= 3  # 2 from room_created + 1 from design_generated

        # Popular styles check
        pop_styles = insights["popular_styles"]
        assert len(pop_styles) >= 2
        assert pop_styles[0]["style"] == "Scandinavian"

        # Budget metrics check
        b_stats = insights["budget_statistics"]
        assert b_stats["average_budget"] == 800000.0
        assert b_stats["min_budget"] == 400000.0
        assert b_stats["max_budget"] == 1200000.0
        assert b_stats["median_budget"] == 800000.0

        # Generation metrics check
        g_stats = insights["generation_statistics"]
        assert g_stats["total_generations"] >= 2
        assert g_stats["average_generations_per_user"] >= 1.0

        # Feature utility list check
        assert len(insights["feature_utility"]) >= 4

        for e in events:
            db.delete(e)
        db.commit()
    finally:
        db.close()


# ============================================================================
# 5. API Endpoints Tests (/api/analytics/*)
# ============================================================================

def test_api_track_event_endpoint():
    payload = {
        "event_name": "style_selected",
        "properties": {"style": "Japandi", "color": "Neutral Earth"},
        "session_id": "test_client_session_99",
    }
    res = client.post("/api/analytics/track", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "recorded"
    assert data["event_name"] == "style_selected"
    assert data["is_standard_event"] is True
    assert "event_id" in data


def test_api_summary_endpoint():
    res = client.get("/api/analytics/summary?days=7")
    assert res.status_code == 200
    data = res.json()
    assert "total_events" in data
    assert "event_counts" in data
    assert data["window_days"] == 7


def test_api_funnel_endpoint():
    res = client.get("/api/analytics/funnel?days=30")
    assert res.status_code == 200
    data = res.json()
    assert "funnel_steps" in data
    assert isinstance(data["funnel_steps"], list)
    assert len(data["funnel_steps"]) == len(FUNNEL_STEPS)


def test_api_insights_endpoint():
    res = client.get("/api/analytics/insights?days=30")
    assert res.status_code == 200
    data = res.json()
    assert "popular_rooms" in data
    assert "popular_styles" in data
    assert "budget_statistics" in data
    assert "generation_statistics" in data
    assert "feature_utility" in data


def test_api_events_history_endpoint():
    res = client.get("/api/analytics/events?limit=5")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if len(data) > 0:
        item = data[0]
        assert "id" in item
        assert "event_name" in item
        assert "properties" in item
        assert "created_at" in item


# ============================================================================
# 6. Workflow Triggers: Registration & Project Creation
# ============================================================================

def test_auth_registration_triggers_analytics_event():
    db = SessionLocal()
    try:
        unique_email = f"auto_track_{uuid4().hex[:6]}@example.com"
        res = client.post(
            "/api/auth/register",
            json={
                "email": unique_email,
                "password": "Password123!Safe",
                "name": "Auto Track User",
            },
        )
        assert res.status_code == 201
        created_user = res.json()

        # Verify analytics_events has user_registered for this user
        event = (
            db.query(AnalyticsEvent)
            .filter(
                AnalyticsEvent.event_name == "user_registered",
                AnalyticsEvent.properties["email"].astext == unique_email
                if "postgresql" in str(db.bind.url)
                else AnalyticsEvent.event_name == "user_registered",
            )
            .order_by(AnalyticsEvent.created_at.desc())
            .first()
        )
        assert event is not None
        assert event.properties.get("email") == unique_email

        # Cleanup
        db.delete(event)
        u = db.query(UserModel).filter(UserModel.id == created_user["id"]).first()
        if u:
            db.delete(u)
        db.commit()
    finally:
        db.close()


def test_project_creation_triggers_analytics_event():
    db = SessionLocal()
    try:
        proj_payload = {
            "name": "Analytics Triggered Project",
            "property_type": "villa",
            "bhk": 3,
            "area_sqft": 1850.0,
            "budget": 1500000.0,
            "currency": "INR",
        }
        res = client.post("/api/projects", json=proj_payload)
        assert res.status_code == 201
        created_proj = res.json()
        proj_id = created_proj["id"]

        # Verify project_created event
        event = (
            db.query(AnalyticsEvent)
            .filter(
                AnalyticsEvent.event_name == "project_created",
            )
            .order_by(AnalyticsEvent.created_at.desc())
            .first()
        )
        assert event is not None
        assert event.properties.get("project_id") == str(proj_id)
        assert event.properties.get("budget") == 1500000.0

        # Cleanup
        from app.models.project import Project as ProjectModel
        db.delete(event)
        p = db.query(ProjectModel).filter(ProjectModel.id == proj_id).first()
        if p:
            db.delete(p)
        db.commit()
    finally:
        db.close()
