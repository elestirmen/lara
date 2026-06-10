#!/usr/bin/env python3
import sys
import os
import argparse
from PIL import Image
import numpy as np

# Ensure we can use rembg
try:
    from rembg import remove, new_session
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False

OUTW, OUTH = 1024, 1365

def align_hat(img_path, output_path, target_width, target_bottom=217):
    print(f"Aligning {img_path} -> {output_path}...")
    img = Image.open(img_path).convert("RGBA")
    
    # Remove background if needed
    if REMBG_AVAILABLE:
        print("Removing background using rembg...")
        import io
        buf = io.BytesIO()
        img.save(buf, "PNG")
        sess = new_session("birefnet-general")
        kes = remove(buf.getvalue(), session=sess, alpha_matting=True)
        img = Image.open(io.BytesIO(kes)).convert("RGBA")
    else:
        print("rembg not available, proceeding with alpha check...")
        
    alpha = img.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        print("Error: Image is empty or transparent")
        sys.exit(1)
        
    # Crop to content
    cropped = img.crop(bbox)
    w, h = cropped.size
    
    # Scale keeping aspect ratio
    scale = target_width / w
    new_w = round(target_width)
    new_h = round(h * scale)
    resized = cropped.resize((new_w, new_h), Image.LANCZOS)
    
    # Calculate position
    px = round(512 - new_w / 2)
    py = round(target_bottom - new_h)
    
    # Create output canvas
    canvas = Image.new("RGBA", (OUTW, OUTH), (0, 0, 0, 0))
    canvas.alpha_composite(resized, (px, py))
    
    # Save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    canvas.save(output_path, "PNG")
    
    # Verify coordinates
    final_alpha = canvas.getchannel("A")
    final_bbox = final_alpha.getbbox()
    print(f"Done! Final bbox: {final_bbox}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("img_path", help="Path to raw generated image")
    parser.add_argument("output_path", help="Path to save aligned PNG")
    parser.add_argument("--width", type=float, default=354, help="Target width of hat")
    parser.add_argument("--bottom", type=float, default=217, help="Target bottom y-coordinate of hat")
    args = parser.parse_args()
    
    align_hat(args.img_path, args.output_path, args.width, args.bottom)
