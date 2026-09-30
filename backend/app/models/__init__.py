"""
Database Models Package
Re-exports all core domain models for Alembic migrations and SQLAlchemy metadata discovery.
"""
from app.models.user import User, UserPreference
from app.models.project import Project
from app.models.floor import Floor
from app.models.room import Room, RoomImage
from app.models.floorplan import Floorplan
from app.models.design import Design, DesignItem
from app.models.design_version import DesignVersion
from app.models.scene import Scene
from app.models.scene_object import SceneObject
from app.models.ai_interaction import AIInteraction
from app.models.budget import Budget, BudgetCategory
from app.models.budget_allocation import BudgetAllocation
from app.models.product import Product, ShoppingItem
from app.models.execution import ExecutionTask, Expense
from app.models.object import Object
from app.models.ai_usage import AIUsage
from app.models.analytics_event import AnalyticsEvent
from app.models.notification import Notification
from app.models.material import Material
from app.models.marketplace import Provider, MarketplaceListing, Quotation, Contract

__all__ = [
    "User",
    "UserPreference",
    "Project",
    "Floor",
    "Room",
    "RoomImage",
    "Floorplan",
    "Design",
    "DesignItem",
    "DesignVersion",
    "Scene",
    "SceneObject",
    "AIInteraction",
    "Budget",
    "BudgetCategory",
    "BudgetAllocation",
    "Product",
    "ShoppingItem",
    "ExecutionTask",
    "Expense",
    "Object",
    "AIUsage",
    "AnalyticsEvent",
    "Notification",
    "Material",
    "Provider",
    "MarketplaceListing",
    "Quotation",
    "Contract",
]
