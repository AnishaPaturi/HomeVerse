from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.session import Base, GUID

class Project(Base):
    __tablename__ = "projects"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Phase 5 canonical fields
    name = Column(String, nullable=True)
    property_type = Column(String, default="apartment")
    bhk = Column(Integer, nullable=True)
    area_sqft = Column(Float, nullable=True)
    budget = Column(Float, nullable=True)
    currency = Column(String, default="INR")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Backwards compatibility fields
    title = Column(String, nullable=True)
    room_type = Column(String, nullable=True)
    thumbnail = Column(String, nullable=True)
    structural_analysis = Column(String, nullable=True)

    user = relationship("User", back_populates="projects")
    designs = relationship("Design", back_populates="project", cascade="all, delete-orphan")
    rooms = relationship("Room", back_populates="project", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="project", cascade="all, delete-orphan")
    shopping_items = relationship("ShoppingItem", back_populates="project", cascade="all, delete-orphan")
    execution_tasks = relationship("ExecutionTask", back_populates="project", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="project", cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        if "name" in kwargs and "title" not in kwargs:
            kwargs["title"] = kwargs["name"]
        elif "title" in kwargs and "name" not in kwargs:
            kwargs["name"] = kwargs["title"]
        super().__init__(**kwargs)
