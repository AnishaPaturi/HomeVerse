import os
import json
import traceback
from typing import Dict, List, Any, Optional
from app.config import settings
import google.genai as genai
from google.genai import types

class CopilotService:
    def __init__(self):
        pass

    def _get_client(self) -> Optional[genai.Client]:
        api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        if api_key:
            return genai.Client(api_key=api_key)
        return None

    async def execute_scene_command(
        self,
        command: str,
        current_scene: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Interprets natural language instructions and translates them to Scene Graph mutations.
        Returns the updated Scene Graph.
        """
        nodes = current_scene.get("nodes", [])
        client = self._get_client()
        
        if not client:
            # Fallback simple keyword mutations
            command_lower = command.lower()
            if "wall" in command_lower:
                # Update wall material
                for n in nodes:
                    if n["type"] == "wall":
                        n["material"] = "#3b82f6" if "blue" in command_lower else "#dc2626" if "red" in command_lower else "#10b981" if "green" in command_lower else "#f8fafc"
            elif "sofa" in command_lower and "brown" in command_lower:
                for n in nodes:
                    if n["type"] == "sofa":
                        n["material"] = "leather_brown"
            elif "move" in command_lower or "shift" in command_lower:
                # Simulate coordinate offset
                for n in nodes:
                    if n["type"] not in ["floor", "wall"]:
                        n["position"][0] += 0.5 # shift X slightly
                        
            return {
                "response": f"I processed your command '{command}' and updated the scene elements.",
                "scene": current_scene
            }
            
        prompt = f"""
        You are the HomeVerse AI Copilot. You modify a 3D Scene Graph based on natural language instructions.
        
        Current Scene Graph Nodes:
        {json.dumps(nodes, indent=2)}
        
        User instruction: "{command}"
        
        You must perform one or more mutations:
        1. "update": Modify properties (position, rotation, scale, material) of an existing node by its "id".
        2. "add": Create a new object node.
        3. "delete": Remove a node by its "id".
        
        Respond ONLY with a valid JSON object matching this schema:
        {{
          "response": "Brief friendly message explaining what changes you made.",
          "mutations": [
            {{
              "type": "update" | "add" | "delete",
              "node_id": "string (for update/delete)",
              "properties": {{
                "material": "string",
                "position": [float, float, float],
                "rotation": float,
                "scale": float
              }},
              "new_node": {{
                "type": "string",
                "position": [float, float, float],
                "rotation": float,
                "scale": float,
                "material": "string"
              }}
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
            result = json.loads(response.text)
            
            # Apply mutations to the current scene nodes
            mutations = result.get("mutations", [])
            updated_nodes = list(nodes)
            
            for mut in mutations:
                mut_type = mut.get("type")
                node_id = mut.get("node_id")
                
                if mut_type == "update" and node_id:
                    for n in updated_nodes:
                        if n["id"] == node_id:
                            props = mut.get("properties", {})
                            for k, v in props.items():
                                if v is not None:
                                    n[k] = v
                elif mut_type == "delete" and node_id:
                    updated_nodes = [n for n in updated_nodes if n["id"] != node_id]
                elif mut_type == "add" and mut.get("new_node"):
                    new_node = mut.get("new_node")
                    import uuid
                    new_node["id"] = str(uuid.uuid4())
                    updated_nodes.append(new_node)
                    
            current_scene["nodes"] = updated_nodes
            return {
                "response": result.get("response", "Scene updated successfully."),
                "scene": current_scene
            }
        except Exception as e:
            print(f"❌ V2 Copilot command failed ({e}). Returning original scene.")
            traceback.print_exc()
            return {
                "response": f"Encountered an issue executing request. Original scene retained.",
                "scene": current_scene
            }

copilot_service = CopilotService()
