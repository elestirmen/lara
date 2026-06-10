#!/usr/bin/env python3
import sys
import os
from PIL import Image

def create_preview(model_path, hat_path, output_path, target_width, target_bottom):
    model = Image.open(model_path).convert("RGBA")
    
    # Load and crop hat
    hat = Image.open(hat_path).convert("RGBA")
    alpha = hat.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        print(f"Empty hat: {hat_path}")
        return
        
    cropped = hat.crop(bbox)
    w, h = cropped.size
    
    # Scale keeping aspect ratio
    scale = target_width / w
    new_w = round(target_width)
    new_h = round(h * scale)
    resized = cropped.resize((new_w, new_h), Image.LANCZOS)
    
    # Calculate position
    px = round(512 - new_w / 2)
    py = round(target_bottom - new_h)
    
    # Overlay on model
    preview = model.copy()
    preview.alpha_composite(resized, (px, py))
    
    # Crop to head region for detailed inspection (x: 300..700, y: 0..400)
    head_region = preview.crop((300, 0, 700, 400))
    head_region.save(output_path, "PNG")
    print(f"Saved preview: {output_path} (width={target_width}, bottom={target_bottom})")

if __name__ == "__main__":
    if len(sys.argv) < 6:
        print("Usage: fit_hat.py <model> <hat> <out> <width> <bottom>")
        sys.exit(1)
    create_preview(sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), float(sys.argv[5]))
