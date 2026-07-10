from typing import Dict, Any
from app.v2.ai.vision.service import vision_service
from app.v2.ai.reconstruction.service import reconstruction_service

class LayoutAgent:
    def __init__(self):
        pass

    async def execute_task(self, task_info: Dict[str, Any], image_bytes: bytes) -> Dict[str, Any]:
        """
        Coordinates vision services to calculate walls, doors, windows, and scale.
        """
        # Run Gemini scene analysis
        vision_data = await vision_service.analyze_room_photo(image_bytes)
        
        # Calculate metric geometry sizes
        reconstruction = await reconstruction_service.reconstruct_room_dimensions(
            vision_data=vision_data,
            depth_data={}
        )
        
        return {
            "walls": vision_data.get("walls", []),
            "windows": vision_data.get("windows", []),
            "doors": vision_data.get("doors", []),
            "lighting_profile": vision_data.get("lighting", "diffused_daylight"),
            "dimensions": reconstruction.get("dimensions", {"width_m": 3.6, "length_m": 4.0, "height_m": 2.8}),
            "camera": {
                "position": reconstruction.get("camera_position"),
                "rotation": reconstruction.get("camera_rotation")
            }
        }

layout_agent = LayoutAgent()
