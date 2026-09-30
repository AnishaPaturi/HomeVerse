from pydantic import BaseModel, Field
from typing import Optional, List
import uuid

class WalkthroughWaypoint(BaseModel):
    step_number: int
    floor_id: Optional[uuid.UUID] = None
    room_id: Optional[uuid.UUID] = None
    room_name: str
    camera_position: List[float]  # [x, y, z]
    target_position: List[float]  # [x, y, z]
    duration_seconds: float = 5.0
    narration: Optional[str] = None

class WalkthroughResponse(BaseModel):
    project_id: uuid.UUID
    project_name: str
    total_floors: int
    total_rooms: int
    estimated_tour_seconds: float
    waypoints: List[WalkthroughWaypoint] = []
    walkthrough_url: Optional[str] = None
