"""
Floorplan Upload Service
Handles floor plan file ingestion, validation, and storage.
"""
from typing import Optional
from uuid import UUID
import uuid
from sqlalchemy.orm import Session
from app.models.floorplan import Floorplan
from app.storage.client import storage_client

class FloorplanUploadService:
    @staticmethod
    async def upload_floorplan(
        db: Session,
        project_id: UUID,
        file_bytes: bytes,
        filename: str,
        floor_id: Optional[UUID] = None
    ) -> Floorplan:
        file_key = f"floorplans/{project_id}/{uuid.uuid4()}_{filename}"
        public_url = await storage_client.upload_file(file_bytes, file_key, content_type="image/jpeg")

        floorplan = Floorplan(
            id=uuid.uuid4(),
            project_id=project_id,
            floor_id=floor_id,
            image_url=public_url,
            status="uploaded"
        )
        db.add(floorplan)
        db.commit()
        db.refresh(floorplan)
        return floorplan
