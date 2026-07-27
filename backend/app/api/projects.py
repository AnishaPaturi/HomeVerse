from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.db.session import get_db
from app.models.project import Project as ProjectModel
from app.schemas.project import Project as ProjectSchema, ProjectCreate, ProjectUpdate

router = APIRouter()

import uuid

@router.post("/", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    user_id = project_in.user_id
    if str(user_id) == "00000000-0000-0000-0000-000000000000":
        user_id = UUID("d0000000-0000-0000-0000-000000000000")
        
    p_id = project_in.id or uuid.uuid4()
    
    existing = db.query(ProjectModel).filter(ProjectModel.id == p_id).first()
    if existing:
        existing.title = project_in.title
        existing.room_type = project_in.room_type
        if project_in.thumbnail: existing.thumbnail = project_in.thumbnail
        if project_in.structural_analysis: existing.structural_analysis = project_in.structural_analysis
        db.commit()
        db.refresh(existing)
        return existing

    project = ProjectModel(
        id=p_id,
        user_id=user_id,
        title=project_in.title,
        room_type=project_in.room_type,
        thumbnail=project_in.thumbnail or "",
        structural_analysis=project_in.structural_analysis or ""
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/user/{user_id}", response_model=List[ProjectSchema])
def list_user_projects(user_id: UUID, db: Session = Depends(get_db)):
    if str(user_id) == "00000000-0000-0000-0000-000000000000":
        user_id = UUID("d0000000-0000-0000-0000-000000000000")
    projects = db.query(ProjectModel).filter(ProjectModel.user_id == user_id).all()
    return projects

@router.get("/{project_id}", response_model=ProjectSchema)
def get_project(project_id: UUID, db: Session = Depends(get_db)):
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        fallback_user = UUID("d0000000-0000-0000-0000-000000000000")
        project = ProjectModel(
            id=project_id,
            user_id=fallback_user,
            title="User Studio Project",
            room_type="Living Room",
            thumbnail="",
            structural_analysis=""
        )
        db.add(project)
        db.commit()
        db.refresh(project)
    return project

@router.put("/{project_id}", response_model=ProjectSchema)
def update_project(project_id: UUID, project_in: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        fallback_user = UUID("d0000000-0000-0000-0000-000000000000")
        project = ProjectModel(
            id=project_id,
            user_id=fallback_user,
            title=project_in.title or "User Studio Project",
            room_type=project_in.room_type or "Living Room",
            thumbnail=project_in.thumbnail or "",
            structural_analysis=project_in.structural_analysis or ""
        )
        db.add(project)
        db.commit()
        db.refresh(project)
    else:
        update_data = project_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)
        db.commit()
        db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: UUID, db: Session = Depends(get_db)):
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    db.delete(project)
    db.commit()
    return None
