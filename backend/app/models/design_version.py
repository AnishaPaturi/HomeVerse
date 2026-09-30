from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.session import Base, GUID

class DesignVersion(Base):
    __tablename__ = "design_versions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    design_id = Column(GUID(), ForeignKey("designs.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, default=1)
    prompt = Column(Text, nullable=True)
    changes_summary = Column(Text, nullable=True)
    estimated_cost = Column(Float, default=0.0)
    image_url = Column(String, nullable=True)
    scene_data = Column(Text, nullable=True)  # Snapshot of 3D objects & layout coordinates
    created_at = Column(DateTime, default=datetime.utcnow)

    design = relationship("Design", back_populates="versions")
