"""
Design Preference & Style Discovery API Endpoints
Phase 10: Preference Questionnaire & Interactive Style Engine
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.db.session import get_db
from app.models.user import User as UserModel, UserPreference as UserPreferenceModel
from app.ai.style_analyzer import StyleAnalyzer

router = APIRouter()
analyzer = StyleAnalyzer()

DEMO_USER_ID = UUID("d0000000-0000-0000-0000-000000000000")

class ReferenceImageOut(BaseModel):
    id: str
    title: str
    style: str
    image_url: str
    colours: List[str]
    wood_tone: str
    materials: List[str]
    vibe: str

class ReactionItem(BaseModel):
    image_id: str
    reaction: str  # like, dislike, skip

class LifestyleQuestionnaire(BaseModel):
    lifestyle: Optional[str] = "balanced"
    family_size: Optional[str] = "3-4"
    pets: Optional[bool] = False
    children: Optional[bool] = False
    work_from_home: Optional[str] = "hybrid"
    entertainment: Optional[str] = "frequent"
    storage_requirements: Optional[str] = "high"
    maintenance_preference: Optional[str] = "low_maintenance"

class CalculateStyleRequest(BaseModel):
    reactions: List[ReactionItem]
    questionnaire: Optional[LifestyleQuestionnaire] = None

class StyleProfileOut(BaseModel):
    primary_style: str
    secondary_style: str
    wood_preference: str
    colour_preference: List[str]
    material_preferences: List[str]
    lifestyle: Dict[str, Any]
    confidence_score: float
    style_scores: Optional[Dict[str, float]] = None

@router.get("/reference-images", response_model=List[ReferenceImageOut])
def get_reference_images():
    """Returns curated reference images catalog for interactive style discovery."""
    return analyzer.get_reference_catalog()

@router.post("/calculate-style", response_model=StyleProfileOut)
def calculate_style_profile(payload: CalculateStyleRequest, db: Session = Depends(get_db)):
    """
    Evaluates reactions (LIKE, DISLIKE, SKIP) and questionnaire answers
    to quantify primary style, secondary style, wood tone, and palette.
    """
    reactions_dict = [r.model_dump() for r in payload.reactions]
    q_dict = payload.questionnaire.model_dump() if payload.questionnaire else {}
    profile = analyzer.compute_style_profile(reactions_dict, q_dict)

    # Persist or update user preferences
    user = db.query(UserModel).filter(UserModel.id == DEMO_USER_ID).first()
    if user:
        pref = db.query(UserPreferenceModel).filter(UserPreferenceModel.user_id == user.id).first()
        if not pref:
            pref = UserPreferenceModel(user_id=user.id)
            db.add(pref)
        pref.style = profile["primary_style"]
        pref.colour_preferences = profile["colour_preference"]
        pref.material_preferences = profile["material_preferences"]
        pref.lifestyle_preferences = profile["lifestyle"]
        db.commit()

    return profile

@router.get("", response_model=StyleProfileOut)
@router.get("/", response_model=StyleProfileOut)
def get_current_preferences(db: Session = Depends(get_db)):
    """Retrieves the active user's saved preference & style profile."""
    user = db.query(UserModel).filter(UserModel.id == DEMO_USER_ID).first()
    if user and user.preferences:
        pref = user.preferences
        return {
            "primary_style": pref.style or "warm_contemporary",
            "secondary_style": "minimalist",
            "wood_preference": "high",
            "colour_preference": pref.colour_preferences or ["beige", "cream", "brown"],
            "material_preferences": pref.material_preferences or ["oak", "linen", "brass"],
            "lifestyle": pref.lifestyle_preferences or {},
            "confidence_score": 0.90,
            "style_scores": {pref.style or "warm_contemporary": 2.0}
        }
    
    # Return default initialized profile
    return {
        "primary_style": "warm_contemporary",
        "secondary_style": "minimalist",
        "wood_preference": "high",
        "colour_preference": ["beige", "cream", "brown"],
        "material_preferences": ["oak", "linen", "brass"],
        "lifestyle": {
            "family_size": "3-4",
            "pets": False,
            "children": True,
            "work_from_home": "hybrid",
            "entertainment": "frequent",
            "storage_requirements": "high",
            "maintenance_preference": "low_maintenance"
        },
        "confidence_score": 0.85
    }


class DirectPreferenceUpdate(BaseModel):
    style: Optional[str] = None
    colour_preferences: Optional[List[str]] = None
    material_preferences: Optional[List[str]] = None
    lifestyle_preferences: Optional[Dict[str, Any]] = None


@router.post("/{user_id}", response_model=Dict[str, Any])
@router.put("/{user_id}", response_model=Dict[str, Any])
def update_user_preferences_endpoint(
    user_id: UUID,
    payload: DirectPreferenceUpdate,
    db: Session = Depends(get_db),
):
    """Saves or updates custom style and lifestyle preferences for a user."""
    pref = db.query(UserPreferenceModel).filter(UserPreferenceModel.user_id == user_id).first()
    if not pref:
        pref = UserPreferenceModel(user_id=user_id)
        db.add(pref)
    if payload.style:
        pref.style = payload.style
    if payload.colour_preferences:
        pref.colour_preferences = payload.colour_preferences
    if payload.material_preferences:
        pref.material_preferences = payload.material_preferences
    if payload.lifestyle_preferences:
        pref.lifestyle_preferences = payload.lifestyle_preferences
    db.commit()
    db.refresh(pref)
    return {
        "user_id": str(pref.user_id),
        "style": pref.style,
        "colour_preferences": pref.colour_preferences or [],
        "material_preferences": pref.material_preferences or [],
        "lifestyle_preferences": pref.lifestyle_preferences or {},
    }

