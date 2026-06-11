#!/usr/bin/env python3
"""Generate body-size variants for the realistic PNG wardrobe.

The old slider warped images live in the browser. This creates stable PNG
variants instead, so the game can switch between pre-rendered body levels:

  public/assets/_beden/b20/<slot>/<id>.png
  public/assets/_beden/b40/<slot>/<id>.png
  ...

Only model bodies, dresses, necklaces and special body-following pieces are
morphed. Shoes, hats, hair and backgrounds stay unchanged.
"""
import argparse
import shutil
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path("/opt/lara")
ASSETS = ROOT / "public" / "assets"
OUT = ASSETS / "_beden"
SLOTS = ("modeller", "elbiseler", "takilar", "ozel")
LEVELS = (20, 40, 60, 80, 100)

# (canvas y ratio, max horizontal scale at level b100)
# Head, hands and feet stay close to original. The gain is concentrated around
# bust and hips while the waist stays close to the base image, so the slider
# reads as a curvier hourglass instead of a uniform horizontal stretch.
PROFILE = np.array(
    [
        (0.00, 1.00),
        (0.20, 1.00),
        (0.28, 1.030),
        (0.35, 1.120),
        (0.42, 1.080),
        (0.48, 1.060),
        (0.52, 1.180),
        (0.58, 1.280),
        (0.64, 1.240),
        (0.72, 1.150),
        (0.80, 1.080),
        (0.88, 1.040),
        (0.95, 1.010),
        (1.00, 1.00),
    ],
    dtype=np.float32,
)

LEVEL_STRENGTH = {
    20: 0.20,
    40: 0.40,
    60: 0.62,
    80: 0.82,
    100: 1.00,
}


def row_scales(height, strength):
    y = np.arange(height, dtype=np.float32) / max(1, height - 1)
    max_scale = np.interp(y, PROFILE[:, 0], PROFILE[:, 1])
    return 1.0 + (max_scale - 1.0) * strength


def body_morph(img, strength):
    src = np.asarray(img.convert("RGBA")).astype(np.float32)
    height, width, _ = src.shape
    center_x = (width - 1) / 2.0
    xs = np.arange(width, dtype=np.float32)

    # The middle of the body receives the strongest change. Outer pixels still
    # move a little, but arms/edge details are not stretched as aggressively as
    # a full-row scale would do.
    dist = np.abs((xs - center_x) / (width / 2.0))
    core_weight = 0.28 + 0.72 * np.exp(-((dist / 0.40) ** 4))

    scales = row_scales(height, strength)
    out = np.zeros_like(src)

    for y in range(height):
        eff = 1.0 + (scales[y] - 1.0) * core_weight
        src_x = center_x + (xs - center_x) / eff
        valid = (src_x >= 0) & (src_x <= width - 1)
        x0 = np.clip(np.floor(src_x).astype(np.int32), 0, width - 1)
        x1 = np.clip(x0 + 1, 0, width - 1)
        t = (src_x - x0)[:, None]
        row = src[y]
        out[y] = row[x0] * (1.0 - t) + row[x1] * t
        out[y, ~valid] = 0

    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")


def pngs(slot):
    source = ASSETS / slot
    if not source.is_dir():
        return []
    return sorted(list(source.glob("*.png")) + list(source.glob("*.webp")))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--clean", action="store_true", help="Remove old generated _beden variants first.")
    args = parser.parse_args()

    if args.clean and OUT.exists():
        shutil.rmtree(OUT)

    total = 0
    for level in LEVELS:
        strength = LEVEL_STRENGTH[level]
        level_name = f"b{level:02d}"
        for slot in SLOTS:
            dest_dir = OUT / level_name / slot
            dest_dir.mkdir(parents=True, exist_ok=True)
            for src_path in pngs(slot):
                dest = dest_dir / src_path.name
                img = body_morph(Image.open(src_path), strength)
                if dest.suffix.lower() == ".webp":
                    img.save(dest, quality=90, method=6)
                else:
                    img.save(dest, optimize=True)
                total += 1
                print(f"  {level_name}/{slot}/{src_path.name}")

    print(f"\nGenerated {total} body variants in {OUT}")
    print("Next: node /opt/lara/tara.js")


if __name__ == "__main__":
    main()
