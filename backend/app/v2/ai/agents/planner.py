import os
import json
import traceback
from typing import Dict, Any, List, Optional
from app.config import settings
import google.genai as genai
from google.genai import types

class PlannerAgent:
    def __init__(self):
        pass

    def _get_client(self) -> Optional[genai.Client]:
        api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        if api_key:
            return genai.Client(api_key=api_key)
        return None

    async def create_execution_plan(
        self,
        room_type: str,
        style: str,
        custom_prompt: str,
        color_palette: str = None
    ) -> Dict[str, Any]:
        """
        Parses user intent and seeds the task queue for the Layout, Style,
        Budget, Furniture, and Rendering agents.
        """
        user_input = f"Room: {room_type}, Style: {style}, Palette: {color_palette or 'Any'}, Context: {custom_prompt or 'None'}"
        client = self._get_client()
        
        if not client:
            # Fallback local planning template
            return {
                "user_intent": user_input,
                "subtasks": [
                    {"agent": "LayoutAgent", "task": "Determine room bounding box and wall segments.", "parameters": {"room_type": room_type}},
                    {"agent": "StyleAgent", "task": "Generate color palette and texture references.", "parameters": {"style": style, "palette": color_palette}},
                    {"agent": "BudgetAgent", "task": "Establish sourcing thresholds.", "parameters": {"style": style}},
                    {"agent": "FurnitureAgent", "task": "Place objects matching style rules.", "parameters": {"room_type": room_type, "style": style}},
                    {"agent": "RenderingAgent", "task": "Generate photorealistic render from scene nodes.", "parameters": {"style": style}}
                ]
            }
            
        prompt = f"""
        You are the HomeVerse Planner Agent. Your job is to parse the user request:
        "{user_input}"
        
        Decompose this request into a structured execution plan for specialized agents:
        1. LayoutAgent: Defines structural parameters and camera vectors.
        2. StyleAgent: Curates colors, textures, and finishes.
        3. BudgetAgent: Sets pricing constraints and marketplace search keywords.
        4. FurnitureAgent: Selects assets and plans their 3D placements.
        5. RenderingAgent: Defines prompt parameters for diffusion imaging.
        
        Respond ONLY with a valid JSON object matching this schema:
        {{
          "user_intent": "Summary of what user wants",
          "subtasks": [
            {{
              "agent": "LayoutAgent" | "StyleAgent" | "BudgetAgent" | "FurnitureAgent" | "RenderingAgent",
              "task": "Actionable task instructions for the agent",
              "parameters": {{}}
            }}
          ]
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
            print(f"❌ V2 Planner Agent failed ({e}). Returning default template plan.")
            traceback.print_exc()
            return {
                "user_intent": user_input,
                "subtasks": [
                    {"agent": "LayoutAgent", "task": "Determine room bounding box and wall segments.", "parameters": {"room_type": room_type}},
                    {"agent": "StyleAgent", "task": "Generate color palette and texture references.", "parameters": {"style": style, "palette": color_palette}},
                    {"agent": "BudgetAgent", "task": "Establish sourcing thresholds.", "parameters": {"style": style}},
                    {"agent": "FurnitureAgent", "task": "Place objects matching style rules.", "parameters": {"room_type": room_type, "style": style}},
                    {"agent": "RenderingAgent", "task": "Generate photorealistic render from scene nodes.", "parameters": {"style": style}}
                ]
            }

planner_agent = PlannerAgent()
