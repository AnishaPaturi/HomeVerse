"""
Object Service
Controls 3D furniture and architectural objects in scene viewports.
"""
from typing import List, Optional
from uuid import UUID
import uuid
from sqlalchemy.orm import Session
from app.models.scene_object import SceneObject
from app.schemas.scene import SceneObjectCreate, SceneObjectUpdate

class ObjectService:
    @staticmethod
    def list_scene_objects(db: Session, scene_id: UUID) -> List[SceneObject]:
        return db.query(SceneObject).filter(SceneObject.scene_id == scene_id).all()

    @staticmethod
    def add_object(db: Session, data: SceneObjectCreate) -> SceneObject:
        obj = SceneObject(
            id=uuid.uuid4(),
            scene_id=data.scene_id,
            object_type=data.object_type,
            name=data.name or data.object_type.title(),
            position_x=data.position_x,
            position_y=data.position_y,
            position_z=data.position_z,
            rotation=data.rotation,
            scale=data.scale,
            material=data.material,
            color=data.color,
            product_id=data.product_id,
            unit_price=data.unit_price
        )
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def update_object(db: Session, object_id: UUID, data: SceneObjectUpdate) -> SceneObject:
        obj = db.query(SceneObject).filter(SceneObject.id == object_id).first()
        if not obj:
            raise ValueError("Scene object not found")

        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(obj, key, val)

        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def delete_object(db: Session, object_id: UUID) -> None:
        obj = db.query(SceneObject).filter(SceneObject.id == object_id).first()
        if obj:
            db.delete(obj)
            db.commit()
