"""
HomeVerse Advanced Material Visualization API (Phase 49 - Version 3)
- Physically Based Rendering (PBR) material definitions (Albedo, Roughness, Metalness, Normal)
- Physical properties, maintenance scores, eco ratings, cost per sq ft
- Side-by-side technical and cost comparison engine (e.g. Italian Marble vs Vitrified Tiles)
"""

from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.material import Material as MaterialModel

router = APIRouter()

class MaterialBase(BaseModel):
    name: str
    category: str  # wood, stone, fabric, metal, paint, glass
    code: Optional[str] = None
    albedo_color: str = "#FFFFFF"
    roughness: float = 0.5
    metalness: float = 0.0
    normal_scale: float = 1.0
    cost_per_sqft: float = 0.0
    texture_url: Optional[str] = None
    durability_rating: float = 4.5
    maintenance_score: float = 4.0
    eco_rating: str = "A"
    description: Optional[str] = None

class MaterialCreate(MaterialBase):
    pass

class MaterialOut(MaterialBase):
    id: UUID
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class MaterialCompareRequest(BaseModel):
    material_a_id: UUID
    material_b_id: UUID
    area_sqft: Optional[float] = None
    room_area_sqft: Optional[float] = None

class MaterialComparisonResult(BaseModel):
    material_a: MaterialOut
    material_b: MaterialOut
    area_sqft: float
    cost_a: float
    cost_b: float
    total_cost_a: float = 0.0
    total_cost_b: float = 0.0
    cost_difference: float
    savings_percentage: float
    durability_comparison: str
    maintenance_comparison: str
    recommendation: str
    technical_tradeoffs: List[str] = []

CANONICAL_MATERIALS = [
    # Woods
    {
        "name": "American Black Walnut",
        "category": "wood",
        "code": "MAT-WD-WALNUT",
        "albedo_color": "#5C4033",
        "roughness": 0.35,
        "metalness": 0.04,
        "normal_scale": 1.1,
        "cost_per_sqft": 320.0,
        "texture_url": "https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=800",
        "durability_rating": 4.8,
        "maintenance_score": 4.2,
        "eco_rating": "A+",
        "description": "Deep lustrous grain with organic chocolate undertones. Natural oil sealed.",
    },
    {
        "name": "European White Oak",
        "category": "wood",
        "code": "MAT-WD-OAK",
        "albedo_color": "#D4A373",
        "roughness": 0.40,
        "metalness": 0.02,
        "normal_scale": 1.0,
        "cost_per_sqft": 280.0,
        "texture_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
        "durability_rating": 4.7,
        "maintenance_score": 4.5,
        "eco_rating": "A",
        "description": "Subtle wire-brushed texture with champagne honey tones and matte water-based polyurethane seal.",
    },
    # Stones
    {
        "name": "Italian Statuario Marble",
        "category": "stone",
        "code": "MAT-ST-STATUARIO",
        "albedo_color": "#F4F3EF",
        "roughness": 0.15,
        "metalness": 0.0,
        "normal_scale": 0.6,
        "cost_per_sqft": 550.0,
        "texture_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
        "durability_rating": 4.2,
        "maintenance_score": 3.0,
        "eco_rating": "B+",
        "description": "Dramatic bold grey feathery veining on crystalline pure white ground. Requires quarterly impregnating seal.",
    },
    {
        "name": "Large-Format Glazed Vitrified Tile",
        "category": "stone",
        "code": "MAT-ST-GVT-SLAB",
        "albedo_color": "#EFECE6",
        "roughness": 0.12,
        "metalness": 0.0,
        "normal_scale": 0.4,
        "cost_per_sqft": 180.0,
        "texture_url": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800",
        "durability_rating": 4.9,
        "maintenance_score": 5.0,
        "eco_rating": "A",
        "description": "1200x1800mm seamless porcelain slab reproducing natural Carrara veining with zero porosity and stain resistance.",
    },
    {
        "name": "Nero Marquina Marble",
        "category": "stone",
        "code": "MAT-ST-MARQUINA",
        "albedo_color": "#1C1C1C",
        "roughness": 0.18,
        "metalness": 0.0,
        "normal_scale": 0.5,
        "cost_per_sqft": 480.0,
        "texture_url": "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800",
        "durability_rating": 4.3,
        "maintenance_score": 3.4,
        "eco_rating": "B",
        "description": "Velvety deep black limestone with bright white calcite veining for high-contrast accents.",
    },
    {
        "name": "Venetian Terrazzo",
        "category": "stone",
        "code": "MAT-ST-TERRAZZO",
        "albedo_color": "#E4DDD3",
        "roughness": 0.22,
        "metalness": 0.0,
        "normal_scale": 0.8,
        "cost_per_sqft": 240.0,
        "texture_url": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800",
        "durability_rating": 4.8,
        "maintenance_score": 4.6,
        "eco_rating": "A+",
        "description": "Recycled marble chips cast in low-VOC off-white cementitious matrix, polished to satin hone.",
    },
    # Fabrics
    {
        "name": "Oatmeal Tactile Boucle",
        "category": "fabric",
        "code": "MAT-FB-BOUCLE",
        "albedo_color": "#E2DCD1",
        "roughness": 0.85,
        "metalness": 0.0,
        "normal_scale": 1.8,
        "cost_per_sqft": 140.0,
        "texture_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
        "durability_rating": 4.4,
        "maintenance_score": 3.8,
        "eco_rating": "A",
        "description": "Looped curly yarn offering cozy architectural texture with 40,000 Martindale rub count.",
    },
    {
        "name": "Commercial-Grade Stain-Resistant Weave",
        "category": "fabric",
        "code": "MAT-FB-PERF-WEAVE",
        "albedo_color": "#D6D1C7",
        "roughness": 0.75,
        "metalness": 0.0,
        "normal_scale": 1.4,
        "cost_per_sqft": 85.0,
        "texture_url": "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800",
        "durability_rating": 4.9,
        "maintenance_score": 4.9,
        "eco_rating": "A",
        "description": "Crypton-treated tight micro-weave resistant to moisture, pet stains, and high friction (100,000 rubs).",
    },
    # Metals
    {
        "name": "Brushed Architectural Brass",
        "category": "metal",
        "code": "MAT-MT-BRASS",
        "albedo_color": "#D4AF37",
        "roughness": 0.28,
        "metalness": 0.88,
        "normal_scale": 0.7,
        "cost_per_sqft": 450.0,
        "texture_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
        "durability_rating": 4.8,
        "maintenance_score": 4.4,
        "eco_rating": "A+",
        "description": "Directional satin-brushed raw brass coated in micro-crystalline wax against oxidization.",
    },
    {
        "name": "Matte Black Powdercoat",
        "category": "metal",
        "code": "MAT-MT-BLACK",
        "albedo_color": "#1C1C1C",
        "roughness": 0.65,
        "metalness": 0.35,
        "normal_scale": 0.5,
        "cost_per_sqft": 220.0,
        "texture_url": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800",
        "durability_rating": 4.9,
        "maintenance_score": 4.8,
        "eco_rating": "A",
        "description": "Electrostatically applied thermoset polymer finish with fine texture resisting scuffs and UV fading.",
    },
    # Paint / Finishes
    {
        "name": "Designer Warm Greige Wall Coat",
        "category": "paint",
        "code": "MAT-PT-GREIGE",
        "albedo_color": "#D8D0C5",
        "roughness": 0.70,
        "metalness": 0.0,
        "normal_scale": 0.3,
        "cost_per_sqft": 45.0,
        "texture_url": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
        "durability_rating": 4.6,
        "maintenance_score": 4.5,
        "eco_rating": "A+",
        "description": "Zero-VOC washable matte architectural emulsion with Light Reflectance Value (LRV) 65.",
    },
    {
        "name": "Fluted Charcoal Acoustic Slats",
        "category": "wood",
        "code": "MAT-FL-SLATS",
        "albedo_color": "#2A2A2A",
        "roughness": 0.60,
        "metalness": 0.05,
        "normal_scale": 2.0,
        "cost_per_sqft": 190.0,
        "texture_url": "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800",
        "durability_rating": 4.8,
        "maintenance_score": 4.6,
        "eco_rating": "A+",
        "description": "3D fluted natural veneer slats backed by recycled PET acoustic felt with 0.85 NRC rating.",
    },
]

def seed_canonical_materials_if_empty(db: Session):
    for m in CANONICAL_MATERIALS:
        existing = db.query(MaterialModel).filter(MaterialModel.name == m["name"]).first()
        if not existing:
            mat = MaterialModel(**m)
            db.add(mat)
    db.commit()


@router.get("", response_model=List[MaterialOut])
@router.get("/", response_model=List[MaterialOut])
def list_materials(
    category: Optional[str] = None,
    search: Optional[str] = None,
    max_cost: Optional[float] = None,
    db: Session = Depends(get_db),
):
    """
    Phase 49: Advanced Material Visualization.
    Lists PBR materials with physical attributes (albedo, roughness, metalness, normal).
    """
    seed_canonical_materials_if_empty(db)
    query = db.query(MaterialModel)

    if category and category.lower() != "all":
        query = query.filter(MaterialModel.category.ilike(f"%{category.strip()}%"))
    if max_cost is not None:
        query = query.filter(MaterialModel.cost_per_sqft <= max_cost)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                MaterialModel.name.ilike(s),
                MaterialModel.category.ilike(s),
                MaterialModel.description.ilike(s),
                MaterialModel.code.ilike(s),
            )
        )

    return query.order_by(MaterialModel.category.asc(), MaterialModel.cost_per_sqft.asc()).all()


@router.get("/{material_id}", response_model=MaterialOut)
def get_material_details(material_id: UUID, db: Session = Depends(get_db)):
    """Retrieves full PBR physical specifications for a single material."""
    seed_canonical_materials_if_empty(db)
    mat = db.query(MaterialModel).filter(MaterialModel.id == material_id).first()
    if not mat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    return mat


@router.post("/compare", response_model=MaterialComparisonResult)
def compare_materials(req: MaterialCompareRequest, db: Session = Depends(get_db)):
    """
    Phase 49: Side-by-side technical, durability, and cost impact comparison engine.
    e.g. Italian Marble vs Large-Format Vitrified Tile across a 280 sqft living room floor.
    """
    seed_canonical_materials_if_empty(db)
    mat_a = db.query(MaterialModel).filter(MaterialModel.id == req.material_a_id).first()
    mat_b = db.query(MaterialModel).filter(MaterialModel.id == req.material_b_id).first()

    if not mat_a or not mat_b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or both materials not found")

    area = req.area_sqft or req.room_area_sqft or 280.0
    total_a = round(mat_a.cost_per_sqft * area, 2)
    total_b = round(mat_b.cost_per_sqft * area, 2)
    diff = round(total_a - total_b, 2)
    pct = round((abs(diff) / max(total_a, total_b) * 100.0), 1) if max(total_a, total_b) > 0 else 0.0

    durability_cmp = (
        f"{mat_a.name} (Durability: {mat_a.durability_rating}/5.0) vs "
        f"{mat_b.name} (Durability: {mat_b.durability_rating}/5.0)."
    )

    maintenance_cmp = (
        f"{mat_a.name} (Maintenance score: {mat_a.maintenance_score}/5.0) vs "
        f"{mat_b.name} (Maintenance score: {mat_b.maintenance_score}/5.0)."
    )

    technical_tradeoffs = [
        f"{mat_a.name}: Roughness {mat_a.roughness}, Metalness {mat_a.metalness}, Durability {mat_a.durability_rating}/5.0",
        f"{mat_b.name}: Roughness {mat_b.roughness}, Metalness {mat_b.metalness}, Durability {mat_b.durability_rating}/5.0",
        f"Eco Rating: {mat_a.eco_rating} ({mat_a.name}) vs {mat_b.eco_rating} ({mat_b.name})",
    ]

    if diff > 0:
        recommendation = (
            f"Choosing {mat_b.name} over {mat_a.name} saves ₹{abs(diff):,.0f} ({pct}%) for {area:.0f} sq ft "
            f"with higher stain resistance and lower long-term maintenance overhead."
        )
    elif diff < 0:
        recommendation = (
            f"Upgrading to {mat_b.name} adds ₹{abs(diff):,.0f} (+{pct}%) for an ultra-luxury bespoke aesthetic."
        )
    else:
        recommendation = f"Both materials have identical installed costs (₹{total_a:,.0f})."

    return MaterialComparisonResult(
        material_a=MaterialOut.model_validate(mat_a),
        material_b=MaterialOut.model_validate(mat_b),
        area_sqft=area,
        cost_a=total_a,
        cost_b=total_b,
        total_cost_a=total_a,
        total_cost_b=total_b,
        cost_difference=diff,
        savings_percentage=pct,
        durability_comparison=durability_cmp,
        maintenance_comparison=maintenance_cmp,
        recommendation=recommendation,
        technical_tradeoffs=technical_tradeoffs,
    )


@router.post("", response_model=MaterialOut, status_code=status.HTTP_201_CREATED)
def create_material(mat_in: MaterialCreate, db: Session = Depends(get_db)):
    """Creates a custom architectural material."""
    mat = MaterialModel(**mat_in.model_dump())
    db.add(mat)
    db.commit()
    db.refresh(mat)
    return mat
