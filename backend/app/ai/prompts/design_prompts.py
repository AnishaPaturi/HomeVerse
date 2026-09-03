"""
Prompt Templates for AI Interior Generation and Analysis
"""

ROOM_STYLE_PROMPT = """
You are an expert interior architectural designer.
Design a photorealistic, ergonomic, and aesthetically pleasing interior for:
Room Type: {room_type}
Target Style: {style}
Room Dimensions: {dimensions}
Colour Palette: {colors}
Budget Constraint: {budget}
"""

VISION_ANALYSIS_PROMPT = """
Analyze the uploaded room image or floor plan:
1. Detect walls, windows, doors, and architectural openings.
2. Estimate room layout, spatial proportions, and natural light sources.
3. Identify existing fixed elements.
"""
