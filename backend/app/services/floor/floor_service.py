"""
Floor Service Layer
Manages floor levels, plans, and multi-story house structure.
"""
from typing import List, Optional
from uuid import UUID
import uuid
from sqlalchemy.orm import Session
from app.models.floor import Floor
from app.schemas.floor import FloorCreate, FloorUpdate

class FloorService:
    @staticmethod
    def get_project_floors(db: Session, project_id: UUID) -> List[Floor]:
        return db.query(Floor).filter(Floor.project_id == project_id).order_by(Floor.floor_number).all()

    @staticmethod
    def get_floor_by_id(db: Session, floor_id: UUID) -> Optional[Floor]:
        return db.query(Floor).filter(Floor.id == floor_id).first()

    @staticmethod
    def create_floor(db: Session, data: FloorCreate) -> Floor:
        floor = Floor(
            id=uuid.uuid4(),
            project_id=data.project_id,
            floor_number=data.floor_number,
            name=data.name,
            level_type=data.level_type,
            area_sqft=data.area_sqft
        )
        db.add(floor)
        db.commit()
        db.refresh(floor)
        return floor

    @staticmethod
    def update_floor(db: Session, floor_id: UUID, data: FloorUpdate) -> Floor:
        floor = db.query(Floor).filter(Floor.id == floor_id).first()
        if not floor:
            raise ValueError(f"Floor {floor_id} not found")

        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(floor, key, val)

        db.add(floor)
        db.commit()
        db.refresh(floor)
        return floor
