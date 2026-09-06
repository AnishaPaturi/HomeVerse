"""
Material Domain Model (Phase 49 - Version 3)
Defines physically based rendering (PBR) materials, textures, and physical attributes.
"""

from sqlalchemy import Column, String, Float, DateTime, Text
import uuid
from datetime import datetime
from app.db.session import Base, GUID

class Material(Base):
    __tablename__ = "materials"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)  # wood, stone, fabric, metal, paint, glass
    code = Column(String, nullable=True, unique=True)
    albedo_color = Column(String, default="#FFFFFF")
    roughness = Column(Float, default=0.5)
    metalness = Column(Float, default=0.0)
    normal_scale = Column(Float, default=1.0)
    cost_per_sqft = Column(Float, default=0.0)
    texture_url = Column(String, nullable=True)
    durability_rating = Column(Float, default=4.5)
    maintenance_score = Column(Float, default=4.0)
    eco_rating = Column(String, default="A")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
