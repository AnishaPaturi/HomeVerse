"""
Unit Test Suite for Milestone G5: metric_calibrator and metric_geometry
======================================================================
"""

import sys
from pathlib import Path
repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

import math
import unittest
import numpy as np
import cv2

from metric_calibrator import (
    parse_dimension_string,
    parse_reference_single_dim,
    MetricScaleCalibrator,
)
from metric_geometry import (
    calculate_shoelace_area_px,
    calculate_polygon_perimeter_px,
    calculate_wall_segments,
    calculate_mabr_dimensions,
    calculate_form_factors,
    compute_physical_room_geometry,
    decompose_area_error,
)


class TestMetricCalibrator(unittest.TestCase):
    def test_dimension_parsers(self):
        # Imperial
        self.assertEqual(parse_dimension_string("10'11\" x 12'11\""), (3.33, 3.94))
        self.assertEqual(parse_dimension_string("11'0\" x 14'0\""), (3.35, 4.27))
        # Metric
        self.assertEqual(parse_dimension_string("3.03 x 7.30 m"), (3.03, 7.3))
        self.assertEqual(parse_dimension_string("2.21x2.48"), (2.21, 2.48))
        # Centimeters
        self.assertEqual(parse_dimension_string("228 x 730"), (2.28, 7.3))
        # Millimeters
        self.assertEqual(parse_dimension_string("3350 x 4270"), (3.35, 4.27))
        # Reference tags
        self.assertEqual(parse_dimension_string("[Bed: 1.8x2.0m]"), (1.8, 2.0))
        self.assertEqual(parse_dimension_string("[Table: 1.4x0.8m]"), (1.4, 0.8))

    def test_reference_single_dim(self):
        self.assertEqual(parse_reference_single_dim("[Sofa: 2.4m]"), ("sofa", 2.4))
        self.assertEqual(parse_reference_single_dim("[WC: 0.7m]"), ("wc", 0.7))
        self.assertIsNone(parse_reference_single_dim("Random text"))

    def test_no_scale_non_hallucination(self):
        calibrator = MetricScaleCalibrator()
        # Mock dummy image
        dummy_img = np.ones((500, 500, 3), dtype=np.uint8) * 255
        res = calibrator.calibrate(dummy_img, scale_mode_hint="no-scale")
        self.assertIsNone(res["scale_px_per_m"])
        self.assertIsNone(res["scale_m_per_px"])
        self.assertEqual(res["provenance"], "UNAVAILABLE")
        self.assertEqual(res["tier"], 5)
        self.assertEqual(res["confidence"], 0.0)
        self.assertFalse(res["is_calibrated"])

    def test_vit_fallback_calibration(self):
        calibrator = MetricScaleCalibrator()
        dummy_img = np.ones((500, 500, 3), dtype=np.uint8) * 255
        res = calibrator.calibrate(dummy_img, vit_scale_prediction=60.0)
        self.assertEqual(res["scale_px_per_m"], 60.0)
        self.assertAlmostEqual(res["scale_m_per_px"], 1.0 / 60.0, places=4)
        self.assertEqual(res["provenance"], "ESTIMATED")
        self.assertEqual(res["tier"], 4)
        self.assertTrue(res["is_calibrated"])

    def test_scale_bar_detection(self):
        calibrator = MetricScaleCalibrator()
        # Actual scale-bar sample from test set
        sample_path = repo_root / "HomeVerse-Dataset/images/test/homeverse_000664.png"
        if sample_path.exists():
            res = calibrator.detect_scale_bar(sample_path)
            self.assertIsNotNone(res)
            # Ground truth PPM for homeverse_000664 is 61.5471
            self.assertAlmostEqual(res["scale_px_per_m"], 61.8, delta=1.5)
            self.assertEqual(res["provenance"], "MEASURED")


class TestMetricGeometry(unittest.TestCase):
    def setUp(self):
        # A simple 4m x 3m room at scale s = 0.02 m/px (i.e. 50 px/m)
        # In pixels: 200px x 150px
        self.rect_pts = [(100.0, 100.0), (300.0, 100.0), (300.0, 250.0), (100.0, 250.0)]
        self.scale_s = 0.02  # 1 px = 0.02 m => 50 px/m

    def test_shoelace_area_and_perimeter(self):
        area_px = calculate_shoelace_area_px(self.rect_pts)
        self.assertAlmostEqual(area_px, 200.0 * 150.0, places=2)

        perim_px = calculate_polygon_perimeter_px(self.rect_pts)
        self.assertAlmostEqual(perim_px, 2 * (200.0 + 150.0), places=2)

        geo = compute_physical_room_geometry(self.rect_pts, self.scale_s, "Living Room")
        self.assertTrue(geo["is_metric_calibrated"])
        # Expected area: 4.0m * 3.0m = 12.0 m^2
        self.assertAlmostEqual(geo["area_m2"], 12.0, places=2)
        # Expected perim: 2 * (4.0 + 3.0) = 14.0 m
        self.assertAlmostEqual(geo["perimeter_m"], 14.0, places=2)

    def test_mabr_dimensions(self):
        mabr = calculate_mabr_dimensions(self.rect_pts, self.scale_s)
        self.assertAlmostEqual(mabr["length_m"], 4.0, places=2)
        self.assertAlmostEqual(mabr["width_m"], 3.0, places=2)
        self.assertAlmostEqual(mabr["aspect_ratio"], 4.0 / 3.0, places=2)

    def test_wall_segments(self):
        walls = calculate_wall_segments(self.rect_pts, self.scale_s)
        self.assertEqual(len(walls), 4)
        lengths_m = [w["length_m"] for w in walls]
        self.assertIn(4.0, lengths_m)
        self.assertIn(3.0, lengths_m)

    def test_non_convex_solidity(self):
        # L-shaped room: 200x200 box with 100x100 missing corner
        l_shape = [
            (0.0, 0.0), (200.0, 0.0), (200.0, 100.0),
            (100.0, 100.0), (100.0, 200.0), (0.0, 200.0)
        ]
        form = calculate_form_factors(l_shape)
        # Convex hull vertices: (0,0), (200,0), (200,100), (100,200), (0,200)
        # Convex hull area = 40000 - 5000 = 35000; L-shape area = 30000 => solidity = 30000/35000 = 0.8571
        self.assertAlmostEqual(form["solidity"], 30000.0 / 35000.0, places=2)
        self.assertTrue(form["is_non_convex"])

    def test_error_decomposition(self):
        # GT: area_px = 10000, scale_gt = 0.02 -> GT area = 10000 * 0.0004 = 4.0 m^2
        # Pred: area_px = 11000 (+10% pixel error), scale_pred = 0.022 (+10% scale error)
        res = decompose_area_error(
            area_px_pred=11000.0,
            area_px_gt=10000.0,
            scale_pred=0.022,
            scale_gt=0.020,
        )
        self.assertAlmostEqual(res["eps_pixel"], 0.10, places=3)
        self.assertAlmostEqual(res["eps_scale"], 0.10, places=3)
        
        # Scenario 1 (Pure Calibration): GT geom (10000) * (0.022)^2 = 4.84 m^2 -> error = 0.84 / 4.0 = 21%
        self.assertAlmostEqual(res["scenario1_calibration_error"], 0.21, places=3)

        # Scenario 2 (Pure Geometry): Pred geom (11000) * (0.020)^2 = 4.40 m^2 -> error = 0.40 / 4.0 = 10%
        self.assertAlmostEqual(res["scenario2_geometry_error"], 0.10, places=3)

        # Scenario 3 (End-to-End): Pred geom (11000) * (0.022)^2 = 5.324 m^2 -> error = 1.324 / 4.0 = 33.1%
        self.assertAlmostEqual(res["scenario3_total_error"], 0.331, places=3)

        # Compounded formula: (1 + 0.10) * (1 + 0.10)^2 - 1 = 1.10 * 1.21 - 1 = 0.331
        self.assertAlmostEqual(res["compounded_relative_area_error"], 0.331, places=3)


if __name__ == "__main__":
    unittest.main()
