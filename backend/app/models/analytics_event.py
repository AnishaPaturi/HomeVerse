"""
Product Analytics Event Model (Phase 45)
Tracks high-level business and product telemetry:
- user_registered
- project_created
- room_created
- style_selected
- design_generated
- design_selected
- budget_optimized
- product_added
- shopping_item_ordered
- execution_started
- project_completed
"""
from datetime import datetime
from typing import Any, Dict
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import relationship

from app.db.session import Base, GUID


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    session_id = Column(String(128), nullable=True, index=True)
    event_name = Column(String(100), nullable=False, index=True)
    properties = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="analytics_events")

    def __repr__(self) -> str:
        return f"<AnalyticsEvent(id={self.id}, event_name='{self.event_name}', user_id={self.user_id})>"
