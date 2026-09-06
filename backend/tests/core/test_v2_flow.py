"""
Test Suite for Phase 48 — Version 2 Flow
Tests the 7 core pillars:
1. Product catalogue (filtering, category, price, search)
2. Product alternatives (value-engineering, savings calculations)
3. Shopping list CRUD & alternative product swap
4. Expense tracker (Budget ₹8.0L, Estimated ₹7.7L, Actual ₹5.2L, Remaining ₹2.8L, receipt upload)
5. Execution tracker (10 Milestones, statuses, progress rollup calculation)
6. Notification engine (budget alerts, milestones, delivery, read tracking)
7. Advanced AI chat copilot (recommendations, action chips, cost simulations)
"""

import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import get_db
from app.models.user import User as UserModel
from app.models.project import Project as ProjectModel
from app.models.product import Product as ProductModel

client = TestClient(app)

@pytest.fixture
def test_user_and_project():
    """Creates an isolated test user and project for V2 testing."""
    from app.db.session import SessionLocal
    session = SessionLocal()
    try:
        user_id = uuid4()
        user = UserModel(
            id=user_id,
            email=f"v2_user_{uuid4().hex[:8]}@example.com",
            password_hash="securepassword123",
            name="V2 Test Architect",
        )
        session.add(user)
        session.commit()

        project_id = uuid4()
        project = ProjectModel(
            id=project_id,
            user_id=user_id,
            name="Modern Sanctuary 2BHK",
            property_type="apartment",
            bhk=2,
            area_sqft=1120.0,
            budget=800000.0,
            currency="INR",
        )
        session.add(project)
        session.commit()
        return {"user_id": str(user_id), "project_id": str(project_id)}
    finally:
        session.close()


# ---------------- 1. Product Catalogue Tests ----------------

def test_product_catalogue_listing_and_filtering():
    """Verifies product catalogue listing, category filter, price bounds, and search."""
    # List all
    res = client.get("/api/products")
    assert res.status_code == 200
    products = res.json()
    assert len(products) >= 5

    # Filter by category
    res_sofas = client.get("/api/products?category=sofa")
    assert res_sofas.status_code == 200
    sofas = res_sofas.json()
    assert len(sofas) >= 1
    for s in sofas:
        assert "sofa" in s["category"].lower()

    # Filter by price range
    res_price = client.get("/api/products?min_price=20000&max_price=55000")
    assert res_price.status_code == 200
    priced = res_price.json()
    for p in priced:
        assert 20000 <= p["price"] <= 55000

    # Search keyword
    res_search = client.get("/api/products?search=Walnut")
    assert res_search.status_code == 200
    searched = res_search.json()
    assert any("walnut" in p["name"].lower() or "walnut" in (p["material"] or "").lower() for p in searched)


def test_product_details_and_creation():
    """Verifies getting a single product and creating a new catalogue product."""
    all_res = client.get("/api/products")
    prod_id = all_res.json()[0]["id"]

    res = client.get(f"/api/products/{prod_id}")
    assert res.status_code == 200
    assert res.json()["id"] == prod_id

    # Create new
    new_prod_payload = {
        "name": "Mid-Century Fluted Sideboard",
        "category": "storage",
        "brand": "Kite & Timber",
        "price": 38000.0,
        "description": "Crafted with solid oak slats and soft-close hinges.",
        "dimensions": "160cm x 45cm x 75cm",
        "rating": 4.8,
        "availability": "in_stock",
        "style": "Warm Contemporary",
        "material": "Oak & Brass",
        "colour": "Natural Oak",
    }
    create_res = client.post("/api/products", json=new_prod_payload)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["name"] == new_prod_payload["name"]
    assert created["price"] == 38000.0


# ---------------- 2. Product Alternatives Tests ----------------

def test_product_alternatives_value_engineering():
    """Verifies that alternative recommendations calculate price difference, savings %, and difference reasons."""
    # Find the high-end Boucle Sectional Sofa
    all_res = client.get("/api/products?category=sofa")
    sofas = all_res.json()
    assert len(sofas) > 0
    expensive_sofa = max(sofas, key=lambda x: x["price"])

    alt_res = client.get(f"/api/products/{expensive_sofa['id']}/alternatives")
    assert alt_res.status_code == 200
    alternatives = alt_res.json()
    assert len(alternatives) >= 1

    for alt in alternatives:
        assert "savings" in alt
        assert "savings_percentage" in alt
        assert "difference_reason" in alt
        assert alt["original_price"] == expensive_sofa["price"]
        assert len(alt["difference_reason"]) > 5


# ---------------- 3. Shopping List & Product Swap Tests ----------------

def test_shopping_list_crud_and_swap(test_user_and_project):
    """Verifies shopping list item tracking, summary rollup, item status transitions, and alternative product swapping."""
    proj_id = test_user_and_project["project_id"]

    # 1. Fetch shopping list
    list_res = client.get(f"/api/projects/{proj_id}/shopping")
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) >= 4

    # 2. Fetch summary rollup
    summary_res = client.get(f"/api/projects/{proj_id}/shopping/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["project_id"] == proj_id
    assert summary["total_items"] == len(items)
    assert summary["total_shopping_cost"] > 100000.0
    assert "status_breakdown" in summary

    # 3. Add custom shopping item
    add_payload = {
        "name": "Custom Hand-Knotted Hallway Runner",
        "quantity": 1.0,
        "estimated_cost": 15000.0,
        "status": "Selected",
    }
    add_res = client.post(f"/api/projects/{proj_id}/shopping", json=add_payload)
    assert add_res.status_code == 201
    new_item = add_res.json()
    item_id = new_item["id"]

    # 4. Update status lifecycle (Selected -> Ordered -> Delivered -> Installed)
    update_res = client.put(f"/api/shopping/{item_id}", json={"status": "Ordered"})
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "Ordered"

    # 5. Swap with an alternative product
    prods = client.get("/api/products?category=table").json()
    alt_table = prods[0]
    swap_res = client.post(f"/api/shopping/{item_id}/swap?alternative_product_id={alt_table['id']}")
    assert swap_res.status_code == 200
    swapped = swap_res.json()
    assert swapped["name"] == alt_table["name"]
    assert swapped["estimated_cost"] == alt_table["price"]

    # 6. Delete item
    del_res = client.delete(f"/api/shopping/{item_id}")
    assert del_res.status_code == 204


# ---------------- 4. Expense Tracker Tests ----------------

def test_expense_tracker_and_summary_rollup(test_user_and_project):
    """
    Verifies Expense Tracker:
    Target budget ₹8.0L, Estimated cost ₹7.7L, Actual expenses ₹5.2L, Remaining ₹2.8L.
    Tests receipt upload/attachment.
    """
    proj_id = test_user_and_project["project_id"]

    # 1. Fetch expenses (auto-seeds canonical expenses)
    exp_res = client.get(f"/api/projects/{proj_id}/expenses")
    assert exp_res.status_code == 200
    expenses = exp_res.json()
    assert len(expenses) >= 5

    # 2. Summary rollup
    summary_res = client.get(f"/api/projects/{proj_id}/expenses/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()

    # Budget ₹8.0L (800,000)
    assert summary["budget"] == 800000.0
    # Actual cost ₹5.2L (approx 520,000)
    assert 500000.0 <= summary["actual_cost"] <= 530000.0
    # Remaining budget ₹2.8L (approx 280,000)
    assert 270000.0 <= summary["remaining_budget"] <= 300000.0
    # Category breakdown includes Civil, Electrical, Kitchen, etc.
    assert "Civil" in summary["category_breakdown"]
    assert "Kitchen" in summary["category_breakdown"]

    # 3. Log a new expense
    new_exp_res = client.post(
        f"/api/projects/{proj_id}/expenses",
        json={
            "category": "Decor",
            "description": "Framed architectural canvas prints for hallway",
            "amount": 12000.0,
            "receipt_url": "https://example.com/receipts/art-prints.pdf",
        },
    )
    assert new_exp_res.status_code == 201
    created_exp = new_exp_res.json()
    exp_id = created_exp["id"]

    # 4. Attach receipt
    receipt_res = client.post(
        f"/api/expenses/{exp_id}/receipt",
        json={"receipt_url": "https://cdn.homeverse.ai/receipts/art-prints-signed.pdf"},
    )
    assert receipt_res.status_code == 200
    assert receipt_res.json()["receipt_url"] == "https://cdn.homeverse.ai/receipts/art-prints-signed.pdf"

    # 5. Delete expense
    del_res = client.delete(f"/api/expenses/{exp_id}")
    assert del_res.status_code == 204


# ---------------- 5. Execution Tracker Tests ----------------

def test_execution_timeline_and_progress_calculation(test_user_and_project):
    """
    Verifies project timeline with 10 milestones:
    Planning, Measurement, Civil, Electrical, Painting, Kitchen, Wardrobes, Furniture, Lighting, Final Setup.
    Verifies progress calculation (completed_tasks / total_tasks * 100).
    """
    proj_id = test_user_and_project["project_id"]

    # 1. Fetch tasks
    tasks_res = client.get(f"/api/projects/{proj_id}/tasks")
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()
    assert len(tasks) == 10

    milestone_names = [t["name"] for t in tasks]
    assert any("planning" in n.lower() for n in milestone_names)
    assert any("civil" in n.lower() for n in milestone_names)
    assert any("kitchen" in n.lower() for n in milestone_names)
    assert any("lighting" in n.lower() for n in milestone_names)

    # 2. Timeline summary & progress percentage
    summary_res = client.get(f"/api/projects/{proj_id}/tasks/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()

    assert summary["total_tasks"] == 10
    # Canonical starts with 3 completed: Planning, Measurement, Civil
    assert summary["completed_tasks"] >= 3
    assert summary["progress_percentage"] == round(summary["completed_tasks"] / 10 * 100.0, 1)

    # 3. Update task status to Completed and verify progress increments
    pending_task = next(t for t in tasks if str(t["status"]).lower() == "pending")
    upd_res = client.put(f"/api/tasks/{pending_task['id']}", json={"status": "Completed"})
    assert upd_res.status_code == 200
    assert upd_res.json()["status"] == "Completed"

    # Re-check summary
    new_summary = client.get(f"/api/projects/{proj_id}/tasks/summary").json()
    assert new_summary["completed_tasks"] == summary["completed_tasks"] + 1
    assert new_summary["progress_percentage"] > summary["progress_percentage"]


# ---------------- 6. Notification Engine Tests ----------------

def test_notifications_lifecycle(test_user_and_project):
    """Verifies notification listing, unread summary, mark read, and mark all read."""
    proj_id = test_user_and_project["project_id"]
    user_id = test_user_and_project["user_id"]

    # 1. List notifications
    res = client.get(f"/api/notifications?project_id={proj_id}")
    assert res.status_code == 200
    notifs = res.json()
    assert len(notifs) >= 3

    # Check alert types
    types = [n["type"] for n in notifs]
    assert any(t in ["budget_alert", "milestone", "delivery", "recommendation"] for t in types)

    # 2. Summary
    summary_res = client.get(f"/api/notifications/summary?project_id={proj_id}")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["unread_count"] >= 1

    # 3. Mark single notification as read
    target_id = notifs[0]["id"]
    read_res = client.put(f"/api/notifications/{target_id}/read")
    assert read_res.status_code == 200
    assert read_res.json()["read"] is True

    # 4. Create custom notification
    create_res = client.post(
        "/api/notifications",
        json={
            "title": "Inspection Approved",
            "message": "Municipal waterproofing inspection passed without remarks.",
            "type": "milestone",
            "project_id": proj_id,
            "user_id": user_id,
        },
    )
    assert create_res.status_code == 201
    created_id = create_res.json()["id"]

    # 5. Mark all as read
    all_read_res = client.put(f"/api/notifications/read-all?project_id={proj_id}")
    assert all_read_res.status_code == 200
    assert all_read_res.json()["status"] == "success"

    # Confirm unread is now 0
    refreshed_summary = client.get(f"/api/notifications/summary?project_id={proj_id}").json()
    assert refreshed_summary["unread_count"] == 0

    # 6. Delete notification
    del_res = client.delete(f"/api/notifications/{created_id}")
    assert del_res.status_code == 204


# ---------------- 7. Advanced AI Chat Copilot Tests ----------------

def test_advanced_ai_chat_copilot(test_user_and_project):
    """Verifies AI design copilot for budget optimization, material comparison, and actionable chips."""
    proj_id = test_user_and_project["project_id"]

    # 1. Budget query
    budget_req = {
        "project_id": proj_id,
        "message": "How can I optimize our ₹8L budget and save money on living room furniture?",
    }
    budget_res = client.post("/api/ai/chat", json=budget_req)
    assert budget_res.status_code == 200
    data = budget_res.json()
    assert len(data["reply"]) > 50
    assert len(data["recommendations"]) >= 2
    assert len(data["action_chips"]) >= 2
    assert data["cost_simulation"] is not None
    assert data["cost_simulation"]["cost_difference"] < 0  # Demonstrates savings

    # 2. Material simulation query (Italian marble vs tiles)
    mat_req = {
        "project_id": proj_id,
        "message": "What is the cost difference between Italian marble and vitrified tiles for flooring?",
    }
    mat_res = client.post("/api/ai/chat", json=mat_req)
    assert mat_res.status_code == 200
    mat_data = mat_res.json()
    assert "marble" in mat_data["reply"].lower()
    assert mat_data["cost_simulation"] is not None
    assert "flooring" in mat_data["cost_simulation"]["material_or_item"].lower()

    # 3. Execution query
    exec_req = {
        "project_id": proj_id,
        "message": "What is the next phase in our execution timeline schedule?",
    }
    exec_res = client.post("/api/ai/chat", json=exec_req)
    assert exec_res.status_code == 200
    exec_data = exec_res.json()
    assert any("execution" in chip["action"] for chip in exec_data["action_chips"])
