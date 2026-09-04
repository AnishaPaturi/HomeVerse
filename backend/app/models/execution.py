from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.models.room import GUID

try:
    from app.db.base import Base
except ImportError:
    from backend.app.db.base import Base

class ExecutionTask(Base):
    __tablename__ = "execution_tasks"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    project_id = Column(GUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="todo")  # todo, in_progress, completed
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    estimated_cost = Column(Float, default=0.0)
    actual_cost = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="execution_tasks")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    project_id = Column(GUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=True)
    amount = Column(Float, default=0.0)
    date = Column(DateTime, default=datetime.utcnow)
    receipt_url = Column(String, nullable=True)

    project = relationship("Project", back_populates="expenses")
