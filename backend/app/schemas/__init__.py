from app.schemas.auth import UserLogin, UserRegister, GoogleAuthRequest, TokenResponse
from app.schemas.user import UserOut, UserPreferenceOut, UserPreferenceUpdate
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from app.schemas.floor import FloorCreate, FloorUpdate, FloorOut
from app.schemas.room import RoomCreate, RoomUpdate, RoomOut
from app.schemas.floorplan import FloorplanAnalysisResponse, FloorplanConfirmRequest, FloorplanOut
from app.schemas.design import DesignCreate, DesignUpdate, DesignOut
from app.schemas.scene import SceneCreate, SceneUpdate, SceneOut, SceneObjectCreate, SceneObjectUpdate, SceneObjectOut
from app.schemas.ai import AIChatRequest, AIChatResponse, AIChangeSuggestion, CheaperAlternative
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetOut, BudgetAllocationCreate, BudgetAllocationOut, BudgetImpactSimulationRequest, BudgetImpactSimulationResponse
from app.schemas.walkthrough import WalkthroughResponse, WalkthroughWaypoint

__all__ = [
    "UserLogin", "UserRegister", "GoogleAuthRequest", "TokenResponse",
    "UserOut", "UserPreferenceOut", "UserPreferenceUpdate",
    "ProjectCreate", "ProjectUpdate", "ProjectOut",
    "FloorCreate", "FloorUpdate", "FloorOut",
    "RoomCreate", "RoomUpdate", "RoomOut",
    "FloorplanAnalysisResponse", "FloorplanConfirmRequest", "FloorplanOut",
    "DesignCreate", "DesignUpdate", "DesignOut",
    "SceneCreate", "SceneUpdate", "SceneOut", "SceneObjectCreate", "SceneObjectUpdate", "SceneObjectOut",
    "AIChatRequest", "AIChatResponse", "AIChangeSuggestion", "CheaperAlternative",
    "BudgetCreate", "BudgetUpdate", "BudgetOut", "BudgetAllocationCreate", "BudgetAllocationOut", "BudgetImpactSimulationRequest", "BudgetImpactSimulationResponse",
    "WalkthroughResponse", "WalkthroughWaypoint",
]
