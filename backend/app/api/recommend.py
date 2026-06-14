from fastapi import APIRouter, status, HTTPException
from pydantic import BaseModel, Field
from typing import List
import json

router = APIRouter()

class RecommendationRequest(BaseModel):
    title: str = Field(..., description="The query keyword or project title for recommendations")
    top_n: int = Field(default=10, description="The maximum number of recommendations to return")

# Mock database of furniture and styling products
PRODUCT_INVENTORY = [
    # Modern
    {
        "id": "prod-1",
        "name": "Eames Lounge Chair & Ottoman",
        "style": "Modern",
        "category": "Chair",
        "price": "$4,500",
        "description": "An iconic mid-century modern classic, combining molded plywood and premium leather.",
        "image_url": "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=400"
    },
    {
        "id": "prod-2",
        "name": "Arco Floor Lamp",
        "style": "Modern",
        "category": "Lighting",
        "price": "$2,999",
        "description": "Carrara marble base with a polished stainless steel arched arm, perfect for statement lighting.",
        "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=400"
    },
    {
        "id": "prod-3",
        "name": "Barcelona Chair",
        "style": "Modern",
        "category": "Chair",
        "price": "$3,200",
        "description": "Premium leather cushions on a chrome-plated steel frame, designed by Mies van der Rohe.",
        "image_url": "https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=400"
    },
    {
        "id": "prod-4",
        "name": "Noguchi Coffee Table",
        "style": "Modern",
        "category": "Table",
        "price": "$1,899",
        "description": "Two curved solid wood legs supporting a heavy glass top, a perfect balance of art and utility.",
        "image_url": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=400"
    },
    {
        "id": "prod-5",
        "name": "Modern Leather Sofa",
        "style": "Modern",
        "category": "Sofa",
        "price": "$2,499",
        "description": "Top-grain leather sofa with clean lines and sturdy matte-black metal legs.",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400"
    },
    # Scandinavian
    {
        "id": "prod-6",
        "name": "Wishbone Chair",
        "style": "Scandinavian",
        "category": "Chair",
        "price": "$350",
        "description": "Steam-bent solid wood backrest with a woven paper cord seat, a timeless Danish design.",
        "image_url": "https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?q=80&w=400"
    },
    {
        "id": "prod-7",
        "name": "Stockholm Fabric Sofa",
        "style": "Scandinavian",
        "category": "Sofa",
        "price": "$1,199",
        "description": "Comfortable light-grey fabric sofa with solid light oak wood tapered legs.",
        "image_url": "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=400"
    },
    {
        "id": "prod-8",
        "name": "Light Oak Coffee Table",
        "style": "Scandinavian",
        "category": "Table",
        "price": "$450",
        "description": "Simple round coffee table in solid white-washed oak, introducing natural warmth.",
        "image_url": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=400"
    },
    {
        "id": "prod-9",
        "name": "Paper Pendant Shade",
        "style": "Scandinavian",
        "category": "Lighting",
        "price": "$80",
        "description": "Handmade origami paper shade that filters light into a soft, warm ambiance.",
        "image_url": "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=400"
    },
    {
        "id": "prod-10",
        "name": "Woolen Sheepskin Rug",
        "style": "Scandinavian",
        "category": "Rug",
        "price": "$150",
        "description": "Ultra-soft genuine sheepskin throw rug for layering on chairs or floors to add hygge.",
        "image_url": "https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=400"
    },
    # Japandi
    {
        "id": "prod-11",
        "name": "Low-Profile Tatami Bed",
        "style": "Japandi",
        "category": "Bed",
        "price": "$1,599",
        "description": "Ultra-low solid pine platform bed frame inspired by traditional Japanese tatami mats.",
        "image_url": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=400"
    },
    {
        "id": "prod-12",
        "name": "Wabi-Sabi Ceramic Vase",
        "style": "Japandi",
        "category": "Decor",
        "price": "$75",
        "description": "Hand-thrown pottery vase with an intentional textured, asymmetric crackle glaze.",
        "image_url": "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=400"
    },
    {
        "id": "prod-13",
        "name": "Rattan Accent Armchair",
        "style": "Japandi",
        "category": "Chair",
        "price": "$420",
        "description": "Natural rattan weave backrest combined with a minimal black oak wood frame.",
        "image_url": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=400"
    },
    {
        "id": "prod-14",
        "name": "Shoji Paper Floor Lamp",
        "style": "Japandi",
        "category": "Lighting",
        "price": "$180",
        "description": "Soft light diffused through a tall cylindrical washi paper shade on a black wood frame.",
        "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=400"
    },
    # Minimalist
    {
        "id": "prod-15",
        "name": "Platform Linen Sofa",
        "style": "Minimalist",
        "category": "Sofa",
        "price": "$1,800",
        "description": "Streamlined block-design sofa upholstered in stain-resistant off-white Belgian linen.",
        "image_url": "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=400"
    },
    {
        "id": "prod-16",
        "name": "Concrete Coffee Table",
        "style": "Minimalist",
        "category": "Table",
        "price": "$699",
        "description": "Clean circular coffee table cast from lightweight, polished architectural concrete.",
        "image_url": "https://images.unsplash.com/photo-1604014237800-1c9102c219da?q=80&w=400"
    },
    {
        "id": "prod-17",
        "name": "Slim Metal Bookshelf",
        "style": "Minimalist",
        "category": "Decor",
        "price": "$380",
        "description": "Powder-coated steel open shelf with an incredibly slim silhouette for zero visual clutter.",
        "image_url": "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=400"
    },
    # Luxury
    {
        "id": "prod-18",
        "name": "Velvet Chesterfield Sofa",
        "style": "Luxury",
        "category": "Sofa",
        "price": "$3,500",
        "description": "Deeply tufted emerald green velvet sofa with rolled arms and metallic brass castor legs.",
        "image_url": "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=400"
    },
    {
        "id": "prod-19",
        "name": "Calacatta Marble Table",
        "style": "Luxury",
        "category": "Table",
        "price": "$4,200",
        "description": "Genuine Calacatta white marble dining/conference table with bold grey veining and brass trim.",
        "image_url": "https://images.unsplash.com/photo-1600566752355-35792bedcfea?q=80&w=400"
    },
    {
        "id": "prod-20",
        "name": "Crystal Drop Chandelier",
        "style": "Luxury",
        "category": "Lighting",
        "price": "$1,999",
        "description": "Multi-tiered gold ring pendant chandelier draped in faceted K9 optical crystal drops.",
        "image_url": "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=400"
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
