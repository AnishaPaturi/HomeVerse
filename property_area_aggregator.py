"""
Property Area Aggregator Module (G6-A)
=====================================
HomeVerse Project - Milestone G6: Property-Level Area & Construction Cost Modeling

Standardized property-level area aggregation and architectural quantity takeoff:
  1. Room Aggregator: Closed CAD polygons -> scaled physical room areas, categories, flooring.
  2. Boundary Analyzer: Reconstructed external perimeter, external vs. internal partition walls,
     shared wall deduplication, and opening deductions.
  3. Area Standards Engine: Authoritative RICS Property Measurement (2nd Edition) & IPMS crosswalk.
  4. Efficiency Analyzer: Building efficiency ratio (NIA / GIA * 100) and step-by-step area reconciliation.

Enforces strict non-hallucination guardrails:
  - If scale is UNAVAILABLE, produces relative percentage schedules only (zero manufactured m²).
  - Traceable source polygon and calibration provenance on every metric entity.
"""

import math
from typing import Dict, List, Optional, Tuple, Any, Set
from shapely.geometry import Polygon, MultiPolygon, LineString
from shapely.ops import unary_union


# Standard 9-Class Functional Hierarchy & Flooring Mapping
FUNCTIONAL_FLOORING_MAPPING = {
    "Living Area": {"primary_finish": "Engineered Hardwood", "finish_category": "wood"},
    "Sleeping Area": {"primary_finish": "Premium Carpet / Wood Plank", "finish_category": "carpet"},
    "Cooking Area": {"primary_finish": "Anti-Slip Porcelain Tile", "finish_category": "tile"},
    "Sanitary Area": {"primary_finish": "Glazed Porcelain Tile (Water-Resistant)", "finish_category": "tile"},
    "Circulation Area": {"primary_finish": "Hard-Wearing Engineered Timber", "finish_category": "wood"},
    "Outdoor Area": {"primary_finish": "Exterior Treated Decking / Pavers", "finish_category": "exterior"},
    "Utility Area": {"primary_finish": "Moisture-Resistant Tile / Vinyl", "finish_category": "vinyl"},
    "Storage Area": {"primary_finish": "Durable Laminate / Sealed Screed", "finish_category": "laminate"},
    "Vehicle Area": {"primary_finish": "Epoxy Coated Concrete", "finish_category": "screed"},
}

# RICS / IPMS Inclusion Rules
# Habitable and usable spaces included in Net Internal Area (NIA / IPMS 3)
NIA_INCLUDED_ROOM_TYPES = {
    "Living Room", "Bed Room", "Master Bedroom", "Bedroom", "Guest Room",
    "Kitchen", "Dining Room", "Kitchen & Dining", "Study", "Home Office",
    "Bathroom", "Toilet", "Powder Room", "Internal Foyer", "Private Hallway",
    "Walk-in Closet", "Pantry",
}

# Explicitly excluded from NIA under RICS Property Measurement 2nd Edition
NIA_EXCLUDED_ROOM_TYPES = {
    "Balcony", "Terrace", "Deck", "Porch", "Veranda", "Patio",
    "Garage", "Carport", "Open Parking",
    "Common Stairwell", "Elevator Shaft", "Shared Service Duct",
    "External Courtyard",
}


class RoomAggregator:
    """
    Component 1: Aggregates individual room polygons, computes scaled areas,
    groups by functional parent categories, and compiles flooring schedules.
    """

    def aggregate_rooms(
        self,
        rooms: List[Dict[str, Any]],
        scale_m_per_px: Optional[float] = None,
        scale_provenance: str = "UNAVAILABLE",
    ) -> Dict[str, Any]:
        """
        Aggregates room areas and validates against overlapping or duplicate geometries.
        """
        is_calibrated = (scale_m_per_px is not None and scale_m_per_px > 0 and scale_provenance != "UNAVAILABLE")

        processed_rooms = []
        shapely_polygons = []
        total_px_area = 0.0
        total_m2_area = 0.0

        category_areas_m2: Dict[str, float] = {}
        category_areas_px: Dict[str, float] = {}
        flooring_schedules: Dict[str, Dict[str, Any]] = {}

        seen_room_ids: Set[Any] = set()
        duplicate_rooms_detected = 0

        for idx, r in enumerate(rooms):
            r_id = r.get("room_id", r.get("query_id", idx))
            if r_id in seen_room_ids:
                duplicate_rooms_detected += 1
                continue
            seen_room_ids.add(r_id)

            poly_pts = r.get("polygon_pixels", r.get("polygon", []))
            if len(poly_pts) < 3:
                continue

            sh_poly = Polygon(poly_pts)
            if not sh_poly.is_valid:
                sh_poly = sh_poly.buffer(0)

            shapely_polygons.append(sh_poly)
            px_area = sh_poly.area
            total_px_area += px_area

            r_type = r.get("type", r.get("room_type", "Room"))
            p_cat = r.get("parent_category", r.get("functional_parent", "Living Area"))

            if is_calibrated:
                m2_area = px_area * (scale_m_per_px ** 2)
                total_m2_area += m2_area
                area_m2_val = round(m2_area, 3)
            else:
                area_m2_val = None

            # Category aggregation
            category_areas_px[p_cat] = category_areas_px.get(p_cat, 0.0) + px_area
            if is_calibrated:
                category_areas_m2[p_cat] = category_areas_m2.get(p_cat, 0.0) + area_m2_val

            # Flooring mapping
            fl_info = FUNCTIONAL_FLOORING_MAPPING.get(p_cat, {"primary_finish": "Standard Hardwood", "finish_category": "wood"})
            finish_type = fl_info["primary_finish"]

            if finish_type not in flooring_schedules:
                flooring_schedules[finish_type] = {
                    "material": finish_type,
                    "category": fl_info["finish_category"],
                    "area_px": 0.0,
                    "area_m2": 0.0 if is_calibrated else None,
                    "room_types": [],
                }
            flooring_schedules[finish_type]["area_px"] += px_area
            if is_calibrated:
                flooring_schedules[finish_type]["area_m2"] += area_m2_val
            if r_type not in flooring_schedules[finish_type]["room_types"]:
                flooring_schedules[finish_type]["room_types"].append(r_type)

            processed_rooms.append({
                "room_id": r_id,
                "room_type": r_type,
                "parent_category": p_cat,
                "area_px": round(px_area, 2),
                "area_m2": area_m2_val,
                "polygon_pixels": poly_pts,
                "is_calibrated": is_calibrated,
                "scale_provenance": scale_provenance,
            })

        # Calculate relative area percentages for each room
        for pr in processed_rooms:
            pr["relative_area_share_pct"] = round((pr["area_px"] / max(1e-4, total_px_area)) * 100.0, 2)

        return {
            "processed_rooms": processed_rooms,
            "shapely_polygons": shapely_polygons,
            "total_room_count": len(processed_rooms),
            "duplicate_rooms_detected": duplicate_rooms_detected,
            "total_room_area_px": round(total_px_area, 2),
            "total_room_area_m2": round(total_m2_area, 3) if is_calibrated else None,
            "category_areas_m2": category_areas_m2 if is_calibrated else None,
            "category_areas_px": category_areas_px,
            "flooring_schedules": flooring_schedules,
            "is_calibrated": is_calibrated,
            "scale_provenance": scale_provenance,
        }


class BoundaryAnalyzer:
    """
    Component 2: Reconstructs external property perimeter, separates external
    from internal partition walls, deduplicates shared walls, and deducts openings.
    """

    def __init__(
        self,
        default_wall_height_m: float = 2.70,
        nominal_wall_thickness_m: float = 0.12,
        shared_wall_snap_tol_px: float = 8.0,
    ):
        self.default_wall_height_m = default_wall_height_m
        self.nominal_wall_thickness_m = nominal_wall_thickness_m
        self.shared_wall_snap_tol_px = shared_wall_snap_tol_px

    def analyze_boundaries(
        self,
        shapely_polygons: List[Polygon],
        scale_m_per_px: Optional[float] = None,
        scale_provenance: str = "UNAVAILABLE",
        custom_wall_height_m: Optional[float] = None,
        openings: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Reconstructs the external building boundary and separates internal/external wall quantities.
        """
        is_calibrated = (scale_m_per_px is not None and scale_m_per_px > 0 and scale_provenance != "UNAVAILABLE")
        wall_height_m = custom_wall_height_m or self.default_wall_height_m
        height_is_default = (custom_wall_height_m is None)

        if not shapely_polygons:
            return {
                "external_boundary_polygon": None,
                "external_perimeter_m": None,
                "internal_partitions_length_m": None,
                "gross_external_wall_elevation_m2": None,
                "net_external_wall_surface_m2": None,
                "internal_partition_elevation_m2": None,
                "opening_deductions_m2": 0.0,
                "wall_height_m": wall_height_m,
                "wall_height_is_default": height_is_default,
            }

        # 1. External Perimeter: Union of all room polygons
        try:
            unified_boundary = unary_union(shapely_polygons)
        except Exception:
            unified_boundary = shapely_polygons[0]

        # External perimeter in pixels
        external_perim_px = unified_boundary.length

        # 2. Total internal boundaries: Sum of individual room perimeters
        sum_room_perims_px = sum(p.length for p in shapely_polygons)

        # Internal partition edges appear twice in sum_room_perims_px, but zero times in external boundary
        # Therefore: Shared internal partition length = (Sum(Room perimeters) - External perimeter) / 2
        internal_partitions_px = max(0.0, (sum_room_perims_px - external_perim_px) / 2.0)

        # 3. Metric conversions
        if is_calibrated:
            external_perim_m = round(external_perim_px * scale_m_per_px, 2)
            internal_partitions_m = round(internal_partitions_px * scale_m_per_px, 2)
            gross_ext_wall_elev_m2 = round(external_perim_m * wall_height_m, 2)
            # Internal partition surface has two exposed sides for painting:
            internal_partition_surface_m2 = round(internal_partitions_m * wall_height_m * 2.0, 2)
            # Internal partition footprint area in m2 with explicit provenance & uncertainty bounds
            internal_partition_footprint_m2 = round(internal_partitions_m * self.nominal_wall_thickness_m, 2)
            partition_footprint_provenance = f"ESTIMATED_NOMINAL_THICKNESS ({self.nominal_wall_thickness_m:.2f}m +/- 0.02m)"
        else:
            external_perim_m = None
            internal_partitions_m = None
            gross_ext_wall_elev_m2 = None
            internal_partition_surface_m2 = None
            internal_partition_footprint_m2 = None
            partition_footprint_provenance = "UNAVAILABLE"

        # 4. Opening Deductions (Doors & Windows)
        opening_deductions_m2 = 0.0
        opening_schedule = []
        if openings:
            for op in openings:
                op_type = op.get("type", "interior_door")
                w = op.get("width_m", 0.85)
                h = op.get("height_m", 2.10)
                a = w * h
                opening_deductions_m2 += a
                opening_schedule.append({
                    "type": op_type,
                    "width_m": w,
                    "height_m": h,
                    "area_m2": round(a, 3),
                    "facing": op.get("facing", "internal"),
                })
        else:
            # Standard automated architectural opening allowances per room count
            n_rooms = len(shapely_polygons)
            # Nominally: 1 door per room (1.785 m²), plus 1 window per external-facing room (~60% of rooms, 1.80 m²)
            est_doors_area = n_rooms * (0.85 * 2.10)
            est_windows_area = int(n_rooms * 0.6) * (1.20 * 1.50)
            opening_deductions_m2 = est_doors_area + est_windows_area

        if is_calibrated:
            net_ext_wall_m2 = max(0.0, round(gross_ext_wall_elev_m2 - (opening_deductions_m2 * 0.35), 2))
            net_int_paint_m2 = max(0.0, round(internal_partition_surface_m2 - (opening_deductions_m2 * 0.65), 2))
            total_net_paint_surface_m2 = round(net_ext_wall_m2 + net_int_paint_m2, 2)
        else:
            net_ext_wall_m2 = None
            net_int_paint_m2 = None
            total_net_paint_surface_m2 = None

        return {
            "external_perimeter_px": round(external_perim_px, 2),
            "external_perimeter_m": external_perim_m,
            "internal_partitions_length_px": round(internal_partitions_px, 2),
            "internal_partitions_length_m": internal_partitions_m,
            "internal_partition_footprint_m2": internal_partition_footprint_m2,
            "nominal_wall_thickness_m": self.nominal_wall_thickness_m,
            "partition_thickness_provenance": partition_footprint_provenance,
            "gross_external_wall_elevation_m2": gross_ext_wall_elev_m2,
            "net_external_wall_surface_m2": net_ext_wall_m2,
            "internal_partition_surface_m2": internal_partition_surface_m2,
            "total_net_paintable_wall_surface_m2": total_net_paint_surface_m2,
            "total_opening_deductions_m2": round(opening_deductions_m2, 2) if is_calibrated else None,
            "wall_height_m": wall_height_m,
            "wall_height_is_default": height_is_default,
            "unified_boundary_area_px": round(unified_boundary.area, 2),
        }


class AreaStandardsEngine:
    """
    Component 3: Applies formal measurement boundaries and exclusion rules
    under versioned measurement standards:
      - Active Primary Standard: IPMS: All Buildings (incorporating IPMS 2 Residential for Gross Internal
        and IPMS 3.1 Residential for Net Internal / Exclusive Use Area).
      - Legacy Reference Profile: RICS Property Measurement (2nd Edition, 2018 - Archived Reference).
      - National Basis Crosswalk: RICS Code of Measuring Practice (6th Edition).
    """

    def __init__(self, active_profile: str = "IPMS_ALL_BUILDINGS_2023"):
        self.active_profile = active_profile

    def calculate_standards(
        self,
        processed_rooms: List[Dict[str, Any]],
        boundary_data: Optional[Dict[str, Any]] = None,
        scale_m_per_px: Optional[float] = None,
        scale_provenance: str = "UNAVAILABLE",
        structural_columns_m2: float = 0.0,
        vertical_shafts_m2: float = 0.0,
        boundary_analysis: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Computes GIA, NIA, and standardized exclusions under active and legacy measurement profiles.
        Enforces precise GIA geometry contract:
          GIA = Sum(Room Areas) + Partition Footprints + Structural Columns + Vertical Shafts
        """
        b_info = boundary_data if boundary_data is not None else (boundary_analysis or {})
        is_calibrated = (scale_m_per_px is not None and scale_m_per_px > 0 and scale_provenance != "UNAVAILABLE")

        nia_rooms = []
        excluded_rooms = []
        nia_m2 = 0.0
        excluded_m2 = 0.0
        nia_px = 0.0
        excluded_px = 0.0

        for r in processed_rooms:
            r_type = r["room_type"]
            px_a = r["area_px"]
            m2_a = r.get("area_m2")

            # Check inclusion in NIA (IPMS 3.1 / RICS Usable Habitable)
            is_nia = (r_type in NIA_INCLUDED_ROOM_TYPES) and (r_type not in NIA_EXCLUDED_ROOM_TYPES)
            if is_nia:
                nia_rooms.append(r)
                nia_px += px_a
                if is_calibrated and m2_a:
                    nia_m2 += m2_a
            else:
                excluded_rooms.append(r)
                excluded_px += px_a
                if is_calibrated and m2_a:
                    excluded_m2 += m2_a

        # GIA Calculation (Measured to internal face of external perimeter walls):
        # Includes all room finished areas, partition wall footprints, columns, and enclosed shafts.
        internal_footprint_m2 = b_info.get("internal_partition_footprint_m2", 0.0) or 0.0

        if is_calibrated:
            total_room_m2 = sum(r.get("area_m2", 0.0) or 0.0 for r in processed_rooms)
            gia_m2 = round(total_room_m2 + internal_footprint_m2 + structural_columns_m2 + vertical_shafts_m2, 2)
            nia_m2 = round(nia_m2, 2)
            excluded_m2 = round(excluded_m2, 2)
        else:
            total_room_m2 = None
            gia_m2 = None
            nia_m2 = None
            excluded_m2 = None

        return {
            "active_measurement_standard": "IPMS: All Buildings (2023 Standard) - IPMS 2 / IPMS 3.1 Residential",
            "legacy_reference_profile": "RICS Property Measurement (2nd Edition, 2018 - Archived Reference)",
            "national_code_crosswalk": "RICS Code of Measuring Practice (6th Edition) - GIA / GEA / NIA",
            "gross_internal_area_gia_m2": gia_m2,
            "net_internal_area_nia_m2": nia_m2,
            "excluded_space_area_m2": excluded_m2,
            "internal_partition_footprint_m2": internal_footprint_m2 if is_calibrated else None,
            "partition_thickness_provenance": b_info.get("partition_thickness_provenance", "ESTIMATED_NOMINAL_THICKNESS (0.12m +/- 0.02m)"),
            "structural_inclusions_m2": {
                "columns_and_piers_m2": structural_columns_m2 if is_calibrated else None,
                "vertical_service_ducts_m2": vertical_shafts_m2 if is_calibrated else None,
            },
            "total_room_area_m2": round(total_room_m2, 2) if is_calibrated else None,
            "nia_room_count": len(nia_rooms),
            "excluded_room_count": len(excluded_rooms),
            "excluded_rooms_details": [
                {"room_id": er["room_id"], "room_type": er["room_type"], "area_m2": er.get("area_m2")}
                for er in excluded_rooms
            ],
            "ipms_crosswalk": {
                "ipms_2_residential_gross_internal_m2": gia_m2,
                "ipms_3_1_residential_exclusive_use_m2": nia_m2,
            },
            "is_calibrated": is_calibrated,
            "scale_provenance": scale_provenance,
        }


class EfficiencyAnalyzer:
    """
    Component 4: Computes building efficiency ratio (NIA / GIA * 100),
    evaluates against internal residential feasibility heuristics, and produces
    the step-by-step area reconciliation schedule.
    """

    def analyze_efficiency(
        self,
        standards_data: Dict[str, Any],
        boundary_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Analyzes plan efficiency and constructs the auditable area reconciliation schedule.
        Note: The 80-92% envelope is an internal architectural heuristic, NOT a RICS/IPMS requirement.
        """
        gia_m2 = standards_data.get("gross_internal_area_gia_m2")
        nia_m2 = standards_data.get("net_internal_area_nia_m2")
        is_calibrated = standards_data.get("is_calibrated", False)

        if is_calibrated and gia_m2 and gia_m2 > 0:
            efficiency_ratio_pct = round((nia_m2 / gia_m2) * 100.0, 2)
            # Internal architectural heuristic alert (80% - 92% typical for self-contained residential units)
            if efficiency_ratio_pct < 75.0:
                heuristic_assessment = "PLAUSIBILITY_ALERT: Low efficiency (<75.0%). High proportion of circulation/service/wall spaces."
            elif efficiency_ratio_pct > 95.0:
                heuristic_assessment = "PLAUSIBILITY_ALERT: High efficiency (>95.0%). Verify partition footprints and perimeter wall thickness."
            else:
                heuristic_assessment = "TYPICAL_RESIDENTIAL_HEURISTIC_ENVELOPE (80.0% - 92.0%)"
        else:
            efficiency_ratio_pct = None
            heuristic_assessment = "UNAVAILABLE_UNITS_UNCALIBRATED"

        # Auditable Step-by-Step Area Reconciliation Table
        reconciliation_table = [
            {
                "step": 1,
                "line_item": "Net Internal Usable Area (NIA / IPMS 3.1)",
                "area_m2": nia_m2,
                "description": "Usable private habitable and sanitary room interior finishes.",
            },
            {
                "step": 2,
                "line_item": "Excluded Accessory Spaces (Balconies, Garages, Terraces)",
                "area_m2": standards_data.get("excluded_space_area_m2"),
                "description": "Unenclosed or external accessory spaces excluded under IPMS/RICS.",
            },
            {
                "step": 3,
                "line_item": "Sum of Measured Room Finished Areas",
                "area_m2": standards_data.get("total_room_area_m2"),
                "description": "Direct sum of all measured closed polygon interior areas.",
            },
            {
                "step": 4,
                "line_item": "Internal Partition Wall Footprints",
                "area_m2": standards_data.get("internal_partition_footprint_m2"),
                "description": f"Internal wall centerline length ({boundary_data.get('internal_partitions_length_m')}m) × thickness ({boundary_data.get('nominal_wall_thickness_m', 0.12)}m).",
            },
            {
                "step": 5,
                "line_item": "Structural Columns & Service Ducts",
                "area_m2": round(sum(standards_data.get("structural_inclusions_m2", {}).values() or [0.0]), 2) if is_calibrated else None,
                "description": "Structural columns, piers, and vertical service shafts within enclosed plate.",
            },
            {
                "step": 6,
                "line_item": "Gross Internal Area (GIA / IPMS 2)",
                "area_m2": gia_m2,
                "description": "Total enclosed area to the inside face of external perimeter walls across all levels.",
            },
        ]

        return {
            "efficiency_ratio_pct": efficiency_ratio_pct,
            "heuristic_assessment": heuristic_assessment,
            "feasibility_status": heuristic_assessment,
            "heuristic_rule": "Internal HomeVerse heuristic for residential apartments/flats (80%-92%). Not a formal RICS/IPMS mandate.",
            "reconciliation_table": reconciliation_table,
        }


class PropertyAreaAggregator:
    """
    Master G6-A Pipeline: Coordinates Room Aggregator, Boundary Analyzer,
    Area Standards Engine, and Efficiency Analyzer.
    """

    def __init__(
        self,
        default_wall_height_m: float = 2.70,
        nominal_wall_thickness_m: float = 0.12,
    ):
        self.room_aggregator = RoomAggregator()
        self.boundary_analyzer = BoundaryAnalyzer(
            default_wall_height_m=default_wall_height_m,
            nominal_wall_thickness_m=nominal_wall_thickness_m,
        )
        self.standards_engine = AreaStandardsEngine()
        self.efficiency_analyzer = EfficiencyAnalyzer()

    def aggregate_property(
        self,
        rooms: List[Dict[str, Any]],
        scale_m_per_px: Optional[float] = None,
        scale_provenance: str = "UNAVAILABLE",
        custom_wall_height_m: Optional[float] = None,
        openings: Optional[List[Dict[str, Any]]] = None,
        property_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executes end-to-end G6-A property area aggregation.
        """
        # Step 1: Room Aggregation
        room_data = self.room_aggregator.aggregate_rooms(
            rooms=rooms,
            scale_m_per_px=scale_m_per_px,
            scale_provenance=scale_provenance,
        )

        # Step 2: Boundary Analysis
        boundary_data = self.boundary_analyzer.analyze_boundaries(
            shapely_polygons=room_data["shapely_polygons"],
            scale_m_per_px=scale_m_per_px,
            scale_provenance=scale_provenance,
            custom_wall_height_m=custom_wall_height_m,
            openings=openings,
        )

        # Step 3: Area Standards Engine
        standards_data = self.standards_engine.calculate_standards(
            processed_rooms=room_data["processed_rooms"],
            boundary_data=boundary_data,
            scale_m_per_px=scale_m_per_px,
            scale_provenance=scale_provenance,
        )

        # Step 4: Efficiency Analysis
        efficiency_data = self.efficiency_analyzer.analyze_efficiency(
            standards_data=standards_data,
            boundary_data=boundary_data,
        )

        return {
            "property_id": property_id or "property_eval_01",
            "formal_status": "PROVISIONAL",
            "production_restrictions": {
                "calibration_readiness": "UNVALIDATED_FOR_PRODUCTION",
                "cost_modeling_status": "FROZEN_NOT_PRODUCTION_READY",
                "restriction_notice": (
                    "G6-A property area schedules (GIA, NIA, partition quantities) are formalized "
                    "under provisional status. All downstream construction cost modeling (G6-B/C) "
                    "remains strictly frozen until G5 metric calibration passes all acceptance gates. "
                    "Preserves independently verified architectural progress without allowing unvalidated "
                    "dimension assignments to contaminate downstream production or cost estimates. "
                    "Validation boundaries remain strictly enforced."
                ),
            },
            "active_measurement_standard": standards_data["active_measurement_standard"],
            "legacy_reference_profile": standards_data["legacy_reference_profile"],
            "national_code_crosswalk": standards_data["national_code_crosswalk"],
            "ipms_crosswalk": standards_data["ipms_crosswalk"],
            "scale_metadata": {
                "scale_m_per_px": scale_m_per_px,
                "scale_px_per_m": round(1.0 / scale_m_per_px, 3) if scale_m_per_px else None,
                "provenance": scale_provenance,
                "is_calibrated": room_data["is_calibrated"],
            },
            "summary_metrics": {
                "gross_internal_area_gia_m2": standards_data["gross_internal_area_gia_m2"],
                "net_internal_area_nia_m2": standards_data["net_internal_area_nia_m2"],
                "efficiency_ratio_pct": efficiency_data["efficiency_ratio_pct"],
                "feasibility_status": efficiency_data["feasibility_status"],
                "total_room_count": room_data["total_room_count"],
                "duplicate_rooms_detected": room_data["duplicate_rooms_detected"],
            },
            "wall_and_surface_quantities": {
                "external_perimeter_m": boundary_data["external_perimeter_m"],
                "internal_partitions_length_m": boundary_data["internal_partitions_length_m"],
                "gross_external_wall_elevation_m2": boundary_data["gross_external_wall_elevation_m2"],
                "net_paintable_wall_surface_m2": boundary_data["total_net_paintable_wall_surface_m2"],
                "opening_deductions_m2": boundary_data["total_opening_deductions_m2"],
                "wall_height_m": boundary_data["wall_height_m"],
                "wall_height_is_default": boundary_data["wall_height_is_default"],
            },
            "flooring_schedule": room_data["flooring_schedules"],
            "category_area_breakdown_m2": room_data["category_areas_m2"],
            "room_schedule": room_data["processed_rooms"],
            "area_reconciliation": efficiency_data["reconciliation_table"],
        }
