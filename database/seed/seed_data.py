"""
Database Seeding Script for HomeVerse
Seeds all 13 Phase 5 core database entities with initial realistic development data.
"""
import sys
import os
import uuid
from datetime import datetime, timedelta

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models import (
    User,
    UserPreference,
    Project,
    Room,
    RoomImage,
    Design,
    DesignItem,
    Budget,
    BudgetCategory,
    Product,
    ShoppingItem,
    ExecutionTask,
    Expense,
)

def seed():
    print("Ensuring database tables exist...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Seeding demo data across all Phase 5 entities...")

        # 1. User
        user_id = uuid.UUID("d0000000-0000-0000-0000-000000000000")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            user = User(
                id=user_id,
                email="designer@homeverse.ai",
                name="Anisha Paturi",
                password_hash="pbkdf2_sha256$mockhash$for$development",
                plan="Pro Designer"
            )
            db.add(user)
            db.flush()

        # 2. UserPreference
        pref = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
        if not pref:
            pref = UserPreference(
                user_id=user.id,
                style="warm_contemporary",
                colour_preferences=["beige", "cream", "warm_grey", "walnut"],
                material_preferences=["natural_wood", "linen", "matte_brass"],
                lifestyle_preferences={"wfh": True, "pets": False, "entertaining": True}
            )
            db.add(pref)

        # 3. Project
        proj_id = uuid.UUID("e0000000-0000-0000-0000-000000000001")
        project = db.query(Project).filter(Project.id == proj_id).first()
        if not project:
            project = Project(
                id=proj_id,
                user_id=user.id,
                name="Skyline Horizon 3BHK",
                title="Skyline Horizon 3BHK",
                property_type="apartment",
                room_type="Living Room",
                bhk=3,
                area_sqft=1450.0,
                budget=1200000.0,
                currency="INR"
            )
            db.add(project)
            db.flush()

        # 4. Rooms
        living_room = db.query(Room).filter(Room.project_id == project.id, Room.name == "Grand Living Area").first()
        if not living_room:
            living_room = Room(
                project_id=project.id,
                name="Grand Living Area",
                room_type="Living Room",
                length=20.0,
                width=15.0,
                height=10.0,
                area=300.0,
                status="in_design"
            )
            db.add(living_room)
            db.flush()

        # 5. Room Images
        room_img = db.query(RoomImage).filter(RoomImage.room_id == living_room.id).first()
        if not room_img:
            room_img = RoomImage(
                room_id=living_room.id,
                image_url="/static/uploads/sample_living_empty.jpg",
                image_type="photo"
            )
            db.add(room_img)

        # 6. Designs
        design = db.query(Design).filter(Design.project_id == project.id).first()
        if not design:
            design = Design(
                project_id=project.id,
                room_id=living_room.id,
                name="Warm Contemporary Living Concept",
                description="Natural oak cabinetry, warm ambient cove lighting, and tailored linen seating.",
                style="warm_contemporary",
                estimated_cost=285000.0,
                image_url="/static/uploads/warm_contemporary_living.jpg",
                status="approved",
                selected=True
            )
            db.add(design)
            db.flush()

        # 7. Products Catalog
        sofa = db.query(Product).filter(Product.name == "Nordic Cloud 3-Seater Sofa").first()
        if not sofa:
            sofa = Product(
                name="Nordic Cloud 3-Seater Sofa",
                category="Furniture",
                brand="HomeVerse Studio",
                price=54000.0,
                image_url="/static/uploads/nordic_sofa.jpg",
                product_url="https://homeverse.ai/catalog/nordic-sofa",
                description="High-density foam with water-resistant oatmeal linen fabric."
            )
            db.add(sofa)
            db.flush()

        # 8. Design Items
        design_item = db.query(DesignItem).filter(DesignItem.design_id == design.id).first()
        if not design_item:
            design_item = DesignItem(
                design_id=design.id,
                name="Nordic Cloud 3-Seater Sofa",
                category="Furniture",
                quantity=1.0,
                unit_cost=54000.0,
                total_cost=54000.0,
                product_id=sofa.id
            )
            db.add(design_item)

        # 9. Budget
        budget = db.query(Budget).filter(Budget.project_id == project.id).first()
        if not budget:
            budget = Budget(
                project_id=project.id,
                total_budget=1200000.0,
                allocated_budget=950000.0,
                spent_amount=320000.0,
                remaining_amount=880000.0
            )
            db.add(budget)
            db.flush()

        # 10. Budget Categories
        categories_data = [
            ("Civil & Demolition", 100000.0, 95000.0, 92000.0),
            ("Carpentry & Wardrobes", 450000.0, 420000.0, 150000.0),
            ("Loose Furniture", 250000.0, 240000.0, 54000.0),
            ("Electrical & Lighting", 150000.0, 145000.0, 24000.0),
        ]
        for cat_name, alloc, est, act in categories_data:
            existing_cat = db.query(BudgetCategory).filter(
                BudgetCategory.budget_id == budget.id,
                BudgetCategory.category == cat_name
            ).first()
            if not existing_cat:
                db.add(BudgetCategory(
                    budget_id=budget.id,
                    category=cat_name,
                    allocated=alloc,
                    estimated=est,
                    actual=act
                ))

        # 11. Shopping Items
        shop_item = db.query(ShoppingItem).filter(ShoppingItem.project_id == project.id).first()
        if not shop_item:
            shop_item = ShoppingItem(
                project_id=project.id,
                product_id=sofa.id,
                name="Nordic Cloud 3-Seater Sofa (Oatmeal)",
                quantity=1.0,
                estimated_cost=54000.0,
                status="pending"
            )
            db.add(shop_item)

        # 12. Execution Tasks
        task = db.query(ExecutionTask).filter(ExecutionTask.project_id == project.id).first()
        if not task:
            task = ExecutionTask(
                project_id=project.id,
                name="False Ceiling Framework & Conduit Inspection",
                description="Verify gypsum board alignments and LED strip profile drops.",
                status="in_progress",
                start_date=datetime.utcnow() - timedelta(days=2),
                end_date=datetime.utcnow() + timedelta(days=5),
                estimated_cost=45000.0,
                actual_cost=42000.0
            )
            db.add(task)

        # 13. Expenses
        expense = db.query(Expense).filter(Expense.project_id == project.id).first()
        if not expense:
            expense = Expense(
                project_id=project.id,
                category="Electrical",
                description="Concealed wiring conduit pipes and junction boxes",
                amount=18500.0,
                date=datetime.utcnow() - timedelta(days=4),
                receipt_url="/static/uploads/receipts/electrical_invoice_01.pdf"
            )
            db.add(expense)

        db.commit()
        print("Database seed completed successfully for all 13 Phase 5 tables!")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
