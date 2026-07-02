from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
import os
import urllib.parse
import httpx
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

@router.get("/template-image")
async def get_template_image_endpoint(
    room_type: str = "Living Room",
    style: str = "Modern",
    direction: str = "North",
    layout: str = "layout-a"
):
    """
    Generates and returns template design reference images.
    Caches the images locally to prevent broken images and speed up loads.
    """
    # Sanitize inputs for filename
    safe_room = "".join(c for c in room_type if c.isalnum() or c in " -_").replace(" ", "_")
    safe_style = "".join(c for c in style if c.isalnum() or c in " -_").replace(" ", "_")
    safe_direction = "".join(c for c in direction if c.isalnum() or c in " -_").replace(" ", "_")
    safe_layout = "".join(c for c in layout if c.isalnum() or c in " -_").replace(" ", "_")
    
    filename = f"{safe_room}_{safe_style}_{safe_direction}_{safe_layout}.jpg"
    dir_path = "static/templates"
    os.makedirs(dir_path, exist_ok=True)
    file_path = os.path.join(dir_path, filename)
    
    # Check if image already exists locally
    if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
        return FileResponse(file_path)
        
    # Generate using Pollinations AI
    # Map layout to option description or seed
    layout_suffix = "layout option A, balanced furniture setup" if layout == "layout-a" else "layout option B, cozy corner layout"
    seed = 1001 if layout == "layout-a" else 2002
    
    prompt = f"Generate an image where the room is {room_type} the style is {style} and the door of the current room is {direction} facing, {layout_suffix}"
    encoded_prompt = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=600&nologo=true&private=true&model=flux&seed={seed}"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                with open(file_path, "wb") as f:
                    f.write(response.content)
                return FileResponse(file_path)
    except Exception as e:
        print(f"Error generating template image: {e}")
        
    # Fallback redirect to pollinations directly
    return RedirectResponse(url)
