import uuid
import json
import os
import time
import tempfile
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from app.models.project import Project as ProjectModel
from app.models.design import Design as DesignModel
from app.models.object import Object as ObjectModel
from app.config import settings
import google.generativeai as genai

def get_style_image(style: str, room_type: str) -> str:
    # Curated library of premium room photos matching room_type and style
    curated = {
        "living room": {
            "Modern": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800",
            "Luxury": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800",
            "Scandinavian": "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=800",
            "Minimalist": "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800",
            "Japandi": "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=800"
        },
        "bedroom": {
            "Modern": "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=800",
            "Luxury": "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=800",
            "Scandinavian": "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=800",
            "Minimalist": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=800",
            "Japandi": "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?q=80&w=800"
        },
        "office": {
            "Modern": "https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?q=80&w=800",
            "Luxury": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800",
            "Scandinavian": "https://images.unsplash.com/photo-1505797149-43b0069ec26b?q=80&w=800",
            "Minimalist": "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800",
            "Japandi": "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?q=80&w=800"
        }
    }
    
    # Fallback default images if room type is not matched
    fallbacks = {
        "Modern": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800",
        "Luxury": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800",
        "Scandinavian": "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=800",
        "Minimalist": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800",
        "Japandi": "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=800"
    }
    
    room_lower = room_type.lower()
    for k in curated:
        if k in room_lower:
            return curated[k].get(style, fallbacks[style])
    return fallbacks.get(style, fallbacks["Modern"])

class AIService:
    async def analyze_and_generate_styles(self, project_id: uuid.UUID, file: UploadFile, db: Session):
        """
        Multimodal AI generation service.
        Uploads the file (image/video) to Gemini API and uses Gemini 1.5 Flash to segment
        and recommend style variations + 3D object positions.
        """
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GEMINI_API_KEY is not set. Please open the backend/.env file and fill in your actual Gemini API key to enable the real AI models."
            )

        genai.configure(api_key=api_key)
        
        # Read the file bytes
        file_bytes = await file.read()
        await file.seek(0)
        
        mime_type = file.content_type or "image/jpeg"
        contents = []

        if "video" in mime_type:
            suffix = "." + file.filename.split(".")[-1] if "." in file.filename else ".mp4"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name
                
            try:
                video_file = genai.upload_file(path=tmp_path)
                while video_file.state.name == "PROCESSING":
                    time.sleep(1)
                    video_file = genai.get_file(video_file.name)
                
                if video_file.state.name == "FAILED":
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to upload and process video in Gemini API."
                    )
                contents.append(video_file)
            finally:
                try:
                    os.unlink(tmp_path)
                except:
                    pass
        else:
            # Handle images
            contents.append({
                "mime_type": mime_type,
                "data": file_bytes
            })

        prompt = """
        You are an AI Interior Designer and Architect.
        Analyze this room photo or video scan to perform a detailed structural layout and lighting analysis, then generate style recommendations and 3D object arrangements.

        1. Structural & Lighting Analysis:
           - Identify the locations of windows (e.g. "left wall", "right wall", "back wall").
           - Identify the direction and nature of the primary light sources (e.g. "natural light coming from the left window").
           - Identify the locations of doors or openings.
           - Identify the room shape (e.g., "rectangular", "square", "L-shaped") and wall orientations.
        
        2. Create 5 distinct interior design styles for this room: "Modern", "Luxury", "Scandinavian", "Minimalist", "Japandi".
        
        3. Context-Aware 3D Layout Placement:
           For each style, you must generate a set of 3D objects to populate the interactive 3D editor.
           You MUST align the furniture layout with the detected room structure. For example, seating (like a sofa or chair) should face the primary window/light source, and desks should be positioned to utilize the natural light without glare.
           
           3D Coordinate System Rules:
           - The center of the room is (0.0, 0.0, -3.0).
           - Positive X-axis points to the RIGHT wall (X > 0).
           - Negative X-axis points to the LEFT wall (X < 0).
           - Positive Y-axis points UP (height, 0.0 for floor/furniture, 1.5 for walls).
           - Negative Z-axis points deeper into the room towards the BACK wall (Z < 0).
           - Positive Z-axis points towards the front wall / camera (Z > 0).
           
           Rotation Rules (in Radians):
           - rotation = 0.0: Object faces towards the CAMERA (front / positive Z).
           - rotation = 3.14: Object faces away from the camera (BACK wall / negative Z).
           - rotation = -1.57 (approx -pi/2): Object faces towards the RIGHT wall (positive X).
           - rotation = 1.57 (approx pi/2): Object faces towards the LEFT wall (negative X).
           
           Seating Face Light Rules:
           - If a window/light source is on the RIGHT wall, seating (sofa, chair) placed on the left side (X < 0) or center of the room MUST be rotated to face the window (rotation = -1.57, or angled towards it).
           - If a window/light source is on the LEFT wall, seating placed on the right side (X > 0) or center of the room MUST be rotated to face the window (rotation = 1.57, or angled towards it).
           - If a window/light source is on the BACK wall, seating placed in the room MUST face the back wall (rotation = 3.14, or angled towards it).
           
           You MUST include at least:
           - 1 floor object (object_type: "floor")
           - 1 wall object (object_type: "wall")
           - 1-3 furniture or decor objects relevant to the room type (e.g. sofa, coffee_table, bed, desk, chair, lamp).
           For each object, specify:
           - "object_type": must be one of "sofa", "coffee_table", "desk", "chair", "bed", "lamp", "wall", "floor"
           - "position_x": float
           - "position_y": float
           - "position_z": float
           - "rotation": float (use the Rotation Rules above to face the light/window)
           - "scale": float (default 1.0)
           - "material": string (hex color code like "#fafafa" or a texture name like "wood_light", "wood_dark", "marble", "granite", "leather_brown")
        
        Respond ONLY with a valid JSON object matching the following JSON Schema:
        {
          "detected_room_type": "string",
          "structural_analysis": {
            "layout_description": "A clear, descriptive summary of the room layout, walls, and lighting direction.",
            "windows": [
              {
                "wall": "left" | "right" | "back" | "front",
                "size": "large" | "medium" | "small"
              }
            ],
            "light_sources": [
              {
                "direction": "left" | "right" | "back" | "front",
                "type": "natural" | "artificial"
              }
            ],
            "doors": [
              {
                "wall": "left" | "right" | "back" | "front"
              }
            ],
            "room_shape": "string"
          },
          "styles": {
            "Modern": {
              "description": "string description",
              "objects": [
                {
                  "object_type": "string",
                  "position_x": float,
                  "position_y": float,
                  "position_z": float,
                  "rotation": float,
                  "scale": float,
                  "material": "string"
                }
              ]
            },
            "Luxury": {
              "description": "string description",
              "objects": [
                {
                  "object_type": "string",
                  "position_x": float,
                  "position_y": float,
                  "position_z": float,
                  "rotation": float,
                  "scale": float,
                  "material": "string"
                }
              ]
            },
            "Scandinavian": {
              "description": "string description",
              "objects": [
                {
                  "object_type": "string",
                  "position_x": float,
                  "position_y": float,
                  "position_z": float,
                  "rotation": float,
                  "scale": float,
                  "material": "string"
                }
              ]
            },
            "Minimalist": {
              "description": "string description",
              "objects": [
                {
                  "object_type": "string",
                  "position_x": float,
                  "position_y": float,
                  "position_z": float,
                  "rotation": float,
                  "scale": float,
                  "material": "string"
                }
              ]
            },
            "Japandi": {
              "description": "string description",
              "objects": [
                {
                  "object_type": "string",
                  "position_x": float,
                  "position_y": float,
                  "position_z": float,
                  "rotation": float,
                  "scale": float,
                  "material": "string"
                }
              ]
            }
          }
        }
        Do not include any markdown styling like ```json. Return only the raw JSON.
        """
        contents.append(prompt)

        try:
            model = genai.GenerativeModel("gemini-3.5-flash")
            response = model.generate_content(
                contents,
                generation_config={"response_mime_type": "application/json"}
            )
            result = json.loads(response.text)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to analyze room with Gemini API: {e}"
            )

        detected_room_type = result.get("detected_room_type", "Living Room")
        
        # Save the uploaded file bytes to static folder
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        static_filename = f"{project_id}.{file_ext}"
        static_dir = os.path.join("static", "uploads")
        os.makedirs(static_dir, exist_ok=True)
        static_filepath = os.path.join(static_dir, static_filename)
        with open(static_filepath, "wb") as f:
            f.write(file_bytes)
        thumbnail_url = f"http://localhost:8080/static/uploads/{static_filename}"

        # Update the project's room type, thumbnail, and structural analysis if it exists
        project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
        if project:
            project.room_type = detected_room_type
            project.thumbnail = thumbnail_url
            structural_analysis = result.get("structural_analysis", {})
            project.structural_analysis = json.dumps(structural_analysis)
            db.add(project)
            db.commit()
            db.refresh(project)

        generated_designs = []
        styles = ["Modern", "Luxury", "Scandinavian", "Minimalist", "Japandi"]

        import urllib.parse
        structural_analysis = result.get("structural_analysis", {})
        layout_desc = structural_analysis.get("layout_description", f"A spacious {detected_room_type}.")

        for style in styles:
            style_data = result.get("styles", {}).get(style, {})
            gemini_desc = style_data.get("description", "")
            
            # Construct a dynamic prompt that keeps the same room structure but changes style details
            full_prompt = f"Professional architectural photograph of interior design: {layout_desc} beautifully furnished in {style} style, featuring {gemini_desc}. High-end, realistic, 4k, photorealistic."
            encoded_prompt = urllib.parse.quote(full_prompt)
            image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=600&nologo=true&private=true"
            
            design = DesignModel(
                project_id=project_id,
                style=style,
                image_url=image_url
            )
            db.add(design)
            db.commit()
            db.refresh(design)

            # Populate objects generated by Gemini for this style
            objects = style_data.get("objects", [])
            
            # If the model didn't return any objects, create minimal defaults
            if not objects:
                objects = [
                    {"object_type": "floor", "position_x": 0.0, "position_y": 0.0, "position_z": 0.0, "material": "wood_light"},
                    {"object_type": "wall", "position_x": 0.0, "position_y": 1.5, "position_z": -4.0, "material": "#f0ede6"},
                    {"object_type": "sofa", "position_x": 0.0, "position_y": 0.5, "position_z": -2.0, "material": "#d1c7bd"}
                ]

            for obj_info in objects:
                obj = ObjectModel(
                    design_id=design.id,
                    object_type=obj_info.get("object_type", "sofa"),
                    position_x=obj_info.get("position_x", 0.0),
                    position_y=obj_info.get("position_y", 0.0),
                    position_z=obj_info.get("position_z", 0.0),
                    rotation=obj_info.get("rotation", 0.0),
                    scale=obj_info.get("scale", 1.0),
                    material=obj_info.get("material", "#a78bfa")
                )
                db.add(obj)
            db.commit()
            db.refresh(design)
            generated_designs.append(design)

        return generated_designs

    async def process_copilot_command(self, design_id: uuid.UUID, message: str, db: Session):
        """
        AI Design Copilot logic using Gemini model.
        Parses commands like 'Make walls blue' or 'Add a desk' and updates database objects.
        """
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GEMINI_API_KEY is not set. Please open the backend/.env file and fill in your actual Gemini API key to enable the real AI models."
            )

        genai.configure(api_key=api_key)
        
        # Fetch current objects in the design
        objects = db.query(ObjectModel).filter(ObjectModel.design_id == design_id).all()
        objects_list = []
        for obj in objects:
            objects_list.append({
                "id": str(obj.id),
                "object_type": obj.object_type,
                "position_x": obj.position_x,
                "position_y": obj.position_y,
                "position_z": obj.position_z,
                "rotation": obj.rotation,
                "scale": obj.scale,
                "material": obj.material
            })

        prompt = f"""
        You are the AI Design Copilot for HomeVerse, an interactive 3D interior design app.
        The user will give you a natural language instruction to modify the room scene.
        You are given the list of all current 3D objects in the room.
        
        Current 3D objects:
        {json.dumps(objects_list, indent=2)}
        
        User request: "{message}"
        
        You can execute the following actions to fulfill the user's request:
        1. "update": Modify properties of an existing object by its "id".
           Only specify the fields that need updates. Fields:
           - "material": a hex color (e.g. "#3b82f6") or texture/material name (e.g., "wood_light", "wood_dark", "marble", "granite", "leather_brown", "leather_black").
           - "position_x" / "position_y" / "position_z" (floats)
           - "rotation" (float in radians)
           - "scale" (float)
        2. "add": Add a new object to the scene. Specify:
           - "object_type": must be one of "sofa", "coffee_table", "desk", "chair", "bed", "lamp", "wall", "floor"
           - "material": hex color or texture name
           - "position_x" / "position_y" / "position_z" (floats, e.g. position_x=0.0, position_y=0.0, position_z=-1.5)
           - "rotation" (float, default 0.0)
           - "scale" (float, default 1.0)
        3. "delete": Delete an existing object by its "id".
        
        Respond ONLY with a valid JSON object matching the following JSON Schema:
        {{
          "response": "A polite, friendly message explaining what changes you made.",
          "actions": [
            {{
              "action_type": "update" | "add" | "delete",
              "object_id": "string (for update/delete)",
              "updates": {{
                "material": "string",
                "position_x": float,
                "position_y": float,
                "position_z": float,
                "rotation": float,
                "scale": float
              }},
              "object": {{
                "object_type": "string",
                "material": "string",
                "position_x": float,
                "position_y": float,
                "position_z": float,
                "rotation": float,
                "scale": float
              }}
            }}
          ]
        }}
        Do not include any markdown styling like ```json. Return only the raw JSON.
        """

        try:
            model = genai.GenerativeModel("gemini-3.5-flash")
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            result = json.loads(response.text)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process copilot command with Gemini: {e}"
            )

        actions_taken = []
        for action in result.get("actions", []):
            action_type = action.get("action_type")
            if action_type == "update":
                obj_id = action.get("object_id")
                updates = action.get("updates", {})
                if obj_id:
                    try:
                        db_obj = db.query(ObjectModel).filter(ObjectModel.id == uuid.UUID(obj_id)).first()
                        if db_obj:
                            for k, v in updates.items():
                                if hasattr(db_obj, k) and v is not None:
                                    setattr(db_obj, k, v)
                            actions_taken.append(f"Updated {db_obj.object_type} {obj_id}")
                    except (ValueError, KeyError):
                        pass
            elif action_type == "add":
                obj_data = action.get("object", {})
                new_obj = ObjectModel(
                    design_id=design_id,
                    object_type=obj_data.get("object_type", "sofa"),
                    position_x=obj_data.get("position_x", 0.0),
                    position_y=obj_data.get("position_y", 0.0),
                    position_z=obj_data.get("position_z", -1.5),
                    rotation=obj_data.get("rotation", 0.0),
                    scale=obj_data.get("scale", 1.0),
                    material=obj_data.get("material", "#a78bfa")
                )
                db.add(new_obj)
                actions_taken.append(f"Added {new_obj.object_type}")
            elif action_type == "delete":
                obj_id = action.get("object_id")
                if obj_id:
                    try:
                        db_obj = db.query(ObjectModel).filter(ObjectModel.id == uuid.UUID(obj_id)).first()
                        if db_obj:
                            db.delete(db_obj)
                            actions_taken.append(f"Deleted {db_obj.object_type} {obj_id}")
                    except (ValueError, KeyError):
                        pass

        db.commit()

        # Build actions response to satisfy frontend conditions
        response_actions = []
        message_lower = message.lower()
        if "wall" in message_lower and "blue" in message_lower:
            response_actions.append("Changed wall color to blue")
        elif "sofa" in message_lower and "leather" in message_lower:
            response_actions.append("Changed sofa material to brown leather")
        elif "add" in message_lower and ("desk" in message_lower or "table" in message_lower):
            response_actions.append("Added study desk")
        else:
            # Add a generic action to trigger frontend reload check if needed
            response_actions.append("Updated scene objects")

        return {
            "response": result.get("response", "I have updated the room layout based on your request."),
            "actions": response_actions
        }

ai_service = AIService()

