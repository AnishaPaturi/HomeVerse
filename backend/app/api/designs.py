import uuid
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.design import Design as DesignModel
from app.models.object import Object as ObjectModel
from app.schemas.design import (
    Design as DesignSchema,
    DesignCreate,
    DesignCostSummary,
    DesignItemCreate,
    DesignItemOut,
    DesignItemUpdate,
)
from app.schemas.object import Object as ObjectSchema, ObjectCreate, ObjectUpdate
from app.services.cost_calculator import CostCalculatorService

router = APIRouter()


@router.post("/", response_model=DesignSchema, status_code=status.HTTP_201_CREATED)
def create_design(design_in: DesignCreate, db: Session = Depends(get_db)):
    d_id = design_in.id or uuid.uuid4()
    existing = db.query(DesignModel).filter(DesignModel.id == d_id).first()
    if existing:
        existing.style = design_in.style
        if design_in.image_url:
            existing.image_url = design_in.image_url
        existing.selected = design_in.selected
        if design_in.name:
            existing.name = design_in.name
        if design_in.description:
            existing.description = design_in.description
        if design_in.room_id:
            existing.room_id = design_in.room_id
        db.commit()
        db.refresh(existing)
        return existing

    design = DesignModel(
        id=d_id,
        project_id=design_in.project_id,
        style=design_in.style,
        image_url=design_in.image_url or "",
        selected=design_in.selected,
        name=design_in.name,
        description=design_in.description,
        room_id=design_in.room_id,
    )
    db.add(design)
    db.commit()
    db.refresh(design)
    return design


@router.get("/project/{project_id}", response_model=List[DesignSchema])
def list_project_designs(project_id: UUID, db: Session = Depends(get_db)):
    designs = db.query(DesignModel).filter(DesignModel.project_id == project_id).all()
    return designs


@router.get("/{design_id}", response_model=DesignSchema)
def get_design(design_id: UUID, db: Session = Depends(get_db)):
    design = db.query(DesignModel).filter(DesignModel.id == design_id).first()
    if not design:
        first_design = db.query(DesignModel).first()
        p_id = first_design.project_id if first_design else UUID("00000000-0000-0000-0000-000000000000")
        design = DesignModel(
            id=design_id,
            project_id=p_id,
            style="Modern",
            image_url="",
            selected=True,
        )
        db.add(design)
        db.commit()
        db.refresh(design)
    return design


# ==========================================================
# PHASE 15 — DESIGN COST CALCULATION ENDPOINTS
# ==========================================================

@router.get("/{design_id}/cost", response_model=DesignCostSummary)
def get_design_cost_breakdown(design_id: UUID, db: Session = Depends(get_db)):
    """
    Get full itemized cost calculation for a design:
    Formula: total_cost = quantity * unit_cost for each item,
    plus category subtotals and budget compliance.
    """
    return CostCalculatorService.get_cost_summary(db=db, design_id=design_id)


@router.get("/{design_id}/items", response_model=List[DesignItemOut])
def list_design_items(design_id: UUID, db: Session = Depends(get_db)):
    """
    List all design items belonging to a design.
    """
    summary = CostCalculatorService.get_cost_summary(db=db, design_id=design_id)
    return summary.items


@router.post("/{design_id}/items", response_model=DesignItemOut, status_code=status.HTTP_201_CREATED)
def add_design_item(design_id: UUID, item_in: DesignItemCreate, db: Session = Depends(get_db)):
    """
    Add a design item (e.g. Sofa, TV unit, Lighting, Decor).
    Computes total_cost = quantity * unit_cost and updates design estimated cost.
    """
    item = CostCalculatorService.add_item(db=db, design_id=design_id, item_in=item_in)
    return DesignItemOut.model_validate(item)


@router.put("/items/{item_id}", response_model=DesignItemOut)
def update_design_item(item_id: UUID, update_in: DesignItemUpdate, db: Session = Depends(get_db)):
    """
    Update quantity, unit_cost, name, or category for a design item.
    Re-evaluates total_cost = quantity * unit_cost and updates parent design total.
    """
    item = CostCalculatorService.update_item(db=db, item_id=item_id, update_in=update_in)
    return DesignItemOut.model_validate(item)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_design_item(item_id: UUID, db: Session = Depends(get_db)):
    """
    Remove an item from a design and recalculate design total cost.
    """
    CostCalculatorService.delete_item(db=db, item_id=item_id)
    return None


@router.post("/{design_id}/seed-sample-items", response_model=List[DesignItemOut])
def seed_sample_design_items(
    design_id: UUID,
    template: str = Query("living_room", description="Template key: living_room, bedroom, kitchen"),
    db: Session = Depends(get_db),
):
    """
    Seed initial spec design items (e.g. Sofa ₹50k, TV unit ₹30k, Lighting ₹10k, Decor ₹15k = ₹105k).
    """
    items = CostCalculatorService.seed_template_items(db=db, design_id=design_id, template_key=template)
    return [DesignItemOut.model_validate(item) for item in items]


@router.post("/{design_id}/recalculate", response_model=DesignCostSummary)
def recalculate_design_cost(design_id: UUID, db: Session = Depends(get_db)):
    """
    Recalculate and audit total costs across all items in a design.
    """
    return CostCalculatorService.get_cost_summary(db=db, design_id=design_id)


# ==========================================================
# 3D STUDIO OBJECT ENDPOINTS (Preserved)
# ==========================================================

@router.post("/{design_id}/objects", response_model=ObjectSchema, status_code=status.HTTP_201_CREATED)
def add_object_to_design(design_id: UUID, object_in: ObjectCreate, db: Session = Depends(get_db)):
    obj = ObjectModel(
        design_id=design_id,
        object_type=object_in.object_type,
        position_x=object_in.position_x,
        position_y=object_in.position_y,
        position_z=object_in.position_z,
        rotation=object_in.rotation,
        scale=object_in.scale,
        material=object_in.material,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/objects/{object_id}", response_model=ObjectSchema)
def update_object(object_id: UUID, object_in: ObjectUpdate, db: Session = Depends(get_db)):
    obj = db.query(ObjectModel).filter(ObjectModel.id == object_id).first()
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Object not found",
        )
    update_data = object_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/objects/{object_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_object(object_id: UUID, db: Session = Depends(get_db)):
    obj = db.query(ObjectModel).filter(ObjectModel.id == object_id).first()
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Object not found",
        )
    db.delete(obj)
    db.commit()
    return None
