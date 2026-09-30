from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.session import Base, GUID

class SceneObject(Base):
    __tablename__ = "scene_objects"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    scene_id = Column(GUID(), ForeignKey("scenes.id", ondelete="CASCADE"), nullable=False)
    object_type = Column(String, nullable=False)  # sofa, bed, table, chair, wall, floor, door, window, etc.
    name = Column(String, nullable=True)
    
    # 3D spatial transformation
    position_x = Column(Float, default=0.0)
    position_y = Column(Float, default=0.0)
    position_z = Column(Float, default=0.0)
    rotation = Column(Float, default=0.0)
    scale = Column(Float, default=1.0)
    
    # Material & visual rendering
    material = Column(String, nullable=True)
    color = Column(String, nullable=True)
    
    # Cost & shopping linkage
    product_id = Column(GUID(), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    unit_price = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    scene = relationship("Scene", back_populates="scene_objects")
    product = relationship("Product")
