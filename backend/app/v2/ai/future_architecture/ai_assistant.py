"""
Phase 51: AI Assistant & Orchestrator
Master coordinator for the entire Future AI Architecture:
                 USER
                   |
                   ↓
             AI ASSISTANT
                   |
          ┌────────┼────────┐
          ↓        ↓        ↓
       Vision   Planning   Budget
          |        |        |
          └────────┼────────┘
                   ↓
             Design Agent
                   |
        ┌──────────┼──────────┐
        ↓          ↓          ↓
    Furniture   Materials   Lighting
        |
        ↓
    Product Agent
        |
        ↓
  Shopping Recommendations
        |
        ↓
   Execution Agent
"""

import asyncio
from typing import Dict, Any, List, Optional
from uuid import uuid4

from app.v2.ai.future_architecture.vision_agent import vision_agent
from app.v2.ai.future_architecture.planning_agent import planning_agent
from app.v2.ai.future_architecture.budget_agent import budget_agent
from app.v2.ai.future_architecture.design_agent import design_agent
from app.v2.ai.future_architecture.furniture_agent import furniture_agent
from app.v2.ai.future_architecture.materials_agent import materials_agent
from app.v2.ai.future_architecture.lighting_agent import lighting_agent
from app.v2.ai.future_architecture.product_agent import product_agent
from app.v2.ai.future_architecture.execution_agent import execution_agent


class AIAssistant:
    """
    Top-Level Orchestrator & Conversational Assistant
    Coordinates the 10-agent hierarchical cascade and provides explainable spatial reasoning.
    """

    def __init__(self):
        self.name = "AIAssistant"
        self.version = "Phase 51 - Future AI Architecture"

    async def execute_cascade(
        self,
        user_query: str,
        room_type: str = "Living Room",
        style: str = "Modern",
        budget: float = 800000.0,
        currency: str = "INR",
        width_m: float = 4.2,
        length_m: float = 5.4,
        height_m: float = 2.9,
        lifestyle_tags: Optional[List[str]] = None,
        natural_light_direction: Optional[str] = "East",
    ) -> Dict[str, Any]:
        """
        Executes the hierarchical AI cascade from user intent down to execution schedule.
        """
        session_id = f"cascade_{uuid4().hex[:8]}"

        # Step 1: Run Tier 1 Perception & Constraints in Parallel
        vision_task = vision_agent.analyze_space(
            room_type=room_type,
            width_m=width_m,
            length_m=length_m,
            height_m=height_m,
            natural_light_direction=natural_light_direction,
        )
        planning_task = planning_agent.generate_plan(
            room_type=room_type,
            dimensions={
                "width_m": width_m,
                "length_m": length_m,
                "floor_area_sqm": round(width_m * length_m, 2),
            },
            lifestyle_tags=lifestyle_tags,
        )
        budget_task = budget_agent.allocate_budget(
            total_budget=budget,
            currency=currency,
            style=style,
            area_sqft=round(width_m * length_m * 10.7639, 1),
        )

        vision_out, planning_out, budget_out = await asyncio.gather(
            vision_task, planning_task, budget_task
        )

        # Step 2: Synthesis Layer — Design Agent unites Vision, Planning, and Budget
        design_out = await design_agent.synthesize_design(
            vision_output=vision_out,
            planning_output=planning_out,
            budget_output=budget_out,
            style=style,
        )

        # Step 3: Tier 2 Specialist Sub-Agents (Furniture, Materials, Lighting)
        furniture_task = furniture_agent.plan_furniture(
            design_output=design_out,
            vision_output=vision_out,
            planning_output=planning_out,
            budget_output=budget_out,
        )
        materials_task = materials_agent.specify_materials(
            design_output=design_out,
            vision_output=vision_out,
            budget_output=budget_out,
        )
        lighting_task = lighting_agent.design_lighting(
            design_output=design_out,
            vision_output=vision_out,
            budget_output=budget_out,
        )

        furniture_out, materials_out, lighting_out = await asyncio.gather(
            furniture_task, materials_task, lighting_task
        )

        # Step 4: Downstream Commercial Layer — Product Agent generates Shopping Recommendations
        product_out = await product_agent.generate_shopping_recommendations(
            furniture_output=furniture_out,
            materials_output=materials_out,
            lighting_output=lighting_out,
            budget_output=budget_out,
        )

        # Step 5: Downstream Construction Layer — Execution Agent creates Phased Schedule
        execution_out = await execution_agent.generate_execution_plan(
            design_output=design_out,
            furniture_output=furniture_out,
            materials_output=materials_out,
            product_output=product_out,
            budget_output=budget_out,
        )

        # Step 6: Formulate Explainable Executive Summary
        executive_summary = (
            f"HomeVerse AI Architecture has synthesized a comprehensive {style} design for your {room_type} "
            f"({vision_out['dimensions']['floor_area_sqft']} sq.ft). "
            f"The spatial layout maximizes the {vision_out['lighting_analysis']['natural_light_orientation']} daylight stream "
            f"with {len(furniture_out['furniture_nodes_3d'])} primary 3D pieces, 900mm clearance corridors, "
            f"and a 3-layer lighting plan delivering {lighting_out['photometric_targets']['total_lumens_delivered']} lumens. "
            f"Total estimated procurement is ₹{product_out['total_estimated_spend_inr']:,.0f} "
            f"(saving ₹{product_out['budget_compliance']['remaining_surplus_inr']:,.0f} under your ₹{budget:,.0f} limit), "
            f"ready for a {execution_out['total_estimated_duration_days']}-day turnkey execution."
        )

        return {
            "session_id": session_id,
            "architecture_phase": "Phase 51: Multi-Agent Interior Design System",
            "user_query": user_query,
            "executive_summary": executive_summary,
            "cascade_hierarchy": {
                "ai_assistant": {
                    "role": "Master Conversational Orchestrator",
                    "status": "completed",
                },
                "tier_1_perception_and_constraints": {
                    "vision_agent": vision_out,
                    "planning_agent": planning_out,
                    "budget_agent": budget_out,
                },
                "synthesis_layer": {
                    "design_agent": design_out,
                },
                "tier_2_specialist_subagents": {
                    "furniture_agent": furniture_out,
                    "materials_agent": materials_out,
                    "lighting_agent": lighting_out,
                },
                "downstream_commercial_and_execution": {
                    "product_agent": product_out,
                    "execution_agent": execution_out,
                },
            },
            "performance_metrics": {
                "agents_executed": 9,
                "execution_mode": "Hierarchical Asynchronous Cascade",
                "budget_compliance": product_out["budget_compliance"]["is_within_budget"],
                "traffic_circulation_compliant": furniture_out["spatial_validation"]["ergonomic_clearances_met"],
            },
        }

    async def chat_with_assistant(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Conversational assistant interface providing explainable insights on the design cascade.
        """
        msg_lower = message.lower()
        if "budget" in msg_lower or "cost" in msg_lower or "price" in msg_lower:
            reply = (
                "The Budget Agent has decomposed your interior envelope into: 20% Civil & Surfaces, "
                "35% Modular Millwork, 25% Loose Furniture, 12% Architectural Lighting, and 8% Contingency. "
                "All recommended retail products are strictly capped to ensure you stay within your limit."
            )
            responsible_agent = "BudgetAgent"
        elif "lighting" in msg_lower or "lumen" in msg_lower or "lamp" in msg_lower:
            reply = (
                "The Lighting Agent deployed a 3-Layer Lighting Architecture: 3000K recessed COB downlights "
                "for anti-glare ambient coverage, focused 3500K task lighting, and concealed 2800K perimeter cove LEDs "
                "for evening warmth."
            )
            responsible_agent = "LightingAgent"
        elif "furniture" in msg_lower or "sofa" in msg_lower or "layout" in msg_lower or "3d" in msg_lower:
            reply = (
                "The Furniture Agent positioned your seating facing the natural daylight axis while enforcing "
                "900mm primary circulation corridors and a 450mm distance between your sectional sofa and coffee table."
            )
            responsible_agent = "FurnitureAgent"
        elif "material" in msg_lower or "wood" in msg_lower or "marble" in msg_lower or "plywood" in msg_lower:
            reply = (
                "The Materials Agent specified IS:710 BWP Marine Grade Plywood for all cabinetry carcass work, "
                "natural crown-cut American Walnut veneers, large-format matte glazed vitrified tiles, and Asian Paints Royale Aspira."
            )
            responsible_agent = "MaterialsAgent"
        elif "timeline" in msg_lower or "days" in msg_lower or "execution" in msg_lower or "contractor" in msg_lower:
            reply = (
                "The Execution Agent scheduled a 54-day turnkey plan spanning 6 sequenced trade milestones: "
                "Civil Demolition -> MEP Rough-in -> False Ceiling -> Millwork Carpentry -> Painting & Lighting -> Staging & Handover."
            )
            responsible_agent = "ExecutionAgent"
        else:
            reply = (
                "HomeVerse AI Assistant coordinates 9 specialized agents: Vision perceives space, Planning organizes lifestyle zones, "
                "Budget guards costs, Design synthesizes the concept, Furniture/Materials/Lighting detail specifications, "
                "Product finds retail catalogue items, and Execution builds the turnkey construction schedule."
            )
            responsible_agent = "AIAssistant"

        return {
            "reply": reply,
            "responsible_agent": responsible_agent,
            "architecture_tier": "Phase 51 Orchestration Layer",
        }


ai_assistant = AIAssistant()
