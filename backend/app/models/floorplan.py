from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.session import Base, GUID

class Floorplan(Base):
    __tablename__ = "floorplans"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    project_id = Column(GUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    floor_id = Column(GUID(), ForeignKey("floors.id", ondelete="SET NULL"), nullable=True)
    image_url = Column(String, nullable=False)
    dimensions_data = Column(Text, nullable=True)  # JSON structure containing walls, doors, windows, scale
    detected_rooms = Column(Text, nullable=True)   # JSON structure of detected room geometries and labels
    scale = Column(Float, default=1.0)             # Scale in px/meter
    status = Column(String, default="uploaded")    # uploaded, analyzing, analyzed, confirmed, corrected
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="floorplans")
    floor = relationship("Floor", back_populates="floorplans")
