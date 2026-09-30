"""
Phase 51: Materials Agent
Selects surface materials, flooring, wall cladding, millwork substrates, upholstery,
and defines PBR (physically-based rendering) specs and architectural performance standards.
"""

from typing import Dict, Any, List, Optional


class MaterialsAgent:
    """
    Tier 2 Specialist Agent: Materiality & Surface Engineering
    Determines architectural substrates, tactile finishes, and PBR properties.
    """

    def __init__(self):
        self.name = "MaterialsAgent"
        self.role = "Architectural Materiality & PBR Surface Engineering"

    async def specify_materials(
        self,
        design_output: Dict[str, Any],
        vision_output: Dict[str, Any],
        budget_output: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Formulates comprehensive material schedules with PBR rendering specifications.
        """
        style = design_output.get("style", "Modern").lower()
        dim = vision_output.get("dimensions", {"floor_area_sqft": 240.0})
        area_sqft = dim.get("floor_area_sqft", 240.0)

        if "luxury" in style:
            floor_item = {
                "category": "Flooring",
                "material_name": "Italian Statuario Marble Slabs (20mm Mirror Hone)",
                "brand": "Statuario Stone Depot",
                "unit_rate_inr": 450.0,
                "unit": "sq.ft",
                "quantity_required": round(area_sqft * 1.1, 1),
                "subtotal_inr": round(area_sqft * 1.1 * 450.0, 2),
                "pbr_properties": {"roughness": 0.08, "metalness": 0.0, "normal_map": "statuario_vein_norm.png", "sheen": 0.95},
                "standard": "IS:1130 Natural Stone Standard",
            }
        else:
            floor_item = {
                "category": "Flooring",
                "material_name": "Large-Format Glazed Satin Vitrified Tiles (1200x1800mm)",
                "brand": "Kajaria Eternity",
                "unit_rate_inr": 95.0,
                "unit": "sq.ft",
                "quantity_required": round(area_sqft * 1.1, 1),
                "subtotal_inr": round(area_sqft * 1.1 * 95.0, 2),
                "pbr_properties": {"roughness": 0.25, "metalness": 0.0, "normal_map": "tile_micrograin_norm.png", "sheen": 0.40},
                "standard": "IS:15622 Group B1a Water Absorption < 0.05%",
            }

        wall_items = [
            {
                "category": "Wall Finish",
                "material_name": "Royale Aspira Ultra-Luxury Anti-Bacterial Emulsion",
                "brand": "Asian Paints",
                "unit_rate_inr": 45.0,
                "unit": "sq.ft",
                "quantity_required": round(area_sqft * 2.8, 1),
                "subtotal_inr": round(area_sqft * 2.8 * 45.0, 2),
                "pbr_properties": {"roughness": 0.85, "metalness": 0.0, "diffuse_hex": design_output.get("color_palette_60_30_10", {}).get("dominant_60", {}).get("hex", "#F4F1EA")},
                "standard": "GreenGuard Gold Certified Low-VOC (< 15g/L)",
            },
            {
                "category": "Accent Feature Wall",
                "material_name": "Natural American Walnut Architectural Fluted Slats",
                "brand": "Decowood Veneers",
                "unit_rate_inr": 180.0,
                "unit": "sq.ft",
                "quantity_required": 80.0,
                "subtotal_inr": 14400.0,
                "pbr_properties": {"roughness": 0.35, "metalness": 0.0, "normal_map": "fluted_walnut_groove.png", "sheen": 0.25},
                "standard": "E1 Formaldehyde Emission Certified",
            },
        ]

        millwork_items = [
            {
                "category": "Cabinetry Substrate",
                "material_name": "Century Club Prime 19mm BWP Marine Plywood",
                "brand": "CenturyPly",
                "unit_rate_inr": 115.0,
                "unit": "sq.ft",
                "quantity_required": 140.0,
                "subtotal_inr": 16100.0,
                "pbr_properties": {"roughness": 0.5, "metalness": 0.0},
                "standard": "IS:710 Boiling Water Proof Certified",
            },
            {
                "category": "Cabinetry Facing",
                "material_name": "Natural Teak & Crown Cut Walnut Architectural Veneer",
                "brand": "Decowood Veneers",
                "unit_rate_inr": 135.0,
                "unit": "sq.ft",
                "quantity_required": 100.0,
                "subtotal_inr": 13500.0,
                "pbr_properties": {"roughness": 0.30, "metalness": 0.0, "sheen": 0.35},
                "standard": "FSC Certified Sustainable Forestry",
            },
        ]

        all_materials = [floor_item] + wall_items + millwork_items
        total_material_cost = sum(m["subtotal_inr"] for m in all_materials)

        return {
            "agent": self.name,
            "status": "completed",
            "material_schedule": all_materials,
            "total_material_cost_inr": round(total_material_cost, 2),
            "sustainability_metrics": {
                "low_voc_compliant": True,
                "green_building_points": 14,
                "durability_warranty_years": 10,
            },
            "pbr_render_map_summary": {
                "flooring_texture": floor_item["material_name"],
                "wall_paint_color": design_output.get("color_palette_60_30_10", {}).get("dominant_60", {}).get("name", "Oatmeal Alabaster"),
                "wood_finish": "Natural Crown Cut Walnut",
            },
        }


materials_agent = MaterialsAgent()
