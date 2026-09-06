"""
Database Models Package
Re-exports all 13 Phase 5 core domain models for Alembic migrations and SQLAlchemy metadata discovery.
"""
from app.models.user import User, UserPreference
from app.models.project import Project
from app.models.room import Room, RoomImage
from app.models.design import Design, DesignItem
from app.models.budget import Budget, BudgetCategory
from app.models.product import Product, ShoppingItem
from app.models.execution import ExecutionTask, Expense
from app.models.object import Object
from app.models.ai_usage import AIUsage
from app.models.analytics_event import AnalyticsEvent
from app.models.notification import Notification

__all__ = [
    "User",
    "UserPreference",
    "Project",
    "Room",
    "RoomImage",
    "Design",
    "DesignItem",
    "Budget",
    "BudgetCategory",
    "Product",
    "ShoppingItem",
    "ExecutionTask",
    "Expense",
    "Object",
    "AIUsage",
    "AnalyticsEvent",
    "Notification",
]

