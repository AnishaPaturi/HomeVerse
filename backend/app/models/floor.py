from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.session import Base, GUID

class Floor(Base):
    __tablename__ = "floors"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    project_id = Column(GUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    floor_number = Column(Integer, default=1)
    name = Column(String, nullable=False, default="Ground Floor")
    level_type = Column(String, default="residential")  # residential, basement, rooftop, mezzanine
    area_sqft = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="floors")
    rooms = relationship("Room", back_populates="floor", cascade="all, delete-orphan")
    floorplans = relationship("Floorplan", back_populates="floor", cascade="all, delete-orphan")
    budget_allocations = relationship("BudgetAllocation", back_populates="floor")
