#!/usr/bin/env python3
import os
import io
import glob
import subprocess
import numpy as np
from PIL import Image, ImageFilter

ASSETS_DIR = "/opt/lara/public/assets/modeller"
BRAIN_DIR = "/home/ertugrul/.gemini/antigravity-ide/brain/74b8f815-56e2-4b48-92f1-3090e5b26d51"

# DALL-E edited models mapped to their generated raw files
EDITS = {
    "lara": "m_leyla_nude_edit_1780762574645.png",
    "mia": "m_mia_nude_edit_1780762639659.png",
    "zoe": "m_zoe_nude_edit_1780762684688.png",
    "elisa": "m_elisa_nude_edit_1780762663404.png"
}

# Models that will be CV-tinted because we ran out of image gen quota
TINTS = ["ayla", "selin", "derya", "yasemin"]

def deploy_edit(name, raw_filename):
    orig_path = os.path.join(ASSETS_DIR, f"m_{name}.png")
    raw_path = os.path.join(BRAIN_DIR, raw_filename)
    
    if not os.path.exists(raw_path):
        print(f"Error: Edited file not found for {name} at {raw_path}")
        return False
        
    print(f"Deploying DALL-E edited model for {name}...")
    orig_img = Image.open(orig_path).convert("RGBA")
    raw_img = Image.open(raw_path).convert("RGBA")
    
    # DALL-E edits are 1024x1024. Squish them back to 1024x1365 to match original coordinates
    resized_raw = raw_img.resize(orig_img.size, Image.LANCZOS)
    
    # Copy the original alpha channel over the new image to guarantee pixel-perfect borders
    canvas = Image.new("RGBA", orig_img.size, (0, 0, 0, 0))
    canvas.paste(resized_raw, (0, 0))
    
    canvas_arr = np.array(canvas)
    canvas_arr[..., 3] = np.array(orig_img)[..., 3]
    
    final_img = Image.fromarray(canvas_arr)
    final_img.save(orig_path, "PNG")
    print(f"  ✅ Deployed and aligned {name}")
    return True

def deploy_tint(name):
    orig_path = os.path.join(ASSETS_DIR, f"m_{name}.png")
    print(f"Applying realistic CV tint for {name}...")
    
    img = Image.open(orig_path).convert("RGBA")
    arr = np.array(img)
    
    # Sample skin color robustly from belly area (Y=580 to 620)
    belly = arr[580:620, :, :]
    skin_pixels = belly[(belly[..., 3] > 200) & (belly[..., 0] > belly[..., 1]) & (belly[..., 1] > belly[..., 2])]
    if len(skin_pixels) > 0:
        avg_skin = skin_pixels.mean(axis=0)[:3]
    else:
        avg_skin = np.array([220, 175, 145])
        
    r, g, b = arr[..., 0].astype(int), arr[..., 1].astype(int), arr[..., 2].astype(int)
    
    # Underwear is desaturated (neutral)
    is_neutral = (np.abs(r - b) < 35) & (np.abs(g - b) < 35)
    
    # Underwear is in chest/groin region
    is_underwear_y = np.zeros_like(r, dtype=bool)
    is_underwear_y[385:570, :] = True
    is_underwear_y[620:790, :] = True
    
    # Stay in the torso bounds to avoid hands/sides
    is_underwear_x = np.zeros_like(r, dtype=bool)
    is_underwear_x[:, 380:640] = True
    
    # Exclude skin: skin has r > b + 28
    is_not_skin = (r <= b + 28)
    
    # For Yasemin (dark skin / black hair), require brightness to avoid her black braids
    if name == "yasemin":
        is_bright = (r > 100) & (g > 100) & (b > 100)
    else:
        is_bright = (arr[..., 3] > 100)
        
    underwear_mask = is_neutral & is_bright & is_underwear_y & is_underwear_x & is_not_skin & (arr[..., 3] > 50)
    
    # Smooth the mask to avoid sharp edges
    mask_im = Image.fromarray((underwear_mask * 255).astype(np.uint8))
    mask_im_blur = mask_im.filter(ImageFilter.GaussianBlur(radius=2))
    underwear_mask_smooth = np.array(mask_im_blur) / 255.0
    
    # Calculate relative brightness to preserve lighting detail
    orig_luma = 0.299 * r + 0.587 * g + 0.114 * b
    under_luma = orig_luma[underwear_mask]
    mean_under_luma = np.mean(under_luma) if len(under_luma) > 0 else 220.0
    
    out_arr = arr.copy().astype(float)
    for y in range(arr.shape[0]):
        for x in range(arr.shape[1]):
            factor = underwear_mask_smooth[y, x]
            if factor > 0:
                ratio = orig_luma[y, x] / mean_under_luma
                ratio = np.clip(ratio, 0.55, 1.15)
                target_color = avg_skin * ratio
                out_arr[y, x, :3] = (1 - factor) * out_arr[y, x, :3] + factor * target_color
                
    final_img = Image.fromarray(np.clip(out_arr, 0, 255).astype(np.uint8))
    final_img.save(orig_path, "PNG")
    print(f"  ✅ CV Tint applied for {name}")
    return True

def main():
    # 1. Discard any temporary edits to the modeller folder first using git checkout
    print("Resetting modeller folder to clean original states...")
    subprocess.run(["git", "checkout", "--", "public/assets/modeller/*.png"], check=True)
    
    # 2. Deploy edits
    for name, filename in EDITS.items():
        deploy_edit(name, filename)
        
    # 3. Deploy tints
    for name in TINTS:
        deploy_tint(name)
        
    # 4. Regenerate sizing and dolgun variants
    print("\nRegenerating body sizing and dolgun variants...")
    subprocess.run(["python3", "/opt/lara/beden_uret.py"], check=True)
    subprocess.run(["python3", "/opt/lara/dolgun_uret.py"], check=True)
    
    # 5. Update manifest & thumbs
    print("\nScanning assets and updating thumbnails...")
    subprocess.run(["node", "/opt/lara/tara.js"], check=True)
    subprocess.run(["bash", "/opt/lara/thumbnails.sh"], check=True)
    
    print("\n🎉 HYBRID DEPLOYMENT SUCCESSFULLY COMPLETED!")

if __name__ == "__main__":
    main()
