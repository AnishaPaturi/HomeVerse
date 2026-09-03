from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.models.room import GUID

try:
    from app.db.base import Base
except ImportError:
    from backend.app.db.base import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    price = Column(Float, default=0.0)
    image_url = Column(String, nullable=True)
    product_url = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ShoppingItem(Base):
    __tablename__ = "shopping_items"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    project_id = Column(GUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(GUID(), ForeignKey("products.id", ondelete="CASCADE"), nullable=True)
    name = Column(String, nullable=False)
    quantity = Column(Float, default=1.0)
    estimated_cost = Column(Float, default=0.0)
    status = Column(String, default="pending")  # pending, ordered, delivered
    created_at = Column(DateTime, default=datetime.utcnow)
