import os
import json
import google.generativeai as genai
from typing import Dict, Any, List
from app.config import settings

class PlannerAgent:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)

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
        
        if not self.api_key:
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
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = await model.generate_content_async(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"V2 Planner Agent failed ({e}). Returning default template plan.")
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
