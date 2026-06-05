#!/usr/bin/env python3
"""Satır-bazlı yatay warp: gövdeyi dolgunlaştırır (yüz/baş normal, bel/kalça/göğüs genişler).
Aynı profil hem gövdeye hem elbiseye uygulanınca elbise dolgun bedene birebir oturur."""
import sys, numpy as np
from PIL import Image

# (yükseklik oranı, yatay ölçek) — yumuşak profil; aralarda doğrusal interpolasyon
PROFIL = [(0.00,1.00),(0.10,1.01),(0.16,1.03),(0.21,1.02),(0.27,1.05),(0.34,1.12),
          (0.39,1.18),(0.45,1.22),(0.50,1.24),(0.55,1.25),(0.62,1.20),(0.70,1.12),
          (0.78,1.06),(0.86,1.03),(0.94,1.01),(1.00,1.00)]

def profil_dizi(H, guc=1.0):
    ys = np.array([p[0] for p in PROFIL]); ss = np.array([p[1] for p in PROFIL])
    ss = 1.0 + (ss - 1.0) * guc                # guc: dolgunluk şiddeti
    yy = np.arange(H) / max(1, H - 1)
    return np.interp(yy, ys, ss)

def warp(img, guc=1.0):
    im = np.asarray(img.convert("RGBA")).astype(np.float32)
    H, W, _ = im.shape
    s = profil_dizi(H, guc)
    cx = (W - 1) / 2.0
    xs = np.arange(W)
    out = np.zeros_like(im)
    for y in range(H):
        srcx = cx + (xs - cx) / s[y]           # genişletmek için kaynaktan daralarak örnekle
        x0 = np.clip(np.floor(srcx).astype(int), 0, W - 1)
        x1 = np.clip(x0 + 1, 0, W - 1)
        t = np.clip(srcx - x0, 0, 1)[:, None]
        row = im[y]
        out[y] = row[x0] * (1 - t) + row[x1] * t
        # kaynak çerçeve dışına düşen sütunları şeffaf yap
        dis = (srcx < 0) | (srcx > W - 1)
        out[y][dis] = 0
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")

if __name__ == "__main__":
    inp, outp = sys.argv[1], sys.argv[2]
    guc = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
    warp(Image.open(inp), guc).save(outp)
    print("warp →", outp, "guc", guc)
