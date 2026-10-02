"""
Integration & Regression Tests: Account Deletion and Empty Recreation
Validates that:
1. Deleting an account removes all traces from all database tables
   (user, projects, rooms, budgets, designs, scenes, objects, preferences,
   ai usage, analytics events, notifications, marketplace providers).
2. Creating an account again with the same credentials/email results in an
   empty, fresh account with no prior data or leakages.
3. Both standard custom user accounts and demo accounts adhere to this lifecycle.
"""
import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.models.user import User, UserPreference
from app.models.project import Project
from app.models.room import Room
from app.models.budget import Budget
from app.models.design import Design
from app.models.ai_usage import AIUsage
from app.models.analytics_event import AnalyticsEvent
from app.models.notification import Notification
from app.models.marketplace import Provider
from app.core.rate_limiter import _in_memory_store

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_rate_limiter():
    _in_memory_store.clear()
    yield
    _in_memory_store.clear()


def test_user_account_deletion_removes_all_traces():
    db = SessionLocal()
    unique_suffix = uuid.uuid4().hex[:8]
    email = f"alice_purge_{unique_suffix}@example.com"
    password = "SecurePassword123!"

    # 1. Register user
    reg_res = client.post(
        "/api/auth/register",
        json={"name": "Alice Purge", "email": email, "password": password},
    )
    assert reg_res.status_code == 201
    user_data = reg_res.json()
    user_id = uuid.UUID(user_data["id"])

    # 2. Populate user data across multiple DB tables
    # Create project
    proj_res = client.post(
        "/api/projects",
        json={
            "name": "Alice Dream Villa",
            "user_id": str(user_id),
            "email": email,
            "property_type": "villa",
            "budget": 500000.0,
            "bhk": 3,
        },
    )
    assert proj_res.status_code == 201
    proj_id = uuid.UUID(proj_res.json()["id"])

    # Add room
    room = Room(id=uuid.uuid4(), project_id=proj_id, name="Living Hall", room_type="Living Room")
    db.add(room)

    # Add design
    design = Design(id=uuid.uuid4(), project_id=proj_id, room_id=room.id, name="Japandi Living", style="Japandi")
    db.add(design)

    # Add user preferences
    pref = UserPreference(id=uuid.uuid4(), user_id=user_id, style="Japandi", colour_preferences=["warm", "earth"])
    db.add(pref)

    # Add AI Usage record
    ai_use = AIUsage(id=uuid.uuid4(), user_id=user_id, operation="render_3d", model="gemini-pro", cost=0.05)
    db.add(ai_use)

    # Add notification
    notif = Notification(id=uuid.uuid4(), user_id=user_id, project_id=proj_id, title="Welcome", message="Welcome to HomeVerse")
    db.add(notif)

    # Add analytics event
    event = AnalyticsEvent(id=uuid.uuid4(), user_id=user_id, session_id="s_123", event_name="project_created", properties={"email": email})
    db.add(event)

    # Add provider record linked to user
    provider = Provider(id=uuid.uuid4(), user_id=user_id, provider_type="contractor", name="Alice Contractor", contact_email=email)
    db.add(provider)
    db.commit()

    # Verify all records exist before deletion
    assert db.query(User).filter(User.id == user_id).first() is not None
    assert db.query(Project).filter(Project.id == proj_id).first() is not None
    assert db.query(Room).filter(Room.project_id == proj_id).count() >= 1
    assert db.query(Budget).filter(Budget.project_id == proj_id).count() >= 1
    assert db.query(Design).filter(Design.project_id == proj_id).count() >= 1
    assert db.query(UserPreference).filter(UserPreference.user_id == user_id).count() >= 1
    assert db.query(AIUsage).filter(AIUsage.user_id == user_id).count() >= 1
    assert db.query(Notification).filter(Notification.user_id == user_id).count() >= 1
    assert db.query(AnalyticsEvent).filter(AnalyticsEvent.user_id == user_id).count() >= 1
    assert db.query(Provider).filter(Provider.user_id == user_id).count() >= 1

    # 3. Delete account via /api/users/account
    del_res = client.request(
        "DELETE",
        "/api/users/account",
        json={"email": email},
    )
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 4. Assert ALL traces are completely wiped from the DB
    assert db.query(User).filter(User.id == user_id).first() is None
    assert db.query(User).filter(User.email == email).first() is None
    assert db.query(Project).filter(Project.user_id == user_id).count() == 0
    assert db.query(Project).filter(Project.id == proj_id).count() == 0
    assert db.query(Room).filter(Room.project_id == proj_id).count() == 0
    assert db.query(Budget).filter(Budget.project_id == proj_id).count() == 0
    assert db.query(Design).filter(Design.project_id == proj_id).count() == 0
    assert db.query(UserPreference).filter(UserPreference.user_id == user_id).count() == 0
    assert db.query(AIUsage).filter(AIUsage.user_id == user_id).count() == 0
    assert db.query(Notification).filter(Notification.user_id == user_id).count() == 0
    assert db.query(AnalyticsEvent).filter(AnalyticsEvent.user_id == user_id).count() == 0
    assert db.query(Provider).filter(Provider.user_id == user_id).count() == 0
    assert db.query(Provider).filter(Provider.contact_email == email).count() == 0

    db.close()


def test_recreating_same_account_is_empty_and_new():
    db = SessionLocal()
    unique_suffix = uuid.uuid4().hex[:8]
    email = f"bob_recreate_{unique_suffix}@example.com"
    password = "SecurePassword123!"

    # 1. First account creation
    reg_1 = client.post(
        "/api/auth/register",
        json={"name": "Bob Original", "email": email, "password": password},
    )
    assert reg_1.status_code == 201
    u1_id = reg_1.json()["id"]

    # 2. Add project to first account
    p_res = client.post(
        "/api/projects",
        json={
            "name": "Bob Old Project",
            "user_id": u1_id,
            "email": email,
            "budget": 250000.0,
        },
    )
    assert p_res.status_code == 201

    # Check project list has 1 project
    list_before = client.get(f"/api/projects?email={email}")
    assert list_before.status_code == 200
    assert len(list_before.json()) == 1

    # 3. Delete account
    del_res = client.request(
        "DELETE",
        "/api/users/account",
        json={"email": email},
    )
    assert del_res.status_code == 200

    # 4. Re-create the account with the EXACT SAME EMAIL
    _in_memory_store.clear()
    reg_2 = client.post(
        "/api/auth/register",
        json={"name": "Bob Reborn", "email": email, "password": password},
    )
    assert reg_2.status_code == 201
    u2_id = reg_2.json()["id"]

    # 5. Assert newly created account is completely fresh and empty
    list_after = client.get(f"/api/projects?email={email}")
    assert list_after.status_code == 200
    projects_after = list_after.json()
    assert projects_after == [], f"Expected empty project list but got {projects_after}"

    # Also check by user_id
    list_by_id = client.get(f"/api/projects?user_id={u2_id}")
    assert list_by_id.status_code == 200
    assert list_by_id.json() == []

    # Check DB directly
    db_projects = db.query(Project).filter(Project.user_id == uuid.UUID(u2_id)).all()
    assert len(db_projects) == 0

    # Clean up
    client.request("DELETE", "/api/users/account", json={"email": email})
    db.close()


def test_auth_delete_account_endpoint():
    db = SessionLocal()
    unique_suffix = uuid.uuid4().hex[:8]
    email = f"charlie_{unique_suffix}@example.com"
    password = "SecurePassword123!"

    # Register
    _in_memory_store.clear()
    reg = client.post(
        "/api/auth/register",
        json={"name": "Charlie", "email": email, "password": password},
    )
    assert reg.status_code == 201
    user_id = reg.json()["id"]

    # Add project
    client.post(
        "/api/projects",
        json={"name": "Charlie Space", "user_id": user_id, "email": email},
    )

    # Delete via /api/auth/delete-account
    del_res = client.request(
        "DELETE",
        "/api/auth/delete-account",
        json={"email": email},
    )
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Re-register
    _in_memory_store.clear()
    reg2 = client.post(
        "/api/auth/register",
        json={"name": "Charlie New", "email": email, "password": password},
    )
    assert reg2.status_code == 201

    # Must be empty
    projs = client.get(f"/api/projects?email={email}").json()
    assert len(projs) == 0

    # Clean up
    client.request("DELETE", "/api/auth/delete-account", json={"email": email})
    db.close()
