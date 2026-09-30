"""
Test Suite for Phase 50 — Version 4 Flow
Validates the 7 core pillars:
1. Interior Contractors (listing, specialty filtering, verified profiles, registration)
2. Designer Marketplace (listing, aesthetic style filtering, consultation booking)
3. Vendor Marketplace (trade suppliers, stone/timber/hardware yards, logistics details)
4. Furniture Marketplace (listing, filtering, stock & lead times, direct order placement)
5. Material Marketplace (bulk materials, MOQ, unit rates, sample swatch kit dispatch)
6. Quotation Comparison (RFQ broadcast, itemized quotes, multi-vendor comparison engine, AI value scoring, acceptance)
7. Contract Management (milestone-linked payment schedules, digital signatures, change orders)
"""

import pytest
from uuid import uuid4
from fastapi.testclient import TestClient

from app.main import app
from app.models.user import User as UserModel
from app.models.project import Project as ProjectModel
from app.models.marketplace import Provider as ProviderModel, MarketplaceListing as ListingModel, Quotation as QuotationModel, Contract as ContractModel

client = TestClient(app)


@pytest.fixture
def test_project_and_user():
    """Sets up an isolated project and user for V4 testing."""
    from app.db.session import SessionLocal
    session = SessionLocal()
    try:
        user_id = uuid4()
        user = UserModel(
            id=user_id,
            email=f"v4_owner_{uuid4().hex[:8]}@example.com",
            password_hash="secure_password_hash",
            name="V4 Executive Client",
        )
        session.add(user)
        session.commit()

        project_id = uuid4()
        project = ProjectModel(
            id=project_id,
            user_id=user_id,
            name="Oberoi Sky City Luxury 3BHK",
            property_type="apartment",
            bhk=3,
            area_sqft=1650.0,
            budget=1500000.0,
            currency="INR",
        )
        session.add(project)
        session.commit()

        return {
            "user_id": str(user_id),
            "project_id": str(project_id),
        }
    finally:
        session.close()


# ---------------- 1. Interior Contractors Tests ----------------

def test_list_and_filter_contractors():
    """Verifies listing interior contractors and filtering by trade specialty (civil, carpentry)."""
    res = client.get("/api/contractors")
    assert res.status_code == 200
    contractors = res.json()
    assert len(contractors) >= 2

    # Filter by specialty: Civil
    res_civil = client.get("/api/contractors?specialty=civil")
    assert res_civil.status_code == 200
    civils = res_civil.json()
    assert len(civils) >= 1
    for c in civils:
        assert any("civil" in s.lower() for s in c["specialties"])

    # Filter by specialty: Carpentry
    res_carp = client.get("/api/contractors?specialty=carpentry")
    assert res_carp.status_code == 200
    carps = res_carp.json()
    assert len(carps) >= 1
    for c in carps:
        assert any("carpentry" in s.lower() or "millwork" in s.lower() or "kitchen" in s.lower() for s in c["specialties"])


def test_contractor_profile_and_registration():
    """Verifies getting a contractor's profile and registering a new contractor firm."""
    res_all = client.get("/api/contractors")
    c_id = res_all.json()[0]["id"]

    res = client.get(f"/api/contractors/{c_id}")
    assert res.status_code == 200
    profile = res.json()
    assert profile["id"] == c_id
    assert profile["is_verified"] is True
    assert profile["base_rate"] > 0
    assert len(profile["specialties"]) >= 1

    # Register new contractor
    new_payload = {
        "provider_type": "contractor",
        "name": "Zenith Turnkey Projects",
        "company_name": "Zenith Infra Works LLP",
        "specialties": ["Civil", "Plumbing", "Electrical"],
        "rating": 4.8,
        "reviews_count": 15,
        "experience_years": 7,
        "is_verified": True,
        "location_city": "Bengaluru",
        "pricing_model": "per_sqft",
        "base_rate": 175.0,
        "availability_status": "available",
        "contact_phone": "+91 99000 12345",
        "contact_email": "info@zenithinfra.com",
    }
    res_create = client.post("/api/contractors", json=new_payload)
    assert res_create.status_code == 201
    created = res_create.json()
    assert created["name"] == new_payload["name"]
    assert created["base_rate"] == 175.0


# ---------------- 2. Designer Marketplace Tests ----------------

def test_list_and_filter_designers():
    """Verifies listing interior designers and filtering by aesthetic design style."""
    res = client.get("/api/designers")
    assert res.status_code == 200
    designers = res.json()
    assert len(designers) >= 2

    # Filter by style: Japandi / Contemporary
    res_japandi = client.get("/api/designers?style=Japandi")
    assert res_japandi.status_code == 200
    japandi_designers = res_japandi.json()
    assert len(japandi_designers) >= 1
    for d in japandi_designers:
        assert any("japandi" in s.lower() or "contemporary" in s.lower() for s in d["specialties"])


def test_designer_profile_and_consultation():
    """Verifies getting designer profile and booking an architectural consultation."""
    res_all = client.get("/api/designers")
    d_id = res_all.json()[0]["id"]

    res_d = client.get(f"/api/designers/{d_id}")
    assert res_d.status_code == 200
    designer = res_d.json()
    assert designer["id"] == d_id
    assert len(designer["portfolio"]) >= 1

    # Book consultation
    consult_payload = {
        "client_name": "Dr. Rohit Sharma",
        "client_phone": "+91 98765 43210",
        "client_email": "rohit.sharma@example.com",
        "preferred_date": "Saturday, 11:00 AM IST",
        "scope_notes": "Planning full 3BHK penthouse interior renovation with Japandi aesthetic.",
    }
    res_consult = client.post(f"/api/designers/{d_id}/consult", json=consult_payload)
    assert res_consult.status_code == 200
    consult_data = res_consult.json()
    assert consult_data["status"] == "confirmed"
    assert consult_data["designer_id"] == d_id
    assert "Saturday" in consult_data["scheduled_date"]


# ---------------- 3. Vendor Marketplace Tests ----------------

def test_list_and_get_vendors():
    """Verifies listing verified trade material suppliers (marble yards, timber distributors)."""
    res = client.get("/api/vendors")
    assert res.status_code == 200
    vendors = res.json()
    assert len(vendors) >= 2

    # Get single vendor details
    v_id = vendors[0]["id"]
    res_v = client.get(f"/api/vendors/{v_id}")
    assert res_v.status_code == 200
    vendor_data = res_v.json()
    assert vendor_data["id"] == v_id
    assert vendor_data["provider_type"] == "vendor"


# ---------------- 4. Furniture Marketplace Tests ----------------

def test_furniture_marketplace_listing_and_filtering():
    """Verifies browsing orderable furniture items, price bounds, and category filters."""
    res = client.get("/api/marketplace/furniture")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 3

    # Filter sofa
    res_sofas = client.get("/api/marketplace/furniture?category=sofa")
    assert res_sofas.status_code == 200
    sofas = res_sofas.json()
    assert len(sofas) >= 1
    assert "sofa" in sofas[0]["category"].lower()


def test_furniture_marketplace_order():
    """Verifies ordering a furniture piece directly from a marketplace manufacturer."""
    res_items = client.get("/api/marketplace/furniture")
    item = res_items.json()[0]

    order_payload = {
        "quantity": 2,
        "shipping_address": "Flat 1402, Tower B, Oberoi Sky City, Borivali East, Mumbai",
        "custom_finish": "Oatmeal Boucle with Walnut Feet",
    }
    res_order = client.post(f"/api/marketplace/furniture/{item['id']}/order", json=order_payload)
    assert res_order.status_code == 200
    order_data = res_order.json()

    assert order_data["listing_id"] == item["id"]
    assert order_data["quantity"] == 2
    assert order_data["total_price"] == item["price"] * 2
    assert order_data["status"] == "order_confirmed"
    assert order_data["tracking_number"].startswith("HV-TRK-")


# ---------------- 5. Material Marketplace Tests ----------------

def test_material_marketplace_listing_and_sample_request():
    """Verifies browsing bulk materials, minimum order quantities, and sample kit ordering."""
    res = client.get("/api/marketplace/materials")
    assert res.status_code == 200
    materials = res.json()
    assert len(materials) >= 4

    # Sample Kit Request
    mat_item = next((m for m in materials if "Marble" in m["name"] or "Veneer" in m["name"]), materials[0])
    sample_payload = {
        "client_name": "Ananya Roy",
        "delivery_address": "Villa 42, Palm Meadows, Whitefield, Bengaluru",
        "contact_phone": "+91 98450 12345",
        "notes": "Please include dark vein and gold vein marble swatches.",
    }
    res_sample = client.post(f"/api/marketplace/materials/{mat_item['id']}/sample-request", json=sample_payload)
    assert res_sample.status_code == 200
    sample_data = res_sample.json()

    assert sample_data["material_id"] == mat_item["id"]
    assert sample_data["dispatch_status"] == "dispatched_for_courier"
    assert sample_data["tracking_reference"].startswith("SMP-")


# ---------------- 6. Quotation Comparison Tests ----------------

def test_quotation_rfq_and_listing(test_project_and_user):
    """Verifies broadcasting RFQ to multiple contractors and fetching received bids."""
    proj_id = test_project_and_user["project_id"]

    rfq_payload = {
        "project_id": proj_id,
        "scope_summary": "Full 3BHK turnkey interior execution: modular kitchen, wardrobes, electrical, and false ceiling.",
        "target_budget": 800000.0,
    }
    res_rfq = client.post("/api/quotations/request", json=rfq_payload)
    assert res_rfq.status_code == 200
    rfq_data = res_rfq.json()
    assert rfq_data["project_id"] == proj_id
    assert rfq_data["contractors_notified"] >= 3

    # Fetch quotes
    res_quotes = client.get(f"/api/projects/{proj_id}/quotations")
    assert res_quotes.status_code == 200
    quotes = res_quotes.json()
    assert len(quotes) >= 3
    for q in quotes:
        assert q["total_amount"] > 0
        assert "material_cost" in q["breakdown"]
        assert "labor_cost" in q["breakdown"]


def test_quotation_comparison_engine(test_project_and_user):
    """Verifies side-by-side comparative analysis of contractor bids (price, timeline, warranty, AI score)."""
    proj_id = test_project_and_user["project_id"]
    res_quotes = client.get(f"/api/projects/{proj_id}/quotations")
    quotes = res_quotes.json()
    quote_ids = [q["id"] for q in quotes[:3]]

    compare_payload = {
        "project_id": proj_id,
        "quotation_ids": quote_ids,
    }
    res_cmp = client.post("/api/quotations/compare", json=compare_payload)
    assert res_cmp.status_code == 200
    cmp_data = res_cmp.json()

    assert cmp_data["project_id"] == proj_id
    assert len(cmp_data["quotations_compared"]) >= 2
    assert cmp_data["price_spread"] >= 0
    assert cmp_data["fastest_timeline_days"] > 0
    assert cmp_data["recommended_quotation_id"] in quote_ids
    assert len(cmp_data["recommendation_reason"]) > 10
    assert len(cmp_data["key_tradeoffs"]) >= 2

    # Accept the recommended quote
    rec_id = cmp_data["recommended_quotation_id"]
    res_accept = client.put(f"/api/quotations/{rec_id}/accept")
    assert res_accept.status_code == 200
    assert res_accept.json()["status"] == "accepted"


# ---------------- 7. Contract Management Tests ----------------

def test_contract_lifecycle_signing_and_change_order(test_project_and_user):
    """Verifies contract retrieval, milestone payment schedule, digital signature, and change orders."""
    proj_id = test_project_and_user["project_id"]

    # 1. Fetch contracts
    res_contracts = client.get(f"/api/projects/{proj_id}/contracts")
    assert res_contracts.status_code == 200
    contracts = res_contracts.json()
    assert len(contracts) >= 1
    contract = contracts[0]

    assert contract["project_id"] == proj_id
    assert contract["total_contract_value"] > 0
    assert len(contract["milestone_payment_schedule"]) >= 4

    # Validate milestone schedule structure
    milestones = contract["milestone_payment_schedule"]
    total_pct = sum(m["percentage"] for m in milestones)
    assert round(total_pct) == 100

    # 2. Sign contract
    sign_payload = {
        "signer_role": "client",
        "signature_text": "V4 Executive Client (Digital Timestamp Verified)",
        "agreement_confirmed": True,
    }
    res_sign = client.post(f"/api/contracts/{contract['id']}/sign", json=sign_payload)
    assert res_sign.status_code == 200
    signed_contract = res_sign.json()

    assert signed_contract["client_signature"] == sign_payload["signature_text"]
    assert signed_contract["status"] == "active"
    assert signed_contract["start_date"] is not None

    # 3. Issue change order
    co_payload = {
        "title": "Upgrade to Fluted Charcoal Wall Cladding & Concealed Strip LED",
        "cost_adjustment": 35000.0,
        "timeline_days_adjustment": 4,
        "justification": "Client requested high-grade acoustic wall slats for media console lounge.",
    }
    res_co = client.post(f"/api/contracts/{contract['id']}/change-order", json=co_payload)
    assert res_co.status_code == 200
    updated_contract = res_co.json()

    assert updated_contract["total_contract_value"] == contract["total_contract_value"] + 35000.0
    assert "Change Order" in updated_contract["scope_of_work"]
