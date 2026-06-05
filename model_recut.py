#!/usr/bin/env python3
"""Modelleri _ham (beyaz zemin, tüm vücut) görselinden kişi-segmentasyonuyla TEMİZ yeniden keser;
mevcut m_lara hizasına (bbox: üst/yükseklik/merkez) birebir oturtur → iç çamaşırı opak, delik yok,
kıyafetlerle hiza korunur. Çıktı: _model_yeni/ (inceleme). Onaylanınca public/assets/modeller'e kopyala."""
import os, io, sys, numpy as np
from PIL import Image
from rembg import remove, new_session

ASSETS = "/opt/lara/public/assets"; HAM = "/opt/lara/_ham"; OUT = "/opt/lara/_model_yeni"
OUTW, OUTH = 1024, 1365
os.makedirs(OUT, exist_ok=True)

def bbox(a, t=25):
    ys, xs = np.where(a > t)
    return xs.min(), xs.max(), ys.min(), ys.max()

def despill(rgba):
    a = rgba[..., 3:4].astype(np.float32) / 255.0
    rgb = rgba[..., :3].astype(np.float32)
    out = np.where(a > 0.05, np.clip((rgb - (1 - a) * 255.0) / np.maximum(a, 0.05), 0, 255), rgb)
    return np.dstack([out, rgba[..., 3]]).astype(np.uint8)

cur = np.array(Image.open(f"{ASSETS}/modeller/m_lara.png").convert("RGBA"))[..., 3]
cx0, cx1, cy0, cy1 = bbox(cur)
tgt_top, tgt_h, tgt_cx = cy0, (cy1 - cy0), (cx0 + cx1) / 2
print(f"hedef hiza (mevcut m_lara): üst={tgt_top} yükseklik={tgt_h} merkez={tgt_cx:.0f}")

sess = new_session("u2net")
only = sys.argv[1:] or None
for fn in sorted(os.listdir(HAM)):
    if not (fn.startswith("m_") and fn.endswith(".png")):
        continue
    if only and fn not in only:
        continue
    raw = Image.open(f"{HAM}/{fn}").convert("RGBA")
    buf = io.BytesIO(); raw.save(buf, "PNG")
    cut = remove(buf.getvalue(), session=sess, alpha_matting=True,
                 alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=12,
                 alpha_matting_erode_size=2, post_process_mask=True)
    rgba = despill(np.array(Image.open(io.BytesIO(cut)).convert("RGBA")))
    img = Image.fromarray(rgba, "RGBA")
    bx0, bx1, by0, by1 = bbox(rgba[..., 3])
    scale = tgt_h / (by1 - by0)
    img2 = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    px = round(tgt_cx - (bx0 + bx1) / 2 * scale)
    py = round(tgt_top - by0 * scale)
    canvas = Image.new("RGBA", (OUTW, OUTH), (0, 0, 0, 0))
    canvas.alpha_composite(img2, (px, py))
    canvas.save(f"{OUT}/{fn}")
    print("  ✓", fn)
print("Bitti →", OUT)
