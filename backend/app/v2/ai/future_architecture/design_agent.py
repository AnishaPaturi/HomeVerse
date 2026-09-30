"""
Phase 51: Design Agent
Synthesizes Vision (space), Planning (lifestyle), and Budget (financial bounds)
into a master holistic spatial concept, orchestrating Furniture, Materials, and Lighting agents.
"""

from typing import Dict, Any, Optional


class DesignAgent:
    """
    Synthesis Layer: Master Concept Generator
    Unites Vision, Planning, and Budget into an architectural design proposal.
    """

    def __init__(self):
        self.name = "DesignAgent"
        self.role = "Architectural Concept Synthesis & Multi-Discipline Orchestrator"

    async def synthesize_design(
        self,
        vision_output: Dict[str, Any],
        planning_output: Dict[str, Any],
        budget_output: Dict[str, Any],
        style: str = "Modern",
        user_preferences: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Synthesizes Tier 1 outputs into an integrated design thesis.
        """
        room_type = vision_output.get("room_type", "Living Room")
        dim = vision_output.get("dimensions", {})
        light_dir = vision_output.get("lighting_analysis", {}).get("natural_light_orientation", "East")
        zones = planning_output.get("functional_zones", [])
        tier = budget_output.get("budget_tier", "Premium Turnkey")
        total_b = budget_output.get("total_budget", 800000.0)

        # 60-30-10 Color Formula tailored to style
        style_lower = style.lower()
        if "japandi" in style_lower:
            concept_name = "Zen Sanctuary & Warm Biophilic Harmony"
            colors = {
                "dominant_60": {"name": "Oatmeal Alabaster", "hex": "#F4F1EA", "role": "Walls and primary vertical surfaces"},
                "secondary_30": {"name": "Natural White Oak & Sanded Muted Ash", "hex": "#D2B48C", "role": "Millwork, flooring, and loose wooden framework"},
                "accent_10": {"name": "Matte Charcoal Black & Forest Moss", "hex": "#2C3539", "role": "Hardware trim, lamp stems, and ceramics"},
            }
            narrative = (
                f"A serene {style} design maximizing the natural {light_dir} daylight stream. "
                "Emphasizes low-profile organic profiles, acoustic slat cladding, and tactile linen upholstery."
            )
        elif "luxury" in style_lower:
            concept_name = "Grand Contemporary Opulence"
            colors = {
                "dominant_60": {"name": "Cashmere Greige", "hex": "#E6E2DD", "role": "Italian plaster wall backdrop"},
                "secondary_30": {"name": "Statuario Gold Marble & Dark Smoked Eucalyptus", "hex": "#B5A692", "role": "Flooring and full-height millwork paneling"},
                "accent_10": {"name": "Brushed Champagne Brass", "hex": "#C5A059", "role": "Lighting profiles, console inlays, and handles"},
            }
            narrative = (
                f"An upscale luxury {room_type} designed with bespoke full-height paneling and integrated architectural lighting, "
                f"carefully proportioned to the {dim.get('floor_area_sqft', 240)} sq.ft envelope."
            )
        else:
            concept_name = "Warm Minimalist Contemporary"
            colors = {
                "dominant_60": {"name": "Warm Chalk Cream", "hex": "#F7F5F0", "role": "Matte emulsion walls and ceiling cove"},
                "secondary_30": {"name": "American Walnut & Brushed Taupe", "hex": "#8A7968", "role": "Cabinetry, coffee table, and media unit"},
                "accent_10": {"name": "Deep Terracotta & Anodized Gunmetal", "hex": "#A45A48", "role": "Scatter cushions, focal artwork, and track lighting"},
            }
            narrative = (
                f"Clean functional contemporary lines blending warm tactile textures with intelligent space division, "
                f"strictly aligned to the ₹{total_b:,.0f} budget envelope."
            )

        return {
            "agent": self.name,
            "status": "completed",
            "concept_name": concept_name,
            "style": style,
            "design_narrative": narrative,
            "color_palette_60_30_10": colors,
            "spatial_synthesis": {
                "floor_area_sqft": dim.get("floor_area_sqft", 240),
                "zones_count": len(zones),
                "lighting_orientation": light_dir,
                "budget_tier": tier,
            },
            "specialist_directives": {
                "furniture_directive": "Prioritize ergonomic circulation with natural light facing seating and 900mm corridors.",
                "materials_directive": f"Select {tier} certified materials with low-VOC coatings and anti-scratch finishes.",
                "lighting_directive": "Deploy 3-layer lighting (3000K warm ambient downlights, focused task, and 2800K cove LEDs).",
            },
        }


design_agent = DesignAgent()
