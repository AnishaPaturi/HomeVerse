"""
Design Service Layer
Manages AI and manual designs, room concepts, and 3D scenes.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.design import Design

class DesignService:
    @staticmethod
    def get_designs_by_project(db: Session, project_id: UUID) -> List[Design]:
        return db.query(Design).filter(Design.project_id == project_id).all()

    @staticmethod
    def get_design_by_id(db: Session, design_id: UUID) -> Optional[Design]:
        return db.query(Design).filter(Design.id == design_id).first()
