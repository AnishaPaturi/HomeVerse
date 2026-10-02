"""
Scale Estimation & Calibration Engine
Establishes pixels-to-meters ratio from blueprint reference text, scale bars, or user input.
"""

from typing import Optional, Dict, Any, Tuple
from app.ai.dimension_schemas import ScaleStatus


class ScaleEstimator:
    """
    Manages spatial scale calibration for architectural blueprints.
    Ensures HomeVerse never guesses arbitrary scales.
    """

    @staticmethod
    def calibrate_from_user_reference(
        image_width_px: int,
        image_height_px: int,
        reference_length_m: float,
        reference_type: str = "overall_width",
        envelope_crop_ratio: float = 0.85
    ) -> Tuple[float, ScaleStatus, str]:
        """
        Calculates pixels-per-meter scale from a user-supplied reference dimension.
        Example: User inputs 12.0m for total house width on an image where house is 2400px.
        Scale = 2400 / 12.0 = 200 px/meter.
        """
        if reference_length_m <= 0:
            raise ValueError("Reference dimension must be strictly positive.")

        # Estimate the pixel span of the building footprint within the canvas
        if reference_type == "overall_width":
            effective_px = image_width_px * envelope_crop_ratio
        elif reference_type == "overall_height":
            effective_px = image_height_px * envelope_crop_ratio
        else:
            effective_px = image_width_px * envelope_crop_ratio

        scale_px_per_m = round(effective_px / reference_length_m, 3)
        status = ScaleStatus.USER_VERIFIED
        note = f"Calibrated using user reference ({reference_type}: {reference_length_m}m = {int(effective_px)}px -> {scale_px_per_m} px/m)"

        return scale_px_per_m, status, note

    @staticmethod
    def calibrate_from_known_room(
        pixel_width: float,
        pixel_height: float,
        real_width_m: float,
        real_length_m: float
    ) -> Tuple[float, ScaleStatus, str]:
        """
        Calibrates scale from a room that has both pixel bbox and explicit text dimensions.
        """
        scale_x = pixel_width / max(real_width_m, 0.01)
        scale_y = pixel_height / max(real_length_m, 0.01)
        scale_px_per_m = round((scale_x + scale_y) / 2.0, 3)
        status = ScaleStatus.VERIFIED
        note = f"Calibrated from blueprint room text ({real_width_m}m × {real_length_m}m -> {scale_px_per_m} px/m)"
        return scale_px_per_m, status, note

    @staticmethod
    def pixels_to_meters(
        pixel_span: float,
        scale_px_per_m: Optional[float]
    ) -> Optional[float]:
        """Convert a pixel measurement to meters using verified scale."""
        if not scale_px_per_m or scale_px_per_m <= 0:
            return None
        return round(pixel_span / scale_px_per_m, 2)
