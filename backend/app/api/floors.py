from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.floor import FloorCreate, FloorUpdate, FloorOut
from app.services.floor.floor_service import FloorService

router = APIRouter()

@router.get("/projects/{project_id}/floors", response_model=List[FloorOut])
def get_floors_for_project(project_id: UUID, db: Session = Depends(get_db)):
    return FloorService.get_project_floors(db, project_id)

@router.post("/projects/{project_id}/floors", response_model=FloorOut)
def create_floor_for_project(project_id: UUID, data: FloorCreate, db: Session = Depends(get_db)):
    data.project_id = project_id
    return FloorService.create_floor(db, data)

@router.get("/floors/{floor_id}", response_model=FloorOut)
def get_floor_by_id(floor_id: UUID, db: Session = Depends(get_db)):
    floor = FloorService.get_floor_by_id(db, floor_id)
    if not floor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Floor not found")
    return floor

@router.put("/floors/{floor_id}", response_model=FloorOut)
def update_floor_by_id(floor_id: UUID, data: FloorUpdate, db: Session = Depends(get_db)):
    try:
        return FloorService.update_floor(db, floor_id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
