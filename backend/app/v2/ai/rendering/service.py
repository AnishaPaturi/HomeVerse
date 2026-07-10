import httpx
import urllib.parse
from typing import Optional

class RenderingService:
    def __init__(self):
        pass

    async def render_scene_image(
        self,
        prompt: str,
        seed: int = 42,
        width: int = 800,
        height: int = 600
    ) -> bytes:
        """
        Sends the compiled prompt to the Diffusion generation engine (Pollinations Flux fallback).
        Returns the raw image bytes.
        """
        encoded_prompt = urllib.parse.quote(prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true&private=true&model=flux&seed={seed}"
        
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    return response.content
                else:
                    raise Exception(f"Renderer API returned non-200 status code: {response.status_code}")
        except Exception as e:
            print(f"V2 Rendering Service: Diffusion render failed: {e}. Generating empty canvas placeholder.")
            # Returns a simulated 1x1 black pixel fallback
            return b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'

rendering_service = RenderingService()
