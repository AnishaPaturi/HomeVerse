import asyncio
import json
from uuid import UUID
from fastapi.testclient import TestClient
from main import app
from app.db.session import SessionLocal
from app.models.project import Project as ProjectModel
from app.models.design import Design as DesignModel

def test_endpoint():
    client = TestClient(app)
    db = SessionLocal()
    try:
        # Find a project and design to test with
        project = db.query(ProjectModel).order_by(ProjectModel.created_at.desc()).first()
        if not project:
            print("No project found in database.")
            return
            
        design = db.query(DesignModel).filter(DesignModel.project_id == project.id).first()
        if not design:
            # Create a mock design
            design = DesignModel(
                project_id=project.id,
                style="Modern",
                image_url=""
            )
            db.add(design)
            db.commit()
            db.refresh(design)
            
        print(f"Testing with Project ID: {project.id}, Design ID: {design.id}")
        
        # Call the endpoint
        response = client.post(
            "/api/ai/render-scratch-design",
            data={
                "design_id": str(design.id),
                "layout_desc": "Test layout description",
                "room_type": "Hall",
                "budget": "20L"
            }
        )
        
        print("Response status code:", response.status_code)
        print("Response JSON:")
        try:
            print(json.dumps(response.json(), indent=2))
        except Exception:
            print(response.text)
            
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_endpoint()
