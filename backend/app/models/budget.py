from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.session import Base, GUID

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    project_id = Column(GUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    total_budget = Column(Float, default=0.0)
    currency = Column(String, default="INR")
    flexibility = Column(String, default="Moderate")  # Strict, Moderate, Flexible
    spent_amount = Column(Float, default=0.0)
    estimated_amount = Column(Float, default=0.0)
    remaining_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Legacy backwards compatibility alias
    @property
    def allocated_budget(self) -> float:
        return self.total_budget - self.remaining_amount

    @allocated_budget.setter
    def allocated_budget(self, value: float) -> None:
        pass

    project = relationship("Project", back_populates="budgets")
    allocations = relationship("BudgetAllocation", back_populates="budget", cascade="all, delete-orphan")
    categories = relationship("BudgetCategory", back_populates="budget", cascade="all, delete-orphan")

class BudgetCategory(Base):
    """Legacy budget category model maintained for compatibility"""
    __tablename__ = "budget_categories"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    budget_id = Column(GUID(), ForeignKey("budgets.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False)  # furniture, civil, lighting, paint, carpentry, false_ceiling, etc.
    allocated = Column(Float, default=0.0)
    estimated = Column(Float, default=0.0)
    actual = Column(Float, default=0.0)

    budget = relationship("Budget", back_populates="categories")
