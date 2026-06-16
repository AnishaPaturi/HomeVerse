import os
import uuid
import json
import sys
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.ai_service import ai_service
from app.models.project import Project as ProjectModel
from app.models.design import Design as DesignModel
from app.models.object import Object as ObjectModel
from app.models.user import User as UserModel
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

def test_copilot():
    db = SessionLocal()
    try:
        # Check if user exists, otherwise create one
        user = db.query(UserModel).first()
        if not user:
            user = UserModel(name="Test User", email="test@example.com")
            db.add(user)
            db.commit()
            db.refresh(user)
            
        # Check if project exists, otherwise create one
        project = db.query(ProjectModel).filter(ProjectModel.user_id == user.id).first()
        if not project:
            project = ProjectModel(user_id=user.id, title="Test Room Project", room_type="Living Room")
            db.add(project)
            db.commit()
            db.refresh(project)
            
        # Check if design exists, otherwise create one
        design = db.query(DesignModel).filter(DesignModel.project_id == project.id).first()
        if not design:
            design = DesignModel(project_id=project.id, style="Modern", image_url="https://example.com/image.jpg")
            db.add(design)
            db.commit()
            db.refresh(design)
            
        # Add basic floor and wall objects to design
        floor = db.query(ObjectModel).filter(ObjectModel.design_id == design.id, ObjectModel.object_type == "floor").first()
        if not floor:
            floor = ObjectModel(design_id=design.id, object_type="floor", material="wood_light")
            db.add(floor)
        wall = db.query(ObjectModel).filter(ObjectModel.design_id == design.id, ObjectModel.object_type == "wall").first()
        if not wall:
            wall = ObjectModel(design_id=design.id, object_type="wall", material="#ffffff")
            db.add(wall)
        db.commit()
        
        api_key = os.getenv("GEMINI_API_KEY")
        print(f"Running copilot command test with Gemini key: {'Set' if api_key else 'Not Set'}")
        if not api_key:
            print("\n[WARNING] GEMINI_API_KEY is not configured in backend/.env file.")
            print("Please configure it to perform the actual model test.")
            return

        import asyncio
        async def run():
            print("\nSending command: 'Make the walls blue and add a desk' to Gemini...")
            result = await ai_service.process_copilot_command(
                design_id=design.id,
                message="Make the walls blue and add a desk",
                db=db
            )
            print("\nGemini Copilot Response:")
            print(json.dumps(result, indent=2))
            
        asyncio.run(run())
        print("\nTest executed successfully!")
        
    except Exception as e:
        print(f"\n[ERROR] Test failed: {e}", file=sys.stderr)
    finally:
        db.close()

if __name__ == "__main__":
    test_copilot()
