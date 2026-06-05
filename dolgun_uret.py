#!/usr/bin/env python3
"""Dolgun (balık etli) beden varyantları üretir:
  - Seçili modellerin gövdesini warp'lar → modeller/m_<ad>_dolgun.png (yeni model olarak çıkar)
  - TÜM elbise + kolyeleri AYNI profille warp'lar → _dolgun/<slot>/<id>.png (giyince birebir oturur)
Standart modellere/elbiselere DOKUNMAZ. Tekrar çalıştırılabilir.
"""
import os
from PIL import Image
from warp_curvy import warp

A = "/opt/lara/public/assets"
GUC = 1.0
# Dolgun yapılacak temel modeller (temiz olanlar; ayla'nın iç çamaşırı sorunu olduğu için hariç)
BAZLAR = ["m_mia", "m_zoe", "m_elisa", "m_lara"]
# Bedene göre uyarlanacak slotlar (ayakkabı=ayak, taç=baş → warp 1.0, gerekmez)
WARP_SLOT = ["elbiseler", "takilar"]

# 1) Dolgun modeller
n = 0
for b in BAZLAR:
    src = f"{A}/modeller/{b}.png"
    if not os.path.exists(src):
        continue
    warp(Image.open(src), GUC).save(f"{A}/modeller/{b}_dolgun.png")
    n += 1
    print("  model ✓", f"{b}_dolgun")

# 2) Elbise/kolyelerin dolgun varyantları → _dolgun/<slot>/<id>.png
for slot in WARP_SLOT:
    sd = f"{A}/{slot}"
    od = f"{A}/_dolgun/{slot}"
    os.makedirs(od, exist_ok=True)
    if not os.path.isdir(sd):
        continue
    for fn in sorted(os.listdir(sd)):
        if not fn.lower().endswith(".png"):
            continue
        warp(Image.open(os.path.join(sd, fn)), GUC).save(os.path.join(od, fn))
        print(f"  {slot} ✓ {fn}")

print(f"\nBitti: {n} dolgun model + elbise/kolye varyantları (_dolgun/).")
print("Sonra: node /opt/lara/tara.js && bash /opt/lara/thumbnails.sh")
