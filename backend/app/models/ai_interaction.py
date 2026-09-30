from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.session import Base, GUID

class AIInteraction(Base):
    __tablename__ = "ai_interactions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    project_id = Column(GUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    room_id = Column(GUID(), ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True)
    user_prompt = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    agent_name = Column(String, default="CopilotAgent")  # BudgetAgent, DesignAgent, CriticAgent, etc.
    budget_impact = Column(Float, default=0.0)           # Estimated delta cost in project currency (+/-)
    suggested_changes = Column(Text, nullable=True)      # JSON string of suggested modifications & cheaper alternatives
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="ai_interactions")
    room = relationship("Room", back_populates="ai_interactions")
