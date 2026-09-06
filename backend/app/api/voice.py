"""
HomeVerse Voice Assistant API (Phase 49 - Version 3)
- Natural Language Voice Command comprehension
- Intent classification: Wall colors, flooring, camera viewpoints, budget inquiries, execution tracking
- Action payload synthesis for real-time 3D and canvas execution
- Audio response text formatted for Text-to-Speech (TTS) synthesis
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.project import Project as ProjectModel

router = APIRouter()

class VoiceCommandRequest(BaseModel):
    transcript: str
    project_id: Optional[UUID] = None
    room_id: Optional[UUID] = None
    context: Optional[Dict[str, Any]] = None

class VoiceActionChip(BaseModel):
    label: str
    action: str
    target_url: Optional[str] = None

class VoiceCommandResponse(BaseModel):
    transcript_received: str
    voice_reply: str
    action_type: str
    action_payload: Dict[str, Any]
    action_chips: List[VoiceActionChip]
    success: bool = True


@router.post("/command", response_model=VoiceCommandResponse)
def process_voice_command(req: VoiceCommandRequest, db: Session = Depends(get_db)):
    """
    Phase 49: Voice Assistant.
    Parses spoken voice transcripts, executes real-time room modifications, and synthesizes spoken guidance.
    """
    text = req.transcript.strip()
    text_lower = text.lower()

    proj_url_prefix = f"/project/{req.project_id}" if req.project_id else "/dashboard"

    # 1. Intent: Change Wall Color
    if any(k in text_lower for k in ["wall", "paint", "color", "colour"]):
        color_hex = "#D8D0C5"
        color_name = "Designer Warm Greige"
        if "greige" in text_lower or "warm" in text_lower:
            color_hex = "#D8D0C5"
            color_name = "Designer Warm Greige"
        elif "charcoal" in text_lower or "dark" in text_lower or "black" in text_lower:
            color_hex = "#2C302E"
            color_name = "Studio Charcoal Accent"
        elif "white" in text_lower or "alabaster" in text_lower:
            color_hex = "#EDEAE0"
            color_name = "Alabaster Architectural White"
        elif "sage" in text_lower or "green" in text_lower:
            color_hex = "#B2BCA2"
            color_name = "Muted Sage Mineral"
        elif "navy" in text_lower or "blue" in text_lower:
            color_hex = "#1E293B"
            color_name = "Deep Midnight Navy"

        reply = f"Applying {color_name} to the living room walls in your 3D view."
        return VoiceCommandResponse(
            transcript_received=text,
            voice_reply=reply,
            action_type="change_wall_color",
            action_payload={"color_hex": color_hex, "color_name": color_name},
            action_chips=[
                VoiceActionChip(label="Preview in 3D", action="preview_3d"),
                VoiceActionChip(label="Compare Finishes", action="materials", target_url="/catalogue"),
            ],
        )

    # 2. Intent: Camera Viewpoint Navigation & Floor Plan View
    elif any(k in text_lower for k in ["view", "camera", "top-down", "walkthrough", "isometric", "perspective", "floor plan", "blueprint"]):
        view_type = "isometric"
        if "top" in text_lower or "down" in text_lower or "plan" in text_lower:
            view_type = "top_down"
            reply = "Switching to top-down architectural blueprint view."
        elif "walk" in text_lower or "first" in text_lower or "person" in text_lower:
            view_type = "walkthrough"
            reply = "Entering first-person walkthrough perspective."
        else:
            view_type = "isometric"
            reply = "Orienting camera to 3D isometric overview."

        return VoiceCommandResponse(
            transcript_received=text,
            voice_reply=reply,
            action_type="switch_camera_view",
            action_payload={"view_type": view_type},
            action_chips=[
                VoiceActionChip(label="Reset Camera", action="reset_camera"),
                VoiceActionChip(label="View in AR", action="view_ar"),
            ],
        )

    # 3. Intent: Change Flooring Material
    elif any(k in text_lower for k in ["flooring", "marble", "tile", "wood floor", "hardwood", "oak", "terrazzo"]) or ("floor" in text_lower and "plan" not in text_lower):
        material_name = "European White Oak Herringbone"
        cost_impact = 0.0
        if "marble" in text_lower:
            material_name = "Italian Statuario Marble Slabs"
            cost_impact = 90720.0
            reply = "Switching flooring to Italian Statuario Marble. This adds approximately ₹90,000 for a 280 square foot area."
        elif "tile" in text_lower or "vitrified" in text_lower:
            material_name = "Large-Format Glazed Vitrified Tiles"
            cost_impact = -35000.0
            reply = "Swapping flooring to Glazed Vitrified Tiles. This saves ₹35,000 and provides zero stain porosity."
        elif "terrazzo" in text_lower:
            material_name = "Venetian Terrazzo"
            cost_impact = -15000.0
            reply = "Updating floor to Venetian Terrazzo with satin polished hone finish."
        else:
            material_name = "European White Oak (Herringbone)"
            reply = "Updating flooring to natural European White Oak in a herringbone layout."

        return VoiceCommandResponse(
            transcript_received=text,
            voice_reply=reply,
            action_type="change_flooring",
            action_payload={"flooring_material": material_name, "cost_impact": cost_impact},
            action_chips=[
                VoiceActionChip(label="Simulate Cost Impact", action="cost_impact", target_url=f"{proj_url_prefix}/budget"),
                VoiceActionChip(label="Material Specs", action="materials", target_url="/catalogue"),
            ],
        )

    # 4. Intent: Budget & Financial Query
    elif any(k in text_lower for k in ["budget", "cost", "spend", "remaining", "contingency", "save", "money"]):
        reply = (
            "Your project budget is ₹8.00L. Actual expenses logged so far total ₹5.20L across civil, electrical, "
            "and kitchen advances, leaving an active contingency cushion of ₹2.80L."
        )
        return VoiceCommandResponse(
            transcript_received=text,
            voice_reply=reply,
            action_type="budget_query",
            action_payload={"target_budget": 800000.0, "actual_cost": 520000.0, "remaining_buffer": 280000.0},
            action_chips=[
                VoiceActionChip(label="Open Budget Manager", action="budget", target_url=f"{proj_url_prefix}/budget"),
                VoiceActionChip(label="View Expense Table", action="expenses", target_url=f"{proj_url_prefix}/execution"),
            ],
        )

    # 5. Intent: Execution Timeline Query
    elif any(k in text_lower for k in ["timeline", "milestone", "schedule", "progress", "civil", "electrical", "finish", "completion", "deadline", "duration"]):
        reply = (
            "You are at Stage 4 of 10. Civil demolition and site measurement are complete. Electrical rough-ins "
            "and wall surface prep are currently in progress."
        )
        return VoiceCommandResponse(
            transcript_received=text,
            voice_reply=reply,
            action_type="timeline_query",
            action_payload={"current_stage": 4, "total_stages": 10, "progress_percentage": 50.0},
            action_chips=[
                VoiceActionChip(label="Track Timeline Milestones", action="execution", target_url=f"{proj_url_prefix}/execution"),
            ],
        )

    # 6. Default General Command / AI Copilot fallback
    else:
        reply = (
            f"I heard: '{text}'. I can update wall colors, swap flooring materials, re-orient camera views, "
            f"or summarize your ₹8.0L budget status. What would you like to adjust?"
        )
        return VoiceCommandResponse(
            transcript_received=text,
            voice_reply=reply,
            action_type="general_query",
            action_payload={"query": text},
            action_chips=[
                VoiceActionChip(label="Try: 'Make walls warm greige'", action="prompt_sample"),
                VoiceActionChip(label="Try: 'Switch flooring to oak'", action="prompt_sample"),
                VoiceActionChip(label="Try: 'What is our remaining budget?'", action="prompt_sample"),
            ],
        )
