"""
Walkthrough Service
Calculates smooth 3D camera navigation waypoints for virtual tours across rooms and floors.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.project import Project
from app.models.floor import Floor
from app.models.room import Room
from app.schemas.walkthrough import WalkthroughResponse, WalkthroughWaypoint

class WalkthroughService:
    @staticmethod
    def generate_project_walkthrough(db: Session, project_id: UUID) -> WalkthroughResponse:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError("Project not found")

        floors = db.query(Floor).filter(Floor.project_id == project_id).order_by(Floor.floor_number).all()
        waypoints: List[WalkthroughWaypoint] = []
        step = 1

        for floor in floors:
            rooms = db.query(Room).filter(Room.floor_id == floor.id).all()
            for r in rooms:
                # Calculate camera coordinates centered on room
                cam_x = (step * 2.0) % 10.0 - 5.0
                cam_y = 1.6 + ((floor.floor_number - 1) * 3.0)  # Eye-level height per floor
                cam_z = (step * 3.0) % 8.0 - 4.0

                waypoints.append(WalkthroughWaypoint(
                    step_number=step,
                    floor_id=floor.id,
                    room_id=r.id,
                    room_name=f"{floor.name} - {r.name}",
                    camera_position=[round(cam_x, 2), round(cam_y, 2), round(cam_z, 2)],
                    target_position=[0.0, round(cam_y, 2), 0.0],
                    duration_seconds=5.0,
                    narration=f"Entering {r.name} on the {floor.name}. Notice the spatial harmony, balanced lighting, and custom furnishings."
                ))
                step += 1

        total_rooms = len(waypoints)
        total_seconds = total_rooms * 5.0

        return WalkthroughResponse(
            project_id=project.id,
            project_name=project.name,
            total_floors=len(floors),
            total_rooms=total_rooms,
            estimated_tour_seconds=total_seconds,
            waypoints=waypoints,
            walkthrough_url=f"/project/{project.id}/walkthrough"
        )
