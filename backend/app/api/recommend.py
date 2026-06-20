from fastapi import APIRouter, status, HTTPException
from pydantic import BaseModel, Field
from typing import List
import json

router = APIRouter()

class RecommendationRequest(BaseModel):
    title: str = Field(..., description="The query keyword or project title for recommendations")
    top_n: int = Field(default=10, description="The maximum number of recommendations to return")

# Mock database of furniture and styling products with real Indian store links and INR pricing
PRODUCT_INVENTORY = [
    # SOFAS
    {
        "id": "prod-1",
        "name": "IKEA KIVIK 3-Seat Sofa",
        "style": "Modern",
        "category": "Sofa",
        "price": "₹49,990",
        "tier": "premium",
        "description": "Premium comfort sofa with deep seat cushions made of pocket springs and high resilience foam.",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400",
        "product_url": "https://www.ikea.com/in/en/p/kivik-three-seat-sofa-hillared-anthracite-s39193678/"
    },
    {
        "id": "prod-2",
        "name": "IKEA LINANÄS 3-Seat Sofa",
        "style": "Minimalist",
        "category": "Sofa",
        "price": "₹17,990",
        "tier": "budget",
        "description": "Budget-friendly modern sofa upholstered in durable grey fabric. Small footprint, perfect for tight spaces.",
        "image_url": "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=400",
        "product_url": "https://www.ikea.com/in/en/p/linanaes-3-seat-sofa-vissle-dark-grey-00512243/"
    },
    {
        "id": "prod-3",
        "name": "Urban Ladder Chesterfield Velvet Sofa",
        "style": "Luxury",
        "category": "Sofa",
        "price": "₹64,999",
        "tier": "premium",
        "description": "Classic Chesterfield design with tufted velvet upholstery and elegant turned wooden legs.",
        "image_url": "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=400",
        "product_url": "https://www.urbanladder.com/sofas"
    },
    {
        "id": "prod-4",
        "name": "Pepperfry 3-Seater Futon Sofa Bed",
        "style": "Scandinavian",
        "category": "Sofa",
        "price": "₹14,499",
        "tier": "budget",
        "description": "Highly functional, space-saving sofa bed with solid wood legs and neutral grey cushioning.",
        "image_url": "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=400",
        "product_url": "https://www.pepperfry.com/furniture-sofas.html"
    },

    # COFFEE TABLES
    {
        "id": "prod-5",
        "name": "IKEA LACK Coffee Table",
        "style": "Minimalist",
        "category": "Table",
        "price": "₹1,999",
        "tier": "budget",
        "description": "Super affordable, lightweight coffee table with a separate shelf for storing magazines and remotes.",
        "image_url": "https://images.unsplash.com/photo-1604014237800-1c9102c219da?q=80&w=400",
        "product_url": "https://www.ikea.com/in/en/p/lack-coffee-table-black-brown-40352986/"
    },
    {
        "id": "prod-6",
        "name": "IKEA GLADOM Tray Table",
        "style": "Japandi",
        "category": "Table",
        "price": "₹1,499",
        "tier": "budget",
        "description": "Removable tray top table in black powder-coated steel. Minimalist design, easy to move around.",
        "image_url": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=400",
        "product_url": "https://www.ikea.com/in/en/p/gladom-tray-table-black-90333049/"
    },
    {
        "id": "prod-7",
        "name": "Solid Walnut Noguchi Coffee Table",
        "style": "Modern",
        "category": "Table",
        "price": "₹28,500",
        "tier": "premium",
        "description": "Organic, teardrop-shaped coffee table with two curved interlocking solid walnut legs and heavy tempered glass top.",
        "image_url": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=400",
        "product_url": "https://www.pepperfry.com/furniture-coffee-tables.html"
    },
    {
        "id": "prod-8",
        "name": "Calacatta Gold Marble Coffee Table",
        "style": "Luxury",
        "category": "Table",
        "price": "₹42,999",
        "tier": "premium",
        "description": "Polished Calacatta marble slab mounted on geometric gold-plated stainless steel frame.",
        "image_url": "https://images.unsplash.com/photo-1600566752355-35792bedcfea?q=80&w=400",
        "product_url": "https://www.urbanladder.com/coffee-table"
    },

    # DESKS
    {
        "id": "prod-9",
        "name": "IKEA MICKE Desk",
        "style": "Minimalist",
        "category": "Desk",
        "price": "₹6,990",
        "tier": "budget",
        "description": "Compact desk with built-in cable management and drawers. Perfect size for small home workspaces.",
        "image_url": "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=400",
        "product_url": "https://www.ikea.com/in/en/p/micke-desk-black-brown-80354276/"
    },
    {
        "id": "prod-10",
        "name": "Urban Ladder Solid Wood Writing Desk",
        "style": "Scandinavian",
        "category": "Desk",
        "price": "₹18,499",
        "tier": "premium",
        "description": "Elegant writing desk made from solid Sheesham wood with organic finish, featuring two drawer units.",
        "image_url": "https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?q=80&w=400",
        "product_url": "https://www.urbanladder.com/study-table"
    },
    {
        "id": "prod-11",
        "name": "Pepperfry Ergonomic Standing Desk",
        "style": "Modern",
        "category": "Desk",
        "price": "₹21,999",
        "tier": "premium",
        "description": "Dual-motor electric standing desk with memory presets, wood finish top, and white steel frame.",
        "image_url": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=400",
        "product_url": "https://www.pepperfry.com/office-tables.html"
    },

    # CHAIRS
    {
        "id": "prod-12",
        "name": "IKEA POÄNG Armchair",
        "style": "Scandinavian",
        "category": "Chair",
        "price": "₹7,990",
        "tier": "budget",
        "description": "Layer-glued bent birch frame provides comfortable resilience. Classic Swedish comfort.",
        "image_url": "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=400",
        "product_url": "https://www.ikea.com/in/en/p/poaeng-armchair-birch-veneer-knisa-light-beige-s69240822/"
    },
    {
        "id": "prod-13",
        "name": "IKEA MILLBERGET Swivel Chair",
        "style": "Modern",
        "category": "Chair",
        "price": "₹8,990",
        "tier": "budget",
        "description": "Affordable ergonomic home office swivel chair with tilt mechanism and height adjustment.",
        "image_url": "https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=400",
        "product_url": "https://www.ikea.com/in/en/p/millberget-swivel-chair-murum-black-50489396/"
    },
    {
        "id": "prod-14",
        "name": "Wishbone Y-Chair (Solid Ash)",
        "style": "Japandi",
        "category": "Chair",
        "price": "₹12,500",
        "tier": "premium",
        "description": "Hand-woven paper cord seat with solid ash wood backrest, combining organic texture with Danish craft.",
        "image_url": "https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?q=80&w=400",
        "product_url": "https://www.pepperfry.com/furniture-chairs.html"
    },
    {
        "id": "prod-15",
        "name": "Eames Lounge Chair & Ottoman",
        "style": "Luxury",
        "category": "Chair",
        "price": "₹38,999",
        "tier": "premium",
        "description": "Reproduction of the 1956 classic in rosewood veneer shell and top-grain black Italian leather.",
        "image_url": "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=400",
        "product_url": "https://www.pepperfry.com/accent-chairs.html"
    },

    # BEDS
    {
        "id": "prod-16",
        "name": "IKEA MALM Bed",
        "style": "Minimalist",
        "category": "Bed",
        "price": "₹28,990",
        "tier": "budget",
        "description": "Clean white bed frame with 2 spacious under-bed storage drawers on castors.",
        "image_url": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=400",
        "product_url": "https://www.ikea.com/in/en/p/malm-bed-frame-high-w-2-storage-boxes-white-s09200966/"
    },
    {
        "id": "prod-17",
        "name": "Solid Teak King Bed Frame",
        "style": "Japandi",
        "category": "Bed",
        "price": "₹45,999",
        "tier": "premium",
        "description": "Low-profile minimal bed frame crafted from sustainably sourced A-grade solid Indian teak wood.",
        "image_url": "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=400",
        "product_url": "https://www.urbanladder.com/beds"
    },

    # LIGHTING
    {
        "id": "prod-18",
        "name": "IKEA TERTIAL Work Lamp",
        "style": "Modern",
        "category": "Lighting",
        "price": "₹999",
        "tier": "budget",
        "description": "Classic steel drafting lamp with adjustable arm and head. Can be clamped onto any desk.",
        "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=400",
        "product_url": "https://www.ikea.com/in/en/p/tertial-work-lamp-dark-grey-50355395/"
    },
    {
        "id": "prod-19",
        "name": "IKEA FADO Table Lamp",
        "style": "Minimalist",
        "category": "Lighting",
        "price": "₹1,499",
        "tier": "budget",
        "description": "Globe-shaped frosted white glass table lamp. Emits soft ambient mood lighting.",
        "image_url": "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=400",
        "product_url": "https://www.ikea.com/in/en/p/fado-table-lamp-with-led-bulb-white-s09427807/"
    },
    {
        "id": "prod-20",
        "name": "Crystal Drop Chandelier",
        "style": "Luxury",
        "category": "Lighting",
        "price": "₹34,500",
        "tier": "premium",
        "description": "Modern luxury spiral rain chandelier featuring hand-cut clear glass crystal drops and brass base.",
        "image_url": "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=400",
        "product_url": "https://www.pepperfry.com/lighting.html"
    }
]

@router.post("/recommend", response_model=str)
def recommend_products(request: RecommendationRequest):
    """
    Returns a JSON string of product recommendations based on a title/search query and count.
    """
    query = request.title.lower().strip()
    
    # Simple scoring system based on title, style, description, and category matches
    scored_products = []
    for product in PRODUCT_INVENTORY:
        score = 0
        # Check category match
        if product["category"].lower() in query:
            score += 10
        # Check style match
        if product["style"].lower() in query:
            score += 8
        # Check name match
        if query in product["name"].lower():
            score += 5
        # Check description match
        if query in product["description"].lower():
            score += 2
            
        # Default relevance if query is broad or matches generic terms
        if not score:
            # Fallback matching: check if any word in query matches product style or category
            words = query.split()
            for word in words:
                if len(word) > 2:
                    if word in product["name"].lower() or word in product["category"].lower() or word in product["style"].lower():
                        score += 3
        
        # If score is > 0, or we want a default pool when nothing matches
        scored_products.append((score, product))
    
    # Sort by score descending, then by name
    scored_products.sort(key=lambda x: (-x[0], x[1]["name"]))
    
    # Pick top_n products
    results = [item[1] for item in scored_products[:request.top_n]]
    
    # Return as serialized JSON string to match the "string" response type from OpenAPI spec
    return json.dumps(results, indent=2)
