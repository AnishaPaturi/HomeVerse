"""
Execution Service Layer
Handles timeline tasks, contractor steps, and field execution milestones.
"""
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.execution import ExecutionTask

class ExecutionService:
    @staticmethod
    def get_tasks_by_project(db: Session, project_id: UUID) -> List[ExecutionTask]:
        return db.query(ExecutionTask).filter(ExecutionTask.project_id == project_id).all()
