from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel
from app.db.session import get_db
from app.models.room import Room as RoomModel

router = APIRouter()

class RoomBase(BaseModel):
    name: str
    room_type: str
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    area: Optional[float] = None
    status: Optional[str] = "planning"

class RoomCreate(RoomBase):
    pass

class RoomOut(RoomBase):
    id: UUID
    project_id: UUID

    class Config:
        from_attributes = True

@router.post("/projects/{project_id}/rooms", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
def create_room(project_id: UUID, room_in: RoomCreate, db: Session = Depends(get_db)):
    room = RoomModel(
        project_id=project_id,
        name=room_in.name,
        room_type=room_in.room_type,
        length=room_in.length,
        width=room_in.width,
        height=room_in.height,
        area=room_in.area or ((room_in.length or 0) * (room_in.width or 0)),
        status=room_in.status
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return room

@router.get("/projects/{project_id}/rooms", response_model=List[RoomOut])
def get_project_rooms(project_id: UUID, db: Session = Depends(get_db)):
    return db.query(RoomModel).filter(RoomModel.project_id == project_id).all()

@router.get("/rooms/{room_id}", response_model=RoomOut)
def get_room(room_id: UUID, db: Session = Depends(get_db)):
    room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.delete("/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(room_id: UUID, db: Session = Depends(get_db)):
    room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    db.delete(room)
    db.commit()
    return None
