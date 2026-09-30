"""
Dimension Service
Handles user verification, dimension adjustments, and room synchronization.
"""
from typing import List
from uuid import UUID
import uuid
import json
from sqlalchemy.orm import Session
from app.models.floorplan import Floorplan
from app.models.room import Room
from app.schemas.floorplan import DetectedRoomSchema

class DimensionService:
    @staticmethod
    def confirm_and_sync_rooms(
        db: Session,
        floorplan_id: UUID,
        confirmed_rooms: List[DetectedRoomSchema]
    ) -> List[Room]:
        floorplan = db.query(Floorplan).filter(Floorplan.id == floorplan_id).first()
        if not floorplan:
            raise ValueError("Floorplan not found")

        created_rooms: List[Room] = []
        for r_data in confirmed_rooms:
            # Check if room with same name exists in project
            existing = db.query(Room).filter(
                Room.project_id == floorplan.project_id,
                Room.name == r_data.name
            ).first()

            if existing:
                existing.width = r_data.width_m
                existing.length = r_data.length_m
                existing.area = r_data.area_sqm
                existing.floor_id = floorplan.floor_id
                db.add(existing)
                created_rooms.append(existing)
            else:
                new_room = Room(
                    id=uuid.uuid4(),
                    project_id=floorplan.project_id,
                    floor_id=floorplan.floor_id,
                    name=r_data.name,
                    room_type=r_data.room_type,
                    width=r_data.width_m,
                    length=r_data.length_m,
                    area=r_data.area_sqm,
                    status="planning"
                )
                db.add(new_room)
                created_rooms.append(new_room)

        floorplan.status = "confirmed"
        floorplan.detected_rooms = json.dumps([r.model_dump() for r in confirmed_rooms])
        db.add(floorplan)
        db.commit()

        for room in created_rooms:
            db.refresh(room)
        return created_rooms
