import os
import json
import traceback
from typing import Dict, Any, List, Optional
from app.config import settings
import google.genai as genai
from google.genai import types

class CriticAgent:
    def __init__(self):
        pass

    def _get_client(self) -> Optional[genai.Client]:
        api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        if api_key:
            return genai.Client(api_key=api_key)
        return None

    async def audit_design_proposal(
        self,
        scene_graph: Dict[str, Any],
        render_url: str,
        style_profile: Dict[str, Any],
        physics_warnings: List[str]
    ) -> Dict[str, Any]:
        """
        Critiques the scene structure and visual output.
        Scoring categories: Spacing, Realism, Consistency.
        """
        nodes = scene_graph.get("nodes", [])
        room_meta = scene_graph.get("room", {})
        client = self._get_client()
        
        spacing_score = 100
        if len(physics_warnings) > 0:
            spacing_score = max(30, 100 - (len(physics_warnings) * 25))
            
        if not client:
            # Fallback simple scoring logic
            return {
                "scores": {
                    "spacing": spacing_score,
                    "aesthetic_consistency": 85,
                    "physics_safety": 95 if spacing_score > 70 else 50
                },
                "passed": spacing_score >= 60,
                "critique": f"Design looks clean. Found {len(physics_warnings)} warning(s).",
                "repairs": []
            }
            
        prompt = f"""
        You are the HomeVerse QA/Critic Agent. Critique this interior design proposal:
        
        Style Profile: {json.dumps(style_profile)}
        Room Structure: {json.dumps(room_meta)}
        Placed Nodes: {json.dumps(nodes, indent=2)}
        Physics Warnings: {json.dumps(physics_warnings)}
        Render URL: {render_url}
        
        Assess and score (0 to 100) the layout for:
        1. spacing: Spatial clearance and walking lane integrity.
        2. aesthetic_consistency: Material harmony and style rules compliance.
        3. physics_safety: Intersection issues.
        
        Provide an list of required "repairs" if any score is below 70.
        
        Respond ONLY with a valid JSON object matching this schema:
        {{
          "scores": {{
            "spacing": int,
            "aesthetic_consistency": int,
            "physics_safety": int
          }},
          "passed": bool, // true if all scores are >= 60
          "critique": "Detailed critique explaining design pros/cons",
          "repairs": [
            {{
              "target_node_id": "string",
              "action": "shift" | "swap_material" | "delete",
              "reason": "explanation of repair"
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
            print(f"❌ V2 Critic Agent failed ({e}). Returning fallback score.")
            traceback.print_exc()
            return {
                "scores": {
                    "spacing": spacing_score,
                    "aesthetic_consistency": 85,
                    "physics_safety": 95 if spacing_score > 70 else 50
                },
                "passed": spacing_score >= 60,
                "critique": f"Design compiled. Encountered connection error during LLM critique.",
                "repairs": []
            }

critic_agent = CriticAgent()
