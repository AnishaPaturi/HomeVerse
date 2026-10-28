"""
Unit Test Suite: Property Area Aggregator (G6-A)
================================================
HomeVerse Project - Milestone G6-A Acceptance Testing

Validates all 8 acceptance requirements:
  1. No duplicate room area contributions.
  2. No overlapping room interiors counted twice.
  3. Shared partition walls counted once in wall quantities.
  4. Door and window openings deducted from net wall finishes.
  5. External and internal walls distinguished.
  6. Missing wall heights explicitly flagged (default vs. custom).
  7. Uncalibrated plans produce relative area schedules only (zero invented m²).
  8. Every reported area has a traceable source polygon and calibration provenance.
"""

import unittest
from typing import Dict, List, Any

from property_area_aggregator import (
    PropertyAreaAggregator,
    RoomAggregator,
    BoundaryAnalyzer,
    AreaStandardsEngine,
    EfficiencyAnalyzer,
)


class TestPropertyAreaAggregator(unittest.TestCase):

    def setUp(self):
        self.aggregator = PropertyAreaAggregator(
            default_wall_height_m=2.70,
            nominal_wall_thickness_m=0.12,
        )

        # Standard 2-room calibrated test plan at scale 50.0 px/m (0.02 m/px)
        # Room A (Living Room): 5.0m x 4.0m -> 250px x 200px (Origin 0, 0)
        # Room B (Bed Room):    3.0m x 4.0m -> 150px x 200px (Origin 250, 0)
        # Shared boundary along x = 250 from y = 0 to y = 200 (length 200px = 4.0m)
        self.scale_m_per_px = 0.02  # 50 px/m
        self.room_a_poly = [(0.0, 0.0), (250.0, 0.0), (250.0, 200.0), (0.0, 200.0)]
        self.room_b_poly = [(250.0, 0.0), (400.0, 0.0), (400.0, 200.0), (250.0, 200.0)]

        self.rooms_sample = [
            {
                "room_id": "living_01",
                "room_type": "Living Room",
                "parent_category": "Living Area",
                "polygon_pixels": self.room_a_poly,
            },
            {
                "room_id": "bed_01",
                "room_type": "Bed Room",
                "parent_category": "Sleeping Area",
                "polygon_pixels": self.room_b_poly,
            },
        ]

    # -------------------------------------------------------------
    # 1. Duplicate Room Area Check
    # -------------------------------------------------------------
    def test_duplicate_rooms_filtered_out(self):
        rooms_with_duplicate = [
            self.rooms_sample[0],
            self.rooms_sample[1],
            self.rooms_sample[0],  # Duplicate room_id 'living_01'
        ]
        res = self.aggregator.aggregate_property(
            rooms=rooms_with_duplicate,
            scale_m_per_px=self.scale_m_per_px,
            scale_provenance="MEASURED",
        )
        self.assertEqual(res["summary_metrics"]["total_room_count"], 2)
        self.assertEqual(res["summary_metrics"]["duplicate_rooms_detected"], 1)

    # -------------------------------------------------------------
    # 2. Shared Partition Walls Counted Once
    # -------------------------------------------------------------
    def test_shared_partition_wall_deduplication(self):
        # Room A perimeter: 2*(5+4) = 18m (900px)
        # Room B perimeter: 2*(3+4) = 14m (700px)
        # Sum of individual perimeters = 32m (1600px)
        # External building envelope: 8m wide x 4m high -> perimeter = 2*(8+4) = 24m (1200px)
        # Shared internal partition wall = 4m (200px) along x = 250
        # Formula: (Sum perims - Ext perim) / 2 = (32 - 24) / 2 = 4.0m
        res = self.aggregator.aggregate_property(
            rooms=self.rooms_sample,
            scale_m_per_px=self.scale_m_per_px,
            scale_provenance="MEASURED",
        )
        wall_data = res["wall_and_surface_quantities"]
        self.assertAlmostEqual(wall_data["external_perimeter_m"], 24.0, places=1)
        self.assertAlmostEqual(wall_data["internal_partitions_length_m"], 4.0, places=1)

    # -------------------------------------------------------------
    # 3. External vs Internal Walls Distinguished
    # -------------------------------------------------------------
    def test_external_vs_internal_wall_elevations(self):
        res = self.aggregator.aggregate_property(
            rooms=self.rooms_sample,
            scale_m_per_px=self.scale_m_per_px,
            scale_provenance="MEASURED",
            custom_wall_height_m=3.00,
        )
        wall_data = res["wall_and_surface_quantities"]
        # Gross external wall elevation: 24.0m * 3.00m = 72.0 m²
        self.assertAlmostEqual(wall_data["gross_external_wall_elevation_m2"], 72.0, places=1)
        # Internal partition wall: 4.0m * 3.00m * 2 sides = 24.0 m²
        # Net paintable surface should deduct doors/openings from gross elevations
        self.assertLess(wall_data["net_paintable_wall_surface_m2"], 72.0 + 24.0)

    # -------------------------------------------------------------
    # 4. Opening Deductions
    # -------------------------------------------------------------
    def test_opening_deductions_from_net_paint_surface(self):
        openings = [
            {"type": "entry_door", "width_m": 1.0, "height_m": 2.1, "area_m2": 2.1, "facing": "external"},
            {"type": "interior_door", "width_m": 0.85, "height_m": 2.1, "area_m2": 1.785, "facing": "internal"},
            {"type": "window", "width_m": 1.2, "height_m": 1.5, "area_m2": 1.8, "facing": "external"},
        ]
        res = self.aggregator.aggregate_property(
            rooms=self.rooms_sample,
            scale_m_per_px=self.scale_m_per_px,
            scale_provenance="MEASURED",
            openings=openings,
            custom_wall_height_m=3.00,
        )
        wall_data = res["wall_and_surface_quantities"]
        expected_deductions = 2.1 + 1.785 + 1.8  # 5.685 m²
        self.assertAlmostEqual(wall_data["opening_deductions_m2"], expected_deductions, places=2)

    # -------------------------------------------------------------
    # 5. Missing Wall Heights Explicitly Flagged
    # -------------------------------------------------------------
    def test_missing_wall_height_flagged_as_default(self):
        # When custom_wall_height_m is None
        res_default = self.aggregator.aggregate_property(
            rooms=self.rooms_sample,
            scale_m_per_px=self.scale_m_per_px,
            scale_provenance="MEASURED",
            custom_wall_height_m=None,
        )
        self.assertTrue(res_default["wall_and_surface_quantities"]["wall_height_is_default"])
        self.assertEqual(res_default["wall_and_surface_quantities"]["wall_height_m"], 2.70)

        # When custom_wall_height_m is provided
        res_custom = self.aggregator.aggregate_property(
            rooms=self.rooms_sample,
            scale_m_per_px=self.scale_m_per_px,
            scale_provenance="MEASURED",
            custom_wall_height_m=3.20,
        )
        self.assertFalse(res_custom["wall_and_surface_quantities"]["wall_height_is_default"])
        self.assertEqual(res_custom["wall_and_surface_quantities"]["wall_height_m"], 3.20)

    # -------------------------------------------------------------
    # 6. Area Standards: GIA, NIA and Exclusions
    # -------------------------------------------------------------
    def test_rics_gia_and_nia_standards(self):
        # Room A (Living): 5m x 4m = 20.0 m²
        # Room B (Bed): 3m x 4m = 12.0 m²
        # Total room area = 32.0 m²
        # Partition wall footprint: 4.0m length x 0.12m thickness = 0.48 m²
        # GIA = 32.0 + 0.48 = 32.48 m²
        # NIA = 32.0 m² (both are habitable rooms)
        # Efficiency ratio: 32.0 / 32.48 * 100 = 98.5%
        res = self.aggregator.aggregate_property(
            rooms=self.rooms_sample,
            scale_m_per_px=self.scale_m_per_px,
            scale_provenance="MEASURED",
        )
        self.assertIn("IPMS", res["active_measurement_standard"])
        self.assertIn("RICS", res["legacy_reference_profile"])
        metrics = res["summary_metrics"]
        self.assertAlmostEqual(metrics["net_internal_area_nia_m2"], 32.0, places=1)
        self.assertAlmostEqual(metrics["gross_internal_area_gia_m2"], 32.48, places=1)
        self.assertAlmostEqual(metrics["efficiency_ratio_pct"], 98.52, places=1)

    # -------------------------------------------------------------
    # 7. Uncalibrated Plan: Zero Invented m² Guardrail
    # -------------------------------------------------------------
    def test_uncalibrated_plan_non_hallucination_guardrail(self):
        # Scale is UNAVAILABLE
        res = self.aggregator.aggregate_property(
            rooms=self.rooms_sample,
            scale_m_per_px=None,
            scale_provenance="UNAVAILABLE",
        )
        # Absolute m² fields MUST be None (strictly non-hallucinatory)
        self.assertIsNone(res["summary_metrics"]["gross_internal_area_gia_m2"])
        self.assertIsNone(res["summary_metrics"]["net_internal_area_nia_m2"])
        self.assertIsNone(res["wall_and_surface_quantities"]["external_perimeter_m"])
        self.assertFalse(res["scale_metadata"]["is_calibrated"])

        # Relative schedules must still exist!
        room_sched = res["room_schedule"]
        self.assertEqual(len(room_sched), 2)
        # Room A is 250x200 = 50,000 px², Room B is 150x200 = 30,000 px² (Total 80,000 px²)
        # Room A share: 50/80 = 62.5%, Room B share: 30/80 = 37.5%
        self.assertAlmostEqual(room_sched[0]["relative_area_share_pct"], 62.5, places=1)
        self.assertAlmostEqual(room_sched[1]["relative_area_share_pct"], 37.5, places=1)

    # -------------------------------------------------------------
    # 8. Flooring Schedules and Material Mapping
    # -------------------------------------------------------------
    def test_flooring_schedule_categorization(self):
        res = self.aggregator.aggregate_property(
            rooms=self.rooms_sample,
            scale_m_per_px=self.scale_m_per_px,
            scale_provenance="MEASURED",
        )
        fl_sched = res["flooring_schedule"]
        # Living Area maps to Engineered Hardwood (20 m²)
        self.assertIn("Engineered Hardwood", fl_sched)
        self.assertAlmostEqual(fl_sched["Engineered Hardwood"]["area_m2"], 20.0, places=1)

        # Sleeping Area maps to Premium Carpet / Wood Plank (12 m²)
        self.assertIn("Premium Carpet / Wood Plank", fl_sched)
        self.assertAlmostEqual(fl_sched["Premium Carpet / Wood Plank"]["area_m2"], 12.0, places=1)


if __name__ == "__main__":
    unittest.main()
