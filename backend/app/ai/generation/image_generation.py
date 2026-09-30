"""
Image Generation Module
Generates photorealistic interior design concept renders.
"""
from typing import Dict, Any, Optional

class ImageGeneration:
    @staticmethod
    async def generate_render(
        prompt: str,
        style: str = "Modern",
        seed: int = 100,
        width: int = 800,
        height: int = 600
    ) -> str:
        clean_prompt = prompt.replace(" ", "_")[:200]
        return f"https://image.pollinations.ai/prompt/{clean_prompt}?width={width}&height={height}&nologo=true&seed={seed}"

image_generator = ImageGeneration()
