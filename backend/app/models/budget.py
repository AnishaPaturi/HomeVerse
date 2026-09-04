from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.models.room import GUID

try:
    from app.db.base import Base
except ImportError:
    from backend.app.db.base import Base

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    project_id = Column(GUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    total_budget = Column(Float, default=0.0)
    allocated_budget = Column(Float, default=0.0)
    spent_amount = Column(Float, default=0.0)
    remaining_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="budgets")
    categories = relationship("BudgetCategory", back_populates="budget", cascade="all, delete-orphan")

class BudgetCategory(Base):
    __tablename__ = "budget_categories"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    budget_id = Column(GUID(), ForeignKey("budgets.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False)  # furniture, civil, lighting, paint, carpentry, false_ceiling, etc.
    allocated = Column(Float, default=0.0)
    estimated = Column(Float, default=0.0)
    actual = Column(Float, default=0.0)

    budget = relationship("Budget", back_populates="categories")
