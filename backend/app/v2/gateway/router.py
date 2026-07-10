from fastapi import APIRouter, UploadFile, File, Form, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import json
from app.v2.database.connection import get_v2_db
from app.v2.ai.orchestrator.service import ai_orchestrator
from app.v2.ai.copilot.service import copilot_service
from app.v2.websocket.manager import collaboration_manager
from app.models.project import Project as ProjectModel
from app.models.design import Design as DesignModel
from app.models.object import Object as ObjectModel

router = APIRouter()

@router.post("/pipeline/full-render")
async def execute_v2_pipeline(
    filename: str = Form(...),
    room_type: str = Form(...),
    style: str = Form(...),
    color_palette: str = Form(None),
    custom_prompt: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_v2_db)
):
    """
    V2 Production Endpoint: Runs the complete 10-stage AI rendering and digital twin pipeline.
    """
    file_bytes = await file.read()
    
    # Run the orchestrator pipeline
    result = await ai_orchestrator.execute_full_rendering_pipeline(
        image_bytes=file_bytes,
        filename=filename,
        room_type=room_type,
        style=style,
        color_palette=color_palette,
        custom_prompt=custom_prompt
    )
    
    # Save results to SQL DB
    try:
        project_id = result["project_id"]
        # Seed user if offline
        from uuid import UUID
        user_id = UUID("d0000000-0000-0000-0000-000000000000")
        
        project = ProjectModel(
            id=UUID(project_id),
            user_id=user_id,
            title=f"My {room_type} ({style})",
            room_type=room_type,
            thumbnail=result["photorealistic_render_url"],
            structural_analysis=json.dumps(result["vision_metadata"])
        )
        db.add(project)
        db.commit()
        
        design = DesignModel(
            project_id=UUID(project_id),
            style=style,
            image_url=result["photorealistic_render_url"],
            selected=True
        )
        db.add(design)
        db.commit()
        db.refresh(design)
        
        # Save scene graph nodes to objects table
        for node in result["scene_graph"]["nodes"]:
            obj = ObjectModel(
                design_id=design.id,
                object_type=node["type"],
                position_x=node["position"][0],
                position_y=node["position"][1],
                position_z=node["position"][2],
                rotation=node["rotation"],
                scale=node["scale"],
                material=node["material"]
            )
            db.add(obj)
            
        db.commit()
    except Exception as e:
        print(f"V2 Router Warning: Failed to archive twin to database: {e}")
        
    return result

@router.post("/pipeline/copilot")
async def execute_v2_copilot(
    design_id: str = Form(...),
    command: str = Form(...),
    db: Session = Depends(get_v2_db)
):
    """
    V2 Copilot Endpoint: Updates absolute scene coordinates dynamically in the scene graph.
    """
    from uuid import UUID
    design = db.query(DesignModel).filter(DesignModel.id == UUID(design_id)).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design record not found")
        
    # Rebuild scene graph from db objects
    objects = db.query(ObjectModel).filter(ObjectModel.design_id == UUID(design_id)).all()
    scene_graph = {
        "room": {
            "type": design.project.room_type if design.project else "Room",
            "width": 3.6,
            "length": 4.0,
            "height": 2.8
        },
        "nodes": [
            {
                "id": str(obj.id),
                "type": obj.object_type,
                "position": [obj.position_x, obj.position_y, obj.position_z],
                "rotation": obj.rotation,
                "scale": obj.scale,
                "material": obj.material
            } for obj in objects
        ]
    }
    
    # Process request using copilot service
    result = await copilot_service.execute_scene_command(
        command=command,
        current_scene=scene_graph
    )
    
    # Apply scene updates to DB objects
    try:
        updated_nodes = result["scene"]["nodes"]
        for node in updated_nodes:
            # Check if object exists
            obj = db.query(ObjectModel).filter(ObjectModel.id == UUID(node["id"])).first()
            if obj:
                obj.position_x = node["position"][0]
                obj.position_y = node["position"][1]
                obj.position_z = node["position"][2]
                obj.rotation = node["rotation"]
                obj.scale = node["scale"]
                obj.material = node["material"]
            else:
                # Add new object
                new_obj = ObjectModel(
                    id=UUID(node["id"]),
                    design_id=UUID(design_id),
                    object_type=node["type"],
                    position_x=node["position"][0],
                    position_y=node["position"][1],
                    position_z=node["position"][2],
                    rotation=node["rotation"],
                    scale=node["scale"],
                    material=node["material"]
                )
                db.add(new_obj)
        db.commit()
    except Exception as e:
        print(f"V2 Router Warning: Failed to sync copilot updates to DB: {e}")
        
    return result

@router.get("/pipeline/history/{design_id}")
def get_v2_design_history(design_id: str):
    """
    Returns design states for Figma-like undo/redo.
    """
    return {
        "design_id": design_id,
        "history": collaboration_manager.get_version_history(design_id)
    }

@router.websocket("/pipeline/ws/{design_id}")
async def websocket_collaboration_endpoint(websocket: WebSocket, design_id: str):
    """
    WS Endpoint: Handles real-time spatial sync updates between designers and clients.
    """
    await collaboration_manager.connect(websocket, design_id)
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            await collaboration_manager.broadcast_scene_update(design_id, websocket, payload)
    except WebSocketDisconnect:
        collaboration_manager.disconnect(websocket, design_id)
    except Exception as e:
        print(f"WS Collaboration Error: {e}")
        collaboration_manager.disconnect(websocket, design_id)
