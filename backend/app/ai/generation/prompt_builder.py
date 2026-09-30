"""
Prompt Builder Module
Constructs high-fidelity diffusion prompts incorporating style DNA, lighting specifications, and budget guardrails.
"""
from typing import Dict, Any, Optional

class PromptBuilder:
    @staticmethod
    def build_diffusion_prompt(
        room_type: str,
        style: str,
        budget_tier: str = "Premium",
        palette: Optional[str] = None
    ) -> str:
        palette_clause = f"with harmonious color palette ({palette})" if palette else ""
        return (
            f"photorealistic 8k architectural digest render of a {style} style {room_type}, "
            f"{palette_clause}, {budget_tier} material quality, natural warm 3000K diffused lighting, "
            f"ultra-detailed textures, raytraced shadows, interior design portfolio shot"
        )

prompt_builder = PromptBuilder()
