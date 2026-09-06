"""
HomeVerse Shopping List & Procurement API (Phase 19 & 48)
- Itemized procurement registry
- Status lifecycles: Wishlist -> Selected -> Ordered -> Delivered -> Installed
- Total shopping cost aggregations
- Alternative product swaps
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.product import Product as ProductModel, ShoppingItem as ShoppingItemModel
from app.models.project import Project as ProjectModel

router = APIRouter()

class ShoppingItemBase(BaseModel):
    name: str
    quantity: float = 1.0
    estimated_cost: float = 0.0
    status: str = "Selected"  # Wishlist, Selected, Ordered, Delivered, Installed
    product_id: Optional[UUID] = None

class ShoppingItemCreate(ShoppingItemBase):
    pass

class ShoppingItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    estimated_cost: Optional[float] = None
    status: Optional[str] = None
    product_id: Optional[UUID] = None

class ShoppingItemOut(ShoppingItemBase):
    id: UUID
    project_id: UUID
    product_details: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

class ShoppingSummaryOut(BaseModel):
    project_id: UUID
    total_items: int
    total_shopping_cost: float
    status_breakdown: Dict[str, int]
    items: List[ShoppingItemOut]

CANONICAL_DEFAULT_ITEMS = [
    {"name": "L-Shape Modular Sectional Sofa in Oatmeal Boucle", "quantity": 1.0, "estimated_cost": 85000.0, "status": "Delivered"},
    {"name": "Solid Walnut Low Profile Coffee Table", "quantity": 1.0, "estimated_cost": 24000.0, "status": "Delivered"},
    {"name": "Floating TV Console with Acoustic Fluted Slats", "quantity": 1.0, "estimated_cost": 48000.0, "status": "Ordered"},
    {"name": "Dimmable Architectural Floor Lamp", "quantity": 2.0, "estimated_cost": 32000.0, "status": "Delivered"},
    {"name": "Textured Handwoven Wool Area Rug (8x10)", "quantity": 1.0, "estimated_cost": 32000.0, "status": "Delivered"},
    {"name": "Linen Full-Length Window Drapes", "quantity": 2.0, "estimated_cost": 18000.0, "status": "Delivered"},
]

def seed_project_shopping_if_empty(project_id: UUID, db: Session):
    existing = db.query(ShoppingItemModel).filter(ShoppingItemModel.project_id == project_id).count()
    if existing == 0:
        for item in CANONICAL_DEFAULT_ITEMS:
            record = ShoppingItemModel(
                project_id=project_id,
                name=item["name"],
                quantity=item["quantity"],
                estimated_cost=item["estimated_cost"],
                status=item["status"],
            )
            db.add(record)
        db.commit()


@router.get("/projects/{project_id}/shopping", response_model=List[ShoppingItemOut])
def get_shopping_list(project_id: UUID, db: Session = Depends(get_db)):
    """Retrieves all shopping list items for a given project."""
    seed_project_shopping_if_empty(project_id, db)
    items = db.query(ShoppingItemModel).filter(ShoppingItemModel.project_id == project_id).all()
    results = []
    for it in items:
        p_data = None
        if it.product:
            p_data = {
                "name": it.product.name,
                "category": it.product.category,
                "price": it.product.price,
                "image_url": it.product.image_url,
                "brand": it.product.brand,
            }
        out = ShoppingItemOut(
            id=it.id,
            project_id=it.project_id,
            name=it.name,
            quantity=it.quantity or 1.0,
            estimated_cost=it.estimated_cost or 0.0,
            status=it.status or "Selected",
            product_id=it.product_id,
            product_details=p_data,
        )
        results.append(out)
    return results


@router.get("/projects/{project_id}/shopping/summary", response_model=ShoppingSummaryOut)
def get_shopping_summary(project_id: UUID, db: Session = Depends(get_db)):
    """
    Computes total shopping cost, item counts, and status breakdowns (Wishlist, Selected, Ordered, Delivered, Installed).
    """
    seed_project_shopping_if_empty(project_id, db)
    items = get_shopping_list(project_id, db)

    total_cost = sum(it.estimated_cost for it in items)
    status_map: Dict[str, int] = {}
    for it in items:
        st = str(it.status).capitalize()
        status_map[st] = status_map.get(st, 0) + 1

    return ShoppingSummaryOut(
        project_id=project_id,
        total_items=len(items),
        total_shopping_cost=round(total_cost, 2),
        status_breakdown=status_map,
        items=items,
    )


@router.post("/projects/{project_id}/shopping", response_model=ShoppingItemOut, status_code=status.HTTP_201_CREATED)
def add_shopping_item(project_id: UUID, item_in: ShoppingItemCreate, db: Session = Depends(get_db)):
    """Adds a new item to the project's shopping list."""
    item = ShoppingItemModel(
        project_id=project_id,
        name=item_in.name,
        quantity=item_in.quantity,
        estimated_cost=item_in.estimated_cost,
        status=item_in.status,
        product_id=item_in.product_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    # Track Product Analytics (Phase 45/48)
    try:
        from app.core.analytics import track_event
        proj = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
        track_event(
            db=db,
            event_name="product_added",
            user_id=proj.user_id if proj else None,
            properties={
                "item_id": str(item.id),
                "project_id": str(project_id),
                "name": item.name,
                "cost": item.estimated_cost,
            },
        )
    except Exception:
        pass

    return item


@router.put("/shopping/{item_id}", response_model=ShoppingItemOut)
def update_shopping_item(item_id: UUID, item_in: ShoppingItemUpdate, db: Session = Depends(get_db)):
    """Updates quantity, cost, or status of an existing shopping item."""
    item = db.query(ShoppingItemModel).filter(ShoppingItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shopping item not found")

    old_status = item.status
    update_data = item_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(item, field, val)

    db.commit()
    db.refresh(item)

    # Track order analytics if status changed to Ordered
    if item.status and str(item.status).lower() == "ordered" and str(old_status).lower() != "ordered":
        try:
            from app.core.analytics import track_event
            proj = db.query(ProjectModel).filter(ProjectModel.id == item.project_id).first()
            track_event(
                db=db,
                event_name="shopping_item_ordered",
                user_id=proj.user_id if proj else None,
                properties={
                    "item_id": str(item.id),
                    "project_id": str(item.project_id),
                    "name": item.name,
                    "order_total": item.estimated_cost,
                },
            )
        except Exception:
            pass

    return item


@router.delete("/shopping/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shopping_item(item_id: UUID, db: Session = Depends(get_db)):
    """Removes an item from the shopping registry."""
    item = db.query(ShoppingItemModel).filter(ShoppingItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shopping item not found")
    db.delete(item)
    db.commit()
    return None


@router.post("/shopping/{item_id}/swap", response_model=ShoppingItemOut)
def swap_shopping_item_with_alternative(
    item_id: UUID,
    alternative_product_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Phase 18 & 48: Swaps a shopping item with a selected product alternative,
    updating cost and name seamlessly.
    """
    item = db.query(ShoppingItemModel).filter(ShoppingItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shopping item not found")

    alt_product = db.query(ProductModel).filter(ProductModel.id == alternative_product_id).first()
    if not alt_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alternative product not found")

    # Update item
    item.name = alt_product.name
    item.estimated_cost = alt_product.price * (item.quantity or 1.0)
    item.product_id = alt_product.id

    db.commit()
    db.refresh(item)
    return item
