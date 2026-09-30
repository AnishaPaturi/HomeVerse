"""
AI Orchestrator Service
Coordinates the multi-agent pipeline: Floorplan -> Planning -> Budget -> Design -> Layout -> Critic -> Rendering.
"""
from typing import Dict, Any
from app.ai.agents.budget_agent import budget_agent
from app.ai.agents.planning_agent import planning_agent
from app.ai.agents.design_agent import design_agent
from app.ai.agents.layout_agent import layout_agent
from app.ai.agents.critic_agent import critic_agent
from app.ai.agents.rendering_agent import rendering_agent

class AIOrchestrator:
    @staticmethod
    async def run_design_pipeline(project_data: Dict[str, Any]) -> Dict[str, Any]:
        total_budget = project_data.get("budget", 1000000.0)
        style = project_data.get("style", "Modern")
        room_type = project_data.get("room_type", "Living Room")
        flexibility = project_data.get("flexibility", "Moderate")

        # 1. Budget Envelopes
        budget_plan = await budget_agent.allocate_budget(
            total_budget=total_budget,
            style=style,
            flexibility=flexibility
        )

        # 2. Planning & Clearances
        planning = await planning_agent.execute_task({"room_type": room_type})

        # 3. Design Theme
        design_specs = await design_agent.execute_task({"style": style})

        # 4. Layout
        layout = await layout_agent.execute_task({"room_type": room_type})

        # 5. Critic Verification
        review = await critic_agent.review_scene({"budget": budget_plan, "layout": layout})

        # 6. Rendering
        render = await rendering_agent.execute_task({
            "prompt": f"{style} {room_type} interior design",
            "seed": 100
        })

        return {
            "status": "success",
            "budget_envelopes": budget_plan["allocation_envelopes"],
            "design_specs": design_specs,
            "layout": layout,
            "critic_score": review["score"],
            "render_url": render["render_url"]
        }

orchestrator_service = AIOrchestrator()
