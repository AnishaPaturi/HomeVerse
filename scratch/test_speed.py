import time
import shutil
from pathlib import Path
from PIL import Image, ImageDraw

out_dir = Path("scratch/test_out")
if out_dir.exists():
    shutil.rmtree(out_dir)
out_dir.mkdir(parents=True, exist_ok=True)

t0 = time.time()
for i in range(30):
    img = Image.new("RGB", (768, 768), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 718, 718], outline=(0, 0, 0), width=3)
    draw.text((100, 100), f"Test Layout {i}", fill=(0, 0, 0))
    img.save(out_dir / f"test_{i:04d}.png", "PNG", optimize=False)
dt = time.time() - t0
print(f"30 images saved in {dt:.2f} seconds ({30/dt:.1f} img/s)")
shutil.rmtree(out_dir)
