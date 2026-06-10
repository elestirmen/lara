#!/usr/bin/env python3
"""Create visual contact sheets for active PNG wardrobe overrides.

The normal JSON/syntax checks prove that files load. They do not show whether a
layer actually looks coherent on the paper-doll body. This script renders active
PNG overrides from gorseller.json on top of a model and writes a compact sheet
that can be inspected before shipping new assets.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path("/opt/lara")
ASSETS = ROOT / "public" / "assets"
CANVAS = (1024, 1365)


def load_manifest() -> dict:
    return json.loads((ASSETS / "gorseller.json").read_text(encoding="utf-8"))


def asset_path(url: str) -> Path:
    return ASSETS / url.removeprefix("/assets/")


def load_layer(slot: str, item_id: str, manifest: dict) -> Image.Image | None:
    url = manifest.get(slot, {}).get(item_id)
    if not url:
        return None
    path = asset_path(url)
    if not path.exists() or path.suffix.lower() != ".png":
        return None
    img = Image.open(path).convert("RGBA")
    return img if img.size == CANVAS else None


def composite(slot: str, item_id: str, manifest: dict, model_id: str, shoe_id: str | None) -> Image.Image | None:
    model = load_layer("modeller", model_id, manifest)
    item = load_layer(slot, item_id, manifest)
    if not model or not item:
        return None
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    canvas = Image.alpha_composite(canvas, model)
    canvas = Image.alpha_composite(canvas, item)
    if shoe_id and slot != "ayakkabilar":
        shoe = load_layer("ayakkabilar", shoe_id, manifest)
        if shoe:
            canvas = Image.alpha_composite(canvas, shoe)
    return canvas


def make_tile(img: Image.Image, label: str, tile_size: tuple[int, int]) -> Image.Image:
    tw, th = tile_size
    label_h = 30
    bbox = img.getchannel("A").getbbox() or (0, 0, img.width, img.height)
    crop = img.crop(
        (
            max(0, bbox[0] - 40),
            max(0, bbox[1] - 40),
            min(img.width, bbox[2] + 40),
            min(img.height, bbox[3] + 40),
        )
    )
    crop.thumbnail((tw - 20, th - label_h - 12), Image.Resampling.LANCZOS)
    tile = Image.new("RGBA", tile_size, (245, 245, 245, 255))
    tile.alpha_composite(crop, ((tw - crop.width) // 2, 8))
    ImageDraw.Draw(tile).text((8, th - label_h + 6), label, fill=(20, 20, 20, 255))
    return tile


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--slot", default="elbiseler", help="Wardrobe slot to render.")
    parser.add_argument("--model", default="m_lara", help="Model ID to composite against.")
    parser.add_argument("--shoe", default="ayk_topuk", help="Optional shoe ID; use empty string to disable.")
    parser.add_argument("--out", default="/tmp/lara_contact.png", help="Output PNG path.")
    parser.add_argument("--cols", type=int, default=5)
    args = parser.parse_args()

    manifest = load_manifest()
    ids = sorted(manifest.get(args.slot, {}))
    tiles: list[Image.Image] = []
    for item_id in ids:
        img = composite(args.slot, item_id, manifest, args.model, args.shoe or None)
        if img:
            tiles.append(make_tile(img, item_id, (240, 340)))

    rows = max(1, math.ceil(len(tiles) / max(1, args.cols)))
    sheet = Image.new("RGBA", (args.cols * 240, rows * 340), (230, 230, 230, 255))
    for index, tile in enumerate(tiles):
        sheet.alpha_composite(tile, ((index % args.cols) * 240, (index // args.cols) * 340))

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print(f"{out} {len(tiles)} items {sheet.size[0]}x{sheet.size[1]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
