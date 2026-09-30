"""
Room Service Layer
Handles room creation, layout dimensions, status, and floor assignment.
"""
from typing import List, Optional
from uuid import UUID
import uuid
from sqlalchemy.orm import Session
from app.models.room import Room
from app.schemas.room import RoomCreate, RoomUpdate

class RoomService:
    @staticmethod
    def get_rooms_by_project(db: Session, project_id: UUID, floor_id: Optional[UUID] = None) -> List[Room]:
        query = db.query(Room).filter(Room.project_id == project_id)
        if floor_id:
            query = query.filter(Room.floor_id == floor_id)
        return query.all()

    @staticmethod
    def get_room_by_id(db: Session, room_id: UUID) -> Optional[Room]:
        return db.query(Room).filter(Room.id == room_id).first()

    @staticmethod
    def create_room(db: Session, data: RoomCreate) -> Room:
        room = Room(
            id=uuid.uuid4(),
            project_id=data.project_id,
            floor_id=data.floor_id,
            name=data.name,
            room_type=data.room_type,
            length=data.length,
            width=data.width,
            height=data.height,
            area=data.area or ((data.length * data.width) if data.length and data.width else None),
            status=data.status or "planning"
        )
        db.add(room)
        db.commit()
        db.refresh(room)
        return room

    @staticmethod
    def update_room(db: Session, room_id: UUID, data: RoomUpdate) -> Room:
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise ValueError(f"Room {room_id} not found")

        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(room, key, val)

        if room.length and room.width and not room.area:
            room.area = round(room.length * room.width, 2)

        db.add(room)
        db.commit()
        db.refresh(room)
        return room
