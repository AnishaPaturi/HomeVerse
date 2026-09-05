from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status, Request
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
from app.schemas.what_if import (
    WhatIfQueryRequest,
    WhatIfScenarioResponse,
    WhatIfApplyRequest,
    WhatIfPresetOption,
)
from app.ai.what_if_engine import WhatIfEngine
from app.models.user import User as UserModel
from app.models.project import Project as ProjectModel
from app.core.rate_limiter import (
    rate_limit_ai_generation,
    rate_limit_upload,
    get_user_ai_quota,
)
from app.core.file_security import validate_uploaded_file
from app.core.input_validation import sanitize_text, sanitize_prompt
from app.core.ai_cost_tracker import check_ai_cost_limit, record_ai_usage
import time
try:
    from app.monitoring.metrics import (
        AI_GENERATION_REQUESTS_TOTAL,
        AI_GENERATION_FAILURES_TOTAL,
        AI_GENERATION_DURATION_SECONDS,
    )
except ImportError:
    AI_GENERATION_REQUESTS_TOTAL = None
    AI_GENERATION_FAILURES_TOTAL = None
    AI_GENERATION_DURATION_SECONDS = None

router = APIRouter()

@router.post("/analyze-upload", dependencies=[Depends(rate_limit_upload)])
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

    # Binary magic-byte, size, and executable protection (Phase 43)
    detected_mime, detected_ext, safe_name = validate_uploaded_file(
        file_bytes=file_bytes,
        claimed_filename=file.filename,
        claimed_content_type=file.content_type,
    )
    file.filename = safe_name

    is_valid = await ai_service.validate_upload_content(
        file_bytes=file_bytes,
        filename=file.filename,
        mime_type=detected_mime,
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not appropriate data supplied to the app. The uploaded file does not appear to be an interior room, home area, or blueprint plan."
        )
    
    start_time = time.perf_counter()
    if AI_GENERATION_REQUESTS_TOTAL:
        AI_GENERATION_REQUESTS_TOTAL.labels(model="gemini-multimodal", status="initiated").inc()

    try:
        # Process the file using the AI service wrapper
        result = await ai_service.analyze_room_upload(
            project_id=project_id,
            file=file,
            db=db
        )
        duration = time.perf_counter() - start_time
        if AI_GENERATION_DURATION_SECONDS:
            AI_GENERATION_DURATION_SECONDS.labels(model="gemini-multimodal").observe(duration)
        if AI_GENERATION_REQUESTS_TOTAL:
            AI_GENERATION_REQUESTS_TOTAL.labels(model="gemini-multimodal", status="success").inc()
        return result
    except Exception as exc:
        if AI_GENERATION_FAILURES_TOTAL:
            AI_GENERATION_FAILURES_TOTAL.labels(model="gemini-multimodal", error_type=type(exc).__name__).inc()
        raise exc

@router.post(
    "/generate-dynamic-design",
    response_model=DesignSchema,
    dependencies=[Depends(rate_limit_ai_generation)],
)
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
    room_type = sanitize_text(room_type)
    style = sanitize_text(style)
    color_palette = sanitize_text(color_palette) if color_palette else None
    custom_prompt = sanitize_prompt(custom_prompt) if custom_prompt else None

    # Verify user AI spending budget before execution (Phase 44)
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    user = db.query(UserModel).filter(UserModel.id == project.user_id).first() if project else None
    if user:
        check_ai_cost_limit(db, user, projected_additional_cost=0.001)

    start_time = time.perf_counter()
    if AI_GENERATION_REQUESTS_TOTAL:
        AI_GENERATION_REQUESTS_TOTAL.labels(model="gemini-3.5-flash", status="initiated").inc()

    try:
        design = await ai_service.generate_dynamic_design(
            project_id=project_id,
            room_type=room_type,
            style=style,
            color_palette=color_palette,
            custom_prompt=custom_prompt,
            db=db
        )
        duration = time.perf_counter() - start_time
        if AI_GENERATION_DURATION_SECONDS:
            AI_GENERATION_DURATION_SECONDS.labels(model="gemini-3.5-flash").observe(duration)
        if AI_GENERATION_REQUESTS_TOTAL:
            AI_GENERATION_REQUESTS_TOTAL.labels(model="gemini-3.5-flash", status="success").inc()

        # Track usage and estimated cost in database (Phase 44)
        if user:
            record_ai_usage(
                db=db,
                user_id=user.id,
                operation="dynamic_design",
                model="gemini-3.5-flash",
                input_tokens=1800,
                output_tokens=650,
                image_count=1,
                generation_id=str(design.id) if hasattr(design, "id") else None,
            )

        # Product analytics event (Phase 45)
        try:
            from app.core.analytics import track_event
            track_event(
                db=db,
                event_name="design_generated",
                user_id=user.id if user else None,
                properties={
                    "project_id": str(project_id),
                    "room_type": room_type,
                    "style": style,
                    "color_palette": color_palette,
                    "design_id": str(design.id) if hasattr(design, "id") else None,
                },
            )
        except Exception:
            pass

        return design
    except Exception as exc:
        if AI_GENERATION_FAILURES_TOTAL:
            AI_GENERATION_FAILURES_TOTAL.labels(model="gemini-3.5-flash", error_type=type(exc).__name__).inc()
        raise exc

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

def standardize_room_name(room_type: str) -> str:
    r = room_type.lower().strip()
    if "hall" in r or "living" in r:
        return "Living_Room"
    if "bedroom" in r:
        if "master" in r:
            return "Master_Bedroom"
        elif "second" in r:
            return "Second_Bedroom"
        elif "kids" in r or "kid" in r:
            return "Kids_Bedroom"
        return "Bedroom"
    if "bath" in r:
        return "Bathroom"
    if "kitchen" in r:
        return "Kitchen"
    if "office" in r:
        return "Office"
    return "".join(c for c in room_type if c.isalnum() or c in " -_").replace(" ", "_")

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
    safe_room = standardize_room_name(room_type)
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
        safe_room = standardize_room_name(room_type)
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
    file_bytes = None
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
        blueprint_url=blueprint_url,
        blueprint_bytes=file_bytes,
        blueprint_mime_type=house_plan_file.content_type if house_plan_file else None
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

    project.room_type = room_type
    db.commit()

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
            budget=budget,
            project_id=project_id
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


@router.post("/initialize-scratch-designs")
async def initialize_scratch_designs(
    project_id: UUID = Form(...),
    room_type: str = Form(...),
    budget: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Step 1 of progressive scratch design: Creates design records and generic 3D objects
    immediately, returning design stubs without waiting for long image renders.
    """
    from app.models.design import Design as DesignModel
    from app.models.object import Object as ObjectModel
    from app.services.layout_engine import layout_engine

    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Update project's room type to the user's selected room
    project.room_type = room_type
    db.commit()

    if not project.structural_analysis:
        raise HTTPException(status_code=400, detail="House model not found. Please create the house model first.")

    try:
        house_model = json.loads(project.structural_analysis)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse house model: {e}")

    try:
        common_layout = await layout_engine.generate_common_layout(
            house_model=house_model,
            room_type=room_type,
            budget=budget,
            project_id=project_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate layout: {e}")

    main_door = house_model.get("mainDoor", "North")
    if "kitchen" in room_type.lower():
        main_door = house_model.get("kitchen", "East")

    styles = ["Modern", "Scandinavian", "Modern Luxury", "Japandi", "Industrial", "Contemporary"]
    
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

    from app.services.ai_service import rotate_layout_objects

    created_designs = []
    for style_name in styles:
        # Create Design Model record
        design = DesignModel(
            project_id=project_id,
            style=style_name,
            direction=main_door,
            layout_variant="common",
            image_url="" # Empty for now
        )
        db.add(design)
        db.commit()
        db.refresh(design)

        # Create Object Models
        objects = common_layout.get("objects", [])
        rotated_objects = rotate_layout_objects(objects, main_door)
        for obj_info in rotated_objects:
            style_mat = map_generic_to_style_material(obj_info.get("material", "wood_base"), style_name)
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
            db.add(obj)
        db.commit()
        
        created_designs.append({
            "id": str(design.id),
            "style": design.style,
            "image_url": ""
        })

    # Update project room type
    if project.room_type != room_type:
        project.room_type = room_type
        db.commit()

    return {
        "layout_desc": common_layout.get("layout_description", ""),
        "designs": created_designs
    }


ROOM_FURNITURE = {
    "Hall": [
        "Sofa", "Center Table", "TV", "TV Cabinet", "Wall Decor", "Feature Wall", 
        "False Ceiling", "Designer Lights", "Side Tables", "Curtains", "Blinds", 
        "Indoor Plants", "Carpet"
    ],
    "Master Bedroom": [
        "King Bed with Storage", "Wardrobes", "TV Unit", "TV", "Window Seat", 
        "Curtains", "Side Tables", "Dressing Table", "Mirror", "Storage", 
        "Showpieces", "AC"
    ],
    "Second Bedroom": [
        "Queen Bed", "Storage", "Wardrobe", "TV", "TV Unit", "Study Desk", 
        "Chair", "Laundry Storage", "Curtains", "Side Tables", "AC", 
        "Dressing Table", "Decor"
    ],
    "Kids Bedroom": [
        "Bed", "Wardrobe", "Study Table", "Chair", "Bookshelf", "Storage", 
        "TV", "Curtains", "Window Seat", "AC", "Play Area"
    ],
    "Dining": [
        "Dining Table", "Chairs based on dimensions", "Fridge", "Crockery Unit", 
        "Storage Cabinets", "Wall Decor", "Pendant Lights"
    ],
    "Kitchen": [
        "Kitchen Platform", "Sink", "Gas Stove", "Chimney", "Pantry", 
        "Microwave Unit", "Oven Unit", "Storage", "Tall Unit", "Exhaust", 
        "Fan"
    ],
    "Bathroom": [
        "WC", "Wash Basin", "Mirror", "Storage Cabinet", "Glass Shower Partition", 
        "Shower Area", "Niche Storage", "Towel Holder", "Ventilation"
    ],
    "Foyer": [
        "Console Table", "Wall Panel", "Mirror", "Decor", "Lighting", "Storage"
    ],
    "Lobby": [
        "Minimal Seating", "Wall Art", "Lighting", "Decor"
    ],
    "Puja Room": [
        "Mandir", "Storage", "Lighting", "Marble", "Wood Carving", "Bell", "Warm Lights"
    ]
}

def extract_room_dimensions(house_model: dict, room_type: str) -> str:
    # Try the new "rooms" dictionary first
    rooms = house_model.get("rooms", {})
    if rooms:
        room_key = room_type.lower().replace(" / ", "_").replace(" ", "_")
        if "hall" in room_key or "living" in room_key:
            room_key = "hall"
        elif "master" in room_key:
            room_key = "master_bedroom"
        elif "second" in room_key:
            room_key = "second_bedroom"
        elif "kid" in room_key:
            room_key = "kids_bedroom"
        elif "bath" in room_key:
            room_key = "bathroom"
            
        r_info = rooms.get(room_key)
        if isinstance(r_info, dict):
            w = r_info.get("width") or r_info.get("width_m") or r_info.get("w")
            l = r_info.get("length") or r_info.get("length_m") or r_info.get("l")
            if w and l:
                return f"{w}m × {l}m"

    # Fallback to dimensionsEachRoom
    each_room = house_model.get("dimensionsEachRoom", {})
    room_dim = each_room.get(room_type) or each_room.get(room_type.lower())
    if isinstance(room_dim, dict):
        w = room_dim.get("width") or room_dim.get("width_m") or room_dim.get("w")
        l = room_dim.get("length") or room_dim.get("length_m") or room_dim.get("l")
        if w and l:
            return f"{w}m × {l}m"
    elif isinstance(room_dim, str):
        return room_dim
        
    h_dim = house_model.get("dimensionsHouse", {})
    if isinstance(h_dim, dict) and h_dim.get("width") and h_dim.get("length"):
        return f"{h_dim.get('width')}m x {h_dim.get('length')}m"
        
    return "3.63m × 3.94m"

@router.post("/render-scratch-design")
async def render_scratch_design(
    design_id: UUID = Form(...),
    layout_desc: str = Form(...),
    room_type: str = Form(...),
    budget: str = Form(...),
    view_direction: str = Form("front"),
    db: Session = Depends(get_db)
):
    """
    Step 2 of progressive scratch design: Generates prompt and renders a single design style
    staggered to avoid rate limiting and allow immediate progressive loading in UI.
    Supports 4 view directions: front (default), back, left, right.
    """
    from app.models.design import Design as DesignModel
    import httpx
    import urllib.parse
    import os

    design = db.query(DesignModel).filter(DesignModel.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design record not found")

    project = db.query(ProjectModel).filter(ProjectModel.id == design.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        house_model = json.loads(project.structural_analysis)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to parse house model")

    style_name = design.style
    room_dims = extract_room_dimensions(house_model, room_type)
    house_type = house_model.get("houseType") or house_model.get("property_type") or "Apartment"

    # Get door direction to set up camera perspective
    door_dir = getattr(design, "direction", None)
    if not door_dir:
        door_dir = house_model.get("mainDoor", "North")
        if "kitchen" in room_type.lower():
            door_dir = house_model.get("kitchen", "East")

    door_wall = "South"
    camera_view = "North"
    door_dir_lower = door_dir.lower()
    if "north" in door_dir_lower:
        door_wall = "North"
        camera_view = "South"
    elif "south" in door_dir_lower:
        door_wall = "South"
        camera_view = "North"
    elif "east" in door_dir_lower:
        door_wall = "East"
        camera_view = "West"
    elif "west" in door_dir_lower:
        door_wall = "West"
        camera_view = "East"

    from app.services.ai_service import calculate_image_dimensions, get_room_dimensions_from_analysis
    
    room_w, room_l = get_room_dimensions_from_analysis(house_model, room_type)
    img_width, img_height = calculate_image_dimensions(room_w, room_l, door_dir)
    
    furniture_items = ROOM_FURNITURE.get(room_type, ["Sofa", "Center Table", "Lights", "Decor"])
    furniture_list = "\n".join([f"• {item}" for item in furniture_items])

    # Determine camera angle and perspective details based on view_direction
    if view_direction == "back":
        camera_desc = f"Camera is positioned at the back wall/window area, looking straight back towards the front entrance door ({door_dir} facing wall). Show the front wall design and entrance."
    elif view_direction == "left":
        camera_desc = f"Camera is positioned near the right wall, looking straight across the room towards the left wall. Show the left wall and the furniture aligned to it."
    elif view_direction == "right":
        camera_desc = f"Camera is positioned near the left wall, looking straight across the room towards the right wall. Show the right wall and the furniture aligned to it."
    elif view_direction == "front_wall":
        camera_desc = f"Camera is positioned inside the room looking directly back at the front entrance wall ({door_dir} facing wall). Show the front wall design, main entrance door, and surrounding wall decor."
    else:
        # "front" view (default)
        camera_desc = f"Camera is positioned at the entrance doorway threshold on {door_wall} wall, looking straight {camera_view} into the room (door perspective). Part of open entrance door frame/jamb is visible in the foreground on the left edge of the frame to frame the view."

    image_prompt = f"""You are a professional architect and interior designer.

Generate ONE photorealistic room only.

Room Type:
{room_type}

Dimensions:
{room_dims}

House Type:
{house_type}

Design Style:
{style_name} ({budget} tier)

Layout & Furniture Placement:
{layout_desc}

Furniture Requirements:
{furniture_list}

Architecture Rules:
- Follow the layout description and floor plan exactly. Do not shift the location of windows, doors, or structural elements.
- The furniture arrangement must remain locked exactly as described: do not move heavy furniture to other sides of the room.
- Only modify the materials, finishes, textures, colors, and styling accessories to reflect the {style_name} design.
- Do not modify or move structural walls.

Window Rules:
If French Window
→ Full Length Curtains
Else
→ Premium Roller Blinds

Camera & Rendering:
- {camera_desc}
- Angle: Eye Level
- Camera: 24mm Lens
- Light: Natural Daylight
- Quality: Ultra Realistic, Architectural Visualization, PBR Materials, Ray Traced Lighting, 4K

Only generate ONE image."""

    clean_prompt = " ".join(image_prompt.splitlines())
    encoded_prompt = urllib.parse.quote(clean_prompt)
    seed = abs(hash(f"{style_name}-{design.project_id}-{view_direction}")) % 100000
    pollinations_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={img_width}&height={img_height}&nologo=true&private=true&model=flux&seed={seed}"

    # Temporarily set URL to prevent empty loading states
    if view_direction == "left":
        design.image_url_left = pollinations_url
    elif view_direction == "right":
        design.image_url_right = pollinations_url
    elif view_direction == "back":
        design.image_url_back = pollinations_url
    elif view_direction == "front_wall":
        design.image_url_front = pollinations_url
    else:
        design.image_url = pollinations_url
    db.commit()

    # Download & cache locally in background
    local_filename = f"{design.id}_{view_direction}.jpg"
    local_path = os.path.join("static/generated", local_filename)
    os.makedirs("static/generated", exist_ok=True)

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.get(pollinations_url)
            if response.status_code == 200:
                with open(local_path, "wb") as f:
                    f.write(response.content)
                local_url = f"http://localhost:8080/static/generated/{local_filename}"
                if view_direction == "left":
                    design.image_url_left = local_url
                elif view_direction == "right":
                    design.image_url_right = local_url
                elif view_direction == "back":
                    design.image_url_back = local_url
                elif view_direction == "front_wall":
                    design.image_url_front = local_url
                else:
                    design.image_url = local_url
                db.commit()
    except Exception as e:
        print(f"Failed to cache image for design {design.id} view {view_direction}: {e}")

    return {
        "id": str(design.id),
        "style": design.style,
        "image_url": design.image_url,
        "image_url_left": design.image_url_left,
        "image_url_right": design.image_url_right,
        "image_url_back": design.image_url_back,
        "image_url_front": design.image_url_front
    }


# ==========================================================
# PHASE 24 — "WHAT IF?" MODE ENDPOINTS
# ==========================================================

@router.get("/what-if/presets", response_model=List[WhatIfPresetOption])
def get_what_if_presets():
    """
    Returns standard 'What If?' prompt presets from Phase 24:
    - Reduce budget by ₹1 lakh
    - Maximize storage
    - Luxury aesthetic look
    - Add work desk
    """
    return WhatIfEngine.get_presets()


@router.post("/what-if/simulate", response_model=WhatIfScenarioResponse)
def simulate_what_if_scenario(
    req: WhatIfQueryRequest,
    db: Session = Depends(get_db)
):
    """
    Simulates modifications to Design, Furniture, Materials, and Cost
    answering user's 'What If?' question without rebuilding the entire project.
    """
    result = WhatIfEngine.simulate(db=db, req=req)
    try:
        from app.core.analytics import track_event
        track_event(
            db=db,
            event_name="budget_optimized",
            properties={
                "design_id": str(req.design_id),
                "budget": result.new_budget,
                "cost_delta": result.cost_delta,
                "scenario_title": result.scenario_title,
            },
        )
    except Exception:
        pass
    return result


@router.post("/what-if/apply", response_model=DesignSchema)
def apply_what_if_scenario(
    req: WhatIfApplyRequest,
    db: Session = Depends(get_db)
):
    """
    Applies the simulated changes directly to the design and items in the database.
    """
    design = WhatIfEngine.apply_scenario(
        db=db,
        design_id=req.design_id,
        scenario_id=req.scenario_id
    )
    return design


@router.get("/quota")
async def get_ai_quota_endpoint(
    request: Request,
    email: Optional[str] = None,
    user_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
):
    """
    Returns the user's daily AI generation quota, used count, and tier information.
    """
    user = None
    target_id = request.headers.get("X-User-Id") or (str(user_id) if user_id else None)
    target_email = request.headers.get("X-User-Email") or email

    if target_id:
        try:
            uid = UUID(str(target_id))
            user = db.query(UserModel).filter(UserModel.id == uid).first()
        except (ValueError, TypeError):
            pass

    if not user and target_email:
        user = db.query(UserModel).filter(UserModel.email == str(target_email)).first()

    # Extract client IP
    forwarded = request.headers.get("X-Forwarded-For")
    client_ip = (
        forwarded.split(",")[0].strip()
        if forwarded
        else (request.client.host if request.client else "127.0.0.1")
    )

    return get_user_ai_quota(user, client_ip)




