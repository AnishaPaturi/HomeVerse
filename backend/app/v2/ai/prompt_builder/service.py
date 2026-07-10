from typing import Dict, Any

class PromptBuilderService:
    def __init__(self):
        # Style templates matching architectural rules
        self.STYLE_RULES = {
            "Modern": "Sleek lines, minimalism, concrete/glass accents, neutral color grading, recessed spotlights.",
            "Scandinavian": "Oak wood finishes, soft woven textures, indoor botanical elements, bright diffused daylight.",
            "Modern Luxury": "Polished marble slabs, brushed gold details, rich walnut cabinetry, layered ambient illumination.",
            "Japandi": "Wabi-sabi aesthetics, paper lanterns, neutral organic linens, warm beige tones, minimalist layout.",
            "Industrial": "Exposed brick walls, black steel fixtures, distressed dark leather, raw urban loft lighting."
        }

    def compile_diffusion_prompt(
        self,
        scene_graph: Dict[str, Any],
        user_prompt: str,
        style: str,
        color_palette: str = None
    ) -> str:
        """
        Builds the final prompt string that locks layout constraints while infusing style rules.
        """
        room_meta = scene_graph.get("room", {})
        room_type = room_meta.get("type", "Living Room")
        width = room_meta.get("width", 3.6)
        length = room_meta.get("length", 4.0)
        lighting = room_meta.get("lighting_profile", "diffused_daylight")
        
        # Describe layout objects
        nodes = scene_graph.get("nodes", [])
        placed_items = [n["type"] for n in nodes if n["type"] not in ["floor", "wall"]]
        layout_str = f"A room measuring {width}m x {length}m containing a " + ", ".join(placed_items)
        
        style_details = self.STYLE_RULES.get(style, "High-end design, photorealistic render.")
        color_details = f"Color palette: {color_palette}." if color_palette else "Theme matching style rules."
        user_details = f"Additional criteria: {user_prompt}." if user_prompt else ""
        
        prompt = f"""Wide-angle professional architectural photo of a {room_type} designed in {style} style.
Layout: {layout_str}.
Design Context: {style_details} {color_details} {user_details}
Lighting: {lighting} with soft shadows and realistic reflections.
Composition: Camera positioned at the doorway entrance, eye-level perspective framing the entire space.
Quality: PBR materials, ray-traced shadows, ultra-detailed 8K architectural visualization, no people, no watermarks."""

        return " ".join(prompt.splitlines())

prompt_builder_service = PromptBuilderService()
