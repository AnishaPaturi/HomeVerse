from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.models.room import GUID

try:
    from app.db.base import Base
except ImportError:
    from backend.app.db.base import Base

class Design(Base):
    __tablename__ = "designs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    project_id = Column(GUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    room_id = Column(GUID(), ForeignKey("rooms.id", ondelete="CASCADE"), nullable=True)
    
    # Phase 5 canonical fields
    name = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    style = Column(String, nullable=False)
    estimated_cost = Column(Float, default=0.0)
    image_url = Column(String, nullable=True)
    status = Column(String, default="generated")
    created_at = Column(DateTime, default=datetime.utcnow)

    # 3D Studio & Panorama compatibility fields
    selected = Column(Boolean, default=False)
    direction = Column(String, nullable=True)
    layout_variant = Column(String, nullable=True)
    image_url_left = Column(String, nullable=True)
    image_url_right = Column(String, nullable=True)
    image_url_back = Column(String, nullable=True)
    image_url_front = Column(String, nullable=True)

    project = relationship("Project", back_populates="designs")
    room = relationship("Room", back_populates="designs")
    objects = relationship("Object", back_populates="design", cascade="all, delete-orphan")
    items = relationship("DesignItem", back_populates="design", cascade="all, delete-orphan")

class DesignItem(Base):
    __tablename__ = "design_items"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    design_id = Column(GUID(), ForeignKey("designs.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    quantity = Column(Float, default=1.0)
    unit_cost = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    product_id = Column(GUID(), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    design = relationship("Design", back_populates="items")
    product = relationship("Product")
