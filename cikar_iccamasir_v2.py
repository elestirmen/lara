#!/usr/bin/env python3
import os
import glob
import subprocess
import numpy as np
from PIL import Image, ImageFilter

ASSETS_DIR = "/opt/lara/public/assets/modeller"

def process_model(img_path):
    print(f"Realistic tinting for {os.path.basename(img_path)}...")
    img = Image.open(img_path).convert("RGBA")
    arr = np.array(img)
    
    # 1. Sample skin color robustly from belly area (Y=580 to 620) where alpha is opaque
    # and color is warmer (R > G > B)
    belly = arr[580:620, :, :]
    skin_pixels = belly[(belly[..., 3] > 200) & (belly[..., 0] > belly[..., 1]) & (belly[..., 1] > belly[..., 2])]
    if len(skin_pixels) > 0:
        avg_skin = skin_pixels.mean(axis=0)[:3]
    else:
        avg_skin = np.array([220, 175, 145]) # Safe fallback for light skin
    
    # Adjust for dark skin if model is Zoe or Yasemin (both have deep brown skin)
    # The robust sampler will auto-detect it, but let's print it to check.
    print(f"  Sampled skin tone: {avg_skin}")
    
    r, g, b = arr[..., 0].astype(int), arr[..., 1].astype(int), arr[..., 2].astype(int)
    
    # 2. Detect underwear pixels
    # Underwear is desaturated (R, G, B are very close)
    is_neutral = (np.abs(r - b) < 22) & (np.abs(g - b) < 22)
    # Underwear is also inside the chest (Y=430..560) or groin (Y=650..780) vertical bounds
    is_underwear_y = np.zeros_like(r, dtype=bool)
    is_underwear_y[430:560, :] = True
    is_underwear_y[650:780, :] = True
    
    # Underwear mask
    underwear_mask = is_neutral & is_underwear_y & (arr[..., 3] > 50)
    
    if not np.any(underwear_mask):
        print(f"  No underwear detected in Y-bounds for {os.path.basename(img_path)}!")
        return False
        
    # 3. Create a smooth feathered mask for blending edges nicely
    mask_im = Image.fromarray((underwear_mask * 255).astype(np.uint8))
    mask_im_blur = mask_im.filter(ImageFilter.GaussianBlur(radius=2))
    underwear_mask_smooth = np.array(mask_im_blur) / 255.0
    
    # 4. Calculate relative brightness to preserve lighting detail (cleavage, folds, shadows)
    orig_luma = 0.299 * r + 0.587 * g + 0.114 * b
    under_luma = orig_luma[underwear_mask]
    mean_under_luma = np.mean(under_luma) if len(under_luma) > 0 else 220.0
    
    out_arr = arr.copy().astype(float)
    for y in range(arr.shape[0]):
        for x in range(arr.shape[1]):
            factor = underwear_mask_smooth[y, x]
            if factor > 0:
                ratio = orig_luma[y, x] / mean_under_luma
                # Keep shadows and highlights in natural skin ranges
                ratio = np.clip(ratio, 0.58, 1.12)
                target_color = avg_skin * ratio
                
                # Blend original with tinted color
                out_arr[y, x, :3] = (1 - factor) * out_arr[y, x, :3] + factor * target_color
                
    # Save back to modeller folder
    final_img = Image.fromarray(np.clip(out_arr, 0, 255).astype(np.uint8))
    final_img.save(img_path, "PNG")
    print(f"  ✅ Saved realistic underwear-free m_{os.path.basename(img_path)}")
    return True

def main():
    # Only process base models (excluding curvy versions m_*_dolgun.png)
    base_models = glob.glob(os.path.join(ASSETS_DIR, "m_*.png"))
    base_models = [m for m in base_models if not m.endswith("_dolgun.png")]
    
    success = 0
    for m in base_models:
        if process_model(m):
            success += 1
            
    print(f"\nCompleted tinting {success}/{len(base_models)} base models.")
    
    # Re-run sizing and dolgun scripts to propagate the changes
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
