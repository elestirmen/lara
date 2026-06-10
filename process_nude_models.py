#!/usr/bin/env python3
import os
import io
import glob
import subprocess
from PIL import Image
from rembg import remove, new_session

ASSETS_DIR = "/opt/lara/public/assets/modeller"
BRAIN_DIR = "/home/ertugrul/.gemini/antigravity-ide/brain/74b8f815-56e2-4b48-92f1-3090e5b26d51"

MODELS = [
    "leyla", "mia", "zoe", "elisa", "ayla", "selin", "derya", "yasemin"
]

def align_model(name, sess):
    orig_path = os.path.join(ASSETS_DIR, f"m_{name}.png")
    
    # Find generated nude raw image
    pattern = os.path.join(BRAIN_DIR, f"m_{name}_nude_*.png")
    matches = glob.glob(pattern)
    if not matches:
        print(f"No generated image found for m_{name}_nude!")
        return False
    
    new_raw_path = matches[0]
    print(f"\nAligning {name}...")
    print(f"  Orig: {orig_path}")
    print(f"  New:  {new_raw_path}")
    
    # Load original
    orig_img = Image.open(orig_path).convert("RGBA")
    orig_bbox = orig_img.getbbox()
    if not orig_bbox:
        print(f"  Error: Bounding box empty for original {name}!")
        return False
        
    orig_w = orig_bbox[2] - orig_bbox[0]
    orig_h = orig_bbox[3] - orig_bbox[1]
    
    # Background removal on new
    print("  Removing background of new image...")
    with open(new_raw_path, "rb") as f:
        new_bg_removed = remove(f.read(), session=sess)
    new_img = Image.open(io.BytesIO(new_bg_removed)).convert("RGBA")
    new_bbox = new_img.getbbox()
    if not new_bbox:
        print(f"  Error: Bounding box empty for new {name}!")
        return False
        
    # Crop to new bbox and scale to original dimensions
    cropped_new = new_img.crop(new_bbox)
    resized_new = cropped_new.resize((orig_w, orig_h), Image.LANCZOS)
    
    # Paste onto blank canvas matching original image shape
    canvas = Image.new("RGBA", orig_img.size, (0, 0, 0, 0))
    canvas.paste(resized_new, (orig_bbox[0], orig_bbox[1]), resized_new)
    
    # Save back to modeller assets
    canvas.save(orig_path, "PNG")
    print(f"  ✅ Successfully aligned and saved m_{name}.png")
    return True

def main():
    print("Initializing rembg session...")
    sess = new_session("u2net")
    
    success_count = 0
    for m in MODELS:
        if align_model(m, sess):
            success_count += 1
            
    print(f"\nAlignment done: {success_count}/{len(MODELS)} models aligned.")
    
    # Re-run sizing and dolgun scripts to apply the updated models
    print("\nRegenerating body sizing and dolgun variants...")
    subprocess.run(["python3", "/opt/lara/beden_uret.py"], check=True)
    subprocess.run(["python3", "/opt/lara/dolgun_uret.py"], check=True)
    
    # Update manifest & thumbs
    print("\nScanning assets and updating thumbnails...")
    subprocess.run(["node", "/opt/lara/tara.js"], check=True)
    subprocess.run(["bash", "/opt/lara/thumbnails.sh"], check=True)
    
    print("\n🎉 ALL TASKS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
