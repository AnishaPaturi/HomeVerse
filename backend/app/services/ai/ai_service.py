"""
AI Service Layer
Coordinates user chat prompts, spatial copilot feedback, and AI agent execution.
"""
from typing import Dict, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.ai_interaction import AIInteraction
from app.models.project import Project
from app.schemas.ai import AIChatRequest, AIChatResponse
from app.services.ai.editing_service import EditingService
import uuid

class AIService:
    @staticmethod
    def handle_copilot_chat(db: Session, request: AIChatRequest) -> AIChatResponse:
        # Process the request with budget-aware editing service
        response = EditingService.process_modification(
            db=db,
            project_id=request.project_id,
            prompt=request.prompt,
            room_id=request.room_id,
            current_style=request.current_style or "Modern"
        )

        # Log AI interaction record
        interaction = AIInteraction(
            id=uuid.uuid4(),
            project_id=request.project_id,
            room_id=request.room_id,
            user_prompt=request.prompt,
            ai_response=response.response,
            agent_name=response.agent,
            budget_impact=response.budget_impact
        )
        db.add(interaction)
        db.commit()

        return response
