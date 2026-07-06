import os
import re
import urllib.parse
from sqlalchemy import create_engine, text
import httpx
from app.config import settings

def sanitize_prompt_for_image(prompt: str) -> str:
    if not prompt:
        return ""
    # Remove curly braces and anything between them (which strips JSON)
    cleaned = re.sub(r'\{.*?\}', '', prompt, flags=re.DOTALL)
    # Remove square brackets and anything between them
    cleaned = re.sub(r'\[.*?\]', '', cleaned, flags=re.DOTALL)
    # Remove newlines and double spaces
    cleaned = cleaned.replace('\n', ' ').replace('\r', ' ')
    cleaned = ' '.join(cleaned.split())
    # Truncate to 300 characters to make it completely safe
    if len(cleaned) > 300:
        cleaned = cleaned[:300] + "..."
    return cleaned

try:
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT id, style, image_url, project_id FROM designs WHERE image_url LIKE 'https://image.pollinations.ai%'"))
        designs = [dict(r._mapping) for r in res]
        print(f"Found {len(designs)} designs with Pollinations URLs in Postgres.")

        os.makedirs("static/generated", exist_ok=True)

        for d in designs:
            d_id = d['id']
            style = d['style']
            old_url = d['image_url']
            
            match = re.search(r'https://image\.pollinations\.ai/prompt/(.*?)\?width', old_url)
            if not match:
                continue
            
            raw_prompt_encoded = match.group(1)
            raw_prompt = urllib.parse.unquote(raw_prompt_encoded)
            
            sanitized_prompt = sanitize_prompt_for_image(raw_prompt)
            encoded_new_prompt = urllib.parse.quote(sanitized_prompt)
            new_url = f"https://image.pollinations.ai/prompt/{encoded_new_prompt}?width=800&height=600&nologo=true&private=true&model=flux"
            
            print(f"Design {d_id} ({style}):")
            print(f"  Sanitized prompt length: {len(sanitized_prompt)}")
            
            local_filename = f"{d_id}.jpg"
            local_path = os.path.join("static/generated", local_filename)
            
            print(f"  Downloading image from Pollinations...")
            try:
                with httpx.Client(timeout=45.0) as client:
                    response = client.get(new_url)
                    if response.status_code == 200:
                        with open(local_path, "wb") as f:
                            f.write(response.content)
                        db_url = f"http://localhost:8080/static/generated/{local_filename}"
                        conn.execute(
                            text("UPDATE designs SET image_url = :url WHERE id = :id"),
                            {"url": db_url, "id": d_id}
                        )
                        print(f"  Successfully downloaded and updated DB reference to: {db_url}")
                    else:
                        conn.execute(
                            text("UPDATE designs SET image_url = :url WHERE id = :id"),
                            {"url": new_url, "id": d_id}
                        )
                        print(f"  Download failed (status {response.status_code}), updated DB reference to working Pollinations URL.")
            except Exception as download_err:
                conn.execute(
                    text("UPDATE designs SET image_url = :url WHERE id = :id"),
                    {"url": new_url, "id": d_id}
                )
                print(f"  Download error ({download_err}), updated DB reference to working Pollinations URL.")
        
        try:
            conn.commit()
        except:
            pass

    print("Postgres database patch completed successfully!")
except Exception as e:
    print(f"Error patching Postgres database: {e}")
