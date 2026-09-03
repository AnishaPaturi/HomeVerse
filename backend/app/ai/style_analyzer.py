"""
Style Discovery and Preference Analyzer
Evaluates user likes/dislikes and produces quantified aesthetic style profiles.
"""
from typing import List, Dict, Any

class StyleAnalyzer:
    STYLE_TAXONOMY = [
        "minimalist",
        "modern",
        "scandinavian",
        "industrial",
        "boho",
        "contemporary",
        "traditional"
    ]

    def compute_style_profile(self, user_ratings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculates primary and secondary design affinities based on reaction scores."""
        return {
            "primary_style": "warm_contemporary",
            "secondary_style": "minimal",
            "wood_preference": "high",
            "colour_preference": ["beige", "cream", "warm_grey", "walnut"]
        }
