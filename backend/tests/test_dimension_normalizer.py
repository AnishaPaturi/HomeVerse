"""
Unit tests for Architectural Dimension Normalizer
Tests conversion of raw blueprint dimensions (imperial) to exact metric equivalents.
"""

import pytest
from app.ai.dimension_normalizer import (
    parse_imperial_length,
    parse_dimension_pair,
    meters_to_imperial_str,
    calculate_dimension_error,
    DimensionNormalizer
)


def test_parse_imperial_length():
    # 11'11" -> 3.632 m
    assert parse_imperial_length("11'11\"") == 3.632
    # 12'11" -> 3.937 m
    assert parse_imperial_length("12'11\"") == 3.937
    # 5'0" -> 1.524 m
    assert parse_imperial_length("5'0\"") == 1.524
    # 7'11" -> 2.413 m
    assert parse_imperial_length("7'11\"") == 2.413
    # 5'3" -> 1.600 m
    assert parse_imperial_length("5'3\"") == 1.600


def test_parse_dimension_pairs_from_blueprint():
    # Drawing Room: 11'11" × 12'11"
    w, l = parse_dimension_pair("11'11\" × 12'11\"")
    assert round(w, 2) == 3.63
    assert round(l, 2) == 3.94

    # Dining: 17'6" × 11'2"
    w, l = parse_dimension_pair("17'6\" × 11'2\"")
    assert round(w, 2) == 5.33
    assert round(l, 2) == 3.40

    # Kitchen: 11'5" × 9'9"
    w, l = parse_dimension_pair("11'5\" × 9'9\"")
    assert round(w, 2) == 3.48
    assert round(l, 2) == 2.97

    # Master Bedroom: 11'11" × 14'11"
    w, l = parse_dimension_pair("11'11\" × 14'11\"")
    assert round(w, 2) == 3.63
    assert round(l, 2) == 4.55


def test_dimension_normalizer_output_structure():
    # User's schema:
    # Detected Room -> Detected Dimensions -> Ground Truth Dimensions -> Dimension Error % -> Detection Confidence
    record = DimensionNormalizer.normalize_room_record(
        source_label="MASTER BEDROOM",
        detected_w_m=3.65,
        detected_l_m=4.50,
        gt_imperial_str="11'11\" × 14'11\"",
        confidence=0.94
    )

    assert record["source_label"] == "MASTER BEDROOM"
    assert record["name"] == "MASTER BEDROOM"
    assert record["width_m"] == 3.65
    assert record["length_m"] == 4.50
    assert record["ground_truth_w_m"] == 3.63
    assert record["ground_truth_l_m"] == 4.55
    assert record["ground_truth_imperial"] == "11'11\" × 14'11\""
    # Small error ~0.8%
    assert record["dimension_error_pct"] < 2.0
    assert record["is_dimensionally_accurate"] is True
    assert record["confidence"] == 0.94
