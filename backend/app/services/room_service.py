"""
Room Service Layer
Handles room creation, layout dimensions, and room assignment.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.room import Room

class RoomService:
    @staticmethod
    def get_rooms_by_project(db: Session, project_id: UUID) -> List[Room]:
        return db.query(Room).filter(Room.project_id == project_id).all()

    @staticmethod
    def get_room_by_id(db: Session, room_id: UUID) -> Optional[Room]:
        return db.query(Room).filter(Room.id == room_id).first()
