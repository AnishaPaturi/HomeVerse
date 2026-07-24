import os
import json
import traceback
from typing import Dict, Any, Optional
from app.config import settings
import google.genai as genai
from google.genai import types

class StyleAgent:
    def __init__(self):
        pass

    def _get_client(self) -> Optional[genai.Client]:
        api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        if api_key:
            return genai.Client(api_key=api_key)
        return None

    async def execute_task(self, task_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates palette, primary materials, and finish tokens based on user requirements.
        """
        style = task_info.get("parameters", {}).get("style", "Modern")
        palette = task_info.get("parameters", {}).get("palette")
        client = self._get_client()
        
        if not client:
            # Fallback local style profile mapping
            profiles = {
                "Modern": {
                    "primary_color": "#1e293b",
                    "accent_color": "#3b82f6",
                    "materials": ["concrete", "glass", "matte_black_steel"],
                    "atmosphere": "Minimalist and clean with subtle direct downlighting."
                },
                "Japandi": {
                    "primary_color": "#f5f5f4",
                    "accent_color": "#78716c",
                    "materials": ["oak_light", "linen_beige", "paper_washi"],
                    "atmosphere": "Peaceful, wabi-sabi vibe with soft diffused paper lanterns."
                },
                "Luxury": {
                    "primary_color": "#0f172a",
                    "accent_color": "#fbbf24",
                    "materials": ["marble_black", "brushed_gold", "walnut_dark"],
                    "atmosphere": "Sophisticated hotel ambience with warm layered cove lights."
                }
            }
            return profiles.get(style, profiles["Modern"])
            
        prompt = f"""
        You are the HomeVerse Style Agent. Build a cohesive interior design style profile.
        Target Style: {style}
        Requested Palette: {palette or "harmonious matches"}
        
        Respond ONLY with a valid JSON object matching this schema:
        {{
          "primary_color": "hex string",
          "accent_color": "hex string",
          "materials": ["list of 3 key materials/finishes"],
          "atmosphere": "description of the mood, textures, and lighting design rules"
        }}
        Respond with raw JSON only. Do not include markdown blocks.
        """
        
        try:
            response = await client.aio.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"❌ V2 Style Agent failed ({e}). Returning default Modern style.")
            traceback.print_exc()
            return {
                "primary_color": "#1e293b",
                "accent_color": "#3b82f6",
                "materials": ["concrete", "glass", "matte_steel"],
                "atmosphere": "Minimalist and clean with subtle direct downlighting."
            }

style_agent = StyleAgent()
