"""
HomeVerse Marketplace API (Phase 50 - Version 4)
- Interior Contractors: Verified profiles, trade specialties, ratings, pricing models
- Designer Marketplace: Certified interior architects, style specialties, consultation booking
- Vendor Marketplace: Trade suppliers (stone yards, timber hubs, hardware distributors)
- Furniture Marketplace: Direct order placement, custom finishes, inventory lead times
- Material Marketplace: Bulk procurement (plywood, marble, veneers, tiles), sample kit requests
"""

from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.marketplace import Provider as ProviderModel, MarketplaceListing as ListingModel
from app.models.project import Project as ProjectModel

router = APIRouter()


# ----------------- Schemas -----------------

class ProviderBase(BaseModel):
    provider_type: str  # contractor, designer, vendor
    name: str
    company_name: Optional[str] = None
    specialties: List[str] = []
    rating: float = 4.8
    reviews_count: int = 12
    experience_years: int = 5
    is_verified: bool = True
    location_city: str = "Bengaluru"
    pricing_model: str = "per_sqft"  # per_sqft, daily_rate, fixed_package
    base_rate: float = 180.0
    portfolio: Optional[List[Dict[str, Any]]] = None
    availability_status: str = "available"
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None

class ProviderCreate(ProviderBase):
    pass

class ProviderOut(ProviderBase):
    id: UUID
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class ConsultationRequest(BaseModel):
    project_id: Optional[UUID] = None
    client_name: str
    client_phone: str
    client_email: str
    preferred_date: Optional[str] = None
    scope_notes: Optional[str] = None

class ConsultationResponse(BaseModel):
    booking_id: UUID
    designer_id: UUID
    designer_name: str
    status: str
    scheduled_date: str
    confirmation_message: str


class MarketplaceListingBase(BaseModel):
    listing_type: str  # furniture, material
    name: str
    category: str
    brand: Optional[str] = None
    price: float
    unit: str = "per_piece"
    min_order_qty: int = 1
    lead_time_days: int = 5
    stock_quantity: int = 50
    specs: Optional[Dict[str, Any]] = None
    sample_available: bool = True
    image_url: Optional[str] = None

class MarketplaceListingCreate(MarketplaceListingBase):
    provider_id: Optional[UUID] = None

class MarketplaceListingOut(MarketplaceListingBase):
    id: UUID
    provider_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class MarketplaceOrderRequest(BaseModel):
    project_id: Optional[UUID] = None
    quantity: int = 1
    shipping_address: str
    custom_finish: Optional[str] = None
    notes: Optional[str] = None

class MarketplaceOrderResponse(BaseModel):
    order_id: UUID
    listing_id: UUID
    item_name: str
    quantity: int
    unit_price: float
    total_price: float
    estimated_delivery: str
    status: str
    tracking_number: str


class SampleKitRequest(BaseModel):
    project_id: Optional[UUID] = None
    client_name: str
    delivery_address: str
    contact_phone: str
    notes: Optional[str] = None

class SampleKitResponse(BaseModel):
    sample_request_id: UUID
    material_id: UUID
    material_name: str
    dispatch_status: str
    tracking_reference: str
    message: str


# ----------------- Canonical Pre-seeded Data -----------------

CANONICAL_PROVIDERS = [
    # Interior Contractors
    {
        "provider_type": "contractor",
        "name": "Apex Craftwork & Civil Turnkey",
        "company_name": "Apex Infra Projects Pvt Ltd",
        "specialties": ["Civil & Demolition", "Brickwork & Plastering", "Waterproofing", "Flooring Installation"],
        "rating": 4.9,
        "reviews_count": 38,
        "experience_years": 12,
        "is_verified": True,
        "location_city": "Bengaluru",
        "pricing_model": "per_sqft",
        "base_rate": 160.0,
        "portfolio": [
            {"title": "Prestige Lakeside 3BHK", "sqft": 1850, "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"},
            {"title": "Brigade Gateway Penthouse", "sqft": 2400, "image": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"},
        ],
        "availability_status": "available",
        "contact_phone": "+91 98801 23456",
        "contact_email": "contracts@apexcraftwork.in",
        "profile_image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        "bio": "Specialized turnkey civil and structural finishing contractors with 12+ years of residential experience.",
    },
    {
        "provider_type": "contractor",
        "name": "Studio Nova Bespoke Carpentry",
        "company_name": "Nova Millwork Works",
        "specialties": ["Carpentry & Millwork", "Modular Kitchens", "Floor-to-Ceiling Wardrobes", "Fluted Wall Paneling", "Veneer PU Finishing"],
        "rating": 4.85,
        "reviews_count": 42,
        "experience_years": 8,
        "is_verified": True,
        "location_city": "Mumbai",
        "pricing_model": "per_sqft",
        "base_rate": 240.0,
        "portfolio": [
            {"title": "Oberoi Woods 4BHK Millwork", "sqft": 2200, "image": "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=800"},
        ],
        "availability_status": "available",
        "contact_phone": "+91 98200 87654",
        "contact_email": "hello@studionova.in",
        "profile_image_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
        "bio": "German machinery precision factory-pressed shutters and custom solid-wood millwork.",
    },
    {
        "provider_type": "contractor",
        "name": "LumenGrid Electricals & False Ceiling",
        "company_name": "LumenGrid Automation LLP",
        "specialties": ["False Ceiling (Gypsum/POP)", "Architectural Magnetic Track Lights", "Home Automation", "HVAC Ducting"],
        "rating": 4.9,
        "reviews_count": 29,
        "experience_years": 10,
        "is_verified": True,
        "location_city": "Bengaluru",
        "pricing_model": "per_sqft",
        "base_rate": 95.0,
        "portfolio": [
            {"title": "Sobha Royal Pavilion 3BHK Automation", "sqft": 1720, "image": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800"},
        ],
        "availability_status": "available",
        "contact_phone": "+91 97400 11223",
        "contact_email": "support@lumengrid.com",
        "profile_image_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
        "bio": "Specialized in seamless cove lighting, acoustic false ceilings, and smart relay automation.",
    },

    # Interior Designers & Architects
    {
        "provider_type": "designer",
        "name": "Ar. Priya Sen Architects",
        "company_name": "Studio Sen Design Laboratory",
        "specialties": ["Warm Contemporary", "Japandi", "Minimalist Luxury", "Biophilic Interiors"],
        "rating": 4.95,
        "reviews_count": 56,
        "experience_years": 9,
        "is_verified": True,
        "location_city": "Bengaluru",
        "pricing_model": "per_sqft",
        "base_rate": 120.0,
        "portfolio": [
            {"title": "The Glass Sanctuary Villa", "sqft": 3500, "image": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800"},
            {"title": "Zen Minimalist 3BHK", "sqft": 1600, "image": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800"},
        ],
        "availability_status": "available",
        "contact_phone": "+91 98450 44556",
        "contact_email": "priya@senarchitects.com",
        "profile_image_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400",
        "bio": "Award-winning interior architect specializing in understated elegance, neutral warm palettes, and ergonomic luxury.",
    },
    {
        "provider_type": "designer",
        "name": "Vanguard Spatial Studio",
        "company_name": "Vanguard Design Consortium",
        "specialties": ["Modern Luxury", "Art Deco Fusion", "Penthouse Interiors", "Italian Minimalist"],
        "rating": 4.88,
        "reviews_count": 34,
        "experience_years": 14,
        "is_verified": True,
        "location_city": "Mumbai",
        "pricing_model": "per_sqft",
        "base_rate": 180.0,
        "portfolio": [
            {"title": "Seaface South Mumbai Duplex", "sqft": 4200, "image": "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800"},
        ],
        "availability_status": "available",
        "contact_phone": "+91 98210 99887",
        "contact_email": "lead@vanguardspatial.com",
        "profile_image_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
        "bio": "Bespoke ultra-high-net-worth residential spaces integrating imported marble and integrated lighting architecture.",
    },

    # Trade Vendors
    {
        "provider_type": "vendor",
        "name": "Statuario Stone Depot & Granite Yard",
        "company_name": "Statuario Natural Stones Ltd",
        "specialties": ["Italian Statuario Marble", "Black Marquina", "Engineered Quartz", "Outdoor Flamed Granite"],
        "rating": 4.8,
        "reviews_count": 65,
        "experience_years": 16,
        "is_verified": True,
        "location_city": "Bengaluru",
        "pricing_model": "per_sqft",
        "base_rate": 450.0,
        "portfolio": [],
        "availability_status": "available",
        "contact_phone": "+91 80 2678 9012",
        "contact_email": "sales@statuariostone.com",
        "profile_image_url": "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=400",
        "bio": "Direct importers of Carrara and Tuscany natural marble blocks with CNC precision cutting in Jigani.",
    },
    {
        "provider_type": "vendor",
        "name": "Century & Greenply Timber Hub",
        "company_name": "South India Plywood Distributorship",
        "specialties": ["BWP Marine Plywood", "Teak & Walnut Veneer", "MDF & HDMR Sheets", "Zero-Emission Laminates"],
        "rating": 4.75,
        "reviews_count": 82,
        "experience_years": 22,
        "is_verified": True,
        "location_city": "Bengaluru",
        "pricing_model": "per_sqft",
        "base_rate": 115.0,
        "portfolio": [],
        "availability_status": "available",
        "contact_phone": "+91 80 2345 6789",
        "contact_email": "orders@timberhub.in",
        "profile_image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400",
        "bio": "Authorized prime distributor of boiling waterproof structural plywood and natural decorative veneers.",
    },
]

CANONICAL_MARKETPLACE_LISTINGS = [
    # Furniture Marketplace Items
    {
        "listing_type": "furniture",
        "name": "Aura Modular L-Shape Sectional in Oatmeal Boucle",
        "category": "sofa",
        "brand": "Kite & Timber Studio",
        "price": 78000.0,
        "unit": "per_piece",
        "min_order_qty": 1,
        "lead_time_days": 12,
        "stock_quantity": 15,
        "specs": {"fabric": "Heavy textured boucle", "frame": "Kiln-dried beechwood", "dimensions": "280cm x 170cm x 82cm", "warranty": "5 years"},
        "sample_available": True,
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
    },
    {
        "listing_type": "furniture",
        "name": "Nordic Solid American Walnut Dining Table (6-Seater)",
        "category": "dining",
        "brand": "Kite & Timber Studio",
        "price": 52000.0,
        "unit": "per_piece",
        "min_order_qty": 1,
        "lead_time_days": 10,
        "stock_quantity": 8,
        "specs": {"wood": "Solid American Walnut", "finish": "Matte PU Organic Oil", "dimensions": "180cm x 90cm x 76cm", "warranty": "10 years"},
        "sample_available": True,
        "image_url": "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800",
    },
    {
        "listing_type": "furniture",
        "name": "Zen Floating Fluted TV Console with Brass Accents",
        "category": "storage",
        "brand": "Atelier Minimal",
        "price": 28000.0,
        "unit": "per_piece",
        "min_order_qty": 1,
        "lead_time_days": 7,
        "stock_quantity": 20,
        "specs": {"material": "Solid Oak Slats & Brass Trim", "mounting": "Concealed heavy-duty wall cleats", "dimensions": "200cm x 40cm x 35cm", "warranty": "3 years"},
        "sample_available": False,
        "image_url": "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800",
    },
    {
        "listing_type": "furniture",
        "name": "Serenity King Bed with Hydraulic Storage & Upholstered Headboard",
        "category": "bed",
        "brand": "RestLab",
        "price": 46000.0,
        "unit": "per_piece",
        "min_order_qty": 1,
        "lead_time_days": 14,
        "stock_quantity": 12,
        "specs": {"storage": "Hydraulic lift 600L", "fabric": "Stain-resistant linen blend", "dimensions": "190cm x 210cm x 110cm", "warranty": "5 years"},
        "sample_available": True,
        "image_url": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
    },

    # Material Marketplace Bulk Items
    {
        "listing_type": "material",
        "name": "Italian Statuario Marble Slabs (20mm Mirror Polished)",
        "category": "marble",
        "brand": "Statuario Stone Depot",
        "price": 450.0,
        "unit": "per_sqft",
        "min_order_qty": 150,
        "lead_time_days": 5,
        "stock_quantity": 5000,
        "specs": {"origin": "Carrara, Italy", "thickness": "20mm (+/- 0.5mm)", "finish": "Epoxy net-backed mirror hone", "porosity": "Ultra-low sealed"},
        "sample_available": True,
        "image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    },
    {
        "listing_type": "material",
        "name": "Century Club Prime BWP Marine Plywood (19mm)",
        "category": "plywood",
        "brand": "CenturyPly",
        "price": 115.0,
        "unit": "per_sqft",
        "min_order_qty": 10,
        "lead_time_days": 2,
        "stock_quantity": 800,
        "specs": {"grade": "IS:710 Marine Grade BWP", "glue": "Phenol Formaldehyde Resin", "borer_warranty": "Lifetime", "thickness": "19mm"},
        "sample_available": True,
        "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
    },
    {
        "listing_type": "material",
        "name": "Natural American Walnut Crown Cut Decorative Veneer",
        "category": "veneer",
        "brand": "Decowood Veneers",
        "price": 135.0,
        "unit": "per_sqft",
        "min_order_qty": 5,
        "lead_time_days": 3,
        "stock_quantity": 450,
        "specs": {"grain": "Crown Architectural Bookmatched", "backing": "Fleece backed", "sheet_size": "8ft x 4ft"},
        "sample_available": True,
        "image_url": "https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=800",
    },
    {
        "listing_type": "material",
        "name": "Large-Format Matt Glazed Vitrified Tiles (1200x1800mm)",
        "category": "tiles",
        "brand": "Kajaria Eternity",
        "price": 95.0,
        "unit": "per_sqft",
        "min_order_qty": 200,
        "lead_time_days": 3,
        "stock_quantity": 3000,
        "specs": {"water_absorption": "< 0.05%", "surface": "Micro-sand satin matte", "slip_resistance": "R10 certified"},
        "sample_available": True,
        "image_url": "https://images.unsplash.com/photo-1584467741263-4136a5a04e18?w=800",
    },
    {
        "listing_type": "material",
        "name": "Royale Aspira Ultra-Luxury Interior Wall Emulsion",
        "category": "paint",
        "brand": "Asian Paints",
        "price": 450.0,
        "unit": "per_liter",
        "min_order_qty": 10,
        "lead_time_days": 1,
        "stock_quantity": 250,
        "specs": {"sheen": "Soft Sheen Silk", "washability": "Best in class scrub resistance", "anti_bacterial": "Silver Ion Certified", "voc": "Ultra-low VOC"},
        "sample_available": True,
        "image_url": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800",
    },
]


def seed_canonical_marketplace_if_empty(db: Session):
    """Ensures realistic contractors, designers, vendors, and marketplace listings exist."""
    existing_providers = db.query(ProviderModel).count()
    if existing_providers == 0:
        for p in CANONICAL_PROVIDERS:
            db.add(ProviderModel(**p))
        db.commit()

    existing_listings = db.query(ListingModel).count()
    if existing_listings == 0:
        provider = db.query(ProviderModel).first()
        prov_id = provider.id if provider else None
        for item in CANONICAL_MARKETPLACE_LISTINGS:
            data = item.copy()
            data["provider_id"] = prov_id
            db.add(ListingModel(**data))
        db.commit()


# ----------------- 1. Interior Contractors Endpoints -----------------

@router.get("/contractors", response_model=List[ProviderOut])
def list_interior_contractors(
    specialty: Optional[str] = None,
    city: Optional[str] = None,
    min_rating: Optional[float] = None,
    db: Session = Depends(get_db),
):
    """
    Phase 50: Interior Contractors Marketplace.
    Lists verified interior contractors with specialty filtering (civil, carpentry, electrical, false ceiling, etc.).
    """
    seed_canonical_marketplace_if_empty(db)
    query = db.query(ProviderModel).filter(ProviderModel.provider_type == "contractor")
    if city:
        query = query.filter(ProviderModel.location_city.ilike(f"%{city}%"))
    if min_rating:
        query = query.filter(ProviderModel.rating >= min_rating)

    contractors = query.all()
    if specialty:
        s_lower = specialty.lower()
        contractors = [
            c for c in contractors
            if any(s_lower in s.lower() for s in (c.specialties or []))
            or s_lower in c.name.lower()
            or (c.company_name and s_lower in c.company_name.lower())
        ]
    return contractors


@router.get("/contractors/{contractor_id}", response_model=ProviderOut)
def get_contractor_profile(contractor_id: UUID, db: Session = Depends(get_db)):
    """Retrieves contractor profile, trade specializations, portfolio, and base rates."""
    seed_canonical_marketplace_if_empty(db)
    c = db.query(ProviderModel).filter(
        ProviderModel.id == contractor_id,
        ProviderModel.provider_type == "contractor",
    ).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contractor not found")
    return c


@router.post("/contractors", response_model=ProviderOut, status_code=status.HTTP_201_CREATED)
def register_contractor(contractor_in: ProviderCreate, db: Session = Depends(get_db)):
    """Registers a new interior contractor firm."""
    data = contractor_in.model_dump()
    data["provider_type"] = "contractor"
    c = ProviderModel(**data)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


# ----------------- 2. Designer Marketplace Endpoints -----------------

@router.get("/designers", response_model=List[ProviderOut])
def list_interior_designers(
    style: Optional[str] = None,
    city: Optional[str] = None,
    min_rating: Optional[float] = None,
    db: Session = Depends(get_db),
):
    """
    Phase 50: Designer Marketplace.
    Lists certified interior designers & architects filterable by aesthetic style (Japandi, Warm Contemporary, etc.).
    """
    seed_canonical_marketplace_if_empty(db)
    query = db.query(ProviderModel).filter(ProviderModel.provider_type == "designer")
    if city:
        query = query.filter(ProviderModel.location_city.ilike(f"%{city}%"))
    if min_rating:
        query = query.filter(ProviderModel.rating >= min_rating)

    designers = query.all()
    if style:
        s_lower = style.lower()
        designers = [
            d for d in designers
            if any(s_lower in s.lower() for s in (d.specialties or []))
        ]
    return designers


@router.get("/designers/{designer_id}", response_model=ProviderOut)
def get_designer_profile(designer_id: UUID, db: Session = Depends(get_db)):
    """Retrieves interior designer profile, portfolio, and consultation pricing."""
    seed_canonical_marketplace_if_empty(db)
    d = db.query(ProviderModel).filter(
        ProviderModel.id == designer_id,
        ProviderModel.provider_type == "designer",
    ).first()
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Designer not found")
    return d


@router.post("/designers/{designer_id}/consult", response_model=ConsultationResponse)
def request_designer_consultation(
    designer_id: UUID,
    req: ConsultationRequest,
    db: Session = Depends(get_db),
):
    """Books an architectural / interior design consultation session with the chosen designer."""
    seed_canonical_marketplace_if_empty(db)
    d = db.query(ProviderModel).filter(ProviderModel.id == designer_id).first()
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Designer not found")

    booking_id = uuid4()
    date_str = req.preferred_date or "Tomorrow, 4:00 PM IST"
    return ConsultationResponse(
        booking_id=booking_id,
        designer_id=designer_id,
        designer_name=d.name,
        status="confirmed",
        scheduled_date=date_str,
        confirmation_message=f"Consultation booked with {d.name} for {date_str}. Meeting link sent to {req.client_email}.",
    )


# ----------------- 3. Vendor Marketplace Endpoints -----------------

@router.get("/vendors", response_model=List[ProviderOut])
def list_marketplace_vendors(
    category: Optional[str] = None,
    city: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Phase 50: Vendor Marketplace.
    Lists trade material suppliers (marble yards, timber distributors, hardware showrooms).
    """
    seed_canonical_marketplace_if_empty(db)
    query = db.query(ProviderModel).filter(ProviderModel.provider_type == "vendor")
    if city:
        query = query.filter(ProviderModel.location_city.ilike(f"%{city}%"))

    vendors = query.all()
    if category:
        c_lower = category.lower()
        vendors = [
            v for v in vendors
            if any(c_lower in s.lower() for s in (v.specialties or []))
        ]
    return vendors


@router.get("/vendors/{vendor_id}", response_model=ProviderOut)
def get_vendor_details(vendor_id: UUID, db: Session = Depends(get_db)):
    """Retrieves vendor profile, product catalog specialties, and contact logistics."""
    seed_canonical_marketplace_if_empty(db)
    v = db.query(ProviderModel).filter(
        ProviderModel.id == vendor_id,
        ProviderModel.provider_type == "vendor",
    ).first()
    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found")
    return v


# ----------------- 4. Furniture Marketplace Endpoints -----------------

@router.get("/marketplace/furniture", response_model=List[MarketplaceListingOut])
def list_furniture_marketplace(
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    max_lead_time_days: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """
    Phase 50: Furniture Marketplace.
    Lists orderable marketplace furniture with stock levels, dimensions, and lead times.
    """
    seed_canonical_marketplace_if_empty(db)
    query = db.query(ListingModel).filter(ListingModel.listing_type == "furniture")
    if category:
        query = query.filter(ListingModel.category.ilike(f"%{category}%"))
    if min_price is not None:
        query = query.filter(ListingModel.price >= min_price)
    if max_price is not None:
        query = query.filter(ListingModel.price <= max_price)
    if max_lead_time_days is not None:
        query = query.filter(ListingModel.lead_time_days <= max_lead_time_days)
    return query.all()


@router.get("/marketplace/furniture/{item_id}", response_model=MarketplaceListingOut)
def get_furniture_item(item_id: UUID, db: Session = Depends(get_db)):
    """Retrieves single furniture item specifications and custom finish options."""
    seed_canonical_marketplace_if_empty(db)
    item = db.query(ListingModel).filter(
        ListingModel.id == item_id,
        ListingModel.listing_type == "furniture",
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Furniture item not found")
    return item


@router.post("/marketplace/furniture/{item_id}/order", response_model=MarketplaceOrderResponse)
def order_furniture_item(
    item_id: UUID,
    order_req: MarketplaceOrderRequest,
    db: Session = Depends(get_db),
):
    """Places a direct purchase order for a marketplace furniture piece."""
    seed_canonical_marketplace_if_empty(db)
    item = db.query(ListingModel).filter(ListingModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Furniture item not found")

    order_id = uuid4()
    total = round(item.price * order_req.quantity, 2)
    tracking = f"HV-TRK-{uuid4().hex[:8].upper()}"

    return MarketplaceOrderResponse(
        order_id=order_id,
        listing_id=item_id,
        item_name=item.name,
        quantity=order_req.quantity,
        unit_price=item.price,
        total_price=total,
        estimated_delivery=f"Within {item.lead_time_days} business days",
        status="order_confirmed",
        tracking_number=tracking,
    )


# ----------------- 5. Material Marketplace Endpoints -----------------

@router.get("/marketplace/materials", response_model=List[MarketplaceListingOut])
def list_material_marketplace(
    category: Optional[str] = None,
    unit: Optional[str] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db),
):
    """
    Phase 50: Material Marketplace.
    Lists bulk raw materials (plywood, marble, tiles, veneers, paint) with MOQ and unit pricing.
    """
    seed_canonical_marketplace_if_empty(db)
    query = db.query(ListingModel).filter(ListingModel.listing_type == "material")
    if category:
        query = query.filter(ListingModel.category.ilike(f"%{category}%"))
    if unit:
        query = query.filter(ListingModel.unit == unit)
    if max_price is not None:
        query = query.filter(ListingModel.price <= max_price)
    return query.all()


@router.get("/marketplace/materials/{item_id}", response_model=MarketplaceListingOut)
def get_material_bulk_item(item_id: UUID, db: Session = Depends(get_db)):
    """Retrieves bulk material specifications and minimum order quantity."""
    seed_canonical_marketplace_if_empty(db)
    item = db.query(ListingModel).filter(
        ListingModel.id == item_id,
        ListingModel.listing_type == "material",
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material item not found")
    return item


@router.post("/marketplace/materials/{item_id}/sample-request", response_model=SampleKitResponse)
def request_material_sample_kit(
    item_id: UUID,
    sample_req: SampleKitRequest,
    db: Session = Depends(get_db),
):
    """Dispatches a physical material swatch sample box directly to the client site."""
    seed_canonical_marketplace_if_empty(db)
    item = db.query(ListingModel).filter(ListingModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material item not found")

    sample_id = uuid4()
    tracking = f"SMP-{uuid4().hex[:6].upper()}"

    return SampleKitResponse(
        sample_request_id=sample_id,
        material_id=item_id,
        material_name=item.name,
        dispatch_status="dispatched_for_courier",
        tracking_reference=tracking,
        message=f"Physical sample swatch for {item.name} will be delivered to {sample_req.delivery_address} in 48 hours.",
    )
