from typing import Dict, Any
from app.v2.ai.prompt_builder.service import prompt_builder_service
from app.v2.ai.rendering.service import rendering_service
from app.v2.ai.quality.service import quality_service
from app.v2.storage.client import storage_client

class RenderingAgent:
    def __init__(self):
        pass

    async def execute_task(
        self,
        task_info: Dict[str, Any],
        scene_graph: Dict[str, Any],
        style_profile: Dict[str, Any],
        project_id: str
    ) -> Dict[str, Any]:
        """
        Compiles the agentic style tags, renders the image using the diffusion engine, 
        and upsizes quality assets to 4K resolution.
        """
        style = task_info.get("parameters", {}).get("style", "Modern")
        custom_prompt = task_info.get("parameters", {}).get("custom_prompt")
        
        # Compile diffusion prompt
        prompt = prompt_builder_service.compile_diffusion_prompt(
            scene_graph=scene_graph,
            user_prompt=custom_prompt,
            style=style,
            color_palette=style_profile.get("primary_color")
        )
        
        # Render image
        raw_rendered_bytes = await rendering_service.render_scene_image(
            prompt=prompt,
            seed=42
        )
        
        # Enhance resolution
        enhanced_bytes = await quality_service.enhance_image_quality(raw_rendered_bytes)
        
        # Upload final render to cloud storage
        render_url = await storage_client.upload_file(
            file_bytes=enhanced_bytes,
            file_key=f"generated/{project_id}_render.jpg",
            content_type="image/jpeg"
        )
        
        return {
            "prompt": prompt,
            "render_url": render_url
        }

rendering_agent = RenderingAgent()
