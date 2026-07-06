import os
import json
import uuid
import google.generativeai as genai
from typing import Dict, Any, Optional
from fastapi import HTTPException
from app.config import settings

class LayoutEngine:
    def __init__(self):
        # Configure API key
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)

    async def validate_and_create_house_json(
        self,
        property_type: str,
        budget: str,
        house_details: Dict[str, Any],
        blueprint_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Uses Gemini to parse user inputs (e.g. details form, room dimensions) and return a clean, structured Master House Model JSON.
        """
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=400,
                detail="GEMINI_API_KEY is not set."
            )
        genai.configure(api_key=api_key)

        prompt = f"""
        You are an AI Architect. Convert the following unstructured user-supplied housing information into a single clean, validated Master House Model JSON object.
        
        User input details:
        - Property Type: {property_type}
        - Budget selection: {budget}
        - House details provided: {json.dumps(house_details, indent=2)}
        - Blueprint Image URL: {blueprint_url or "None"}

        Standardize the keys to match the following structure:
        {{
          "houseType": "{property_type.capitalize()}",
          "budget": "{budget}",
          "mainDoor": "{house_details.get('mainDoorDirection', 'North')}",
          "kitchen": "{house_details.get('kitchenDoorDirection', 'East')}",
          "bedrooms": {house_details.get('numBedrooms', 3) or 3},
          "bathrooms": {house_details.get('numBathrooms', 2) or 2},
          "balconies": {house_details.get('numBalconies', 1) or 1},
          "totalDimensions": "{house_details.get('dimensionsHouse', '30 ft * 40 ft')}",
          "windows": {house_details.get('numWindows', 6) or 6},
          "doors": {house_details.get('numDoors', 8) or 8},
          "blueprintUrl": "{blueprint_url or ''}",
          "independentDetails": {{  // Include only if property type is Independent House
            "floors": {house_details.get('numFloors', 1) or 1},
            "roomsPerFloor": "{house_details.get('roomsPerFloor', '')}",
            "purposeEachFloor": "{house_details.get('purposeEachFloor', '')}",
            "rooftop": "{house_details.get('rooftop', 'no')}",
            "parking": "{house_details.get('parking', 'no')}",
            "garden": "{house_details.get('garden', 'no')}"
          }},
          "rooms": {{
             // Generate estimated or parsed dimensions (width and length in meters, door count, window count) 
             // for each primary room based on the total dimensions and dimensionsEachRoom inputs.
             // Ensure at least "hall", "master_bedroom", "kitchen", "bathroom" are present with realistic dimensions.
             "hall": {{
                "width": 3.63,
                "length": 3.94,
                "windows": 2,
                "doors": 1
             }},
             "master_bedroom": {{
                "width": 4.0,
                "length": 4.5,
                "windows": 2,
                "doors": 1
             }},
             "kitchen": {{
                "width": 3.0,
                "length": 3.5,
                "windows": 1,
                "doors": 1
             }},
             "bathroom": {{
                "width": 1.8,
                "length": 2.2,
                "windows": 1,
                "doors": 1
             }}
          }}
        }}

        Notes for parsing:
        - Look at the user's `dimensionsEachRoom` text ("{house_details.get('dimensionsEachRoom', '')}") and try to parse custom width/length for Hall, Bedroom, Kitchen, Dining, Bathroom.
        - If the user enters dimensions in feet (e.g., 10x12, 10 ft * 12 ft), convert them to meters (multiply feet by 0.3048).
        - If not specified, estimate typical realistic room dimensions in meters that fit within the total house footprint.
        - Ensure all width and length fields are floats in meters.
        - Make sure "rooms" contains standardized keys: "hall", "master_bedroom", "second_bedroom", "kids_bedroom", "dining", "kitchen", "bathroom".

        Respond ONLY with a valid JSON matching this schema. Do not include markdown wraps (```json) or extra text.
        """

        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = await model.generate_content_async(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            result = json.loads(response.text)
            return result
        except Exception as e:
            print(f"Error creating house JSON with Gemini: {e}")
            # Fallback house JSON
            return {
                "houseType": property_type.capitalize(),
                "budget": budget,
                "mainDoor": house_details.get("mainDoorDirection", "North"),
                "kitchen": house_details.get("kitchenDoorDirection", "East"),
                "bedrooms": int(house_details.get("numBedrooms", 3) or 3),
                "bathrooms": int(house_details.get("numBathrooms", 2) or 2),
                "balconies": int(house_details.get("numBalconies", 1) or 1),
                "totalDimensions": house_details.get("dimensionsHouse", "30 ft * 40 ft"),
                "windows": int(house_details.get("numWindows", 6) or 6),
                "doors": int(house_details.get("numDoors", 8) or 8),
                "blueprintUrl": blueprint_url or "",
                "rooms": {
                    "hall": {"width": 3.63, "length": 3.94, "windows": 2, "doors": 1},
                    "master_bedroom": {"width": 4.0, "length": 4.5, "windows": 2, "doors": 1},
                    "kitchen": {"width": 3.0, "length": 3.5, "windows": 1, "doors": 1},
                    "bathroom": {"width": 1.8, "length": 2.2, "windows": 1, "doors": 1}
                }
            }

    async def generate_common_layout(
        self,
        house_model: Dict[str, Any],
        room_type: str,
        budget: str
    ) -> Dict[str, Any]:
        """
        Generates one common 3D room layout (furniture positioning, doors, windows, walls, floor)
        using the Master House Model JSON and specific architectural templates & rules.
        """
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=400,
                detail="GEMINI_API_KEY is not set."
            )
        genai.configure(api_key=api_key)

        # Standardize room key
        room_key = room_type.lower().replace(" / ", "_").replace(" ", "_")
        if "hall" in room_key or "living" in room_key:
            room_key = "hall"
        elif "master" in room_key:
            room_key = "master_bedroom"
        elif "second" in room_key:
            room_key = "second_bedroom"
        elif "kid" in room_key:
            room_key = "kids_bedroom"
        elif "bath" in room_key:
            room_key = "bathroom"

        rooms_data = house_model.get("rooms", {})
        room_info = rooms_data.get(room_key, {})
        
        # Room dimensions (default fallback if missing)
        width = room_info.get("width", 3.63)
        length = room_info.get("length", 3.94)
        windows = room_info.get("windows", 2)
        doors = room_info.get("doors", 1)

        # Get room template definitions
        room_templates = {
            "hall": "Sofa, TV, TV Cabinet, Center Table, Wall Decor, False Ceiling, Lights, Curtains, Side Table, Plants",
            "master_bedroom": "King Bed, Storage, Wardrobe, TV, TV Unit, Window Seat, Curtains, AC, Dressing Table, Side Tables, Decor",
            "second_bedroom": "Bed, Wardrobe, Desk, Chair, TV, AC, Dressing Table, Laundry Storage, Curtains",
            "kids_bedroom": "Bed, Wardrobe, Study Table, Bookshelf, TV, AC, Window Seat, Curtains",
            "kitchen": "Sink, Hob, Chimney, Microwave Unit, Pantry, Platform, Storage, Fan",
            "bathroom": "WC, Wash Basin, Mirror, Storage, Shower, Glass Partition, Niche Storage"
        }
        
        template_key = "hall" if room_key not in room_templates else room_key
        required_items = room_templates[template_key]

        prompt = f"""
        You are the Layout Engine of HomeVerse, an intelligent AI interior designer.
        Your task is to position furniture in a 3D coordinate system using room dimensions, templates, and architectural rules.

        Inputs:
        - Room Type: {room_type} (Key: {room_key})
        - Room Dimensions: Width = {width}m (along X-axis), Length = {length}m (along Z-axis)
        - Windows count: {windows}
        - Doors count: {doors}
        - Main Door Direction: {house_model.get('mainDoor', 'North')}
        - Budget Tier: {budget}

        Strict Room Templates (You MUST place all these items in the room layout):
        Required items: {required_items}

        Strict Architecture Rules (You MUST apply these rules):
        1. If Window Width > 1.8m (or if room has a French Window) then place "Floor Length Curtains" (object_type: "curtains", material: "fabric_curtain_base"), else place "Blinds" (object_type: "blinds", material: "wood_blind_base").
        2. If French Window, the curtains must be ceiling-mounted (position_y = 2.4).
        3. If Room Type is Bathroom and Area (width * length) < 2.0 m², use a "Sliding Glass Partition" (object_type: "wall", material: "glass_sliding_base") instead of a hinged partition.
        4. If Room Type is Hall/Living Room and Room Width < 3.5m, avoid L-shaped sofas (object_type: "sofa_l"). Instead use 3+1 seating (a 3-seater "sofa" and a 1-seater "armchair").
        5. If Room Type is Dining and Room Width > 5.0m, place a "6 Seater Dining Table" (scale = 1.3), otherwise place a "4 Seater Dining Table" (scale = 1.0).

        3D Coordinate System Rules:
        - The room boundary is defined by width {width}m (along X-axis) and length {length}m (along Z-axis).
        - The center of the room is (0.0, 0.0, -3.0).
        - Left wall is at X = -{width}/2. Right wall is at X = {width}/2.
        - Back wall is at Z = -3.0 - {length}/2. Front wall is at Z = -3.0 + {length}/2.
        - Floor is at Y = 0.0, Ceiling is at Y = 2.6.
        - All furniture must be positioned inside these boundaries, not overlapping, and facing the correct direction.
        - Include a "floor" object (object_type: "floor") and a "wall" object (object_type: "wall").
        - Use generic materials (e.g. "wood_base", "fabric_base", "metal_base", "glass_base", "concrete_base", "brick_base", "marble_base").
        - Rotations are in radians: 0.0 (faces front/positive Z), 3.14 (faces back/negative Z), -1.57 (faces right/positive X), 1.57 (faces left/negative X).

        Output a valid JSON matching this schema:
        {{
          "layout_description": "Detailed description of the layout, furniture placement, lighting, and camera perspective.",
          "camera_angle": "Door Perspective looking straight into the room",
          "objects": [
            {{
              "object_type": "string",  // must be one of "sofa", "coffee_table", "desk", "chair", "bed", "lamp", "wall", "floor", "curtains", "blinds", "balcony", "tv", "flower_pot", "dining_table", "bookshelf", "nightstand", "wardrobe", "rug", "armchair", "sideboard", "pouf", "mirror", "bench", "stool", "bar_stool", "plant_box", "console_table", "room"
              "position_x": float,
              "position_y": float,
              "position_z": float,
              "rotation": float,
              "scale": float,
              "material": "string" // generic name
            }}
          ]
        }}
        Respond ONLY with the JSON object. Do not include markdown wraps (```json) or extra text.
        """

        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = await model.generate_content_async(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            result = json.loads(response.text)
            return result
        except Exception as e:
            print(f"Error generating common layout: {e}")
            # Fallback mock layout
            return {
                "layout_description": f"A default parsed layout for {room_type}.",
                "camera_angle": "Door Perspective",
                "objects": [
                    {"object_type": "floor", "position_x": 0.0, "position_y": 0.0, "position_z": -3.0, "rotation": 0.0, "scale": 1.0, "material": "wood_base"},
                    {"object_type": "wall", "position_x": 0.0, "position_y": 1.3, "position_z": -3.0 - (length/2), "rotation": 0.0, "scale": 1.0, "material": "plaster_base"},
                    {"object_type": "sofa", "position_x": 0.0, "position_y": 0.0, "position_z": -3.0, "rotation": 0.0, "scale": 1.0, "material": "fabric_base"},
                    {"object_type": "coffee_table", "position_x": 0.0, "position_y": 0.0, "position_z": -2.0, "rotation": 0.0, "scale": 1.0, "material": "wood_base"}
                ]
            }

layout_engine = LayoutEngine()
