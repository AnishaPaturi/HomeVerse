"""
House Scene Service
Aggregates room and floor scenes into a unified multi-floor 3D house model.
"""
from typing import Dict, Any, List
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.project import Project
from app.models.floor import Floor
from app.models.room import Room
from app.models.scene import Scene
from app.models.scene_object import SceneObject

class HouseSceneService:
    @staticmethod
    def get_complete_house_scene(db: Session, project_id: UUID) -> Dict[str, Any]:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError("Project not found")

        floors = db.query(Floor).filter(Floor.project_id == project_id).order_by(Floor.floor_number).all()
        floors_data = []

        total_objects_count = 0
        total_estimated_value = 0.0

        for floor in floors:
            rooms = db.query(Room).filter(Room.floor_id == floor.id).all()
            rooms_data = []

            for room in rooms:
                scene = db.query(Scene).filter(Scene.room_id == room.id).first()
                objects = db.query(SceneObject).filter(SceneObject.scene_id == scene.id).all() if scene else []
                total_objects_count += len(objects)
                total_estimated_value += sum(obj.unit_price for obj in objects)

                rooms_data.append({
                    "room_id": str(room.id),
                    "name": room.name,
                    "room_type": room.room_type,
                    "dimensions": {
                        "width": room.width or 4.0,
                        "length": room.length or 4.5,
                        "height": room.height or 2.8,
                        "area": room.area or 18.0
                    },
                    "objects_count": len(objects),
                    "scene_id": str(scene.id) if scene else None
                })

            floors_data.append({
                "floor_id": str(floor.id),
                "floor_number": floor.floor_number,
                "name": floor.name,
                "level_type": floor.level_type,
                "rooms": rooms_data
            })

        return {
            "project_id": str(project.id),
            "project_name": project.name,
            "property_type": project.property_type,
            "total_floors": len(floors),
            "floors": floors_data,
            "metrics": {
                "total_objects": total_objects_count,
                "total_furniture_cost": round(total_estimated_value, 2)
            }
        }
