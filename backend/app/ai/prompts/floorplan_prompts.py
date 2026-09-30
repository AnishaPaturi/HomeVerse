"""
Floorplan Prompts
System prompts for architectural vision recognition and space segmentation.
"""

FLOORPLAN_PARSING_PROMPT = """
Analyze the floor plan image:
1. Detect all exterior structural boundary walls and interior partition walls.
2. Identify and label all rooms (Living Room, Kitchen, Bedrooms, Bathrooms, Balconies).
3. Compute bounding boxes and estimate dimensions in meters based on door width scaling.
4. Return structured JSON with room types, dimensions, and area in square meters.
"""
