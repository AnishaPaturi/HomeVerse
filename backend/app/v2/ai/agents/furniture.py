from typing import Dict, Any, List
from app.v2.ai.scene_graph.service import scene_graph_builder

class FurnitureAgent:
    def __init__(self):
        pass

    async def execute_task(
        self,
        task_info: Dict[str, Any],
        layout_data: Dict[str, Any],
        style_data: Dict[str, Any],
        budget_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculates optimal 3D coordinates for all furniture items
        and performs spacing / collision safety audits.
        """
        room_type = task_info.get("parameters", {}).get("room_type", "Living Room")
        style = task_info.get("parameters", {}).get("style", "Modern")
        
        dimensions = layout_data.get("dimensions", {"width_m": 3.6, "length_m": 4.0, "height_m": 2.8})
        lighting = layout_data.get("lighting_profile", "diffused_daylight")
        
        # Build initial scene graph
        scene_graph = await scene_graph_builder.build_initial_scene_graph(
            room_type=room_type,
            dimensions=dimensions,
            lighting_direction=lighting,
            style=style
        )
        
        # Inject style materials into nodes
        materials = style_data.get("materials", ["wood", "concrete"])
        primary_color = style_data.get("primary_color", "#f1f5f9")
        
        for node in scene_graph["nodes"]:
            if node["type"] == "floor":
                node["material"] = materials[0]
            elif node["type"] == "wall":
                node["material"] = primary_color
            elif node["type"] not in ["floor", "wall"] and len(materials) > 1:
                node["material"] = materials[1]
                
        # Perform Spacing & Collision checks (Physics Validation)
        nodes = scene_graph["nodes"]
        warnings = []
        
        # Simple overlap check: check if any two objects share the exact same X and Z coordinates
        for i in range(len(nodes)):
            for j in range(i + 1, len(nodes)):
                n1, n2 = nodes[i], nodes[j]
                if n1["type"] in ["floor", "wall"] or n2["type"] in ["floor", "wall"]:
                    continue
                dist = ((n1["position"][0] - n2["position"][0])**2 + (n1["position"][2] - n2["position"][2])**2)**0.5
                if dist < 0.3:
                    warnings.append(f"Collision warning: {n1['type']} and {n2['type']} are overlapping too closely ({dist:.2f}m).")
                    # Auto repair: shift second object slightly
                    n2["position"][0] += 0.5
                    warnings.append(f"Auto-repair: Shifted {n2['type']} +50cm on X-axis.")
                    
        return {
            "scene_graph": scene_graph,
            "physics_warnings": warnings,
            "audit_passed": len(warnings) == 0
        }

furniture_agent = FurnitureAgent()
