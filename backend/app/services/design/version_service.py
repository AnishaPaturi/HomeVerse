"""
Version Service
Maintains immutable snapshots of room designs, modifications, and cost evolutions.
"""
from typing import List, Optional
from uuid import UUID
import uuid
import json
from sqlalchemy.orm import Session
from app.models.design import Design
from app.models.design_version import DesignVersion

class VersionService:
    @staticmethod
    def create_snapshot(
        db: Session,
        design_id: UUID,
        changes_summary: str,
        prompt: Optional[str] = None,
        scene_data: Optional[dict] = None
    ) -> DesignVersion:
        design = db.query(Design).filter(Design.id == design_id).first()
        if not design:
            raise ValueError("Design not found")

        last_version = db.query(DesignVersion).filter(
            DesignVersion.design_id == design_id
        ).order_by(DesignVersion.version_number.desc()).first()

        next_ver = (last_version.version_number + 1) if last_version else 1

        version = DesignVersion(
            id=uuid.uuid4(),
            design_id=design_id,
            version_number=next_ver,
            prompt=prompt,
            changes_summary=changes_summary,
            estimated_cost=design.estimated_cost,
            image_url=design.image_url,
            scene_data=json.dumps(scene_data) if scene_data else None
        )
        db.add(version)
        db.commit()
        db.refresh(version)
        return version

    @staticmethod
    def list_versions(db: Session, design_id: UUID) -> List[DesignVersion]:
        return db.query(DesignVersion).filter(
            DesignVersion.design_id == design_id
        ).order_by(DesignVersion.version_number.asc()).all()
