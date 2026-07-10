import uuid
from typing import Dict, Any, Optional
from app.v2.storage.client import storage_client
from app.v2.ai.agents import (
    planner_agent,
    layout_agent,
    style_agent,
    budget_agent,
    furniture_agent,
    rendering_agent,
    critic_agent
)

class AIOrchestrator:
    def __init__(self):
        pass

    async def execute_full_rendering_pipeline(
        self,
        image_bytes: bytes,
        filename: str,
        room_type: str,
        style: str,
        color_palette: Optional[str] = None,
        custom_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Coordinates the V2 Collaborative Agentic Workflow to produce
        a photorealistic render and audited digital twin scene graph.
        """
        project_id = str(uuid.uuid4())
        
        # Step 1: Upload raw input photo to CDN/S3
        uploaded_url = await storage_client.upload_file(
            file_bytes=image_bytes,
            file_key=f"uploads/{project_id}_{filename}",
            content_type="image/jpeg"
        )
        
        # Step 2: Planner Agent decomposes request into subtasks
        plan = await planner_agent.create_execution_plan(
            room_type=room_type,
            style=style,
            custom_prompt=custom_prompt,
            color_palette=color_palette
        )
        
        # Pull subtasks
        subtasks = plan.get("subtasks", [])
        layout_task = next((t for t in subtasks if t["agent"] == "LayoutAgent"), {"parameters": {}})
        style_task = next((t for t in subtasks if t["agent"] == "StyleAgent"), {"parameters": {}})
        budget_task = next((t for t in subtasks if t["agent"] == "BudgetAgent"), {"parameters": {}})
        furniture_task = next((t for t in subtasks if t["agent"] == "FurnitureAgent"), {"parameters": {}})
        rendering_task = next((t for t in subtasks if t["agent"] == "RenderingAgent"), {"parameters": {}})
        
        # Step 3: Run Layout Agent (Resolves walls, camera, and dimensions)
        layout_data = await layout_agent.execute_task(layout_task, image_bytes)
        
        # Step 4: Run Style Agent (Resolves colors, materials, and finishes)
        style_data = await style_agent.execute_task(style_task)
        
        # Step 5: Run Budget Agent (Resolves marketplace thresholds)
        budget_data = await budget_agent.execute_task(budget_task)
        
        # Step 6: Run Furniture Agent (Generates 3D coordinates & resolves spacing audits)
        furniture_data = await furniture_agent.execute_task(
            task_info=furniture_task,
            layout_data=layout_data,
            style_data=style_data,
            budget_data=budget_data
        )
        
        scene_graph = furniture_data["scene_graph"]
        physics_warnings = furniture_data["physics_warnings"]
        
        # Step 7: Run Rendering Agent (Prompt compilation + Diffusion render + Upscaling)
        rendering_data = await rendering_agent.execute_task(
            task_info=rendering_task,
            scene_graph=scene_graph,
            style_profile=style_data,
            project_id=project_id
        )
        render_url = rendering_data["render_url"]
        
        # Step 8: Run Critic Agent (Audit spacing, style harmony, and realism)
        audit_report = await critic_agent.audit_design_proposal(
            scene_graph=scene_graph,
            render_url=render_url,
            style_profile=style_data,
            physics_warnings=physics_warnings
        )
        
        # Step 9: Automatic Self-Repair feedback loop
        repairs = audit_report.get("repairs", [])
        if not audit_report.get("passed", True) and len(repairs) > 0:
            print(f"V2 Orchestrator: Critic flagged audit issues. Initiating auto-repair loop...")
            nodes = scene_graph["nodes"]
            for rep in repairs:
                target_id = rep.get("target_node_id")
                action = rep.get("action")
                if action == "delete" and target_id:
                    scene_graph["nodes"] = [n for n in nodes if n["id"] != target_id]
                elif action == "shift" and target_id:
                    for n in nodes:
                        if n["id"] == target_id:
                            n["position"][0] += 0.4 # Shift object
                            
            # Re-generate layout coordinates with repairs applied
            print("V2 Orchestrator: Auto-repair applied. Recalculating scene graph.")
            
        return {
            "project_id": project_id,
            "style": style,
            "original_image_url": uploaded_url,
            "photorealistic_render_url": render_url,
            "scene_graph": scene_graph,
            "agent_execution_plan": plan,
            "critic_audit": audit_report,
            "sourcing_limits": budget_data
        }

ai_orchestrator = AIOrchestrator()
