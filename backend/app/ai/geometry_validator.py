"""
Geometry Validation Engine
Verifies physical plausibility, metric consistency, and aspect ratio sanity.
"""

from typing import Dict, Any, List, Optional


class GeometryValidator:
    """
    Validates that extracted or user-supplied room dimensions obey physical laws.
    """

    @staticmethod
    def validate_room_geometry(
        width: Optional[float],
        depth: Optional[float],
        area: Optional[float] = None,
        tolerance_pct: float = 15.0
    ) -> Dict[str, Any]:
        """
        Validates a single room's dimensions.
        Returns validation status, calculated area, discrepancy percentage, and notes.
        """
        notes: List[str] = []
        is_valid = True
        penalty = 0.0

        if width is None or depth is None:
            return {
                "is_valid": False,
                "notes": ["Dimensions are missing or incomplete."],
                "calculated_area": None,
                "confidence_penalty": 0.5
            }

        if width <= 0 or depth <= 0:
            return {
                "is_valid": False,
                "notes": ["Width and depth must be positive numbers."],
                "calculated_area": 0.0,
                "confidence_penalty": 0.5
            }

        calc_area = round(width * depth, 2)
        effective_area = area if area is not None and area > 0 else calc_area

        # Area consistency check
        if area is not None and area > 0:
            discrepancy_pct = (abs(area - calc_area) / area) * 100.0
            if discrepancy_pct > tolerance_pct:
                is_valid = False
                notes.append(
                    f"Area discrepancy of {discrepancy_pct:.1f}% exceeds tolerance threshold of {tolerance_pct}%."
                )
                penalty += min(0.35, discrepancy_pct / 100.0)
        else:
            discrepancy_pct = 0.0

        # Aspect ratio sanity check (e.g. 1:10 corridor or extreme shape)
        aspect_ratio = width / max(depth, 0.01)
        if aspect_ratio < 0.20 or aspect_ratio > 5.0:
            notes.append(f"Unusual room aspect ratio ({aspect_ratio:.2f}:1).")
            penalty += 0.15

        # Bounds check
        if width < 0.8 or depth < 0.8:
            notes.append("Room dimension smaller than 0.8m is unusually compact.")
            penalty += 0.1
        if width > 30.0 or depth > 30.0:
            notes.append("Room dimension exceeds 30m; verify overall building scale.")
            penalty += 0.2

        return {
            "is_valid": is_valid,
            "discrepancy_pct": round(discrepancy_pct, 1),
            "calculated_area": calc_area,
            "effective_area": effective_area,
            "notes": notes,
            "confidence_penalty": round(penalty, 3)
        }
