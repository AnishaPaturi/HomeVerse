import uuid
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.models.design import Design as DesignModel
from app.models.object import Object as ObjectModel

class AIService:
    async def analyze_and_generate_styles(self, project_id: uuid.UUID, file: UploadFile, db: Session):
        """
        Mock AI generation service for MVP.
        In production, this would upload the file to S3/Cloudinary,
        run YOLOv11 and SAM 2, and use FLUX/SDXL to generate style variations.
        """
        # Example style options
        styles = ["Modern", "Luxury", "Scandinavian", "Minimalist", "Japandi"]
        generated_designs = []

        # Create mock design variations in database
        for style in styles:
            design = DesignModel(
                project_id=project_id,
                style=style,
                image_url=f"https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=600" # Placeholder room
            )
            db.add(design)
            db.commit()
            db.refresh(design)

            # Pre-populate some 3D objects in the room for editing
            mock_objects = [
                {"object_type": "sofa", "position_x": 0.0, "position_y": 0.5, "position_z": -2.0, "material": "#d1c7bd"},
                {"object_type": "coffee_table", "position_x": 0.0, "position_y": 0.25, "position_z": -0.8, "material": "#8b5a2b"},
                {"object_type": "floor", "object_type_db": "floor", "position_x": 0.0, "position_y": 0.0, "position_z": 0.0, "material": "wood_light"},
                {"object_type": "wall", "object_type_db": "wall", "position_x": 0.0, "position_y": 1.5, "position_z": -4.0, "material": "#f0ede6"}
            ]

            for obj_info in mock_objects:
                obj = ObjectModel(
                    design_id=design.id,
                    object_type=obj_info["object_type"],
                    position_x=obj_info["position_x"],
                    position_y=obj_info["position_y"],
                    position_z=obj_info["position_z"],
                    material=obj_info["material"]
                )
                db.add(obj)
            db.commit()
            db.refresh(design)
            generated_designs.append(design)

        return generated_designs

    async def process_copilot_command(self, design_id: uuid.UUID, message: str, db: Session):
        """
        Mock AI Design Copilot logic.
        Parses commands like 'Make walls blue' or 'Add a desk' and updates database objects.
        """
        message_lower = message.lower()
        response_text = ""
        actions_taken = []

        if "wall" in message_lower and ("blue" in message_lower or "color" in message_lower):
            # Change wall color
            wall = db.query(ObjectModel).filter(
                ObjectModel.design_id == design_id,
                ObjectModel.object_type == "wall"
            ).first()
            if wall:
                wall.material = "#3b82f6" # Blue hex
                db.commit()
                response_text = "I have updated the wall color to blue."
                actions_taken.append("Changed wall color to blue")
            else:
                response_text = "I couldn't find a wall in this design's 3D scene."
                
        elif "sofa" in message_lower and "leather" in message_lower:
            sofa = db.query(ObjectModel).filter(
                ObjectModel.design_id == design_id,
                ObjectModel.object_type == "sofa"
            ).first()
            if sofa:
                sofa.material = "leather_brown"
                db.commit()
                response_text = "I have updated the sofa material to brown leather."
                actions_taken.append("Changed sofa material to brown leather")
            else:
                response_text = "I couldn't find a sofa in this design's 3D scene."
                
        elif "add" in message_lower and ("desk" in message_lower or "table" in message_lower):
            # Add a new desk object
            new_obj = ObjectModel(
                design_id=design_id,
                object_type="desk",
                position_x=1.5,
                position_y=0.4,
                position_z=-1.5,
                material="#4a3b32"
            )
            db.add(new_obj)
            db.commit()
            response_text = "I have added a study desk to the room."
            actions_taken.append("Added study desk")
        else:
            response_text = f"I received your request: '{message}'. Currently in MVP, you can say 'make walls blue', 'change sofa to leather', or 'add a desk'."

        return {
            "response": response_text,
            "actions": actions_taken
        }

ai_service = AIService()
