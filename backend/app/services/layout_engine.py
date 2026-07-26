import os
import json
import uuid
import traceback
from typing import Dict, Any, Optional
from fastapi import HTTPException
from app.config import settings
import google.genai as genai
from google.genai import types

class LayoutEngine:
    def __init__(self):
        pass

    def _get_client(self) -> genai.Client:
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=400,
                detail="GEMINI_API_KEY is not set."
            )
        return genai.Client(api_key=api_key)

    async def validate_and_create_house_json(
        self,
        property_type: str,
        budget: str,
        house_details: Dict[str, Any],
        blueprint_url: Optional[str] = None,
        blueprint_bytes: Optional[bytes] = None,
        blueprint_mime_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Uses Gemini to parse user inputs (e.g. details form, room dimensions) and the uploaded blueprint image to return a clean, structured Master House Model JSON.
        """
        client = self._get_client()

        prompt = f"""
        You are an AI Architect. Convert the following unstructured user-supplied housing information and the attached blueprint/floorplan image into a single clean, validated Master House Model JSON object.
        
        User input details:
        - Property Type: {property_type}
        - Budget selection: {budget}
        - House details provided: {json.dumps(house_details, indent=2)}
        - Blueprint Image URL: {blueprint_url or "None"}

        If a blueprint/floorplan image is attached:
        - Carefully analyze the architectural drawing.
        - Identify the layout of the rooms (e.g., Living Room/Hall, Master Bedroom, Kitchen, Dining Room, Bathroom).
        - Detect wall boundaries, door openings, window placements, and relative room sizes.
        - Extract/estimate the dimensions of each room in meters based on the drawing.
        - Ensure that the rooms and their dimensions in the generated JSON reflect the actual layout and structure shown in the blueprint.

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
             // for each primary room based on the total dimensions, blueprint image structure, and dimensionsEachRoom inputs.
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
        - The user has selected the specific room "{house_details.get('selectedRoomToDesign', '')}" to design/modify, and specified its dimensions as "{house_details.get('roomWidth', '')} x {house_details.get('roomLength', '')} meters". You MUST set this room's dimensions to match these values exactly in the "rooms" dictionary.
        - If the user enters dimensions in feet (e.g., 10x12, 10 ft * 12 ft), convert them to meters (multiply feet by 0.3048).
        - If not specified, estimate typical realistic room dimensions in meters that fit within the total house footprint and match the attached blueprint layout.
        - Ensure all width and length fields are floats in meters.
        - Make sure "rooms" contains standardized keys: "hall", "master_bedroom", "second_bedroom", "kids_bedroom", "dining", "kitchen", "bathroom".

        Respond ONLY with a valid JSON matching this schema. Do not include markdown wraps (```json) or extra text.
        """

        try:
            contents = []
            if blueprint_bytes and blueprint_mime_type:
                contents.append(types.Part.from_bytes(data=blueprint_bytes, mime_type=blueprint_mime_type))
            contents.append(prompt)

            response = await client.aio.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            result = json.loads(response.text)
            if blueprint_url:
                result["blueprintUrl"] = blueprint_url
                result["blueprint_url"] = blueprint_url
            return result
        except Exception as e:
            print(f"[ERROR] Error creating house JSON with Gemini: {e}")
            traceback.print_exc()
            # Fallback house JSON parsing logic
            selected_room = house_details.get("selectedRoomToDesign", "Hall").lower().replace(" ", "_")
            if "hall" in selected_room or "living" in selected_room:
                selected_room = "hall"
            elif "master" in selected_room:
                selected_room = "master_bedroom"
            elif "second" in selected_room:
                selected_room = "second_bedroom"
            elif "kids" in selected_room or "kids_bedroom" in selected_room:
                selected_room = "kids_bedroom"
            elif "kitchen" in selected_room:
                selected_room = "kitchen"
            elif "bathroom" in selected_room:
                selected_room = "bathroom"
                
            r_width = 3.63
            r_length = 3.94
            try:
                r_width = float(house_details.get("roomWidth", 3.63))
                r_length = float(house_details.get("roomLength", 3.94))
            except:
                pass

            rooms = {
                "hall": {"width": 3.63, "length": 3.94, "windows": 2, "doors": 1},
                "master_bedroom": {"width": 4.0, "length": 4.5, "windows": 2, "doors": 1},
                "kitchen": {"width": 3.0, "length": 3.5, "windows": 1, "doors": 1},
                "bathroom": {"width": 1.8, "length": 2.2, "windows": 1, "doors": 1}
            }
            if selected_room in rooms:
                rooms[selected_room]["width"] = r_width
                rooms[selected_room]["length"] = r_length
            else:
                rooms[selected_room] = {"width": r_width, "length": r_length, "windows": 1, "doors": 1}

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
                "rooms": rooms
            }

    async def generate_common_layout(
        self,
        house_model: Dict[str, Any],
        room_type: str,
        budget: str,
        project_id: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Generates 3D room/apartment layout (furniture positioning, doors, windows, walls, floor).
        Uses Gemini Vision on the uploaded blueprint image if available; otherwise dynamically
        generates layout based on real room dimensions in house_model.
        """
        # Step 1: Check for blueprint image file on disk
        blueprint_file_path = None
        blueprint_mime_type = None

        if project_id:
            str_pid = str(project_id)
            upload_dir = "static/uploads"
            if os.path.exists(upload_dir):
                for fname in os.listdir(upload_dir):
                    if fname.startswith(f"{str_pid}_blueprint"):
                        blueprint_file_path = os.path.join(upload_dir, fname)
                        if fname.lower().endswith(".png"):
                            blueprint_mime_type = "image/png"
                        elif fname.lower().endswith(".webp"):
                            blueprint_mime_type = "image/webp"
                        else:
                            blueprint_mime_type = "image/jpeg"
                        break

        b_url = house_model.get("blueprintUrl", "")
        if not blueprint_file_path and b_url and "static/uploads/" in b_url:
            fname = b_url.split("static/uploads/")[-1]
            candidate = os.path.join("static", "uploads", fname)
            if os.path.exists(candidate):
                blueprint_file_path = candidate
                if candidate.lower().endswith(".png"):
                    blueprint_mime_type = "image/png"
                elif candidate.lower().endswith(".webp"):
                    blueprint_mime_type = "image/webp"
                else:
                    blueprint_mime_type = "image/jpeg"

        # Step 2: Try vision-grounded layout generation if blueprint image exists
        if blueprint_file_path and os.path.exists(blueprint_file_path):
            try:
                client = self._get_client()
                with open(blueprint_file_path, "rb") as f:
                    blueprint_bytes = f.read()

                prompt = f"""
                You are an AI Architect and 3D Layout Engine for HomeVerse.
                Analyze the attached architectural blueprint/floorplan image and generate a 3D coordinate layout for the property.

                Inputs:
                - Selected Room / Area: {room_type}
                - Property Type: {house_model.get('houseType', 'Apartment')}
                - Main Door Direction: {house_model.get('mainDoor', 'North')}
                - Budget Tier: {budget}
                - Extracted Dimensions: {json.dumps(house_model.get('rooms', {}), indent=2)}

                Instructions:
                1. Carefully analyze the attached blueprint image.
                2. Identify outer boundary walls and room partition walls. Generate 3D partition objects ("partition") for walls.
                3. Identify main entrance door ("door") and window locations ("window").
                4. Position furniture items suitable for {room_type} (e.g., "sofa", "bed", "dining_table", "chair", "coffee_table", "tv", "desk", "wardrobe", "nightstand", "armchair", "console_table", "mirror", "cabinet", "refrigerator", "washing_machine").
                5. The floor is at position_y = 0.0, position_z centered around -3.0.
                6. Use generic materials: "wood_light", "wood_dark", "fabric_base", "metal_base", "glass_base", "marble_base", "ceramic", "#334155", "#1e293b".

                Output MUST be valid JSON matching this schema:
                {{
                  "layout_description": "Vision-grounded architectural layout based on uploaded blueprint.",
                  "camera_angle": "Overview Perspective",
                  "objects": [
                    {{
                      "object_type": "string",
                      "position_x": float,
                      "position_y": float,
                      "position_z": float,
                      "rotation": float,
                      "scale": float,
                      "material": "string"
                    }}
                  ]
                }}
                Respond ONLY with the JSON object. Do not include markdown wraps (```json) or extra text.
                """

                contents = [
                    types.Part.from_bytes(data=blueprint_bytes, mime_type=blueprint_mime_type or "image/jpeg"),
                    prompt
                ]

                response = await client.aio.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=contents,
                    config=types.GenerateContentConfig(response_mime_type="application/json")
                )
                result = json.loads(response.text)
                if result and isinstance(result, dict) and "objects" in result and len(result["objects"]) > 0:
                    return result
            except Exception as e:
                print(f"[WARNING] Gemini vision blueprint layout generation failed: {e}. Falling back to dynamic dimension layout.")

        client = self._get_client()

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
              "object_type": "string",
              "position_x": float,
              "position_y": float,
              "position_z": float,
              "rotation": float,
              "scale": float,
              "material": "string"
            }}
          ]
        }}
        Respond ONLY with the JSON object. Do not include markdown wraps (```json) or extra text.
        """

        try:
            response = await client.aio.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            result = json.loads(response.text)
            return result
        except Exception as e:
            print(f"[ERROR] Error generating common layout in layout_engine: {e}")
            traceback.print_exc()
            r_type = room_type.lower()
            z_center = -3.0
            objs = [
                {"object_type": "floor", "position_x": 0.0, "position_y": 0.0, "position_z": z_center, "rotation": 0.0, "scale": 1.0, "material": "wood_base"},
                {"object_type": "wall", "position_x": 0.0, "position_y": 1.3, "position_z": z_center - (length/2), "rotation": 0.0, "scale": 1.0, "material": "plaster_base"}
            ]
            if "bed" in r_type:
                objs.extend([
                    {"object_type": "bed", "position_x": 0.0, "position_y": 0.0, "position_z": z_center - 0.5, "rotation": 3.14, "scale": 1.0, "material": "wood_base"},
                    {"object_type": "chair", "position_x": 1.2, "position_y": 0.0, "position_z": z_center + 0.2, "rotation": 1.57, "scale": 0.9, "material": "fabric_base"},
                    {"object_type": "lamp", "position_x": -1.2, "position_y": 0.0, "position_z": z_center - 0.5, "rotation": 0.0, "scale": 1.0, "material": "metal_base"}
                ])
            else:
                objs.extend([
                    {"object_type": "sofa", "position_x": 0.0, "position_y": 0.0, "position_z": z_center - 0.5, "rotation": 0.0, "scale": 1.0, "material": "fabric_base"},
                    {"object_type": "coffee_table", "position_x": 0.0, "position_y": 0.0, "position_z": z_center + 0.8, "rotation": 0.0, "scale": 1.0, "material": "wood_base"},
                    {"object_type": "lamp", "position_x": -1.5, "position_y": 0.0, "position_z": z_center - 0.5, "rotation": 0.0, "scale": 1.0, "material": "metal_base"}
                ])
            return {
                "layout_description": f"A default parsed layout for {room_type}.",
                "camera_angle": "Door Perspective",
                "objects": objs
            }

layout_engine = LayoutEngine()
