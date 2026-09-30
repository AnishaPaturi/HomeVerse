"""
Design Service Layer
Handles design CRUD, selection, and styling status.
"""
from typing import List, Optional
from uuid import UUID
import uuid
from sqlalchemy.orm import Session
from app.models.design import Design
from app.schemas.design import DesignCreate, DesignUpdate

class DesignService:
    @staticmethod
    def get_room_designs(db: Session, room_id: UUID) -> List[Design]:
        return db.query(Design).filter(Design.room_id == room_id).all()

    @staticmethod
    def get_project_designs(db: Session, project_id: UUID) -> List[Design]:
        return db.query(Design).filter(Design.project_id == project_id).all()

    @staticmethod
    def get_design_by_id(db: Session, design_id: UUID) -> Optional[Design]:
        return db.query(Design).filter(Design.id == design_id).first()

    @staticmethod
    def create_design(db: Session, data: DesignCreate) -> Design:
        design = Design(
            id=uuid.uuid4(),
            project_id=data.project_id,
            room_id=data.room_id,
            name=data.name,
            style=data.style,
            description=data.description,
            estimated_cost=data.estimated_cost or 0.0,
            image_url=data.image_url,
            status="generated"
        )
        db.add(design)
        db.commit()
        db.refresh(design)
        return design
