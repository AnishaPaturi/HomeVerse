"""
Style Discovery and Preference Analyzer
Evaluates user likes/dislikes on reference images and produces quantified aesthetic style profiles.
"""
from typing import List, Dict, Any
from collections import defaultdict, Counter

class StyleAnalyzer:
    STYLE_TAXONOMY = [
        "warm_contemporary",
        "minimalist",
        "modern",
        "scandinavian",
        "industrial",
        "japandi",
        "traditional_indian",
        "boho"
    ]

    REFERENCE_IMAGES: List[Dict[str, Any]] = [
        {
            "id": "ref-warm-contemp-1",
            "title": "Warm Contemporary Living Lounge",
            "style": "warm_contemporary",
            "image_url": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80",
            "colours": ["beige", "cream", "warm_grey", "walnut"],
            "wood_tone": "high",
            "materials": ["oak", "linen", "travertine"],
            "vibe": "Inviting, organic, sophisticated"
        },
        {
            "id": "ref-minimalist-1",
            "title": "Architectural Minimalist Salon",
            "style": "minimalist",
            "image_url": "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
            "colours": ["white", "light_grey", "charcoal", "taupe"],
            "wood_tone": "medium",
            "materials": ["microcement", "matte_steel", "cotton"],
            "vibe": "Serene, uncluttered, geometric"
        },
        {
            "id": "ref-scandi-1",
            "title": "Nordic Light & Birch Suite",
            "style": "scandinavian",
            "image_url": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
            "colours": ["white", "soft_sage", "birch_blonde", "cream"],
            "wood_tone": "high",
            "materials": ["light_ash", "wool", "boucle"],
            "vibe": "Bright, hygge, airy"
        },
        {
            "id": "ref-industrial-1",
            "title": "Urban Loft with Black Steel & Brick",
            "style": "industrial",
            "image_url": "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80",
            "colours": ["charcoal", "brick_red", "distressed_brown", "matte_black"],
            "wood_tone": "medium",
            "materials": ["reclaimed_wood", "blackened_iron", "exposed_brick"],
            "vibe": "Raw, masculine, urban"
        },
        {
            "id": "ref-japandi-1",
            "title": "Zen Wabi-Sabi Sanctuary",
            "style": "japandi",
            "image_url": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
            "colours": ["bamboo", "cream", "terracotta", "washed_black"],
            "wood_tone": "high",
            "materials": ["rattan", "bamboo", "textured_plaster"],
            "vibe": "Mindful, grounding, tactile"
        },
        {
            "id": "ref-modern-1",
            "title": "High-Gloss Modern Panoramic Suite",
            "style": "modern",
            "image_url": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80",
            "colours": ["anthracite", "cool_grey", "pure_white", "champagne"],
            "wood_tone": "low",
            "materials": ["tinted_glass", "lacquered_wood", "polished_quartz"],
            "vibe": "Sleek, polished, high-tech"
        },
        {
            "id": "ref-traditional-1",
            "title": "Heritage Teak & Brass Haven",
            "style": "traditional_indian",
            "image_url": "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80",
            "colours": ["teak_brown", "ochre", "antique_brass", "deep_ruby"],
            "wood_tone": "high",
            "materials": ["carved_teak", "brass_accents", "silk", "terracotta"],
            "vibe": "Warm, cultural, regal"
        },
        {
            "id": "ref-boho-1",
            "title": "Sun-Drenched Bohemian Retreat",
            "style": "boho",
            "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
            "colours": ["warm_amber", "sage_green", "sand", "terracotta"],
            "wood_tone": "high",
            "materials": ["jute", "macrame", "raw_teak", "potted_plants"],
            "vibe": "Free-spirited, lush, eclectic"
        }
    ]

    def get_reference_catalog(self) -> List[Dict[str, Any]]:
        """Returns reference images catalog for interactive style discovery."""
        return self.REFERENCE_IMAGES

    def compute_style_profile(
        self,
        reactions: List[Dict[str, Any]],
        lifestyle_answers: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Calculates quantified design affinities based on reaction scores:
        - LIKE: +2 points
        - SKIP: 0 points
        - DISLIKE: -1 points
        """
        style_scores: Dict[str, float] = defaultdict(float)
        wood_scores: Dict[str, float] = defaultdict(float)
        color_counter: Counter = Counter()
        material_counter: Counter = Counter()

        ref_map = {item["id"]: item for item in self.REFERENCE_IMAGES}

        # Base default fallback weights
        style_scores["warm_contemporary"] = 1.0
        style_scores["minimalist"] = 0.5

        for reaction in reactions:
            img_id = reaction.get("image_id")
            action = str(reaction.get("reaction", "skip")).lower()
            ref = ref_map.get(img_id)
            if not ref:
                continue

            weight = 2.0 if action == "like" else (-1.0 if action == "dislike" else 0.0)
            style_scores[ref["style"]] += weight
            wood_scores[ref["wood_tone"]] += weight

            if weight > 0:
                for col in ref.get("colours", []):
                    color_counter[col] += int(weight)
                for mat in ref.get("materials", []):
                    material_counter[mat] += int(weight)

        # Determine Primary & Secondary Styles
        sorted_styles = sorted(style_scores.items(), key=lambda x: x[1], reverse=True)
        primary_style = sorted_styles[0][0] if sorted_styles else "warm_contemporary"
        secondary_style = sorted_styles[1][0] if len(sorted_styles) > 1 else "minimalist"

        # Wood preference level
        top_wood = sorted(wood_scores.items(), key=lambda x: x[1], reverse=True)
        wood_preference = top_wood[0][0] if top_wood and top_wood[0][1] > 0 else "high"

        # Colors & Materials
        top_colors = [c[0] for c in color_counter.most_common(4)] or ["beige", "cream", "brown", "warm_grey"]
        top_materials = [m[0] for m in material_counter.most_common(4)] or ["natural_wood", "linen", "matte_brass"]

        # Integrate Lifestyle considerations
        lifestyle = lifestyle_answers or {}
        if lifestyle.get("maintenance_preference") == "low_maintenance":
            if "matte_steel" not in top_materials and "durable_laminate" not in top_materials:
                top_materials.append("easy_clean_fabrics")
        if lifestyle.get("has_pets") or lifestyle.get("pets"):
            top_materials.append("scratch_resistant_upholstery")

        confidence_score = min(0.98, max(0.70, 0.60 + (len(reactions) * 0.05)))

        return {
            "primary_style": primary_style,
            "secondary_style": secondary_style,
            "wood_preference": wood_preference,
            "colour_preference": top_colors,
            "material_preferences": top_materials,
            "lifestyle": lifestyle,
            "confidence_score": round(confidence_score, 2),
            "style_scores": dict(style_scores)
        }
