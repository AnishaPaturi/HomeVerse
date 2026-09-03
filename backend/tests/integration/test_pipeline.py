"""
Integration Tests for AI Pipeline
"""
import pytest
from app.ai.orchestrator import AIOrchestrator

@pytest.mark.asyncio
async def test_orchestrator_flow():
    orchestrator = AIOrchestrator()
    res = await orchestrator.generate_room_concept(
        project_id="test-proj",
        room_data={"room_type": "Living Room", "area": 250},
        preferences={"style": "Modern Minimalist"}
    )
    assert res["status"] == "completed"
    assert "recommendations" in res
