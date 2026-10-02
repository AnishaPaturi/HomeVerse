"""
Procedural Architectural Floor Plan Generator
Generates synthetic floor plan images and exact ground-truth CAD geometry for Vision Transformer training.
"""

import os
import json
import random
import math
from typing import List, Dict, Any, Tuple
from PIL import Image, ImageDraw, ImageFont


# Supported room types with realistic metric constraints (width_range, height_range in meters)
ROOM_SPECS = {
    "Living Room": {"w": (4.0, 7.5), "h": (3.5, 6.5), "color": "#FAFAFA"},
    "Master Bedroom": {"w": (3.8, 5.5), "h": (3.5, 5.0), "color": "#FDFEFE"},
    "Bedroom": {"w": (3.0, 4.5), "h": (3.0, 4.2), "color": "#FDFEFE"},
    "Kitchen": {"w": (2.4, 4.2), "h": (2.2, 3.8), "color": "#F8F9FA"},
    "Dining Room": {"w": (3.0, 4.5), "h": (2.8, 4.0), "color": "#FAFAFA"},
    "Bathroom": {"w": (1.8, 2.8), "h": (1.8, 2.6), "color": "#F4F6F6"},
    "Balcony": {"w": (1.5, 3.5), "h": (1.2, 2.2), "color": "#F2F4F4"},
}


class FloorPlanGenerator:
    def __init__(self, img_size: int = 512, seed: int = 42):
        self.img_size = img_size
        random.seed(seed)
        try:
            self.font = ImageFont.load_default()
        except Exception:
            self.font = None

    def _generate_layout(self) -> Dict[str, Any]:
        """Procedurally generate a layout of partitioned rooms within building envelope."""
        # Building dimension in meters
        total_w_m = round(random.uniform(9.0, 16.0), 2)
        total_h_m = round(random.uniform(8.0, 14.0), 2)

        # Scale in pixels per meter (with margin of 40px on all sides)
        margin = 40
        drawable_w = self.img_size - 2 * margin
        drawable_h = self.img_size - 2 * margin

        scale_x = drawable_w / total_w_m
        scale_y = drawable_h / total_h_m
        scale_px_per_m = min(scale_x, scale_y)

        # Centered origin for building footprint
        building_px_w = int(total_w_m * scale_px_per_m)
        building_px_h = int(total_h_m * scale_px_per_m)
        origin_x = margin + (drawable_w - building_px_w) // 2
        origin_y = margin + (drawable_h - building_px_h) // 2

        # Choose layout template: 2x2 grid, 2x3 grid, or 1 living + partitioned zones
        layout_type = random.choice(["2x2", "2x3", "split_living"])

        rooms_data: List[Dict[str, Any]] = []

        if layout_type == "2x2":
            split_x = random.uniform(0.45, 0.60)
            split_y = random.uniform(0.45, 0.55)

            w1_m = round(total_w_m * split_x, 2)
            w2_m = round(total_w_m - w1_m, 2)
            h1_m = round(total_h_m * split_y, 2)
            h2_m = round(total_h_m - h1_m, 2)

            cells = [
                {"name": "Living Room", "x_m": 0.0, "y_m": 0.0, "w_m": w1_m, "h_m": h1_m},
                {"name": "Kitchen", "x_m": w1_m, "y_m": 0.0, "w_m": w2_m, "h_m": h1_m},
                {"name": "Master Bedroom", "x_m": 0.0, "y_m": h1_m, "w_m": w1_m, "h_m": h2_m},
                {"name": "Bathroom", "x_m": w1_m, "y_m": h1_m, "w_m": w2_m, "h_m": h2_m},
            ]
        elif layout_type == "2x3":
            split_x1 = random.uniform(0.35, 0.45)
            split_x2 = random.uniform(0.30, 0.35)
            w1_m = round(total_w_m * split_x1, 2)
            w2_m = round(total_w_m * split_x2, 2)
            w3_m = round(total_w_m - w1_m - w2_m, 2)

            split_y = random.uniform(0.48, 0.55)
            h1_m = round(total_h_m * split_y, 2)
            h2_m = round(total_h_m - h1_m, 2)

            cells = [
                {"name": "Living Room", "x_m": 0.0, "y_m": 0.0, "w_m": w1_m + w2_m, "h_m": h1_m},
                {"name": "Dining Room", "x_m": w1_m + w2_m, "y_m": 0.0, "w_m": w3_m, "h_m": h1_m},
                {"name": "Master Bedroom", "x_m": 0.0, "y_m": h1_m, "w_m": w1_m, "h_m": h2_m},
                {"name": "Bedroom", "x_m": w1_m, "y_m": h1_m, "w_m": w2_m, "h_m": h2_m},
                {"name": "Bathroom", "x_m": w1_m + w2_m, "y_m": h1_m, "w_m": w3_m, "h_m": h2_m},
            ]
        else: # split_living with balcony
            split_x = random.uniform(0.52, 0.62)
            w1_m = round(total_w_m * split_x, 2)
            w2_m = round(total_w_m - w1_m, 2)

            h_living_m = round(total_h_m * 0.65, 2)
            h_balcony_m = round(total_h_m - h_living_m, 2)

            split_y_right = random.uniform(0.50, 0.60)
            h_bed_m = round(total_h_m * split_y_right, 2)
            h_bath_m = round(total_h_m - h_bed_m, 2)

            cells = [
                {"name": "Living Room", "x_m": 0.0, "y_m": 0.0, "w_m": w1_m, "h_m": h_living_m},
                {"name": "Balcony", "x_m": 0.0, "y_m": h_living_m, "w_m": w1_m, "h_m": h_balcony_m},
                {"name": "Bedroom", "x_m": w1_m, "y_m": 0.0, "w_m": w2_m, "h_m": h_bed_m},
                {"name": "Kitchen", "x_m": w1_m, "y_m": h_bed_m, "w_m": w2_m, "h_m": h_bath_m},
            ]

        # Convert metric cells to pixel bboxes and ground truth rooms
        for idx, cell in enumerate(cells):
            px_x1 = int(origin_x + cell["x_m"] * scale_px_per_m)
            px_y1 = int(origin_y + cell["y_m"] * scale_px_per_m)
            px_x2 = int(px_x1 + cell["w_m"] * scale_px_per_m)
            px_y2 = int(px_y1 + cell["h_m"] * scale_px_per_m)

            area_sqm = round(cell["w_m"] * cell["h_m"], 2)

            rooms_data.append({
                "room_id": f"room_{idx+1:02d}",
                "name": cell["name"],
                "width_m": float(cell["w_m"]),
                "height_m": float(cell["h_m"]),
                "area_sqm": float(area_sqm),
                "bbox_pixels": [px_x1, px_y1, px_x2, px_y2],
                "polygon_pixels": [
                    [px_x1, px_y1],
                    [px_x2, px_y1],
                    [px_x2, px_y2],
                    [px_x1, px_y2]
                ],
                "confidence_target": 1.0
            })

        return {
            "total_width_m": float(total_w_m),
            "total_height_m": float(total_h_m),
            "total_area_sqm": round(total_w_m * total_h_m, 2),
            "scale_pixels_per_meter": round(scale_px_per_m, 3),
            "envelope_bbox": [origin_x, origin_y, origin_x + building_px_w, origin_y + building_px_h],
            "rooms": rooms_data
        }

    def render(self, layout: Dict[str, Any]) -> Image.Image:
        """Render realistic 2D CAD architectural floor plan with walls, doors, windows, and labels."""
        img = Image.new("RGB", (self.img_size, self.img_size), color="#FFFFFF")
        draw = ImageDraw.Draw(img)

        # 1. Subtle background grid (1m grid lines)
        scale = layout["scale_pixels_per_meter"]
        env_x1, env_y1, env_x2, env_y2 = layout["envelope_bbox"]

        grid_color = "#F0F3F4"
        x = env_x1
        while x <= env_x2:
            draw.line([(x, env_y1), (x, env_y2)], fill=grid_color, width=1)
            x += scale

        y = env_y1
        while y <= env_y2:
            draw.line([(env_x1, y), (env_x2, y)], fill=grid_color, width=1)
            y += scale

        # 2. Draw room fills and labels
        for r in layout["rooms"]:
            bx1, by1, bx2, by2 = r["bbox_pixels"]
            # Fill room slightly off-white
            room_color = ROOM_SPECS.get(r["name"], {}).get("color", "#FDFEFE")
            draw.rectangle([bx1, by1, bx2, by2], fill=room_color)

            # Room label text
            name = r["name"]
            dim_text = f"{r['width_m']:.1f}m x {r['height_m']:.1f}m"
            cx = (bx1 + bx2) // 2
            cy = (by1 + by2) // 2

            # Text offset
            draw.text((cx - 24, cy - 10), name, fill="#2C3E50", font=self.font)
            draw.text((cx - 22, cy + 4), dim_text, fill="#7F8C8D", font=self.font)

        # 3. Draw Interior Walls (thickness = 3px)
        for r in layout["rooms"]:
            bx1, by1, bx2, by2 = r["bbox_pixels"]
            draw.rectangle([bx1, by1, bx2, by2], outline="#2D3748", width=3)

        # 4. Draw Exterior Perimeter Walls (heavy thickness = 6px)
        draw.rectangle([env_x1, env_y1, env_x2, env_y2], outline="#1A202C", width=6)

        # 5. Draw architectural doors (gap + swing arc)
        for r in layout["rooms"]:
            bx1, by1, bx2, by2 = r["bbox_pixels"]
            door_size = int(scale * 0.9)  # 0.9m standard door
            # Place door on inner horizontal or vertical edge
            if bx1 > env_x1:
                # Door on left vertical wall
                door_y = by1 + 15
                if door_y + door_size < by2:
                    # Clear wall segment for door
                    draw.line([(bx1, door_y), (bx1, door_y + door_size)], fill="#FFFFFF", width=4)
                    # Door leaf
                    draw.line([(bx1, door_y), (bx1 + door_size, door_y)], fill="#4A5568", width=2)
                    # Swing arc
                    draw.arc([bx1 - door_size, door_y - door_size, bx1 + door_size, door_y + door_size],
                             start=0, end=90, fill="#A0AEC0", width=1)

        # 6. Draw Windows on exterior perimeter (double line with gap)
        win_size = int(scale * 1.4)  # 1.4m window
        # Top wall window
        draw.line([(env_x1 + 30, env_y1), (env_x1 + 30 + win_size, env_y1)], fill="#3182CE", width=3)
        draw.line([(env_x1 + 30, env_y1 - 3), (env_x1 + 30 + win_size, env_y1 - 3)], fill="#3182CE", width=1)
        # Bottom wall window
        draw.line([(env_x2 - 30 - win_size, env_y2), (env_x2 - 30, env_y2)], fill="#3182CE", width=3)
        draw.line([(env_x2 - 30 - win_size, env_y2 + 3), (env_x2 - 30, env_y2 + 3)], fill="#3182CE", width=1)

        # 7. Exterior overall dimension lines with arrows/ticks
        dim_offset = 18
        # Top dimension (width)
        draw.line([(env_x1, env_y1 - dim_offset), (env_x2, env_y1 - dim_offset)], fill="#4A5568", width=1)
        draw.line([(env_x1, env_y1 - dim_offset - 4), (env_x1, env_y1 - dim_offset + 4)], fill="#4A5568", width=1)
        draw.line([(env_x2, env_y1 - dim_offset - 4), (env_x2, env_y1 - dim_offset + 4)], fill="#4A5568", width=1)
        w_label = f"{layout['total_width_m']:.2f} m"
        draw.text(((env_x1 + env_x2) // 2 - 20, env_y1 - dim_offset - 12), w_label, fill="#2D3748", font=self.font)

        # Left dimension (height)
        draw.line([(env_x1 - dim_offset, env_y1), (env_x1 - dim_offset, env_y2)], fill="#4A5568", width=1)
        draw.line([(env_x1 - dim_offset - 4, env_y1), (env_x1 - dim_offset + 4, env_y1)], fill="#4A5568", width=1)
        draw.line([(env_x1 - dim_offset - 4, env_y2), (env_x1 - dim_offset + 4, env_y2)], fill="#4A5568", width=1)
        h_label = f"{layout['total_height_m']:.2f} m"
        draw.text((env_x1 - dim_offset - 35, (env_y1 + env_y2) // 2 - 5), h_label, fill="#2D3748", font=self.font)

        return img

    def generate_dataset(self, num_samples: int, output_dir: str) -> List[str]:
        """Generate and save num_samples of images and ground-truth JSON files."""
        images_dir = os.path.join(output_dir, "images")
        annotations_dir = os.path.join(output_dir, "annotations")
        os.makedirs(images_dir, exist_ok=True)
        os.makedirs(annotations_dir, exist_ok=True)

        generated_ids = []
        for i in range(1, num_samples + 1):
            plan_id = f"floor_{i:06d}"
            layout = self._generate_layout()
            layout["plan_id"] = plan_id
            layout["image_path"] = f"images/{plan_id}.png"

            img = self.render(layout)

            img_path = os.path.join(images_dir, f"{plan_id}.png")
            json_path = os.path.join(annotations_dir, f"{plan_id}.json")

            img.save(img_path, format="PNG")
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(layout, f, indent=2)

            generated_ids.append(plan_id)

        print(f"Successfully generated {num_samples} floor plans in {output_dir}")
        return generated_ids


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Generate synthetic CAD floor plans")
    parser.add_argument("--count", type=int, default=100, help="Number of floor plans to generate")
    parser.add_argument("--output", type=str, default="data", help="Output directory")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    gen = FloorPlanGenerator(img_size=512, seed=args.seed)
    gen.generate_dataset(num_samples=args.count, output_dir=args.output)
