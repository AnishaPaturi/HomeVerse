from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel
from app.db.session import get_db
from app.models.product import Product as ProductModel, ShoppingItem as ShoppingItemModel

router = APIRouter()

class ShoppingItemBase(BaseModel):
    name: str
    quantity: float = 1.0
    estimated_cost: float = 0.0
    status: str = "pending"
    product_id: Optional[UUID] = None

class ShoppingItemCreate(ShoppingItemBase):
    pass

class ShoppingItemOut(ShoppingItemBase):
    id: UUID
    project_id: UUID

    class Config:
        from_attributes = True

@router.get("/projects/{project_id}/shopping", response_model=List[ShoppingItemOut])
def get_shopping_list(project_id: UUID, db: Session = Depends(get_db)):
    return db.query(ShoppingItemModel).filter(ShoppingItemModel.project_id == project_id).all()

@router.post("/projects/{project_id}/shopping", response_model=ShoppingItemOut, status_code=status.HTTP_201_CREATED)
def add_shopping_item(project_id: UUID, item_in: ShoppingItemCreate, db: Session = Depends(get_db)):
    item = ShoppingItemModel(
        project_id=project_id,
        name=item_in.name,
        quantity=item_in.quantity,
        estimated_cost=item_in.estimated_cost,
        status=item_in.status,
        product_id=item_in.product_id
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item
