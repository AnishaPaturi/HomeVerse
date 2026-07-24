import os
import json
import traceback
from typing import Dict, Any, Optional
from app.config import settings
import google.genai as genai
from google.genai import types

class VisionService:
    def __init__(self):
        pass

    def _get_client(self) -> Optional[genai.Client]:
        api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        if api_key:
            return genai.Client(api_key=api_key)
        return None

    async def analyze_room_photo(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> Dict[str, Any]:
        """
        Uses Gemini Vision to perform high-fidelity structural, wall, window, door, and camera angle estimation.
        """
        client = self._get_client()
        if not client:
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
            contents = [
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                prompt
            ]
            response = await client.aio.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"❌ V2 Vision Service: Gemini analysis failed ({e}). Returning fallback layout.")
            traceback.print_exc()
            return {
                "walls": [{"direction": "left", "material": "#f1f5f9"}, {"direction": "right", "material": "#f1f5f9"}],
                "windows": [{"wall": "back", "type": "standard", "width_m": 1.5}],
                "doors": [{"wall": "front", "facing": "North"}],
                "floor": {"material": "wood_light", "area_sqm": 14.5},
                "camera": {"yaw": 0.0, "pitch": -5.0, "height_m": 1.6},
                "lighting": "diffused_daylight"
            }

vision_service = VisionService()
