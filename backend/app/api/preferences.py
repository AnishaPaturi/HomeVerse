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

def get_or_create_default_user(db: Session) -> UserModel:
    user = db.query(UserModel).filter(UserModel.id == DEMO_USER_ID).first()
    if not user:
        user = UserModel(
            id=DEMO_USER_ID,
            email="designer@homeverse.ai",
            name="Anisha Paturi",
            plan="Pro Designer"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

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
    email: Optional[str] = None
    user_id: Optional[UUID] = None
    current_index: Optional[int] = 0
    active_tab: Optional[str] = "discovery"

class SaveProgressRequest(BaseModel):
    reactions: Optional[List[ReactionItem]] = []
    questionnaire: Optional[LifestyleQuestionnaire] = None
    current_index: Optional[int] = 0
    active_tab: Optional[str] = "discovery"
    email: Optional[str] = None
    user_id: Optional[UUID] = None

class ProgressResponse(BaseModel):
    status: str = "saved"
    current_index: int = 0
    active_tab: str = "discovery"
    reactions: List[Dict[str, str]] = []
    questionnaire: Dict[str, Any] = {}

class StyleProfileOut(BaseModel):
    primary_style: str
    secondary_style: str
    wood_preference: str
    colour_preference: List[str]
    material_preferences: List[str]
    lifestyle: Dict[str, Any]
    confidence_score: float
    style_scores: Optional[Dict[str, float]] = None
    reactions: Optional[List[Dict[str, str]]] = None
    current_index: Optional[int] = 0
    active_tab: Optional[str] = "discovery"

@router.get("/reference-images", response_model=List[ReferenceImageOut])
def get_reference_images():
    """Returns curated reference images catalog for interactive style discovery."""
    return analyzer.get_reference_catalog()

@router.post("/save-progress", response_model=ProgressResponse)
def save_questionnaire_progress(
    payload: SaveProgressRequest,
    db: Session = Depends(get_db)
):
    """
    Saves current question progression and answers so a user who disconnects
    or pauses can resume from the exact same point.
    """
    reactions_dict = [r.model_dump() for r in payload.reactions] if payload.reactions else []
    q_dict = payload.questionnaire.model_dump() if payload.questionnaire else {}
    
    target_id = payload.user_id
    target_email = payload.email
    user = None
    if target_id:
        user = db.query(UserModel).filter(UserModel.id == target_id).first()
    elif target_email:
        user = db.query(UserModel).filter(UserModel.email.ilike(target_email.strip())).first()
    if not user:
        user = get_or_create_default_user(db)

    if user:
        pref = db.query(UserPreferenceModel).filter(UserPreferenceModel.user_id == user.id).first()
        if not pref:
            pref = UserPreferenceModel(user_id=user.id)
            db.add(pref)
        existing_lifestyle = dict(pref.lifestyle_preferences or {})
        existing_lifestyle.update(q_dict)
        existing_lifestyle["discovery_reactions"] = reactions_dict
        existing_lifestyle["discovery_current_index"] = payload.current_index or 0
        existing_lifestyle["discovery_active_tab"] = payload.active_tab or "discovery"
        pref.lifestyle_preferences = existing_lifestyle
        db.commit()

    return {
        "status": "saved",
        "current_index": payload.current_index or 0,
        "active_tab": payload.active_tab or "discovery",
        "reactions": reactions_dict,
        "questionnaire": q_dict
    }

@router.get("/progress", response_model=ProgressResponse)
def get_questionnaire_progress(
    email: Optional[str] = None,
    user_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    """Retrieves saved questionnaire and style discovery progress."""
    user = None
    if user_id:
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
    elif email:
        user = db.query(UserModel).filter(UserModel.email.ilike(email.strip())).first()
    if not user and not email and not user_id:
        user = get_or_create_default_user(db)

    if user and user.preferences and user.preferences.lifestyle_preferences:
        lp = user.preferences.lifestyle_preferences
        return {
            "status": "restored",
            "current_index": lp.get("discovery_current_index", 0),
            "active_tab": lp.get("discovery_active_tab", "discovery"),
            "reactions": lp.get("discovery_reactions", []),
            "questionnaire": {k: v for k, v in lp.items() if not k.startswith("discovery_")}
        }

    return {
        "status": "empty",
        "current_index": 0,
        "active_tab": "discovery",
        "reactions": [],
        "questionnaire": {
            "family_size": "3-4",
            "pets": False,
            "children": True,
            "work_from_home": "hybrid",
            "entertainment": "frequent",
            "storage_requirements": "high",
            "maintenance_preference": "low_maintenance"
        }
    }

@router.post("/calculate-style", response_model=StyleProfileOut)
def calculate_style_profile(
    payload: CalculateStyleRequest,
    email: Optional[str] = None,
    user_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    """
    Evaluates reactions (LIKE, DISLIKE, SKIP) and questionnaire answers
    to quantify primary style, secondary style, wood tone, and palette.
    """
    reactions_dict = [r.model_dump() for r in payload.reactions]
    q_dict = payload.questionnaire.model_dump() if payload.questionnaire else {}
    profile = analyzer.compute_style_profile(reactions_dict, q_dict)

    # Persist or update user preferences with progress metadata
    target_id = payload.user_id or user_id
    target_email = payload.email or email
    user = None
    if target_id:
        user = db.query(UserModel).filter(UserModel.id == target_id).first()
    elif target_email:
        user = db.query(UserModel).filter(UserModel.email.ilike(target_email.strip())).first()
    if not user:
        user = get_or_create_default_user(db)

    saved_lifestyle = dict(profile["lifestyle"])
    saved_lifestyle["discovery_reactions"] = reactions_dict
    saved_lifestyle["discovery_current_index"] = payload.current_index or len(reactions_dict)
    saved_lifestyle["discovery_active_tab"] = payload.active_tab or "discovery"

    if user:
        pref = db.query(UserPreferenceModel).filter(UserPreferenceModel.user_id == user.id).first()
        if not pref:
            pref = UserPreferenceModel(user_id=user.id)
            db.add(pref)
        pref.style = profile["primary_style"]
        pref.colour_preferences = profile["colour_preference"]
        pref.material_preferences = profile["material_preferences"]
        pref.lifestyle_preferences = saved_lifestyle
        db.commit()

    profile["reactions"] = reactions_dict
    profile["current_index"] = payload.current_index or len(reactions_dict)
    profile["active_tab"] = payload.active_tab or "discovery"
    return profile

@router.get("", response_model=StyleProfileOut)
@router.get("/", response_model=StyleProfileOut)
def get_current_preferences(
    email: Optional[str] = None,
    user_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    """Retrieves the active user's saved preference & style profile."""
    user = None
    if user_id:
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
    elif email:
        user = db.query(UserModel).filter(UserModel.email.ilike(email.strip())).first()
    if not user and not email and not user_id:
        user = get_or_create_default_user(db)

    if user and user.preferences:
        pref = user.preferences
        lp = pref.lifestyle_preferences or {}
        return {
            "primary_style": pref.style or "warm_contemporary",
            "secondary_style": "minimalist",
            "wood_preference": "high",
            "colour_preference": pref.colour_preferences or ["beige", "cream", "brown"],
            "material_preferences": pref.material_preferences or ["oak", "linen", "brass"],
            "lifestyle": {k: v for k, v in lp.items() if not k.startswith("discovery_")},
            "confidence_score": 0.90,
            "style_scores": {pref.style or "warm_contemporary": 2.0},
            "reactions": lp.get("discovery_reactions", []),
            "current_index": lp.get("discovery_current_index", 0),
            "active_tab": lp.get("discovery_active_tab", "discovery")
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
        "confidence_score": 0.85,
        "reactions": [],
        "current_index": 0,
        "active_tab": "discovery"
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

