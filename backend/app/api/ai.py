from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
import os
import urllib.parse
import httpx
import asyncio
from app.db.session import get_db
from app.services.ai_service import ai_service
from app.schemas.design import Design as DesignSchema

router = APIRouter()

@router.post("/analyze-upload")
async def upload_and_analyze_room(
    project_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Accepts a photo or video scan upload of a room,
    performs structural & layout analysis, and saves the file locally.
    Does NOT pre-generate styles.
    """
    if file.content_type.split("/")[0] not in ["image", "video"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image or video files are supported."
        )
    
    # Read the file bytes for validation
    file_bytes = await file.read()
    await file.seek(0)
    
    is_valid = await ai_service.validate_upload_content(
        file_bytes=file_bytes,
        filename=file.filename,
        mime_type=file.content_type or "image/jpeg"
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not appropriate data supplied to the app. The uploaded file does not appear to be an interior room, home area, or blueprint plan."
        )
    
    # Process the file using the AI service wrapper
    result = await ai_service.analyze_room_upload(
        project_id=project_id,
        file=file,
        db=db
    )
    return result

@router.post("/generate-dynamic-design", response_model=DesignSchema)
async def generate_dynamic_design_endpoint(
    project_id: UUID = Form(...),
    room_type: str = Form(...),
    style: str = Form(...),
    color_palette: str = Form(None),
    custom_prompt: str = Form(None),
    db: Session = Depends(get_db)
):
    """
    Generates a single design variation dynamically based on the user's choices.
    """
    design = await ai_service.generate_dynamic_design(
        project_id=project_id,
        room_type=room_type,
        style=style,
        color_palette=color_palette,
        custom_prompt=custom_prompt,
        db=db
    )
    return design

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

@router.post("/pre-generate-templates")
async def pre_generate_templates(
    room_type: str = Form(...)
):
    """
    Pre-generates all 40 combinations (5 styles * 4 directions * 2 layouts)
    for a chosen room type in the background concurrently.
    """
    styles = ["Modern", "Japandi", "Scandinavian", "Minimalist", "Luxury"]
    directions = ["North", "East", "West", "South"]
    layouts = ["layout-a", "layout-b"]
    
    import concurrent.futures
    
    def generate_single_combination(style: str, direction: str, layout: str):
        # Sanitize inputs for filename
        safe_room = "".join(c for c in room_type if c.isalnum() or c in " -_").replace(" ", "_")
        safe_style = "".join(c for c in style if c.isalnum() or c in " -_").replace(" ", "_")
        safe_direction = "".join(c for c in direction if c.isalnum() or c in " -_").replace(" ", "_")
        safe_layout = "".join(c for c in layout if c.isalnum() or c in " -_").replace(" ", "_")
        
        filename = f"{safe_room}_{safe_style}_{safe_direction}_{safe_layout}.jpg"
        dir_path = "static/templates"
        os.makedirs(dir_path, exist_ok=True)
        file_path = os.path.join(dir_path, filename)
        
        # Check if it already exists
        if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
            return True
            
        layout_suffix = "layout option A, balanced furniture setup" if layout == "layout-a" else "layout option B, cozy corner layout"
        seed = 1001 if layout == "layout-a" else 2002
        
        prompt = f"Generate an image where the room is {room_type} the style is {style} and the door of the current room is {direction} facing, {layout_suffix}"
        encoded_prompt = urllib.parse.quote(prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=600&nologo=true&private=true&model=flux&seed={seed}"
        
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.get(url)
                if response.status_code == 200:
                    with open(file_path, "wb") as f:
                        f.write(response.content)
                    return True
        except Exception as e:
            print(f"Error pre-generating template: {e}")
        return False

    loop = asyncio.get_event_loop()
    with concurrent.futures.ThreadPoolExecutor(max_workers=25) as executor:
        futures = []
        for style in styles:
            for direction in directions:
                for layout in layouts:
                    futures.append(
                        loop.run_in_executor(
                            executor,
                            generate_single_combination,
                            style,
                            direction,
                            layout
                        )
                    )
        await asyncio.gather(*futures)
        
    return {"status": "success", "message": f"Pre-generated combinations for {room_type}"}

from app.models.project import Project as ProjectModel
from app.models.user import User as UserModel
import json

@router.post("/generate-scratch-designs")
async def generate_scratch_designs(
    project_id: UUID = Form(...),
    room_type: str = Form(...),
    budget: str = Form(...),
    property_type: str = Form(...),
    house_details: str = Form(...),
    house_plan_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Generates 6 customized room designs in parallel representing the 6 design styles:
    Modern, Scandinavian, Modern Luxury, Japandi, Industrial, Contemporary.
    Saves them in the database under the project and returns the designs list.
    """
    # Create or update project details
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        project = ProjectModel(
            id=project_id,
            user_id=UUID("d0000000-0000-0000-0000-000000000000"),
            title=f"My {room_type} Project",
            room_type=room_type,
            thumbnail=""
        )
        db.add(project)
        db.commit()
        db.refresh(project)

    blueprint_url = None
    if house_plan_file:
        try:
            file_bytes = await house_plan_file.read()
            await house_plan_file.seek(0)
            
            # Content validation
            is_valid = await ai_service.validate_upload_content(
                file_bytes=file_bytes,
                filename=house_plan_file.filename,
                mime_type=house_plan_file.content_type or "image/jpeg"
            )
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Not appropriate data supplied to the app. The uploaded file does not appear to be an interior room, home area, or blueprint plan."
                )
            
            file_ext = house_plan_file.filename.split(".")[-1] if "." in house_plan_file.filename else "jpg"
            static_filename = f"{project_id}_blueprint.{file_ext}"
            os.makedirs("static/uploads", exist_ok=True)
            local_path = os.path.join("static", "uploads", static_filename)
            with open(local_path, "wb") as f:
                f.write(file_bytes)
            blueprint_url = f"http://localhost:8080/static/uploads/{static_filename}"
            print(f"Blueprint stored locally: {blueprint_url}")
        except HTTPException as he:
            raise he
        except Exception as e:
            print(f"Local storage blueprint save failed: {e}")
        
    try:
        analysis_data = {
            "budget": budget,
            "property_type": property_type,
            "house_details": json.loads(house_details) if house_details.startswith(("{", "[")) else house_details,
            "blueprint_url": blueprint_url
        }
        project.structural_analysis = json.dumps(analysis_data)
        project.room_type = room_type
        db.commit()
    except Exception as e:
        print(f"Error saving scratch project details: {e}")

    # Top 6 House Design Styles
    styles = ["Modern", "Scandinavian", "Modern Luxury", "Japandi", "Industrial", "Contemporary"]
    
    from app.db.session import SessionLocal

    async def run_single_style_generation(style_name: str):
        sub_db = SessionLocal()
        try:
            design = await ai_service.generate_dynamic_design(
                project_id=project_id,
                room_type=room_type,
                style=style_name,
                color_palette=None,
                custom_prompt=f"Budget: {budget}. House details: {house_details}",
                db=sub_db
            )
            return design
        finally:
            sub_db.close()

    tasks = [run_single_style_generation(style) for style in styles]
    
    try:
        designs = await asyncio.gather(*tasks)
    except Exception as e:
        print(f"Error generating scratch designs: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate scratch designs: {e}"
        )
        
    return [
        {
            "id": str(d.id),
            "style": d.style,
            "image_url": d.image_url
        } for d in designs
    ]
