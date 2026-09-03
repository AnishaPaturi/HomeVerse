"""
Shopping Service Layer
Handles shopping lists, catalog products, and fulfillment status.
"""
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.product import ShoppingItem

class ShoppingService:
    @staticmethod
    def get_shopping_items(db: Session, project_id: UUID) -> List[ShoppingItem]:
        return db.query(ShoppingItem).filter(ShoppingItem.project_id == project_id).all()
