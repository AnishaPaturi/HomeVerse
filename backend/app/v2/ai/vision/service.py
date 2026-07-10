import os
import json
import google.generativeai as genai
from typing import Dict, Any
from app.config import settings

class VisionService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)

    async def analyze_room_photo(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> Dict[str, Any]:
        """
        Uses Gemini Vision to perform high-fidelity structural, wall, window, door, and camera angle estimation.
        """
        if not self.api_key:
            # Fallback mock analysis
            return {
                "walls": [{"direction": "left", "material": "#f1f5f9"}, {"direction": "right", "material": "#f1f5f9"}],
                "windows": [{"wall": "back", "type": "sliding", "width_m": 1.8}],
                "doors": [{"wall": "front", "facing": "North"}],
                "floor": {"material": "wood_light", "area_sqm": 15.0},
                "camera": {"yaw": 0.0, "pitch": -5.0, "height_m": 1.6},
                "lighting": "left_ambient"
            }
            
        prompt = """
        Analyze this room photo. Estimate the structural layout, wall orientations, window sizes, door placements, floor materials, camera orientation, and lighting conditions.
        
        Respond ONLY with a valid JSON object matching this schema:
        {
          "walls": [
            {"direction": "left" | "right" | "back" | "front", "material": "string"}
          ],
          "windows": [
            {"wall": "left" | "right" | "back", "type": "sliding" | "french" | "standard", "width_m": float}
          ],
          "doors": [
            {"wall": "left" | "right" | "back" | "front", "facing": "string"}
          ],
          "floor": {
            "material": "string",
            "area_sqm": float
          },
          "camera": {
            "yaw": float, // angle in degrees
            "pitch": float, // angle in degrees
            "height_m": float // estimated camera height from floor
          },
          "lighting": "left_ambient" | "right_ambient" | "direct_sunlight" | "diffused_daylight" | "artificial"
        }
        Respond with raw JSON only. Do not include markdown blocks.
        """
        
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            contents = [
                {
                    "mime_type": mime_type,
                    "data": image_bytes
                },
                prompt
            ]
            response = await model.generate_content_async(
                contents,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"V2 Vision Service: Gemini analysis failed ({e}). Returning fallback layout.")
            return {
                "walls": [{"direction": "left", "material": "#f1f5f9"}, {"direction": "right", "material": "#f1f5f9"}],
                "windows": [{"wall": "back", "type": "standard", "width_m": 1.5}],
                "doors": [{"wall": "front", "facing": "North"}],
                "floor": {"material": "wood_light", "area_sqm": 14.5},
                "camera": {"yaw": 0.0, "pitch": -5.0, "height_m": 1.6},
                "lighting": "diffused_daylight"
            }

vision_service = VisionService()
