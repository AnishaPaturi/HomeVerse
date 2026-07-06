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

@router.post("/create-house-model")
async def create_house_model(
    project_id: UUID = Form(...),
    property_type: str = Form(...),
    budget: str = Form(...),
    house_details: str = Form(...),
    house_plan_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Validates user inputs, processes blueprint upload if present,
    creates the master House Model JSON via LayoutEngine, and saves it in the project.
    """
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        project = ProjectModel(
            id=project_id,
            user_id=UUID("d0000000-0000-0000-0000-000000000000"),
            title=f"My {property_type.capitalize()} Project",
            room_type="Hall",
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
                    detail="Not appropriate data supplied to the app. The uploaded file does not appear to be a blueprint or room photo."
                )
            
            file_ext = house_plan_file.filename.split(".")[-1] if "." in house_plan_file.filename else "jpg"
            static_filename = f"{project_id}_blueprint.{file_ext}"
            os.makedirs("static/uploads", exist_ok=True)
            local_path = os.path.join("static", "uploads", static_filename)
            with open(local_path, "wb") as f:
                f.write(file_bytes)
            blueprint_url = f"http://localhost:8080/static/uploads/{static_filename}"
        except HTTPException as he:
            raise he
        except Exception as e:
            print(f"Error saving blueprint: {e}")

    try:
        details_dict = json.loads(house_details)
    except Exception:
        details_dict = {}

    # Call layout engine to create master JSON
    from app.services.layout_engine import layout_engine
    master_json = await layout_engine.validate_and_create_house_json(
        property_type=property_type,
        budget=budget,
        house_details=details_dict,
        blueprint_url=blueprint_url
    )

    project.structural_analysis = json.dumps(master_json)
    db.commit()
    db.refresh(project)

    return master_json

@router.post("/generate-scratch-designs")
async def generate_scratch_designs(
    project_id: UUID = Form(...),
    room_type: str = Form(...),
    budget: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Generates 6 customized room designs in parallel representing the 6 design styles:
    Modern, Scandinavian, Modern Luxury, Japandi, Industrial, Contemporary.
    Reads from the project's Master House Model JSON, locks the 3D layout coordinates,
    maps style-specific materials, and renders them via Pollinations AI.
    """
    from app.models.design import Design as DesignModel
    from app.models.object import Object as ObjectModel
    from app.services.layout_engine import layout_engine

    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.structural_analysis:
        raise HTTPException(status_code=400, detail="House model not found. Please create the house model first.")

    try:
        house_model = json.loads(project.structural_analysis)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse house model: {e}")

    # Step 1: Generate one common room layout (locked coordinate layout)
    try:
        common_layout = await layout_engine.generate_common_layout(
            house_model=house_model,
            room_type=room_type,
            budget=budget
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate layout: {e}")

    # Top 6 House Design Styles
    styles = ["Modern", "Scandinavian", "Modern Luxury", "Japandi", "Industrial", "Contemporary"]

    # Style Rules Text
    STYLE_RULES = {
        "Modern": "White, Grey, Wood, Minimal, Straight Lines, Glass. Sleek minimalist furniture.",
        "Scandinavian": "Oak, White, Plants, Soft Lighting, Fabric, Light Flooring. Warm, functional and natural.",
        "Modern Luxury": "Marble, Gold, Wood Veneer, Ambient Lighting, Large Furniture, Premium Decor. Rich and sophisticated finishes.",
        "Japandi": "Light Wood, Beige, Minimal, Natural Materials, Paper Lamps, Plants. Fusion of Japanese and Nordic minimalism.",
        "Industrial": "Concrete, Brick, Black Metal, Leather, Dark Wood. Raw elements, urban loft style.",
        "Contemporary": "Curved Furniture, Neutral Palette, Statement Lighting, Latest Trends. Bold and comfort-focused."
    }

    # Style Materials mapping table
    STYLE_MATERIALS = {
        "Modern": {"floor": "wood_light", "wall": "#e5e7eb", "sofa": "leather_black", "table": "glass", "cabinet": "wood_dark", "curtains": "#fafafa", "accent": "#9ca3af", "bed": "fabric_grey", "metal": "black_metal"},
        "Scandinavian": {"floor": "wood_light", "wall": "#ffffff", "sofa": "fabric_grey", "table": "wood_light", "cabinet": "wood_light", "curtains": "#fafafa", "accent": "#10b981", "bed": "fabric_grey", "metal": "wood_light"},
        "Modern Luxury": {"floor": "marble", "wall": "wood_dark", "sofa": "leather_brown", "table": "marble", "cabinet": "wood_dark", "curtains": "#1e293b", "accent": "gold", "bed": "leather_brown", "metal": "gold"},
        "Japandi": {"floor": "wood_light", "wall": "#f5f5f4", "sofa": "#e7e5e4", "table": "wood_light", "cabinet": "wood_light", "curtains": "#f5f5f4", "accent": "#0f766e", "bed": "fabric_grey", "metal": "wood_light"},
        "Industrial": {"floor": "concrete", "wall": "brick", "sofa": "leather_black", "table": "wood_dark", "cabinet": "black_metal", "curtains": "#4b5563", "accent": "black_metal", "bed": "leather_black", "metal": "black_metal"},
        "Contemporary": {"floor": "wood_dark", "wall": "#f3f4f6", "sofa": "#6b7280", "table": "glass", "cabinet": "wood_dark", "curtains": "#cbd5e1", "accent": "gold", "bed": "fabric_grey", "metal": "black_metal"}
    }

    def map_generic_to_style_material(generic_material: str, style_name: str) -> str:
        mapping = STYLE_MATERIALS.get(style_name, STYLE_MATERIALS["Modern"])
        mat_lower = generic_material.lower()
        if "floor" in mat_lower:
            return mapping["floor"]
        elif "wall" in mat_lower:
            return mapping["wall"]
        elif "sofa" in mat_lower:
            return mapping["sofa"]
        elif "table" in mat_lower or "coffee" in mat_lower:
            return mapping["table"]
        elif "cabinet" in mat_lower or "wardrobe" in mat_lower or "sideboard" in mat_lower:
            return mapping["cabinet"]
        elif "curtain" in mat_lower or "blind" in mat_lower:
            return mapping["curtains"]
        elif "metal" in mat_lower:
            return mapping["metal"]
        elif "bed" in mat_lower:
            return mapping["bed"]
        return mapping.get("accent", generic_material)

    from app.db.session import SessionLocal
    import httpx
    import urllib.parse
    import os

    async def run_single_style_generation(style_name: str):
        sub_db = SessionLocal()
        try:
            # Create a Design Model
            design = DesignModel(
                project_id=project_id,
                style=style_name,
                image_url=""
            )
            sub_db.add(design)
            sub_db.commit()
            sub_db.refresh(design)

            # Build style prompt using prompt builder
            layout_desc = common_layout.get("layout_description", "")
            main_door = house_model.get("mainDoor", "North")
            kitchen_dir = house_model.get("kitchen", "East")
            
            budget_influence = f"The design fits a budget of {budget}. It has styling and materials corresponding to this budget level."
            image_prompt = f"""Wide-angle professional architectural photo of a {room_type} in {style_name} style.
Layout & Furniture: {layout_desc}.
Style elements: {STYLE_RULES.get(style_name, '')} {budget_influence}
Composition:
- Camera is positioned at the entrance door threshold (main door faces {main_door}), looking straight into the room.
- Part of the open entrance door frame/jamb is visible in the foreground on the left edge of the frame to frame the view.
- Warm ambient lighting, soft shadows, photorealistic rendering.
- High-resolution, ultra realistic 4K architectural visualization, no people, no text."""

            # Clean prompt to remove newlines for web safety
            clean_prompt = " ".join(image_prompt.splitlines())
            encoded_prompt = urllib.parse.quote(clean_prompt)
            # Use style specific seed
            seed = abs(hash(f"{style_name}-{project_id}")) % 100000
            pollinations_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=600&nologo=true&private=true&model=flux&seed={seed}"
            
            # Save remote URL as primary to bypass local port/network binding limits in user browser
            design.image_url = pollinations_url
            sub_db.commit()

            # Save objects list with locked coordinates but style specific materials
            objects = common_layout.get("objects", [])
            for obj_info in objects:
                # Apply style material mapping
                generic_mat = obj_info.get("material", "wood_base")
                style_mat = map_generic_to_style_material(generic_mat, style_name)
                
                obj = ObjectModel(
                    design_id=design.id,
                    object_type=obj_info.get("object_type", "sofa"),
                    position_x=obj_info.get("position_x", 0.0),
                    position_y=obj_info.get("position_y", 0.0),
                    position_z=obj_info.get("position_z", 0.0),
                    rotation=obj_info.get("rotation", 0.0),
                    scale=obj_info.get("scale", 1.0),
                    material=style_mat
                )
                sub_db.add(obj)
            
            sub_db.commit()
            sub_db.refresh(design)

            # Download & cache locally in background for database archival
            local_filename = f"{design.id}.jpg"
            local_path = os.path.join("static/generated", local_filename)
            os.makedirs("static/generated", exist_ok=True)
            
            try:
                async with httpx.AsyncClient(timeout=45.0) as client:
                    response = await client.get(pollinations_url)
                    if response.status_code == 200:
                        with open(local_path, "wb") as f:
                            f.write(response.content)
            except Exception as e:
                print(f"Failed to cache image for style {style_name}: {e}")
                
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
            detail=f"Failed to generate designs: {e}"
        )
        
    # Update project room type
    if project.room_type != room_type:
        project.room_type = room_type
        db.commit()

    return [
        {
            "id": str(d.id),
            "style": d.style,
            "image_url": d.image_url
        } for d in designs
    ]
