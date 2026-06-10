#!/usr/bin/env python3
"""
process_images.py — Ham AI görsellerini oyuna hazır, TERTEMİZ KENARLI parçalara çevirir.

Boru hattı (profesyonel):
  1) Şekil maskesi: BiRefNet (yoksa isnet/u2net) — beyaz kıyafetleri (gelinlik, cam ayakkabı)
     bile renkten bağımsız doğru keser.
  2) Beyaz-despill: arka plan beyaz olduğundan kenardaki beyaz hâle matematiksel olarak silinir
     → kırpma izi kalmaz.
  3) Tek tip hizalama: tüm 1024×1024 ham kareler AYNI dönüşümle 1024×1365'e oturur → tüm parçalar
     birbiriyle kusursuz hizalı (kafa ~%8, ayak ~%94). Arka planlar opak, tam ekran.

⚠️ ÖNEMLİ: rembg KİŞİ segmentasyonu yapar (tüm gövdeyi tutar). Bu yüzden:
  - MODELLER (m_*) ve İZOLE üretilmiş tek ürün görselleri için DOĞRUDUR.
  - "Ürünü giymiş kadın" ham görselinde (elbise/ayakkabı/aksesuar) gövdeyi de tutar →
    yalnız-ürün İÇİN UYGUN DEĞİL. Yalnız-ürün gerekiyorsa: ürünü İZOLE üret (flat-lay /
    şeffaf zemin) ya da kıyafet için 'u2net_cloth_seg' modelini kullan.

Çalıştırma (venv'den):
  /opt/lara/.venv/bin/python /opt/lara/process_images.py [GIRDI] [--out KLASOR] [--apply] [--model AD]
  GIRDI  : ham görsel klasörü (varsayılan /opt/lara/_ham), dosya: <id>.png / <id>_raw_<n>.png
  --out  : çıktı klasörü (varsayılan /opt/lara/_islenmis  = inceleme)
  --apply: doğrudan public/assets'e yaz (canlı). Yedek _yedek_assets'te.
"""
import sys, os, re, io, argparse
from PIL import Image
import numpy as np

KOK = "/opt/lara"
ASSETS = os.path.join(KOK, "public", "assets")
STATE = os.path.join(KOK, ".kenar_temizlendi")
OUTW, OUTH = 1024, 1365
ONEK_SLOT = {"m_": "modeller", "elb_": "elbiseler", "ayk_": "ayakkabilar", "tac_": "taclar",
             "kly_": "takilar", "kanat_": "kanatlar", "asa_": "asalar", "ap_": "arkaplanlar",
             "oz_": "ozel"}
UZ = (".png", ".webp", ".jpg", ".jpeg")
MODELLER = ["birefnet-general", "isnet-general-use", "u2net"]

# Tek tip hizalama dönüşümü (ham kare → 1024×1365). Ham figür: kafa ~%7, ayak ~%98.
HEAD_RAW, FEET_RAW, HEAD_OUT, FEET_OUT = 0.07, 0.98, 0.08, 0.94


def id_slot(fn):
    s = os.path.splitext(os.path.basename(fn))[0]
    s = re.sub(r"_raw_\d+$", "", s)
    s = re.sub(r"\s*\(\d+\)$", "", s)
    idd = re.sub(r"[^a-z0-9_-]", "", s.lower())
    for o, sl in ONEK_SLOT.items():
        if idd.startswith(o):
            return idd, sl
    return idd, None


def beyaz_despill(rgba):
    """Yarı saydam kenarlardaki beyaz bulaşmayı kaldırır (arka plan beyazdı)."""
    a = rgba[..., 3:4].astype(np.float32) / 255.0
    rgb = rgba[..., :3].astype(np.float32)
    m = (a > 0.05)
    fg = rgb.copy()
    fg = np.where(m, np.clip((rgb - (1 - a) * 255.0) / np.maximum(a, 0.05), 0, 255), rgb)
    return np.dstack([fg, rgba[..., 3]]).astype(np.uint8)


def hizala(img):
    """1024×1024 (veya başka) kesilmiş RGBA'yı tek tip dönüşümle 1024×1365'e oturt."""
    img = img.convert("RGBA")
    rawh = img.size[1]
    scale = (FEET_OUT - HEAD_OUT) * OUTH / ((FEET_RAW - HEAD_RAW) * rawh)
    S = (max(1, round(img.size[0] * scale)), max(1, round(img.size[1] * scale)))
    big = img.resize(S, Image.LANCZOS)
    feet_scaled = FEET_RAW * rawh * scale
    py = round(FEET_OUT * OUTH - feet_scaled)
    px = round((OUTW - S[0]) / 2)
    canvas = Image.new("RGBA", (OUTW, OUTH), (0, 0, 0, 0))
    canvas.alpha_composite(big, (px, py))
    return canvas


def kapak(img):
    """Arka plan: 1024×1365'i KIRPARAK doldur, opak."""
    img = img.convert("RGB")
    sw, sh = img.size
    s = max(OUTW / sw, OUTH / sh)
    img = img.resize((round(sw * s), round(sh * s)), Image.LANCZOS)
    x = (img.size[0] - OUTW) // 2
    y = (img.size[1] - OUTH) // 2
    return img.crop((x, y, x + OUTW, y + OUTH))


def state_isaretle(p):
    try:
        with open(STATE, "a") as f:
            f.write(f"{p}|{int(os.path.getmtime(p))}\n")
    except Exception:
        pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("girdi", nargs="?", default=os.path.join(KOK, "_ham"))
    ap.add_argument("--out", default=os.path.join(KOK, "_islenmis"))
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--model", default=None)
    a = ap.parse_args()
    out_kok = ASSETS if a.apply else a.out

    if not os.path.isdir(a.girdi):
        print("Girdi klasörü yok:", a.girdi); sys.exit(1)

    from rembg import remove, new_session
    sess = None
    for ad in ([a.model] if a.model else MODELLER):
        try:
            print("Model:", ad, "…"); sess = new_session(ad); kullan = ad; break
        except Exception as e:
            print("  olmadı:", ad, e)
    if not sess:
        print("Model yüklenemedi."); sys.exit(1)
    print("Kullanılan model:", kullan)

    dosyalar = sorted(f for f in os.listdir(a.girdi) if f.lower().endswith(UZ))
    n = 0
    for d in dosyalar:
        idd, slot = id_slot(d)
        if not slot:
            print("  ? slot bilinmiyor:", d); continue
        try:
            ham = Image.open(os.path.join(a.girdi, d))
            if slot == "arkaplanlar":
                son = kapak(ham)
            else:
                buf = io.BytesIO(); ham.convert("RGBA").save(buf, "PNG")
                kes = remove(buf.getvalue(), session=sess, alpha_matting=True,
                             alpha_matting_foreground_threshold=240,
                             alpha_matting_background_threshold=12,
                             alpha_matting_erode_size=2, post_process_mask=True)
                rgba = np.array(Image.open(io.BytesIO(kes)).convert("RGBA"))
                rgba = beyaz_despill(rgba)
                son = hizala(Image.fromarray(rgba, "RGBA"))
            od = os.path.join(out_kok, slot); os.makedirs(od, exist_ok=True)
            if a.apply:
                for e in UZ:
                    p = os.path.join(od, idd + e)
                    if os.path.exists(p): os.remove(p)
            hp = os.path.join(od, idd + ".png")
            son.save(hp)
            if a.apply: state_isaretle(hp)
            n += 1; print("  ✓", slot + "/" + idd + ".png")
        except Exception as e:
            print("  ✗", d, e)

    print(f"\nBitti: {n} görsel → {out_kok}")
    if not a.apply:
        print("İncele; iyiyse:  /opt/lara/.venv/bin/python /opt/lara/process_images.py _ham --apply")
    else:
        print("Şimdi: bash /opt/lara/thumbnails.sh && node /opt/lara/tara.js  → Ctrl+Shift+R")


if __name__ == "__main__":
    main()
