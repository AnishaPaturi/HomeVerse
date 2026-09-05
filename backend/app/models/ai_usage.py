"""
AI Usage and Cost Tracking Model (Phase 44)
Tracks tokens, image counts, operations, and estimated USD cost per user generation.
"""
from datetime import datetime
import uuid
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.db.session import Base, GUID


class AIUsage(Base):
    __tablename__ = "ai_usage"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    generation_id = Column(String(128), nullable=True, index=True)
    operation = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    input_tokens = Column(Integer, default=0, nullable=False)
    output_tokens = Column(Integer, default=0, nullable=False)
    image_count = Column(Integer, default=0, nullable=False)
    cost = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="ai_usages")
