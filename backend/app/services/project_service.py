"""
Project Service Layer
Manages project lifecycle, properties, and ownership.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.project import Project

class ProjectService:
    @staticmethod
    def get_user_projects(db: Session, user_id: UUID) -> List[Project]:
        return db.query(Project).filter(Project.user_id == user_id).all()

    @staticmethod
    def get_project_by_id(db: Session, project_id: UUID) -> Optional[Project]:
        return db.query(Project).filter(Project.id == project_id).first()
