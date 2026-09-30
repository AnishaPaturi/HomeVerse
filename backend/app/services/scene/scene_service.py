"""
Scene Service
Manages 3D visualization scenes for rooms, floors, and house walkthroughs.
"""
from typing import List, Optional
from uuid import UUID
import uuid
from sqlalchemy.orm import Session
from app.models.scene import Scene
from app.schemas.scene import SceneCreate, SceneUpdate

class SceneService:
    @staticmethod
    def get_room_scene(db: Session, room_id: UUID) -> Optional[Scene]:
        return db.query(Scene).filter(Scene.room_id == room_id).first()

    @staticmethod
    def get_or_create_room_scene(db: Session, project_id: UUID, room_id: UUID, name: str = "Room 3D View") -> Scene:
        scene = db.query(Scene).filter(Scene.room_id == room_id).first()
        if not scene:
            scene = Scene(
                id=uuid.uuid4(),
                project_id=project_id,
                room_id=room_id,
                name=name,
                scene_type="room",
                camera_settings='{"position": [0, 5, 8], "target": [0, 0, 0], "fov": 50}',
                lighting_settings='{"ambient": 0.8, "directional": [5, 10, 5], "intensity": 1.0}'
            )
            db.add(scene)
            db.commit()
            db.refresh(scene)
        return scene

    @staticmethod
    def update_scene(db: Session, scene_id: UUID, data: SceneUpdate) -> Scene:
        scene = db.query(Scene).filter(Scene.id == scene_id).first()
        if not scene:
            raise ValueError("Scene not found")

        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(scene, key, val)

        db.add(scene)
        db.commit()
        db.refresh(scene)
        return scene
