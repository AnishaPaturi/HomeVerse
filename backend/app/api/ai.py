from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.db.session import get_db
from app.services.ai_service import ai_service
from app.schemas.design import Design as DesignSchema

router = APIRouter()

@router.post("/analyze-upload", response_model=List[DesignSchema])
async def upload_and_analyze_room(
    project_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Accepts a photo or video scan upload of a room,
    performs object detection and segmentation,
    and returns 5 generated design variations.
    """
    if file.content_type.split("/")[0] not in ["image", "video"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image or video files are supported."
        )
    
    # Check if the file represents a room or interior area
    filename_lower = file.filename.lower()
    non_room_keywords = [
        "cat", "dog", "animal", "car", "vehicle", "apple", "banana", "fruit", 
        "outdoor", "outside", "landscape", "nature", "forest", "mountain", 
        "ocean", "beach", "sky", "garden", "park", "street", "exterior",
        "cityscape", "food"
    ]
    is_room = True
    for kw in non_room_keywords:
        if kw in filename_lower:
            is_room = False
            break
            
    if not is_room:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not appropriate data supplied to the app. The uploaded file does not appear to be an interior room or home area."
        )
    
    # Process the file using the AI service wrapper
    designs = await ai_service.analyze_and_generate_styles(
        project_id=project_id,
        file=file,
        db=db
    )
    return designs

@router.post("/copilot-chat")
async def copilot_chat(
    design_id: UUID = Form(...),
    message: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Interacts with the AI Design Copilot to update the 3D scene elements.
    """
    response = await ai_service.process_copilot_command(
        design_id=design_id,
        message=message,
        db=db
    )
    return response
