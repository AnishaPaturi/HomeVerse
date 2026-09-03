from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.db.session import get_db
from app.models.execution import ExecutionTask as TaskModel, Expense as ExpenseModel

router = APIRouter()

class TaskBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "todo"
    estimated_cost: float = 0.0
    actual_cost: float = 0.0

class TaskCreate(TaskBase):
    pass

class TaskOut(TaskBase):
    id: UUID
    project_id: UUID

    class Config:
        from_attributes = True

@router.get("/projects/{project_id}/tasks", response_model=List[TaskOut])
def get_execution_tasks(project_id: UUID, db: Session = Depends(get_db)):
    return db.query(TaskModel).filter(TaskModel.project_id == project_id).all()

@router.post("/projects/{project_id}/tasks", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_execution_task(project_id: UUID, task_in: TaskCreate, db: Session = Depends(get_db)):
    task = TaskModel(
        project_id=project_id,
        name=task_in.name,
        description=task_in.description,
        status=task_in.status,
        estimated_cost=task_in.estimated_cost,
        actual_cost=task_in.actual_cost
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task
