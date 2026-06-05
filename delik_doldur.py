#!/usr/bin/env python3
"""
delik_doldur.py — Parçalardaki KAPALI (enclosed) yanlış-şeffaf delikleri doldurur.
  - Modeller: delik = iç çamaşırı bölgesi → koyu renkle doldurulur.
  - Diğerleri: delik = kumaş → en yakın opak komşudan renk alınır (inpaint).
Açık (kenara bağlı) şeffaflık ve yarı-saydam (tül/cam) bölgeler KORUNUR — sadece
etrafı tamamen kapalı, tam-şeffaf delikler doldurulur. Yedek: _yedek_delik/.
Çalıştır: /opt/lara/.venv/bin/python /opt/lara/delik_doldur.py
"""
import os
import numpy as np
from PIL import Image
from scipy.ndimage import binary_fill_holes, distance_transform_edt

ASSETS = "/opt/lara/public/assets"
YEDEK = "/opt/lara/_yedek_delik"
SLOTLAR = ["modeller", "elbiseler", "ayakkabilar", "taclar", "takilar", "kanatlar", "asalar"]
KOYU = (42, 39, 48)   # iç çamaşırı dolgu rengi (charcoal)
ESIK = 25             # alfa<=ESIK → şeffaf say
MIN_DELIK = 300       # bu kadar pikselden küçük delikleri yok say

os.makedirs(YEDEK, exist_ok=True)
toplam = 0
for slot in SLOTLAR:
    d = os.path.join(ASSETS, slot)
    if not os.path.isdir(d):
        continue
    for fn in sorted(os.listdir(d)):
        if not fn.lower().endswith(".png"):
            continue
        p = os.path.join(d, fn)
        im = np.array(Image.open(p).convert("RGBA"))
        a = im[..., 3]
        opaque = a > ESIK
        if not opaque.any():
            continue
        filled = binary_fill_holes(opaque)
        holes = filled & (~opaque)
        n = int(holes.sum())
        if n < MIN_DELIK:
            continue
        Image.fromarray(im).save(os.path.join(YEDEK, f"{slot}__{fn}"))
        if slot == "modeller":
            im[holes, 0], im[holes, 1], im[holes, 2] = KOYU
        else:
            idx = distance_transform_edt(~opaque, return_indices=True)[1]
            src = im[idx[0], idx[1]]
            for c in range(3):
                im[..., c][holes] = src[..., c][holes]
        im[..., 3][holes] = 255
        Image.fromarray(im).save(p)
        toplam += 1
        print(f"  ✓ {slot}/{fn}  delik={n}px dolduruldu")

print(f"\nBitti: {toplam} dosyada delik dolduruldu. Yedek: {YEDEK}")
print("Sonra: bash /opt/lara/thumbnails.sh && node /opt/lara/tara.js  → Ctrl+Shift+R")
