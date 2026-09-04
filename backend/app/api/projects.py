from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from app.db.session import get_db
from app.models.project import Project as ProjectModel
from app.models.budget import Budget as BudgetModel
from app.models.user import User as UserModel, UserPreference as UserPreferenceModel
from app.schemas.project import Project as ProjectSchema, ProjectCreate, ProjectUpdate
import uuid

router = APIRouter()

DEMO_USER_ID = UUID("d0000000-0000-0000-0000-000000000000")

def get_or_create_default_user(db: Session) -> UUID:
    user = db.query(UserModel).filter(UserModel.id == DEMO_USER_ID).first()
    if not user:
        user = UserModel(
            id=DEMO_USER_ID,
            email="designer@homeverse.ai",
            name="Anisha Paturi",
            plan="Pro Designer"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user.id

@router.post("", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    """
    Phase 7: Project Creation API
    Supports 7-step wizard: property_type, bhk, area, floor_plan, budget, lifestyle, preferences
    """
    user_id = project_in.user_id
    if not user_id or str(user_id) == "00000000-0000-0000-0000-000000000000":
        user_id = get_or_create_default_user(db)

    p_id = project_in.id or uuid.uuid4()
    name = project_in.name or project_in.title or "My New Home"
    title = project_in.title or name

    project = ProjectModel(
        id=p_id,
        user_id=user_id,
        name=name,
        title=title,
        property_type=project_in.property_type or "apartment",
        bhk=project_in.bhk,
        area_sqft=project_in.area_sqft,
        budget=project_in.budget or 0.0,
        currency=project_in.currency or "INR",
        room_type=project_in.room_type or "Living Room",
        thumbnail=project_in.thumbnail or project_in.floor_plan_url or "",
        structural_analysis=project_in.structural_analysis or ""
    )
    db.add(project)

    # Initialize associated budget if budget specified
    if project_in.budget and project_in.budget > 0:
        budget_obj = BudgetModel(
            project_id=p_id,
            total_budget=project_in.budget,
            allocated_budget=0.0,
            spent_amount=0.0,
            remaining_amount=project_in.budget
        )
        db.add(budget_obj)

    # Save lifestyle/preferences if provided
    if project_in.preferences or project_in.lifestyle:
        user_pref = db.query(UserPreferenceModel).filter(UserPreferenceModel.user_id == user_id).first()
        if not user_pref:
            user_pref = UserPreferenceModel(user_id=user_id)
            db.add(user_pref)
        if project_in.preferences:
            if "style" in project_in.preferences:
                user_pref.style = project_in.preferences["style"]
            if "colours" in project_in.preferences:
                user_pref.colour_preferences = project_in.preferences["colours"]
            if "materials" in project_in.preferences:
                user_pref.material_preferences = project_in.preferences["materials"]
        if project_in.lifestyle:
            user_pref.lifestyle_preferences = project_in.lifestyle

    db.commit()
    db.refresh(project)
    return project

@router.get("", response_model=List[ProjectSchema])
@router.get("/", response_model=List[ProjectSchema])
def get_projects(db: Session = Depends(get_db)):
    """List all projects."""
    return db.query(ProjectModel).order_by(ProjectModel.created_at.desc()).all()

@router.get("/user/{user_id}", response_model=List[ProjectSchema])
def list_user_projects(user_id: UUID, db: Session = Depends(get_db)):
    """List projects for a specific user."""
    if str(user_id) == "00000000-0000-0000-0000-000000000000":
        user_id = DEMO_USER_ID
    return db.query(ProjectModel).filter(ProjectModel.user_id == user_id).order_by(ProjectModel.created_at.desc()).all()

@router.get("/{project_id}", response_model=ProjectSchema)
def get_project(project_id: UUID, db: Session = Depends(get_db)):
    """Get single project by ID."""
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    return project

@router.put("/{project_id}", response_model=ProjectSchema)
def update_project(project_id: UUID, project_in: ProjectUpdate, db: Session = Depends(get_db)):
    """Update project properties."""
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )

    update_data = project_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    if "name" in update_data and "title" not in update_data:
        project.title = update_data["name"]
    elif "title" in update_data and "name" not in update_data:
        project.name = update_data["title"]

    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: UUID, db: Session = Depends(get_db)):
    """Delete a project."""
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    db.delete(project)
    db.commit()
    return None
