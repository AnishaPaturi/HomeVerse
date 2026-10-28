"""
Unit Test Suite: Geometric OCR Spatial Matcher
==============================================
HomeVerse Project - Milestone G5/G6 Transition Audit

Validates:
  1. OCR Dimension parsing across imperial, metric, mm, cm, and single dimensions.
  2. Multi-criteria cost function calculations (containment, line, projection, orientation, aspect).
  3. Bipartite Hungarian matching on synthetic 3-room layout (Master Bed, Living, Bath).
  4. Explicit ambiguity rejection for boundary-conflicted dimension annotations.
  5. Plausibility bounds rejection.
  6. Non-hallucination guardrail when zero valid annotations exist.
"""

import math
import unittest
from typing import Dict, List, Any

from ocr_spatial_matcher import (
    OCRSpatialMatcher,
    parse_dimension_annotation,
)


class TestOCRSpatialMatcher(unittest.TestCase):

    def setUp(self):
        self.matcher = OCRSpatialMatcher(
            max_cost_threshold=0.65,
            min_margin_threshold=0.08,
            min_plausible_ppm=20.0,
            max_plausible_ppm=200.0,
        )

    # -------------------------------------------------------------
    # 1. Parsing Tests
    # -------------------------------------------------------------
    def test_parse_imperial_feet_inches(self):
        res = parse_dimension_annotation("11'6\" x 14'2\"")
        self.assertIsNotNone(res)
        self.assertTrue(res["is_paired"])
        self.assertAlmostEqual(res["width_m"], 3.505, places=2)
        self.assertAlmostEqual(res["length_m"], 4.318, places=2)
        self.assertEqual(res["unit"], "imperial_feet_inches")

    def test_parse_metric_standard(self):
        res = parse_dimension_annotation("3.35m x 4.27m")
        self.assertIsNotNone(res)
        self.assertTrue(res["is_paired"])
        self.assertEqual(res["width_m"], 3.35)
        self.assertEqual(res["length_m"], 4.27)
        self.assertAlmostEqual(res["aspect_ratio"], 4.27 / 3.35, places=2)

    def test_parse_millimeters(self):
        res = parse_dimension_annotation("3500 x 4200")
        self.assertIsNotNone(res)
        self.assertTrue(res["is_paired"])
        self.assertEqual(res["width_m"], 3.5)
        self.assertEqual(res["length_m"], 4.2)

    def test_parse_single_dimension(self):
        res = parse_dimension_annotation("4.50m")
        self.assertIsNotNone(res)
        self.assertFalse(res["is_paired"])
        self.assertEqual(res["dimension_m"], 4.50)

    def test_parse_invalid_text(self):
        self.assertIsNone(parse_dimension_annotation("Living Room"))
        self.assertIsNone(parse_dimension_annotation("Scale: 1:100"))
        self.assertIsNone(parse_dimension_annotation(""))

    # -------------------------------------------------------------
    # 2. Geometric Cost Function Tests
    # -------------------------------------------------------------
    def test_containment_cost_inside_and_outside(self):
        # 100 x 100 room centered at (150, 150)
        poly = [(100.0, 100.0), (200.0, 100.0), (200.0, 200.0), (100.0, 200.0)]
        
        # Center inside
        cost_inside = self.matcher.compute_containment_distance((150.0, 150.0), poly)
        self.assertEqual(cost_inside, 0.0)

        # Center outside
        cost_outside = self.matcher.compute_containment_distance((300.0, 150.0), poly)
        self.assertGreater(cost_outside, 0.5)

    def test_aspect_ratio_cost(self):
        # 3.0m x 4.5m -> aspect = 1.5
        parsed = {"is_paired": True, "aspect_ratio": 1.5}
        
        # Room with aspect 1.5 -> cost 0
        cost_match = self.matcher.compute_aspect_ratio_distance(parsed, 1.50)
        self.assertAlmostEqual(cost_match, 0.0, places=3)

        # Room with aspect 2.25 -> 50% mismatch -> cost 1.0
        cost_mismatch = self.matcher.compute_aspect_ratio_distance(parsed, 2.25)
        self.assertAlmostEqual(cost_mismatch, 1.0, places=2)

    # -------------------------------------------------------------
    # 3. Full Bipartite Matching on Multi-Room Synthetic Layout
    # -------------------------------------------------------------
    def test_multi_room_bipartite_matching(self):
        # Ground Truth Scale = 50.0 pixels per meter
        scale_ppm = 50.0

        # Room 1: Master Bedroom (4.0m x 5.0m) -> 200px x 250px at (50, 50)
        r1_poly = [(50.0, 50.0), (250.0, 50.0), (250.0, 300.0), (50.0, 300.0)]
        room1 = {
            "room_id": "room_01",
            "type": "Master Bedroom",
            "polygon_pixels": r1_poly,
            "mabr": {"length_px": 250.0, "width_px": 200.0, "aspect_ratio": 1.25, "rotation_deg": 0.0},
            "wall_segments": [
                {"angle_deg": 0.0, "length_px": 200.0},
                {"angle_deg": 90.0, "length_px": 250.0},
            ],
        }

        # Room 2: Living Room (5.0m x 6.0m) -> 250px x 300px at (300, 50)
        r2_poly = [(300.0, 50.0), (550.0, 50.0), (550.0, 350.0), (300.0, 350.0)]
        room2 = {
            "room_id": "room_02",
            "type": "Living Room",
            "polygon_pixels": r2_poly,
            "mabr": {"length_px": 300.0, "width_px": 250.0, "aspect_ratio": 1.20, "rotation_deg": 0.0},
            "wall_segments": [
                {"angle_deg": 0.0, "length_px": 250.0},
                {"angle_deg": 90.0, "length_px": 300.0},
            ],
        }

        # Room 3: Bathroom (2.0m x 2.5m) -> 100px x 125px at (50, 350)
        r3_poly = [(50.0, 350.0), (150.0, 350.0), (150.0, 475.0), (50.0, 475.0)]
        room3 = {
            "room_id": "room_03",
            "type": "Bathroom",
            "polygon_pixels": r3_poly,
            "mabr": {"length_px": 125.0, "width_px": 100.0, "aspect_ratio": 1.25, "rotation_deg": 0.0},
            "wall_segments": [
                {"angle_deg": 0.0, "length_px": 100.0},
                {"angle_deg": 90.0, "length_px": 125.0},
            ],
        }

        rooms = [room1, room2, room3]

        # 3 Printed OCR Annotations (with deliberate minor offset to test robustness)
        annotations = [
            {"text": "5.0m x 6.0m", "bbox": [400, 180, 50, 20], "center": (425.0, 190.0)},   # In Room 2
            {"text": "2.0m x 2.5m", "bbox": [90, 400, 40, 15], "center": (110.0, 407.5)},     # In Room 3
            {"text": "4.0m x 5.0m", "bbox": [130, 160, 45, 18], "center": (152.5, 169.0)},   # In Room 1
        ]

        result = self.matcher.match(annotations, rooms)

        self.assertTrue(result["is_calibrated"])
        self.assertEqual(result["provenance"], "MEASURED")
        self.assertEqual(result["verified_matches_count"], 3)
        self.assertEqual(result["ambiguous_count"], 0)
        self.assertEqual(result["rejected_count"], 0)

        # Check precision: each annotation matched to the correct room
        match_dict = {m["room_id"]: m["annotation_text"] for m in result["matched_associations"]}
        self.assertEqual(match_dict["room_01"], "4.0m x 5.0m")
        self.assertEqual(match_dict["room_02"], "5.0m x 6.0m")
        self.assertEqual(match_dict["room_03"], "2.0m x 2.5m")

        # Check consensus scale accuracy: Should be exactly 50.0 px/m
        self.assertAlmostEqual(result["scale_px_per_m"], 50.0, places=1)
        self.assertAlmostEqual(result["scale_m_per_px"], 0.02, places=4)

    def test_single_dimensions_pregrouped_into_room_pair(self):
        # Room: Master Bedroom (4.0m x 5.0m) -> 200px x 250px at (50, 50)
        # Scale = 50.0 px/m
        room = {
            "room_id": "bed_master",
            "type": "Master Bedroom",
            "polygon_pixels": [(50.0, 50.0), (250.0, 50.0), (250.0, 300.0), (50.0, 300.0)],
            "mabr": {"length_px": 250.0, "width_px": 200.0, "aspect_ratio": 1.25, "rotation_deg": 0.0},
            "wall_segments": [
                {"angle_deg": 0.0, "length_px": 200.0},
                {"angle_deg": 90.0, "length_px": 250.0},
            ],
        }

        # Two separate single-dimension labels inside the room (e.g., width 4.0m and length 5.0m)
        annotations = [
            {"text": "4.0m", "bbox": [100, 70, 30, 15], "center": (115.0, 77.5)},
            {"text": "5.0m", "bbox": [60, 150, 15, 30], "center": (67.5, 165.0)},
        ]

        result = self.matcher.match(annotations, [room], enable_pre_grouping=True)

        self.assertTrue(result["is_calibrated"])
        self.assertEqual(result["verified_matches_count"], 1)
        self.assertEqual(result["matched_associations"][0]["room_id"], "bed_master")
        self.assertAlmostEqual(result["scale_px_per_m"], 50.0, places=1)

    # -------------------------------------------------------------
    # 4. Ambiguity Rejection Test
    # -------------------------------------------------------------
    def test_ambiguity_flagged_for_conflicted_boundary_text(self):
        # Two adjacent rooms with identical dimensions (200px x 200px)
        r1 = {
            "room_id": "bed_A",
            "type": "Bedroom",
            "polygon_pixels": [(0.0, 0.0), (200.0, 0.0), (200.0, 200.0), (0.0, 200.0)],
            "mabr": {"length_px": 200.0, "width_px": 200.0, "aspect_ratio": 1.0},
        }
        r2 = {
            "room_id": "bed_B",
            "type": "Bedroom",
            "polygon_pixels": [(200.0, 0.0), (400.0, 0.0), (400.0, 200.0), (200.0, 200.0)],
            "mabr": {"length_px": 200.0, "width_px": 200.0, "aspect_ratio": 1.0},
        }

        # Text positioned exactly on the dividing wall (x = 200)
        ann = [{"text": "3.0m x 3.0m", "bbox": [180, 90, 40, 20], "center": (200.0, 100.0)}]

        res = self.matcher.match(ann, [r1, r2])
        # Margin between r1 and r2 is 0.0 -> must be explicitly flagged as AMBIGUOUS!
        self.assertGreaterEqual(res["ambiguous_count"], 1)
        self.assertEqual(res["verified_matches_count"], 0)

    # -------------------------------------------------------------
    # 5. Out-of-Bounds Rejection Test
    # -------------------------------------------------------------
    def test_out_of_bounds_dimension_rejected(self):
        room = {
            "room_id": "r1",
            "type": "Room",
            "polygon_pixels": [(0.0, 0.0), (100.0, 0.0), (100.0, 100.0), (0.0, 100.0)],
            "mabr": {"length_px": 100.0, "width_px": 100.0, "aspect_ratio": 1.0},
        }
        # 100px / 25.0m = 4.0 px/m (Plausibility lower bound is 20.0 px/m)
        ann = [{"text": "25.0m x 25.0m", "bbox": [40, 40, 20, 20], "center": (50.0, 50.0)}]
        res = self.matcher.match(ann, [room])
        self.assertEqual(res["verified_matches_count"], 0)
        self.assertEqual(res["rejected_count"], 1)
        self.assertFalse(res["is_calibrated"])

    # -------------------------------------------------------------
    # 6. Zero Annotations Non-Hallucination Contract
    # -------------------------------------------------------------
    def test_zero_annotations_non_hallucination(self):
        room = {
            "room_id": "r1",
            "type": "Living Room",
            "polygon_pixels": [(0.0, 0.0), (100.0, 0.0), (100.0, 100.0), (0.0, 100.0)],
            "mabr": {"length_px": 100.0, "width_px": 100.0, "aspect_ratio": 1.0},
        }
        res = self.matcher.match([], [room])
        self.assertFalse(res["is_calibrated"])
        self.assertIsNone(res["scale_px_per_m"])
        self.assertIsNone(res["scale_m_per_px"])
        self.assertEqual(res["provenance"], "UNAVAILABLE")


if __name__ == "__main__":
    unittest.main()
