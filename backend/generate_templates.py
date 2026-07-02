import os
import urllib.parse
import httpx
import asyncio

styles = ["Modern", "Japandi", "Scandinavian", "Minimalist", "Luxury"]
directions = ["North", "East", "West", "South"]
layouts = ["layout-a", "layout-b"]
room_types = ["Living Room", "Bedroom"]

async def download_image(room_type: str, style: str, direction: str, layout: str):
    # Sanitize inputs for filename
    safe_room = "".join(c for c in room_type if c.isalnum() or c in " -_").replace(" ", "_")
    safe_style = "".join(c for c in style if c.isalnum() or c in " -_").replace(" ", "_")
    safe_direction = "".join(c for c in direction if c.isalnum() or c in " -_").replace(" ", "_")
    safe_layout = "".join(c for c in layout if c.isalnum() or c in " -_").replace(" ", "_")
    
    filename = f"{safe_room}_{safe_style}_{safe_direction}_{safe_layout}.jpg"
    dir_path = "backend/static/templates" if os.path.exists("backend") else "static/templates"
    os.makedirs(dir_path, exist_ok=True)
    file_path = os.path.join(dir_path, filename)
    
    if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
        print(f"Skipping {filename} (already exists)")
        return
        
    layout_suffix = "layout option A, balanced furniture setup" if layout == "layout-a" else "layout option B, cozy corner layout"
    seed = 1001 if layout == "layout-a" else 2002
    
    prompt = f"Generate an image where the room is {room_type} the style is {style} and the door of the current room is {direction} facing, {layout_suffix}"
    encoded_prompt = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=600&nologo=true&private=true&model=flux&seed={seed}"
    
    print(f"Generating: {room_type} | {style} | {direction} | {layout} ...")
    
    retries = 3
    delay = 3.0
    for attempt in range(retries):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    with open(file_path, "wb") as f:
                        f.write(response.content)
                    print(f"Successfully saved {filename}")
                    return
                elif response.status_code == 429:
                    print(f"Rate limited (429) on attempt {attempt+1} for {filename}. Retrying in {delay}s...")
                    await asyncio.sleep(delay)
                    delay *= 2
                else:
                    print(f"Failed to generate {filename} on attempt {attempt+1} (Status {response.status_code}). Retrying in {delay}s...")
                    await asyncio.sleep(delay)
                    delay *= 2
        except Exception as e:
            print(f"Error downloading {filename} on attempt {attempt+1}: {e}. Retrying in {delay}s...")
            await asyncio.sleep(delay)
            delay *= 2
            
    print(f"Could not generate {filename} after {retries} attempts.")

async def main():
    # Run sequentially with a small delay to avoid 429 rate limit
    for room in room_types:
        for style in styles:
            for direction in directions:
                for layout in layouts:
                    await download_image(room, style, direction, layout)
                    await asyncio.sleep(1.0) # Sleep 1.0 seconds between generations
    print("Done pre-generating template images!")

if __name__ == "__main__":
    asyncio.run(main())
