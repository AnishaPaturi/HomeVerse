from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.db.session import get_db
from app.models.design import Design as DesignModel
from app.models.object import Object as ObjectModel
from app.schemas.design import Design as DesignSchema, DesignCreate
from app.schemas.object import Object as ObjectSchema, ObjectCreate, ObjectUpdate

router = APIRouter()

@router.post("/", response_model=DesignSchema, status_code=status.HTTP_201_CREATED)
def create_design(design_in: DesignCreate, db: Session = Depends(get_db)):
    design = DesignModel(
        project_id=design_in.project_id,
        style=design_in.style,
        image_url=design_in.image_url,
        selected=design_in.selected,
    )
    db.add(design)
    db.commit()
    db.refresh(design)
    return design

@router.get("/project/{project_id}", response_model=List[DesignSchema])
def list_project_designs(project_id: UUID, db: Session = Depends(get_db)):
    designs = db.query(DesignModel).filter(DesignModel.project_id == project_id).all()
    return designs

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
