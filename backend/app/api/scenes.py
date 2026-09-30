from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.scene import SceneOut, SceneCreate, SceneUpdate, SceneObjectOut, SceneObjectCreate, SceneObjectUpdate
from app.services.scene.scene_service import SceneService
from app.services.scene.object_service import ObjectService
from app.services.scene.house_scene_service import HouseSceneService

router = APIRouter()

@router.get("/rooms/{room_id}/scene", response_model=SceneOut)
def get_room_scene_endpoint(room_id: UUID, project_id: Optional[UUID] = None, db: Session = Depends(get_db)):
    if not project_id:
        from app.models.room import Room
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
        project_id = room.project_id

    scene = SceneService.get_or_create_room_scene(db, project_id, room_id)
    return scene

@router.get("/projects/{project_id}/house-scene")
def get_house_scene_endpoint(project_id: UUID, db: Session = Depends(get_db)):
    try:
        return HouseSceneService.get_complete_house_scene(db, project_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/scenes/{scene_id}/objects", response_model=SceneObjectOut)
def add_scene_object_endpoint(scene_id: UUID, data: SceneObjectCreate, db: Session = Depends(get_db)):
    data.scene_id = scene_id
    return ObjectService.add_object(db, data)

@router.put("/scenes/objects/{object_id}", response_model=SceneObjectOut)
def update_scene_object_endpoint(object_id: UUID, data: SceneObjectUpdate, db: Session = Depends(get_db)):
    try:
        return ObjectService.update_object(db, object_id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.delete("/scenes/objects/{object_id}")
def delete_scene_object_endpoint(object_id: UUID, db: Session = Depends(get_db)):
    ObjectService.delete_object(db, object_id)
    return {"message": "Object removed successfully"}
