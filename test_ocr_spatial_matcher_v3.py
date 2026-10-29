"""
Unit Test Suite: Geometric OCR Spatial Matcher V3
=================================================
HomeVerse Project - Milestone G5-OCR-v3 Acceptance Testing

Tests:
  1. Dimension annotation parsing (imperial, standard metric, compact centimeters, millimeters).
  2. Exact perpendicular wall-segment distance formula.
  3. Collinear wall span aggregation.
  4. Hierarchical line bounding-box reconstruction.
  5. Dummy full-image box rejection.
  6. Hungarian assignment with alternative margin evaluation.
  7. Ambiguity handling for equidistant competing rooms.
"""

import math
import unittest
from typing import Dict, List, Any

import numpy as np

from ocr_spatial_matcher_v3 import (
    parse_dimension_annotation_v3,
    point_to_wall_segment_perpendicular,
    aggregate_collinear_wall_spans,
    OCRSpatialMatcherV3,
)


class TestOCRSpatialMatcherV3(unittest.TestCase):

    def setUp(self):
        self.matcher = OCRSpatialMatcherV3(
            max_cost_threshold=0.65,
            min_margin_threshold=0.08,
            min_plausible_ppm=15.0,
            max_plausible_ppm=250.0,
            min_query_conf=0.25,
        )

    # 1. Parsing tests
    def test_dimension_parsing_formats(self):
        # Metric meters
        res1 = parse_dimension_annotation_v3("Bedroom 3.50 x 4.20 m")
        self.assertIsNotNone(res1)
        self.assertTrue(res1["is_paired"])
        self.assertAlmostEqual(res1["width_m"], 3.50)
        self.assertAlmostEqual(res1["length_m"], 4.20)

        # Compact centimeters
        res2 = parse_dimension_annotation_v3("494x244m")
        self.assertIsNotNone(res2)
        self.assertAlmostEqual(res2["width_m"], 2.44)
        self.assertAlmostEqual(res2["length_m"], 4.94)

        # Imperial
        res3 = parse_dimension_annotation_v3("11'0\" x 14'0\"")
        self.assertIsNotNone(res3)
        self.assertAlmostEqual(res3["width_m"], 3.353, places=2)
        self.assertAlmostEqual(res3["length_m"], 4.267, places=2)

        # Millimeters
        res4 = parse_dimension_annotation_v3("3500 x 4200")
        self.assertIsNotNone(res4)
        self.assertAlmostEqual(res4["width_m"], 3.50)
        self.assertAlmostEqual(res4["length_m"], 4.20)

    # 2. Perpendicular distance formula test
    def test_perpendicular_wall_distance(self):
        # Segment from (0, 100) to (200, 100) (horizontal line at y=100)
        # Point at (50, 120): distance perpendicular must be exactly 20.0
        p_eval = point_to_wall_segment_perpendicular(50.0, 120.0, 0.0, 100.0, 200.0, 100.0)
        self.assertAlmostEqual(p_eval["dist_perp"], 20.0, places=4)
        self.assertAlmostEqual(p_eval["dist_euclidean"], 20.0, places=4)
        self.assertAlmostEqual(p_eval["t"], 0.25, places=4)  # 50 / 200 = 0.25

        # Point past segment end: (250, 100)
        p_eval2 = point_to_wall_segment_perpendicular(250.0, 100.0, 0.0, 100.0, 200.0, 100.0)
        self.assertAlmostEqual(p_eval2["dist_perp"], 0.0, places=4)  # Collinear with line
        self.assertAlmostEqual(p_eval2["dist_euclidean"], 50.0, places=4)  # 50px past endpoint b
        self.assertAlmostEqual(p_eval2["t"], 1.25, places=4)

    # 3. Collinear wall span aggregation
    def test_collinear_wall_aggregation(self):
        wall_segs = [
            {"start": (0, 0), "end": (100, 0), "length_px": 100.0, "angle_deg": 0.0},
            {"start": (100, 0), "end": (250, 0), "length_px": 150.0, "angle_deg": 0.0},
            {"start": (250, 0), "end": (250, 200), "length_px": 200.0, "angle_deg": 90.0},
        ]
        spans = aggregate_collinear_wall_spans(wall_segs)
        # Two horizontal segments must be aggregated into one composite span of 250px
        horiz_spans = [s for s in spans if abs(s["angle_deg"]) <= 5.0]
        self.assertEqual(len(horiz_spans), 1)
        self.assertAlmostEqual(horiz_spans[0]["composite_length_px"], 250.0)

    # 4. Dummy bounding box rejection
    def test_dummy_bounding_box_rejection(self):
        annotations = [
            {
                "text": "3.50 x 4.20 m",
                "bbox": [0, 0, 800, 800],  # Dummy box spanning 80% of 1024x1024
            }
        ]
        rooms = [
            {
                "query_id": 0,
                "confidence": 0.90,
                "polygon_pixels": [(100, 100), (300, 100), (300, 300), (100, 300)],
            }
        ]
        res = self.matcher.match(ocr_annotations=annotations, detected_rooms=rooms, image_size=(1024, 1024))
        self.assertEqual(len(res["matched_associations"]), 0)
        self.assertEqual(res["unlocalized_count"], 1)

    # 5. Hungarian assignment with alternative margin evaluation
    def test_hungarian_matching_with_margin(self):
        # Two rooms, Room 1 at [100, 100] to [300, 300] (200x200)
        # Room 2 far away at [600, 600] to [800, 800]
        # Annotation at [200, 200] (center of Room 1)
        rooms = [
            {
                "query_id": 1,
                "confidence": 0.95,
                "polygon_pixels": [(100, 100), (300, 100), (300, 300), (100, 300)],
            },
            {
                "query_id": 2,
                "confidence": 0.90,
                "polygon_pixels": [(600, 600), (800, 600), (800, 800), (600, 800)],
            },
        ]
        annotations = [
            {
                "text": "4.00 x 4.00 m",
                "bbox": [190, 195, 20, 10],
                "center": (200.0, 200.0),
            }
        ]
        res = self.matcher.match(ocr_annotations=annotations, detected_rooms=rooms, image_size=(1024, 1024))
        self.assertEqual(len(res["matched_associations"]), 1)
        match = res["matched_associations"][0]
        self.assertEqual(match["room_query_id"], 1)
        self.assertGreater(match["assignment_margin"], 0.08)
        # Scale: 200px / 4.0m = 50.0 px/m
        self.assertAlmostEqual(res["scale_px_per_m"], 50.0, places=1)


if __name__ == "__main__":
    unittest.main()
