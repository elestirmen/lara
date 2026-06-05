#!/usr/bin/env python3
"""Create wardrobe variants from the existing aligned PNG assets.

This intentionally derives new items from already-working 1024x1365 assets.
The alpha mask and canvas stay unchanged, so wardrobe alignment remains stable.
"""
from pathlib import Path
import hashlib
import random

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ASSETS = Path("/opt/lara/public/assets")
SIZE = (1024, 1365)


def rng_for(name):
    return random.Random(int(hashlib.sha1(name.encode("utf-8")).hexdigest()[:8], 16))


def ensure_size(img):
    if img.size == SIZE:
        return img
    return img.resize(SIZE, Image.LANCZOS)


def load_rgba(slot, asset_id):
    return ensure_size(Image.open(ASSETS / slot / f"{asset_id}.png").convert("RGBA"))


def save_png(slot, asset_id, img):
    out = ASSETS / slot / f"{asset_id}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, optimize=True)
    print(f"  {slot}/{asset_id}.png")


def bbox_from_alpha(alpha):
    ys, xs = np.where(alpha > 25)
    if len(xs) == 0:
        return 0, 0, SIZE[0] - 1, SIZE[1] - 1
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def recolor_rgba(img, color, amount=0.45, saturation=1.08, contrast=1.04, brightness=1.0):
    img = ImageEnhance.Color(img).enhance(saturation)
    img = ImageEnhance.Contrast(img).enhance(contrast)
    img = ImageEnhance.Brightness(img).enhance(brightness)

    arr = np.asarray(img.convert("RGBA")).astype(np.float32)
    rgb = arr[..., :3]
    alpha = arr[..., 3:4]
    color_arr = np.array(color, dtype=np.float32)

    lum = rgb.mean(axis=2, keepdims=True) / 255.0
    shaded_color = color_arr * (0.45 + lum * 0.70)
    shaded_color = np.clip(shaded_color, 0, 255)
    mix = amount * (alpha > 8)
    rgb = rgb * (1.0 - mix) + shaded_color * mix

    out = np.dstack([np.clip(rgb, 0, 255), alpha])
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def clipped_overlay(base, overlay):
    alpha = np.asarray(base.convert("RGBA"))[..., 3]
    ov = np.asarray(overlay.convert("RGBA")).copy()
    ov[..., 3] = np.minimum(ov[..., 3], alpha)
    return Image.alpha_composite(base.convert("RGBA"), Image.fromarray(ov, "RGBA"))


def add_sparkles(img, asset_id, count=55, color=(255, 244, 196, 185), upper_bias=False):
    r = rng_for(asset_id + "-spark")
    alpha = np.asarray(img.convert("RGBA"))[..., 3]
    x0, y0, x1, y1 = bbox_from_alpha(alpha)
    overlay = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    made = 0
    tries = 0
    while made < count and tries < count * 40:
        tries += 1
        x = r.randint(x0, x1)
        if upper_bias:
          y = r.randint(y0, max(y0, y0 + (y1 - y0) // 2))
        else:
          y = r.randint(y0, y1)
        if alpha[y, x] <= 25:
            continue
        rad = r.choice([2, 2, 3, 4])
        draw.line((x - rad, y, x + rad, y), fill=color, width=1)
        draw.line((x, y - rad, x, y + rad), fill=color, width=1)
        made += 1
    return clipped_overlay(img, overlay)


def add_diagonal_sheen(img, color=(255, 255, 255, 42), step=118, width=5):
    overlay = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for x in range(-SIZE[1], SIZE[0] + SIZE[1], step):
        draw.line((x, SIZE[1], x + SIZE[1], 0), fill=color, width=width)
    return clipped_overlay(img, overlay.filter(ImageFilter.GaussianBlur(0.4)))


def add_soft_vignette(img, color=(0, 0, 0), amount=0.25):
    arr = np.asarray(img.convert("RGBA")).astype(np.float32)
    h, w = arr.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    dx = (xx - w / 2) / (w / 2)
    dy = (yy - h / 2) / (h / 2)
    dist = np.clip((dx * dx + dy * dy) ** 0.5, 0, 1)
    mask = (dist ** 1.8)[..., None] * amount
    arr[..., :3] = arr[..., :3] * (1 - mask) + np.array(color) * mask
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")


def wardrobe_variant(slot, source, asset_id, color, amount, sparkle=False, sheen=False):
    img = recolor_rgba(load_rgba(slot, source), color, amount=amount)
    if sheen:
        img = add_diagonal_sheen(img)
    if sparkle:
        img = add_sparkles(img, asset_id, count=42 if slot != "elbiseler" else 72, upper_bias=slot != "elbiseler")
    save_png(slot, asset_id, img)


def gradient_overlay(size, top, bottom, alpha=120):
    h = size[1]
    arr = np.zeros((h, size[0], 4), dtype=np.uint8)
    top = np.array(top, dtype=np.float32)
    bottom = np.array(bottom, dtype=np.float32)
    for y in range(h):
        t = y / max(1, h - 1)
        arr[y, :, :3] = np.clip(top * (1 - t) + bottom * t, 0, 255)
        arr[y, :, 3] = alpha
    return Image.fromarray(arr, "RGBA")


def scene_variant(source, asset_id, top, bottom, mode):
    base = ensure_size(Image.open(ASSETS / "arkaplanlar" / f"{source}.png").convert("RGBA"))
    img = Image.alpha_composite(base, gradient_overlay(SIZE, top, bottom, alpha=115))
    draw = ImageDraw.Draw(img, "RGBA")
    r = rng_for(asset_id + "-scene")

    if mode == "stars":
        for _ in range(105):
            x = r.randint(40, SIZE[0] - 40)
            y = r.randint(45, 520)
            rad = r.choice([1, 1, 2, 3])
            draw.ellipse((x - rad, y - rad, x + rad, y + rad), fill=(255, 255, 235, r.randint(105, 220)))
        light = Image.new("RGBA", SIZE, (0, 0, 0, 0))
        ld = ImageDraw.Draw(light, "RGBA")
        ld.polygon([(SIZE[0] // 2, -80), (260, SIZE[1]), (764, SIZE[1])], fill=(255, 240, 190, 42))
        img = Image.alpha_composite(img, light.filter(ImageFilter.GaussianBlur(46)))
    elif mode == "spot":
        light = Image.new("RGBA", SIZE, (0, 0, 0, 0))
        ld = ImageDraw.Draw(light, "RGBA")
        ld.polygon([(210, -60), (350, -60), (120, SIZE[1])], fill=(255, 235, 190, 58))
        ld.polygon([(700, -60), (850, -60), (925, SIZE[1])], fill=(255, 220, 250, 54))
        img = Image.alpha_composite(img, light.filter(ImageFilter.GaussianBlur(52)))
        img = Image.alpha_composite(img, gradient_overlay(SIZE, (0, 0, 0), (95, 36, 105), alpha=34))
    elif mode == "snow":
        for _ in range(155):
            x = r.randint(0, SIZE[0])
            y = r.randint(0, SIZE[1])
            rad = r.choice([1, 2, 2, 3])
            draw.ellipse((x - rad, y - rad, x + rad, y + rad), fill=(255, 255, 255, r.randint(90, 195)))
        snow = gradient_overlay(SIZE, (255, 255, 255), (240, 250, 255), alpha=0)
        arr = np.asarray(snow).copy()
        h = SIZE[1]
        for y in range(h):
            t = max(0.0, (y - h * 0.68) / (h * 0.32))
            arr[y, :, 3] = int(78 * min(1.0, t))
        img = Image.alpha_composite(img, Image.fromarray(arr, "RGBA"))
    elif mode == "gold":
        light = Image.new("RGBA", SIZE, (0, 0, 0, 0))
        ld = ImageDraw.Draw(light, "RGBA")
        ld.polygon([(SIZE[0] // 2, -60), (330, SIZE[1]), (694, SIZE[1])], fill=(255, 238, 175, 70))
        img = Image.alpha_composite(img, light.filter(ImageFilter.GaussianBlur(58)))
        for _ in range(60):
            x = r.randint(100, SIZE[0] - 100)
            y = r.randint(90, 760)
            draw.ellipse((x - 3, y - 3, x + 3, y + 3), fill=(255, 222, 120, 95))
    elif mode == "sunset":
        sun = Image.new("RGBA", SIZE, (0, 0, 0, 0))
        sd = ImageDraw.Draw(sun, "RGBA")
        sd.ellipse((710, 120, 880, 290), fill=(255, 223, 135, 130))
        img = Image.alpha_composite(img, sun.filter(ImageFilter.GaussianBlur(7)))
        img = Image.alpha_composite(img, gradient_overlay(SIZE, (0, 0, 0), (35, 95, 72), alpha=35))

    img = add_soft_vignette(img, amount=0.18)
    save_png("arkaplanlar", asset_id, img.convert("RGB").convert("RGBA"))


def main():
    dresses = [
        ("elb_kirmizi_gece", "elb_lacivert_gece", (25, 48, 118), 0.55, True, True),
        ("elb_zumrut", "elb_mor_saten", (103, 54, 154), 0.50, True, True),
        ("elb_yazlik", "elb_gul_pembe", (238, 105, 151), 0.42, True, False),
        ("elb_kazak", "elb_kis_mavi", (77, 135, 190), 0.48, False, True),
        ("elb_esofman", "elb_spor_lila", (142, 110, 213), 0.50, False, False),
        ("elb_mayo", "elb_deniz_turkuaz", (22, 164, 174), 0.43, True, False),
        ("elb_tulum", "elb_gece_bordo_tulum", (122, 28, 62), 0.52, True, True),
        ("elb_balo_mavi", "elb_inci_balo", (205, 185, 232), 0.38, True, True),
    ]
    hats = [
        ("tac_klasik", "tac_gumus_klasik", (210, 220, 230), 0.58, True, False),
        ("tac_klasik", "tac_zumrut_kraliyet", (34, 145, 104), 0.46, True, False),
        ("tac_kelebek_toka", "tac_pembe_kelebek", (248, 102, 165), 0.42, True, False),
        ("tac_bere", "tac_lila_bere", (172, 135, 214), 0.48, False, False),
        ("tac_kovboy", "tac_siyah_kovboy", (34, 33, 43), 0.62, False, True),
    ]
    shoes = [
        ("ayk_topuk", "ayk_kirmizi_topuk", (178, 28, 54), 0.58, True, False),
        ("ayk_cam", "ayk_gumus_cam", (218, 230, 238), 0.46, True, False),
        ("ayk_spor", "ayk_pembe_spor", (242, 105, 160), 0.48, False, False),
        ("ayk_bot", "ayk_lila_bot", (120, 82, 172), 0.50, False, True),
        ("ayk_sandalet", "ayk_altin_sandalet", (213, 154, 56), 0.44, True, False),
    ]
    necklaces = [
        ("kly_kalp", "kly_gumus_kalp", (218, 225, 235), 0.55, True, False),
        ("kly_altin", "kly_zumrut_altin", (28, 154, 104), 0.42, True, False),
        ("kly_kalp", "kly_mavi_kristal", (74, 153, 216), 0.48, True, False),
        ("kly_altin", "kly_pembe_altin", (232, 104, 155), 0.38, True, False),
    ]

    for args in dresses:
        wardrobe_variant("elbiseler", *args)
    for args in hats:
        wardrobe_variant("taclar", *args)
    for args in shoes:
        wardrobe_variant("ayakkabilar", *args)
    for args in necklaces:
        wardrobe_variant("takilar", *args)

    scene_variant("ap_balo", "ap_gece_balo", (15, 23, 70), (65, 35, 105), "stars")
    scene_variant("ap_balo", "ap_pembe_podyum", (120, 37, 118), (245, 93, 154), "spot")
    scene_variant("ap_bahce", "ap_kis_bahce", (188, 226, 245), (235, 248, 255), "snow")
    scene_variant("ap_balo", "ap_altin_salon", (196, 128, 46), (255, 221, 138), "gold")
    scene_variant("ap_bahce", "ap_orman_aksam", (84, 56, 123), (243, 130, 86), "sunset")

    print("\nGenerated consistent wardrobe variants.")


if __name__ == "__main__":
    main()
