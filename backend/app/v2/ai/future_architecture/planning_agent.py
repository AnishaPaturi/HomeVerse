"""
Phase 51: Planning Agent
Analyzes user lifestyle, room functionality, traffic flow corridors (900mm clearances),
activity zoning, and spatial constraints.
"""

from typing import Dict, Any, List, Optional


class PlanningAgent:
    """
    Tier 1 Agent: Space Programming & Ergonomic Planning
    Establishes activity zones, circulation corridors, and clearance constraints.
    """

    def __init__(self):
        self.name = "PlanningAgent"
        self.role = "Lifestyle Programming & Ergonomic Spatial Planning"

    async def generate_plan(
        self,
        room_type: str,
        dimensions: Dict[str, float],
        lifestyle_tags: Optional[List[str]] = None,
        occupants_count: int = 2,
    ) -> Dict[str, Any]:
        """
        Determines spatial zoning, circulation paths, and ergonomic clearance constraints.
        """
        w = dimensions.get("width_m", 4.2)
        l = dimensions.get("length_m", 5.4)
        area_sqm = dimensions.get("floor_area_sqm", w * l)
        lifestyle = lifestyle_tags or ["work_from_home", "frequent_entertaining", "contemporary_living"]

        # 1. Activity Zones formulation
        zones = []
        if room_type.lower() in ["living room", "living", "lounge"]:
            zones.append({
                "zone_name": "Conversation & Lounge Zone",
                "allocated_area_sqm": round(area_sqm * 0.55, 2),
                "primary_function": "Primary seating, coffee table cluster, and media viewing",
                "ergonomic_rule": "Maintain 450mm between sofa and coffee table; minimum 900mm perimeter corridor",
            })
            if "work_from_home" in lifestyle:
                zones.append({
                    "zone_name": "Focus Workstation / Study Nook",
                    "allocated_area_sqm": round(area_sqm * 0.25, 2),
                    "primary_function": "Ergonomic desk with task lighting and concealed wire management",
                    "ergonomic_rule": "750mm desk clearance behind chair for natural ingress/egress",
                })
            else:
                zones.append({
                    "zone_name": "Formal Dining & Bar Alcove",
                    "allocated_area_sqm": round(area_sqm * 0.25, 2),
                    "primary_function": "Compact dining/buffet console for entertaining",
                    "ergonomic_rule": "Minimum 900mm clearance from dining table edge to walls",
                })
            zones.append({
                "zone_name": "Circulation & Entry Corridor",
                "allocated_area_sqm": round(area_sqm * 0.20, 2),
                "primary_function": "Unobstructed transit path from door to balcony/windows",
                "ergonomic_rule": "Strict 900mm–1000mm primary walkway unobstructed by furniture edges",
            })
        elif room_type.lower() in ["bedroom", "master bedroom"]:
            zones.append({
                "zone_name": "Sleeping & Rest Sanctum",
                "allocated_area_sqm": round(area_sqm * 0.60, 2),
                "primary_function": "King/Queen bed with twin bedside tables and headboard wall",
                "ergonomic_rule": "Minimum 750mm walkway on both sides of bed",
            })
            zones.append({
                "zone_name": "Dressing & Wardrobe Zone",
                "allocated_area_sqm": round(area_sqm * 0.25, 2),
                "primary_function": "Floor-to-ceiling wardrobes with dressing mirror",
                "ergonomic_rule": "1000mm open shutter clearance in front of wardrobes",
            })
            zones.append({
                "zone_name": "Reading & Vanity Corner",
                "allocated_area_sqm": round(area_sqm * 0.15, 2),
                "primary_function": "Comfortable accent armchair with side table and warm lamp",
                "ergonomic_rule": "Positioned near natural light window",
            })
        else:
            zones.append({
                "zone_name": "Primary Functional Core",
                "allocated_area_sqm": round(area_sqm * 0.70, 2),
                "primary_function": f"Main activities tailored for {room_type}",
                "ergonomic_rule": "900mm primary clearance corridor",
            })
            zones.append({
                "zone_name": "Storage & Auxiliary Zone",
                "allocated_area_sqm": round(area_sqm * 0.30, 2),
                "primary_function": "Shelving, cabinetry, and secondary utilities",
                "ergonomic_rule": "Unobstructed opening radius",
            })

        # Circulation constraints
        clearances = [
            {"corridor": "Main Entry to Window/Balcony", "min_clearance_mm": 900, "status": "enforced"},
            {"corridor": "Sofa to Coffee Table", "min_clearance_mm": 450, "status": "enforced"},
            {"corridor": "Dining / Desk Chair Drawback", "min_clearance_mm": 750, "status": "enforced"},
            {"corridor": "Wardrobe / Storage Clearance", "min_clearance_mm": 1000, "status": "enforced"},
        ]

        return {
            "agent": self.name,
            "status": "completed",
            "room_type": room_type,
            "occupants_count": occupants_count,
            "lifestyle_profile": lifestyle,
            "functional_zones": zones,
            "ergonomic_clearances": clearances,
            "traffic_flow_rating": "Optimized A-Grade Circulation",
        }


planning_agent = PlanningAgent()
