from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.walkthrough import WalkthroughResponse
from app.services.walkthrough.walkthrough_service import WalkthroughService

router = APIRouter()

@router.get("/projects/{project_id}/walkthrough", response_model=WalkthroughResponse)
def get_project_walkthrough(project_id: UUID, db: Session = Depends(get_db)):
    try:
        return WalkthroughService.generate_project_walkthrough(db, project_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
