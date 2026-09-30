"""
Project Service Layer
Manages house lifecycle, floors, rooms, and budget initialization at creation time.
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
import uuid
from sqlalchemy.orm import Session
from app.models.project import Project
from app.models.floor import Floor
from app.models.room import Room
from app.models.budget import Budget
from app.schemas.project import ProjectCreate, ProjectUpdate

class ProjectService:
    @staticmethod
    def get_user_projects(db: Session, user_id: UUID) -> List[Project]:
        return db.query(Project).filter(Project.user_id == user_id).all()

    @staticmethod
    def get_project_by_id(db: Session, project_id: UUID) -> Optional[Project]:
        return db.query(Project).filter(Project.id == project_id).first()

    @staticmethod
    def create_project(
        db: Session,
        user_id: UUID,
        name: str,
        property_type: str = "apartment",
        bhk: int = 3,
        area_sqft: float = 1200.0,
        budget_amount: float = 1000000.0,
        currency: str = "INR",
        budget_flexibility: str = "Moderate",
        num_floors: int = 1,
    ) -> Project:
        """
        Creates a new House project and initializes its floors, standard rooms, and budget envelope.
        """
        project_id = uuid.uuid4()
        project = Project(
            id=project_id,
            user_id=user_id,
            name=name,
            property_type=property_type,
            bhk=bhk,
            area_sqft=area_sqft,
            budget=budget_amount,
            currency=currency,
        )
        db.add(project)

        # 1. Establish Budget at creation time
        budget = Budget(
            id=uuid.uuid4(),
            project_id=project_id,
            total_budget=budget_amount,
            currency=currency,
            flexibility=budget_flexibility,
            spent_amount=0.0,
            estimated_amount=0.0,
            remaining_amount=budget_amount
        )
        db.add(budget)

        # 2. Provision Floors (1 for flat, N for independent house)
        floors_to_create = max(1, num_floors if property_type == "independent" else 1)
        created_floors = []
        for i in range(1, floors_to_create + 1):
            floor_name = "Ground Floor" if i == 1 else f"Floor {i}"
            floor = Floor(
                id=uuid.uuid4(),
                project_id=project_id,
                floor_number=i,
                name=floor_name,
                level_type="residential"
            )
            db.add(floor)
            created_floors.append(floor)

        # 3. Provision Default Rooms on Ground Floor
        default_rooms = ["Living Room", "Kitchen", "Master Bedroom"]
        if bhk >= 2:
            default_rooms.append("Bedroom 2")
        if bhk >= 3:
            default_rooms.append("Bedroom 3")
        default_rooms.append("Bathroom")

        ground_floor_id = created_floors[0].id if created_floors else None
        for room_name in default_rooms:
            room = Room(
                id=uuid.uuid4(),
                project_id=project_id,
                floor_id=ground_floor_id,
                name=room_name,
                room_type=room_name.split()[0] if "Bedroom" in room_name else room_name,
                status="planning"
            )
            db.add(room)

        db.commit()
        db.refresh(project)
        return project
