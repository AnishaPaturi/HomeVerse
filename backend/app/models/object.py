from sqlalchemy import Column, String, Float, ForeignKey, UUID
from sqlalchemy.orm import relationship
import uuid
from app.db.session import Base

class Object(Base):
    __tablename__ = "objects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    design_id = Column(UUID(as_uuid=True), ForeignKey("designs.id", ondelete="CASCADE"), nullable=False)
    object_type = Column(String, nullable=False) # e.g. "sofa", "table", "wall", "floor"
    
    # Coordinates in 3D viewport
    position_x = Column(Float, default=0.0)
    position_y = Column(Float, default=0.0)
    position_z = Column(Float, default=0.0)
    
    rotation = Column(Float, default=0.0)
    scale = Column(Float, default=1.0)
    
    # Custom attributes / materials
    material = Column(String, nullable=True) # Textures or Hex colors

    design = relationship("Design", back_populates="objects")
