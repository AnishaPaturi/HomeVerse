from typing import List, Dict, Any
import uuid

class SceneGraphBuilder:
    def __init__(self):
        pass

    async def build_initial_scene_graph(
        self,
        room_type: str,
        dimensions: Dict[str, float],
        lighting_direction: str,
        style: str
    ) -> Dict[str, Any]:
        """
        Creates a structured CAD scene graph representing the room twin.
        Every object is positioned relative to the center (0.0, 0.0, -3.0).
        """
        width = dimensions.get("width_m", 3.6)
        length = dimensions.get("length_m", 4.0)
        
        # Base scene structure
        scene = {
            "room": {
                "type": room_type,
                "width": width,
                "length": length,
                "height": dimensions.get("height_m", 2.8),
                "lighting_profile": lighting_direction
            },
            "nodes": [
                {
                    "id": str(uuid.uuid4()),
                    "type": "floor",
                    "position": [0.0, 0.0, -3.0],
                    "rotation": 0.0,
                    "scale": 1.0,
                    "material": "wood_light" if "Modern" in style else "marble"
                },
                {
                    "id": str(uuid.uuid4()),
                    "type": "wall",
                    "position": [0.0, 1.4, -3.0 - (length/2)],
                    "rotation": 0.0,
                    "scale": 1.0,
                    "material": "#f8fafc"
                }
            ]
        }
        
        # Room template nodes
        room_lower = room_type.lower()
        z_center = -3.0
        
        if "bed" in room_lower:
            scene["nodes"].extend([
                {
                    "id": str(uuid.uuid4()),
                    "type": "bed",
                    "position": [0.0, 0.0, z_center - 0.5],
                    "rotation": 3.14,
                    "scale": 1.0,
                    "material": "leather_brown",
                    "relations": {"attached_to": "back_wall", "distance_cm": 10}
                },
                {
                    "id": str(uuid.uuid4()),
                    "type": "nightstand",
                    "position": [-1.2, 0.0, z_center - 0.5],
                    "rotation": 0.0,
                    "scale": 0.8,
                    "material": "wood_dark",
                    "relations": {"next_to": "bed", "side": "left"}
                },
                {
                    "id": str(uuid.uuid4()),
                    "type": "lamp",
                    "position": [-1.2, 0.6, z_center - 0.5],
                    "rotation": 0.0,
                    "scale": 0.9,
                    "material": "#e2e8f0",
                    "relations": {"mounted_on": "nightstand"}
                }
            ])
        elif "kitchen" in room_lower:
            scene["nodes"].extend([
                {
                    "id": str(uuid.uuid4()),
                    "type": "desk",
                    "position": [0.0, 0.0, z_center - 0.5],
                    "rotation": 0.0,
                    "scale": 1.2,
                    "material": "marble",
                    "relations": {"attached_to": "back_wall"}
                },
                {
                    "id": str(uuid.uuid4()),
                    "type": "wardrobe",
                    "position": [1.5, 0.0, z_center],
                    "rotation": -1.57,
                    "scale": 1.0,
                    "material": "wood_light"
                }
            ])
        else:
            # Default to Living Room / Hall
            scene["nodes"].extend([
                {
                    "id": str(uuid.uuid4()),
                    "type": "sofa",
                    "position": [0.0, 0.0, z_center - 0.5],
                    "rotation": 0.0,
                    "scale": 1.0,
                    "material": "fabric_grey",
                    "relations": {"center_of_room": True}
                },
                {
                    "id": str(uuid.uuid4()),
                    "type": "coffee_table",
                    "position": [0.0, 0.0, z_center + 0.8],
                    "rotation": 0.0,
                    "scale": 0.9,
                    "material": "wood_dark",
                    "relations": {"in_front_of": "sofa", "distance_cm": 45}
                },
                {
                    "id": str(uuid.uuid4()),
                    "type": "lamp",
                    "position": [-1.5, 0.0, z_center - 0.5],
                    "rotation": 0.0,
                    "scale": 1.0,
                    "material": "#fbbf24"
                }
            ])
            
        return scene

scene_graph_builder = SceneGraphBuilder()
