"""
Architectural Dimension Extractor
Extracts printed text dimensions from blueprint regions and maps them to metric space.
Flags rooms where dimensions are missing or unavailable.
"""

from typing import Dict, Any, Optional, Tuple, List
from app.ai.dimension_normalizer import parse_dimension_pair, meters_to_imperial_str
from app.ai.dimension_schemas import DimensionSource, ScaleStatus


class DimensionExtractor:
    """
    Extracts explicit dimensions printed on floor plan blueprints.
    Never invents or fabricates a measurement when text is absent.
    """

    @staticmethod
    def extract_room_dimension(
        dim_text: Optional[str],
        scale_px_per_m: Optional[float] = None,
        bbox_pixels: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """
        Extracts and normalizes dimensions for a single room.
        
        Priority:
        1. Explicit Blueprint Text (e.g. 11'11" × 14'11") -> dimension_source: "blueprint"
        2. Calibrated scale from bbox (if available and scale is verified) -> dimension_source: "geometry"
        3. Missing -> dimension_source: "missing", width: None, depth: None
        """
        # Case 1: Explicit Blueprint Text Found
        if dim_text and dim_text.strip():
            w_m, l_m = parse_dimension_pair(dim_text)
            if w_m is not None and l_m is not None:
                # Format parts
                parts = dim_text.split("×") if "×" in dim_text else dim_text.split("x")
                w_src = parts[0].strip() if len(parts) >= 1 else dim_text
                d_src = parts[1].strip() if len(parts) >= 2 else dim_text

                return {
                    "width": round(w_m, 2),
                    "depth": round(l_m, 2),
                    "area": round(w_m * l_m, 2),
                    "dimension_source": DimensionSource.BLUEPRINT,
                    "scale_status": ScaleStatus.VERIFIED,
                    "width_source": w_src,
                    "depth_source": d_src,
                    "ground_truth_imperial": dim_text,
                    "confidence": 0.96,
                    "is_missing": False
                }

        # Case 2: Geometry from Calibrated Scale
        if scale_px_per_m and bbox_pixels and len(bbox_pixels) == 4:
            x1, y1, x2, y2 = bbox_pixels
            px_w = abs(x2 - x1)
            px_l = abs(y2 - y1)
            w_m = round(px_w / scale_px_per_m, 2)
            l_m = round(px_l / scale_px_per_m, 2)
            return {
                "width": w_m,
                "depth": l_m,
                "area": round(w_m * l_m, 2),
                "dimension_source": DimensionSource.GEOMETRY_CALIBRATED,
                "scale_status": ScaleStatus.VERIFIED,
                "width_source": f"{px_w}px @ {scale_px_per_m}px/m",
                "depth_source": f"{px_l}px @ {scale_px_per_m}px/m",
                "ground_truth_imperial": f"{meters_to_imperial_str(w_m)} × {meters_to_imperial_str(l_m)}",
                "confidence": 0.82,
                "is_missing": False
            }

        # Case 3: Dimension Unavailable / Missing
        return {
            "width": None,
            "depth": None,
            "area": None,
            "dimension_source": DimensionSource.MISSING,
            "scale_status": ScaleStatus.MISSING,
            "width_source": None,
            "depth_source": None,
            "ground_truth_imperial": None,
            "confidence": 0.0,
            "is_missing": True
        }
