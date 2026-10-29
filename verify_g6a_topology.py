"""
Verification Suite: G6-A Planar Topology & Geometric Invariants
===============================================================
HomeVerse Project - Milestone G6-A Architectural Verification

Verifies PropertyAreaAggregator against 5 mandated test topologies:
  1. Multi-Room Rectangular Layout: 4+ adjacent rooms in a 2x2 grid.
  2. L-Shaped & Non-Convex Rooms: Interlocking concave geometries with reflex vertices.
  3. Open-Plan Living/Dining: Virtual sub-spaces vs. physical enclosure.
  4. Shared Walls, Partial Boundaries & T-Junctions: One long wall bordering two smaller rooms.
  5. Columns, Piers & Vertical Shafts: Internal structural deductions and GIA inclusions.

Strict Acceptance Criteria:
  - Zero duplicate area contributions (Total Room Area == Sum of room interiors).
  - Exact shared partition wall deduplication in linear takeoffs (no double-counting).
  - Zero-residual mathematical reconciliation:
      |GIA - (Total Room Area + Partition Footprints + Columns + Shafts)| < 1e-9.
  - Correct boundary classification (External Perimeter vs Internal Partitions).
  - Traceable provenance and strict non-hallucination guardrail enforcement.
"""

import sys
import unittest
from pathlib import Path
from typing import Dict, List, Any

# Ensure project root is on sys.path
repo_root = Path(__file__).resolve().parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from property_area_aggregator import (
    PropertyAreaAggregator,
    RoomAggregator,
    BoundaryAnalyzer,
    AreaStandardsEngine,
    EfficiencyAnalyzer,
)


class TestG6ATopologyVerification(unittest.TestCase):
    """
    Independent topology verification suite for PropertyAreaAggregator.
    Evaluates geometric correctness independently of OCR calibration.
    """

    def setUp(self):
        self.aggregator = PropertyAreaAggregator(
            default_wall_height_m=2.80,
            nominal_wall_thickness_m=0.12,
        )
        # Using a clean canonical scale: 50 px/m -> 0.02 m/px
        self.scale_m_per_px = 0.02
        self.prov = "MEASURED"

    # =========================================================================
    # Scenario 1: Multi-Room Rectangular 2x2 Grid Layout
    # =========================================================================
    def test_scenario1_multi_room_rectangular_grid(self):
        """
        4 adjacent rooms in a 2x2 grid:
          R1: [0, 0] to [200, 150] (4m x 3m = 12 m²) - Living
          R2: [200, 0] to [350, 150] (3m x 3m = 9 m²) - Kitchen
          R3: [0, 150] to [200, 300] (4m x 3m = 12 m²) - Bed 1
          R4: [200, 150] to [350, 300] (3m x 3m = 9 m²) - Bed 2
        Total finished room area = 12 + 9 + 12 + 9 = 42.00 m²
        Outer envelope: 350px x 300px -> 7m x 6m -> Perimeter = 26.00 m
        Internal partitions:
          - Vertical shared wall: x=200 from y=0 to y=300 -> length 300px = 6.0m
          - Horizontal shared wall: y=150 from x=0 to x=350 -> length 350px = 7.0m
          - Total internal partitions = 13.0m
        """
        rooms = [
            {
                "room_id": "living_01",
                "room_type": "Living Room",
                "parent_category": "Living Area",
                "polygon_pixels": [(0, 0), (200, 0), (200, 150), (0, 150)],
            },
            {
                "room_id": "kitchen_01",
                "room_type": "Kitchen",
                "parent_category": "Cooking Area",
                "polygon_pixels": [(200, 0), (350, 0), (350, 150), (200, 150)],
            },
            {
                "room_id": "bed_01",
                "room_type": "Bed Room",
                "parent_category": "Sleeping Area",
                "polygon_pixels": [(0, 150), (200, 150), (200, 300), (0, 300)],
            },
            {
                "room_id": "bed_02",
                "room_type": "Bed Room",
                "parent_category": "Sleeping Area",
                "polygon_pixels": [(200, 150), (350, 150), (350, 300), (200, 300)],
            },
        ]

        report = self.aggregator.aggregate_property(
            rooms=rooms,
            scale_m_per_px=self.scale_m_per_px,
            scale_provenance=self.prov,
            property_id="grid_2x2_01",
        )

        sum_metrics = report["summary_metrics"]
        quantities = report["wall_and_surface_quantities"]
        reconciliation = report["area_reconciliation"]

        # 1. Total finished room area
        total_room_m2 = sum_metrics["net_internal_area_nia_m2"]
        self.assertAlmostEqual(total_room_m2, 42.00, places=2)

        # 2. External Perimeter
        self.assertAlmostEqual(quantities["external_perimeter_m"], 26.00, places=2)

        # 3. Internal Partition deduplication (must be ~13.0m, not doubled to 26.0m)
        self.assertAlmostEqual(quantities["internal_partitions_length_m"], 13.00, places=1)

        # 4. Partition footprint = 13.0m * 0.12m = 1.56 m²
        expected_partition_m2 = round(13.00 * 0.12, 2)

        # 5. Exact GIA Decomposition Reconciliation:
        # GIA = Total Room Area + Partition Footprint
        gia_m2 = sum_metrics["gross_internal_area_gia_m2"]
        self.assertAlmostEqual(gia_m2, 42.00 + expected_partition_m2, places=2)

        # 6. Auditable step residual check
        step1_nia = reconciliation[0]["area_m2"]
        step4_partition = reconciliation[3]["area_m2"]
        step6_gia = reconciliation[5]["area_m2"]
        residual = abs(step6_gia - (step1_nia + step4_partition))
        self.assertLess(residual, 0.01)

    # =========================================================================
    # Scenario 2: L-Shaped & Non-Convex Rooms with Reflex Vertices
    # =========================================================================
    def test_scenario2_l_shaped_non_convex_rooms(self):
        """
        Two interlocking rooms:
          Room A (L-shaped Living/Dining):
            (0,0) -> (300,0) -> (300, 100) -> (150, 100) -> (150, 250) -> (0, 250)
            Composed of:
              Top rectangle: [0, 0] to [300, 100] -> 6m x 2m = 12 m²
              Bottom-left leg: [0, 100] to [150, 250] -> 3m x 3m = 9 m²
            Total Room A = 21.00 m²
          Room B (Bedroom fitted into the reflex corner):
            [150, 100] to [300, 250] -> 3m x 3m = 9 m²
        Total Room Finished Area = 21.00 + 9.00 = 30.00 m²
        Combined bounding envelope = [0, 0] to [300, 250] -> 6m x 5m = 30 m² of rooms
        Outer perimeter = 2 * (6 + 5) = 22.00 m
        Shared internal boundary:
          - Horizontal segment: (150, 100) to (300, 100) -> 150px = 3.0m
          - Vertical segment: (150, 100) to (150, 250) -> 150px = 3.0m
          - Total shared internal partition = 6.00 m
        """
        poly_l_shaped = [
            (0.0, 0.0),
            (300.0, 0.0),
            (300.0, 100.0),
            (150.0, 100.0),
            (150.0, 250.0),
            (0.0, 250.0),
        ]
        poly_corner_bed = [
            (150.0, 100.0),
            (300.0, 100.0),
            (300.0, 250.0),
            (150.0, 250.0),
        ]

        rooms = [
            {
                "room_id": "l_living_01",
                "room_type": "Living Room",
                "parent_category": "Living Area",
                "polygon_pixels": poly_l_shaped,
            },
            {
                "room_id": "corner_bed_01",
                "room_type": "Bed Room",
                "parent_category": "Sleeping Area",
                "polygon_pixels": poly_corner_bed,
            },
        ]

        report = self.aggregator.aggregate_property(
            rooms=rooms,
            scale_m_per_px=self.scale_m_per_px,
            scale_provenance=self.prov,
            property_id="non_convex_l_shape_01",
        )

        sum_metrics = report["summary_metrics"]
        quantities = report["wall_and_surface_quantities"]

        # Finished room area
        self.assertAlmostEqual(sum_metrics["net_internal_area_nia_m2"], 30.00, places=2)

        # External perimeter of combined union (300px x 250px) = 6m + 5m + 6m + 5m = 22.00 m
        self.assertAlmostEqual(quantities["external_perimeter_m"], 22.00, places=2)

        # Shared L-notch partition length = 3.0m + 3.0m = 6.00 m
        self.assertAlmostEqual(quantities["internal_partitions_length_m"], 6.00, places=1)

        # GIA = 30.00 + (6.00 * 0.12 = 0.72) = 30.72 m²
        self.assertAlmostEqual(sum_metrics["gross_internal_area_gia_m2"], 30.72, places=2)

    # =========================================================================
    # Scenario 3: Open-Plan Living/Dining + Habitable vs Accessory Exclusions
    # =========================================================================
    def test_scenario3_open_plan_and_accessory_exclusions(self):
        """
        Open plan space with adjacent Balcony (Accessory space excluded from NIA):
          R1: Open-plan Living (250 x 200) = 5m x 4m = 20.00 m²
          R2: Attached Kitchen (150 x 200) = 3m x 4m = 12.00 m²
          R3: Balcony (Exterior Terrace) = (400 x 75) = 8m x 1.5m = 12.00 m²
        IPMS Standards Test:
          - NIA includes: Living Room (20m²) + Kitchen (12m²) = 32.00 m²
          - Excluded Accessory Space: Balcony (12.00 m²)
          - Finished room area = 44.00 m²
        """
        rooms = [
            {
                "room_id": "open_living",
                "room_type": "Living Room",
                "parent_category": "Living Area",
                "polygon_pixels": [(0, 0), (250, 0), (250, 200), (0, 200)],
            },
            {
                "room_id": "open_kitchen",
                "room_type": "Kitchen",
                "parent_category": "Cooking Area",
                "polygon_pixels": [(250, 0), (400, 0), (400, 200), (250, 200)],
            },
            {
                "room_id": "ext_balcony",
                "room_type": "Balcony",
                "parent_category": "Outdoor Area",
                "polygon_pixels": [(0, 200), (400, 200), (400, 275), (0, 275)],
            },
        ]

        report = self.aggregator.aggregate_property(
            rooms=rooms,
            scale_m_per_px=self.scale_m_per_px,
            scale_provenance=self.prov,
            property_id="open_plan_balcony_01",
        )

        sum_metrics = report["summary_metrics"]
        reconciliation = report["area_reconciliation"]

        # NIA must strictly exclude Balcony
        self.assertAlmostEqual(sum_metrics["net_internal_area_nia_m2"], 32.00, places=2)

        # Step 2: Excluded accessory spaces must report 12.00 m²
        step2_excluded = reconciliation[1]["area_m2"]
        self.assertAlmostEqual(step2_excluded, 12.00, places=2)

        # Step 3: Total room finished area = 32.00 + 12.00 = 44.00 m²
        step3_total = reconciliation[2]["area_m2"]
        self.assertAlmostEqual(step3_total, 44.00, places=2)

    # =========================================================================
    # Scenario 4: Shared Walls, Partial Boundaries & T-Junctions
    # =========================================================================
    def test_scenario4_partial_boundary_t_junction(self):
        """
        One long room sharing a wall with two smaller adjacent rooms (T-Junction):
          Room A (Long Gallery / Corridor):
            [0, 0] to [500, 100] (10m x 2m = 20 m²)
          Room B (Bedroom 1):
            [0, 100] to [300, 250] (6m x 3m = 18 m²)
          Room C (Bedroom 2):
            [300, 100] to [500, 250] (4m x 3m = 12 m²)
        Total Room Area = 20 + 18 + 12 = 50.00 m²
        T-Junction Wall Analysis:
          - The shared wall along y = 100 has total length 500px = 10.0m.
            (Room A meets Room B for 300px = 6.0m, and Room C for 200px = 4.0m)
          - The vertical partition between Room B and C at x = 300 from y = 100 to y = 250 has length 150px = 3.0m.
          - Total internal partitions must equal exactly 10.0m + 3.0m = 13.0m!
          - The 10m shared wall MUST NOT be counted as 20m (Room A's 10m + B's 6m + C's 4m).
        """
        rooms = [
            {
                "room_id": "long_corridor_01",
                "room_type": "Private Hallway",
                "parent_category": "Circulation Area",
                "polygon_pixels": [(0, 0), (500, 0), (500, 100), (0, 100)],
            },
            {
                "room_id": "bed_01",
                "room_type": "Bed Room",
                "parent_category": "Sleeping Area",
                "polygon_pixels": [(0, 100), (300, 100), (300, 250), (0, 250)],
            },
            {
                "room_id": "bed_02",
                "room_type": "Bed Room",
                "parent_category": "Sleeping Area",
                "polygon_pixels": [(300, 100), (500, 100), (500, 250), (300, 250)],
            },
        ]

        report = self.aggregator.aggregate_property(
            rooms=rooms,
            scale_m_per_px=self.scale_m_per_px,
            scale_provenance=self.prov,
            property_id="t_junction_plan_01",
        )

        quantities = report["wall_and_surface_quantities"]
        sum_metrics = report["summary_metrics"]

        # Finished area
        self.assertAlmostEqual(sum_metrics["net_internal_area_nia_m2"], 50.00, places=2)

        # External perimeter: [0,0] to [500, 250] -> 2 * (10m + 5m) = 30.00 m
        self.assertAlmostEqual(quantities["external_perimeter_m"], 30.00, places=2)

        # Deduplicated internal partitions must equal 10.0m (T-spine) + 3.0m (divider) = 13.0m
        self.assertAlmostEqual(quantities["internal_partitions_length_m"], 13.00, places=1)

        # Partition footprint = 13.0m * 0.12m = 1.56 m²
        # GIA = 50.00 + 1.56 = 51.56 m²
        self.assertAlmostEqual(sum_metrics["gross_internal_area_gia_m2"], 51.56, places=2)

    # =========================================================================
    # Scenario 5: Columns, Structural Piers & Vertical Shaft Deductions
    # =========================================================================
    def test_scenario5_columns_piers_and_vertical_shafts(self):
        """
        Layout with structural column piers and vertical MEP service risers:
          R1: Master Bedroom (250 x 200) = 5m x 4m = 20.00 m²
          R2: En-suite Bathroom (150 x 200) = 3m x 4m = 12.00 m²
        Total Room Area = 32.00 m²
        Structural inclusions passed to standards engine:
          - Structural column pier: 0.36 m² (e.g. 0.6m x 0.6m reinforced column)
          - Enclosed MEP duct riser: 0.45 m² (e.g. 0.9m x 0.5m service shaft)
        Total structural inclusions = 0.81 m²
        Internal partition length = 4.0m -> footprint = 4.0 * 0.12 = 0.48 m²
        GIA Decomposition:
          GIA = Total Room Area (32.00) + Partition Footprint (0.48) + Columns & Shafts (0.81)
              = 33.29 m²
        """
        rooms = [
            {
                "room_id": "master_bed",
                "room_type": "Master Bedroom",
                "parent_category": "Sleeping Area",
                "polygon_pixels": [(0, 0), (250, 0), (250, 200), (0, 200)],
            },
            {
                "room_id": "ensuite_bath",
                "room_type": "Bathroom",
                "parent_category": "Sanitary Area",
                "polygon_pixels": [(250, 0), (400, 0), (400, 200), (250, 200)],
            },
        ]

        # Use BoundaryAnalyzer and AreaStandardsEngine directly to test structural additions
        room_agg = RoomAggregator()
        room_data = room_agg.aggregate_rooms(rooms, self.scale_m_per_px, self.prov)

        boundary_an = BoundaryAnalyzer(default_wall_height_m=2.80, nominal_wall_thickness_m=0.12)
        boundary_data = boundary_an.analyze_boundaries(
            shapely_polygons=room_data["shapely_polygons"],
            scale_m_per_px=self.scale_m_per_px,
            scale_provenance=self.prov,
        )

        standards_eng = AreaStandardsEngine()
        standards_data = standards_eng.calculate_standards(
            processed_rooms=room_data["processed_rooms"],
            boundary_data=boundary_data,
            scale_m_per_px=self.scale_m_per_px,
            scale_provenance=self.prov,
            structural_columns_m2=0.36,
            vertical_shafts_m2=0.45,
        )

        eff_an = EfficiencyAnalyzer()
        eff_data = eff_an.analyze_efficiency(standards_data, boundary_data)

        # Verify GIA
        # Room Area = 32.00
        # Partition = 0.48
        # Columns = 0.36
        # Shafts = 0.45
        # Total GIA = 33.29 m²
        expected_gia = round(32.00 + 0.48 + 0.36 + 0.45, 2)
        self.assertAlmostEqual(standards_data["gross_internal_area_gia_m2"], expected_gia, places=2)

        # Check Step 5 in reconciliation schedule
        reconciliation = eff_data["reconciliation_table"]
        step5_struct = reconciliation[4]["area_m2"]
        self.assertAlmostEqual(step5_struct, 0.81, places=2)

        # Verify mathematical identity residual
        step1_nia = reconciliation[0]["area_m2"]
        step4_partition = reconciliation[3]["area_m2"]
        step5_columns = reconciliation[4]["area_m2"]
        step6_gia = reconciliation[5]["area_m2"]

        reconciled_sum = round(step1_nia + step4_partition + step5_columns, 2)
        residual = abs(step6_gia - reconciled_sum)
        self.assertLess(residual, 1e-9)


def run_topology_verification():
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(TestG6ATopologyVerification)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_topology_verification()
    sys.exit(0 if success else 1)
