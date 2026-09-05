"""
Unit and Integration Tests for Phase 44: AI Cost Control & Tracking
Validates:
- Cost calculation for Gemini Flash, Gemini Pro, Imagen-3, Multimodal
- Tier-based spending cap resolution (Free: $1.00, Premium: $15.00, Pro: $60.00)
- Usage event logging into the `ai_usage` table
- Rolling 30-day window spend aggregation
- Budget limit enforcement and AICostLimitExceededException (HTTP 402)
- API endpoints: /api/ai/usage/summary, /api/ai/usage/limits, /api/ai/usage/history
- Pipeline cost gate enforcement during design generation
"""
from datetime import datetime, timedelta
import pytest
from uuid import uuid4
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.db.session import SessionLocal
from app.models.user import User as UserModel
from app.models.ai_usage import AIUsage
from app.core.ai_cost_tracker import (
    calculate_ai_cost,
    get_tier_cost_limit,
    get_user_monthly_spend,
    check_ai_cost_limit,
    record_ai_usage,
    get_user_usage_summary,
    MODEL_PRICING,
)
from app.core.exceptions import AICostLimitExceededException

client = TestClient(app, raise_server_exceptions=False)


# ============================================================================
# 1. Cost Calculation Tests
# ============================================================================

def test_calculate_ai_cost_gemini_flash():
    # 10,000 input tokens = (10,000 / 1M) * 0.075 = $0.00075
    # 2,000 output tokens = (2,000 / 1M) * 0.30 = $0.0006
    # Total = $0.00135
    cost = calculate_ai_cost("gemini-1.5-flash", input_tokens=10000, output_tokens=2000)
    assert cost == 0.00135

    # Test alias gemini-3.5-flash
    cost_35 = calculate_ai_cost("gemini-3.5-flash", input_tokens=10000, output_tokens=2000)
    assert cost_35 == 0.00135


def test_calculate_ai_cost_gemini_pro():
    # 1,000,000 input tokens = $1.25
    # 500,000 output tokens = $2.50
    cost = calculate_ai_cost("gemini-1.5-pro", input_tokens=1_000_000, output_tokens=500_000)
    assert cost == 3.75


def test_calculate_ai_cost_imagen3():
    # 3 images * $0.03 = $0.09
    cost = calculate_ai_cost("imagen-3", image_count=3)
    assert cost == 0.09


def test_calculate_ai_cost_multimodal():
    # 10,000 input = 10k/1M * 0.15 = 0.0015
    # 5,000 output = 5k/1M * 0.60 = 0.003
    # 2 images scanned = 2 * 0.002 = 0.004
    # Total = 0.0085
    cost = calculate_ai_cost("gemini-multimodal", input_tokens=10000, output_tokens=5000, image_count=2)
    assert cost == 0.0085


def test_calculate_ai_cost_fallback_model():
    # Unlisted model falls back to default: $0.10 / 1M input, $0.40 / 1M output, $0.025 / image
    cost = calculate_ai_cost("unlisted-custom-model", input_tokens=100000, output_tokens=50000, image_count=1)
    expected = (100000 / 1_000_000 * 0.10) + (50000 / 1_000_000 * 0.40) + (1 * 0.025)
    assert cost == round(expected, 6)


def test_calculate_ai_cost_zero():
    assert calculate_ai_cost("gemini-1.5-flash", 0, 0, 0) == 0.0


# ============================================================================
# 2. Tier Spending Caps
# ============================================================================

def test_tier_cost_limits():
    assert get_tier_cost_limit("Free") == settings.AI_COST_FREE_LIMIT_MONTHLY
    assert get_tier_cost_limit("Premium") == settings.AI_COST_PREMIUM_LIMIT_MONTHLY
    assert get_tier_cost_limit("Pro Designer") == settings.AI_COST_PRO_LIMIT_MONTHLY
    assert get_tier_cost_limit("Enterprise Pro") == settings.AI_COST_PRO_LIMIT_MONTHLY
    # Default fallback
    assert get_tier_cost_limit(None) == settings.AI_COST_FREE_LIMIT_MONTHLY
    assert get_tier_cost_limit("UnknownTier") == settings.AI_COST_FREE_LIMIT_MONTHLY


# ============================================================================
# 3. Usage Recording & Spend Aggregation
# ============================================================================

def test_record_ai_usage_and_monthly_spend():
    db = SessionLocal()
    try:
        user = UserModel(
            id=uuid4(),
            email=f"cost_user_{uuid4().hex[:6]}@example.com",
            password_hash="hash",
            name="Cost Test User",
            plan="Free",
        )
        db.add(user)
        db.commit()

        # Initially 0 spend
        spend = get_user_monthly_spend(db, user.id)
        assert spend == 0.0

        # Record an event
        rec1 = record_ai_usage(
            db=db,
            user_id=user.id,
            operation="design_generation",
            model="gemini-1.5-flash",
            input_tokens=10000,
            output_tokens=2000,
            image_count=1,
            generation_id=str(uuid4()),
        )
        assert rec1.id is not None
        assert rec1.cost > 0.0

        spend_after = get_user_monthly_spend(db, user.id)
        assert spend_after == rec1.cost

        # Record another event
        rec2 = record_ai_usage(
            db=db,
            user_id=user.id,
            operation="image_rendering",
            model="imagen-3",
            image_count=2,
        )
        total_spend = get_user_monthly_spend(db, user.id)
        assert round(total_spend, 6) == round(rec1.cost + rec2.cost, 6)

        # Cleanup
        db.query(AIUsage).filter(AIUsage.user_id == user.id).delete()
        db.delete(user)
        db.commit()
    finally:
        db.close()


def test_monthly_spend_excludes_older_than_window():
    db = SessionLocal()
    try:
        user = UserModel(
            id=uuid4(),
            email=f"old_cost_user_{uuid4().hex[:6]}@example.com",
            password_hash="hash",
            name="Old Cost User",
            plan="Free",
        )
        db.add(user)
        db.commit()

        # Insert a record from 40 days ago
        old_rec = AIUsage(
            user_id=user.id,
            operation="legacy_render",
            model="gemini-1.5-flash",
            cost=2.50,
            created_at=datetime.utcnow() - timedelta(days=40),
        )
        # Insert a current record
        cur_rec = AIUsage(
            user_id=user.id,
            operation="current_render",
            model="gemini-1.5-flash",
            cost=0.50,
            created_at=datetime.utcnow(),
        )
        db.add_all([old_rec, cur_rec])
        db.commit()

        # Aggregated 30-day spend should only include cur_rec (0.50), not old_rec (2.50)
        spend = get_user_monthly_spend(db, user.id, days=30)
        assert spend == 0.50

        # Aggregated 60-day spend should include both
        spend_60 = get_user_monthly_spend(db, user.id, days=60)
        assert spend_60 == 3.00

        # Cleanup
        db.query(AIUsage).filter(AIUsage.user_id == user.id).delete()
        db.delete(user)
        db.commit()
    finally:
        db.close()


# ============================================================================
# 4. Limit Enforcement (check_ai_cost_limit)
# ============================================================================

def test_check_ai_cost_limit_allows_when_within_budget():
    db = SessionLocal()
    try:
        user = UserModel(
            id=uuid4(),
            email=f"allowed_user_{uuid4().hex[:6]}@example.com",
            password_hash="hash",
            name="Allowed User",
            plan="Free",
        )
        db.add(user)
        db.commit()

        allowed, spend, limit, remaining = check_ai_cost_limit(db, user)
        assert allowed is True
        assert spend == 0.0
        assert limit == 1.00
        assert remaining == 1.00

        db.delete(user)
        db.commit()
    finally:
        db.close()


def test_check_ai_cost_limit_blocks_when_cap_exceeded():
    db = SessionLocal()
    try:
        user = UserModel(
            id=uuid4(),
            email=f"blocked_user_{uuid4().hex[:6]}@example.com",
            password_hash="hash",
            name="Blocked User",
            plan="Free",
        )
        db.add(user)
        db.commit()

        # Add usage exceeding Free limit ($1.00)
        usage = AIUsage(
            user_id=user.id,
            operation="excess_gen",
            model="gemini-1.5-pro",
            cost=1.25,
            created_at=datetime.utcnow(),
        )
        db.add(usage)
        db.commit()

        # 1. Non-raising check
        allowed, spend, limit, remaining = check_ai_cost_limit(db, user, raise_exception=False)
        assert allowed is False
        assert spend == 1.25
        assert limit == 1.00

        # 2. Raising check
        with pytest.raises(AICostLimitExceededException) as exc_info:
            check_ai_cost_limit(db, user, raise_exception=True)

        exc = exc_info.value
        assert exc.status_code == 402
        assert exc.code == "AI_COST_LIMIT_EXCEEDED"
        assert exc.details["current_spend_usd"] == 1.25
        assert exc.details["monthly_limit_usd"] == 1.00

        # Cleanup
        db.query(AIUsage).filter(AIUsage.user_id == user.id).delete()
        db.delete(user)
        db.commit()
    finally:
        db.close()


def test_check_ai_cost_limit_disabled():
    db = SessionLocal()
    try:
        user = UserModel(
            id=uuid4(),
            email=f"flag_user_{uuid4().hex[:6]}@example.com",
            password_hash="hash",
            name="Flag User",
            plan="Free",
        )
        db.add(user)
        db.commit()

        # Temporarily disable tracking
        original = settings.AI_COST_TRACKING_ENABLED
        settings.AI_COST_TRACKING_ENABLED = False
        try:
            allowed, spend, limit, remaining = check_ai_cost_limit(
                db, user, projected_additional_cost=999.0, raise_exception=True
            )
            assert allowed is True
        finally:
            settings.AI_COST_TRACKING_ENABLED = original

        db.delete(user)
        db.commit()
    finally:
        db.close()


# ============================================================================
# 5. Usage Summary Aggregation
# ============================================================================

def test_get_user_usage_summary():
    db = SessionLocal()
    try:
        user = UserModel(
            id=uuid4(),
            email=f"summary_user_{uuid4().hex[:6]}@example.com",
            password_hash="hash",
            name="Summary User",
            plan="Premium",
        )
        db.add(user)
        db.commit()

        # Add several usage records
        u1 = AIUsage(
            user_id=user.id,
            operation="design_generation",
            model="gemini-1.5-flash",
            input_tokens=5000,
            output_tokens=1500,
            image_count=0,
            cost=0.0008,
            created_at=datetime.utcnow(),
        )
        u2 = AIUsage(
            user_id=user.id,
            operation="image_rendering",
            model="imagen-3",
            input_tokens=0,
            output_tokens=0,
            image_count=2,
            cost=0.06,
            created_at=datetime.utcnow(),
        )
        db.add_all([u1, u2])
        db.commit()

        summary = get_user_usage_summary(db, user, days=30)
        assert summary["plan"] == "Premium"
        assert summary["monthly_limit_usd"] == 15.00
        assert summary["total_generations"] == 2
        assert summary["total_tokens"] == 6500
        assert summary["total_images"] == 2
        assert "gemini-1.5-flash" in summary["cost_by_model"]
        assert "imagen-3" in summary["cost_by_model"]
        assert "design_generation" in summary["cost_by_operation"]
        assert "image_rendering" in summary["cost_by_operation"]
        assert summary["current_month_spend_usd"] == round(0.0008 + 0.06, 6)

        db.query(AIUsage).filter(AIUsage.user_id == user.id).delete()
        db.delete(user)
        db.commit()
    finally:
        db.close()


# ============================================================================
# 6. API Endpoints Tests (/api/ai/usage/*)
# ============================================================================

def test_api_usage_summary_endpoint():
    db = SessionLocal()
    try:
        user = UserModel(
            id=uuid4(),
            email=f"api_user_{uuid4().hex[:6]}@example.com",
            password_hash="hash",
            name="API User",
            plan="Pro Designer",
        )
        db.add(user)
        db.commit()

        # Query by email
        res = client.get(f"/api/ai/usage/summary?email={user.email}")
        assert res.status_code == 200
        data = res.json()
        assert data["plan"] == "Pro Designer"
        assert data["monthly_limit_usd"] == 60.00
        assert "total_generations" in data

        # Query by header X-User-Id
        res_hdr = client.get("/api/ai/usage/summary", headers={"X-User-Id": str(user.id)})
        assert res_hdr.status_code == 200
        assert res_hdr.json()["user_id"] == str(user.id)

        db.delete(user)
        db.commit()
    finally:
        db.close()


def test_api_spending_limits_endpoint():
    db = SessionLocal()
    try:
        user = UserModel(
            id=uuid4(),
            email=f"limits_user_{uuid4().hex[:6]}@example.com",
            password_hash="hash",
            name="Limits User",
            plan="Premium",
        )
        db.add(user)
        db.commit()

        res = client.get(f"/api/ai/usage/limits?email={user.email}")
        assert res.status_code == 200
        data = res.json()
        assert data["plan"] == "Premium"
        assert data["monthly_limit_usd"] == 15.00
        assert data["is_budget_exceeded"] is False
        assert data["current_spend_usd"] == 0.0

        db.delete(user)
        db.commit()
    finally:
        db.close()


def test_api_usage_history_endpoint():
    db = SessionLocal()
    try:
        user = UserModel(
            id=uuid4(),
            email=f"hist_user_{uuid4().hex[:6]}@example.com",
            password_hash="hash",
            name="History User",
            plan="Free",
        )
        db.add(user)
        db.commit()

        # Add 3 usage records
        for i in range(3):
            db.add(
                AIUsage(
                    user_id=user.id,
                    operation=f"op_{i}",
                    model="gemini-1.5-flash",
                    cost=0.01 * (i + 1),
                )
            )
        db.commit()

        res = client.get(f"/api/ai/usage/history?email={user.email}&limit=10")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 3
        assert data[0]["operation"] in ["op_0", "op_1", "op_2"]

        db.query(AIUsage).filter(AIUsage.user_id == user.id).delete()
        db.delete(user)
        db.commit()
    finally:
        db.close()


# ============================================================================
# 7. AI Pipeline Cost Limit Gate Enforcement (HTTP 402)
# ============================================================================

def test_generate_design_blocks_when_cost_limit_exceeded():
    from app.models.project import Project as ProjectModel
    db = SessionLocal()
    try:
        user = UserModel(
            id=uuid4(),
            email=f"maxed_user_{uuid4().hex[:6]}@example.com",
            password_hash="hash",
            name="Maxed User",
            plan="Free",
        )
        db.add(user)
        db.commit()

        project = ProjectModel(
            id=uuid4(),
            user_id=user.id,
            name="Maxed Project",
        )
        db.add(project)
        db.commit()

        # Exceed free limit ($1.00)
        db.add(
            AIUsage(
                user_id=user.id,
                operation="max_out",
                model="gemini-1.5-pro",
                cost=1.50,
            )
        )
        db.commit()

        # Attempt dynamic design generation as this user
        res = client.post(
            "/api/ai/generate-dynamic-design",
            data={
                "project_id": str(project.id),
                "room_type": "living_room",
                "style": "scandinavian",
            },
            headers={"X-User-Id": str(user.id), "X-User-Email": user.email},
        )

        assert res.status_code == 402
        data = res.json()
        assert data["error"]["code"] == "AI_COST_LIMIT_EXCEEDED"
        assert "limit of $1.00 reached" in data["error"]["message"]

        # Cleanup
        db.query(AIUsage).filter(AIUsage.user_id == user.id).delete()
        db.delete(project)
        db.delete(user)
        db.commit()
    finally:
        db.close()
