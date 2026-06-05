#!/usr/bin/env python3
"""Her modelin gövde genişliğini ölçüp, elbiselerin o modele göre yatay ölçekleneceği
katsayıyı (public/assets/model_genislik.json) üretir. Referans = elbiselerin çizildiği
standart beden (orijinal m_lara/mia/zoe/elisa ortalaması). Yeni model eklenince tekrar çalışır."""
import os, json
import numpy as np
from PIL import Image

D = "/opt/lara/public/assets/modeller"
OUT = "/opt/lara/public/assets/model_genislik.json"
ROWS = [0.37, 0.47, 0.52]  # göğüs, bel, kalça (elbisenin kapladığı bölge)

def beden(fn):
    a = np.array(Image.open(os.path.join(D, fn)).convert("RGBA"))[..., 3]
    H, W = a.shape
    ws = []
    for fr in ROWS:
        xs = np.where(a[int(H * fr)] > 25)[0]
        ws.append((xs.max() - xs.min()) if len(xs) else 0)
    return sum(ws) / len(ws)

models = {fn[:-4]: beden(fn) for fn in os.listdir(D) if fn.endswith(".png")}
orj = [models[m] for m in ("m_lara", "m_mia", "m_zoe", "m_elisa") if m in models]
ref = (sum(orj) / len(orj)) if orj else sorted(models.values())[len(models) // 2]
fac = {m: round(min(1.25, max(0.72, w / ref)), 3) for m, w in models.items()}
json.dump(fac, open(OUT, "w"), ensure_ascii=False, indent=1)
print("Referans beden:", round(ref), "px →", OUT)
for m, f in sorted(fac.items()):
    print(f"  {m:14} {f}")
