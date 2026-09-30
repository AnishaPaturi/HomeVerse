from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.floorplan import Floorplan
from app.schemas.floorplan import FloorplanAnalysisResponse, FloorplanConfirmRequest, FloorplanOut
from app.services.floorplan.upload_service import FloorplanUploadService
from app.services.floorplan.analysis_service import FloorplanAnalysisService
from app.services.floorplan.dimension_service import DimensionService
from app.schemas.room import RoomOut

router = APIRouter()

@router.post("/projects/{project_id}/floorplans/upload", response_model=FloorplanOut)
async def upload_floorplan_endpoint(
    project_id: UUID,
    file: UploadFile = File(...),
    floor_id: Optional[UUID] = Form(None),
    db: Session = Depends(get_db)
):
    content = await file.read()
    return await FloorplanUploadService.upload_floorplan(
        db=db,
        project_id=project_id,
        file_bytes=content,
        filename=file.filename or "floorplan.jpg",
        floor_id=floor_id
    )

@router.post("/floorplans/{floorplan_id}/analyze", response_model=FloorplanAnalysisResponse)
def analyze_floorplan_endpoint(floorplan_id: UUID, db: Session = Depends(get_db)):
    try:
        return FloorplanAnalysisService.analyze_floorplan(db, floorplan_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/floorplans/{floorplan_id}/confirm", response_model=List[RoomOut])
def confirm_floorplan_dimensions(
    floorplan_id: UUID,
    confirm_req: FloorplanConfirmRequest,
    db: Session = Depends(get_db)
):
    try:
        rooms = DimensionService.confirm_and_sync_rooms(db, floorplan_id, confirm_req.confirmed_rooms)
        return rooms
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/floorplans/{floorplan_id}", response_model=FloorplanOut)
def get_floorplan_details(floorplan_id: UUID, db: Session = Depends(get_db)):
    fp = db.query(Floorplan).filter(Floorplan.id == floorplan_id).first()
    if not fp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Floorplan not found")
    return fp
