import uuid
from typing import Dict, Any, Optional
from app.v2.storage.client import storage_client
from app.v2.ai.vision.service import vision_service
from app.v2.ai.segmentation.service import segmentation_service
from app.v2.ai.depth.service import depth_service
from app.v2.ai.reconstruction.service import reconstruction_service
from app.v2.ai.scene_graph.service import scene_graph_builder
from app.v2.ai.prompt_builder.service import prompt_builder_service
from app.v2.ai.rendering.service import rendering_service
from app.v2.ai.quality.service import quality_service

class AIOrchestrator:
    def __init__(self):
        pass

    async def execute_full_rendering_pipeline(
        self,
        image_bytes: bytes,
        filename: str,
        room_type: str,
        style: str,
        color_palette: Optional[str] = None,
        custom_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Coordinates the V2 multi-stage microservices pipeline to produce
        both a photorealistic render AND a structured digital twin scene graph.
        """
        project_id = str(uuid.uuid4())
        
        # Step 1: Upload raw asset to CDN/S3
        uploaded_url = await storage_client.upload_file(
            file_bytes=image_bytes,
            file_key=f"uploads/{project_id}_{filename}",
            content_type="image/jpeg"
        )
        
        # Step 2: Vision scene scan
        vision_data = await vision_service.analyze_room_photo(
            image_bytes=image_bytes
        )
        
        # Step 3: SAM2 Segmentation masks
        masks = await segmentation_service.segment_room_regions(
            image_bytes=image_bytes,
            project_id=project_id
        )
        
        # Step 4: Depth Anything V2 distance maps
        depth_data = await depth_service.generate_depth_map(
            image_bytes=image_bytes,
            project_id=project_id
        )
        
        # Step 5: Metric size calibration
        reconstruct_data = await reconstruction_service.reconstruct_room_dimensions(
            vision_data=vision_data,
            depth_data=depth_data
        )
        dimensions = reconstruct_data.get("dimensions", {"width_m": 3.6, "length_m": 4.0, "height_m": 2.8})
        
        # Step 6: Create initial structured Scene Graph (the Digital Twin)
        scene_graph = await scene_graph_builder.build_initial_scene_graph(
            room_type=room_type,
            dimensions=dimensions,
            lighting_direction=vision_data.get("lighting", "diffused_daylight"),
            style=style
        )
        
        # Step 7: Build image generation prompt
        diffusion_prompt = prompt_builder_service.compile_diffusion_prompt(
            scene_graph=scene_graph,
            user_prompt=custom_prompt,
            style=style,
            color_palette=color_palette
        )
        
        # Step 8: Call diffusion renderer
        raw_rendered_bytes = await rendering_service.render_scene_image(
            prompt=diffusion_prompt,
            seed=abs(hash(project_id)) % 100000
        )
        
        # Step 9: Post-processing quality enhancement (Upscaling)
        enhanced_bytes = await quality_service.enhance_image_quality(
            raw_rendered_bytes
        )
        
        # Step 10: Store final render and sync to S3
        render_url = await storage_client.upload_file(
            file_bytes=enhanced_bytes,
            file_key=f"generated/{project_id}_render.jpg",
            content_type="image/jpeg"
        )
        
        return {
            "project_id": project_id,
            "style": style,
            "original_image_url": uploaded_url,
            "photorealistic_render_url": render_url,
            "depth_map_url": depth_data.get("depth_map_url"),
            "segmentation_masks": masks,
            "vision_metadata": vision_data,
            "scene_graph": scene_graph
        }

ai_orchestrator = AIOrchestrator()
