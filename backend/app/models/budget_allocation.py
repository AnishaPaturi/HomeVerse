from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.session import Base, GUID

class BudgetAllocation(Base):
    __tablename__ = "budget_allocations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    budget_id = Column(GUID(), ForeignKey("budgets.id", ondelete="CASCADE"), nullable=False)
    floor_id = Column(GUID(), ForeignKey("floors.id", ondelete="SET NULL"), nullable=True)
    room_id = Column(GUID(), ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True)
    
    # Categories: Furniture, Lighting, Flooring, Walls, Ceiling, Materials, Decor, Electrical, Other
    category = Column(String, nullable=False, default="Furniture")
    allocated_amount = Column(Float, default=0.0)
    estimated_amount = Column(Float, default=0.0)
    actual_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    budget = relationship("Budget", back_populates="allocations")
    floor = relationship("Floor", back_populates="budget_allocations")
    room = relationship("Room", back_populates="budget_allocations")
