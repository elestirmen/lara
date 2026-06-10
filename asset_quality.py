#!/usr/bin/env python3
"""Asset quality audit for Sihirli Stil Stüdyosu.

This is a deterministic local check for the PNG wardrobe contract. It does not
judge beauty; it catches measurable incompatibilities that break the paper-doll
pipeline: wrong canvas size, missing alpha, off-center layers, oversized models,
and missing metadata.
"""
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

from PIL import Image


ROOT = Path("/opt/lara")
ASSETS = ROOT / "public" / "assets"
CANVAS = (1024, 1365)
SLOTS = (
    "modeller",
    "arkaplanlar",
    "kanatlar",
    "elbiseler",
    "ayakkabilar",
    "takilar",
    "saclar",
    "taclar",
    "asalar",
    "ozel",
)

LANDMARKS = {
    "shoulder": 420,
    "bust": 512,
    "waist": 645,
    "hip": 708,
    "knee": 983,
    "ankle": 1215,
}

MODEL_LIMITS = {
    "bbox_width": (240, 325),
    "bbox_height": (1180, 1295),
    "center_x": (492, 532),
    "waist_width": (215, 290),
    "hip_width": (230, 325),
}


@dataclass
class Finding:
    severity: str
    path: str
    message: str


def load_metadata() -> dict:
    path = ASSETS / "metadata.json"
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def alpha_bbox(img: Image.Image):
    return img.convert("RGBA").getchannel("A").getbbox()


def row_width(alpha: Image.Image, y: int, threshold: int = 32) -> int:
    if y < 0 or y >= alpha.height:
        return 0
    pix = alpha.load()
    xs = [x for x in range(alpha.width) if pix[x, y] > threshold]
    return max(xs) - min(xs) + 1 if xs else 0


def visible_bbox(alpha: Image.Image, threshold: int = 32):
    pix = alpha.load()
    xs: list[int] = []
    ys: list[int] = []
    for y in range(alpha.height):
        for x in range(alpha.width):
            if pix[x, y] > threshold:
                xs.append(x)
                ys.append(y)
    if not xs:
        return None
    return (min(xs), min(ys), max(xs) + 1, max(ys) + 1)


def in_range(value: float, bounds: tuple[float, float]) -> bool:
    return bounds[0] <= value <= bounds[1]


def audit_png(path: Path, slot: str, metadata: dict, *, strict_shape: bool = False) -> list[Finding]:
    findings: list[Finding] = []
    rel = str(path.relative_to(ROOT))
    try:
        img = Image.open(path)
        img.load()
    except Exception as exc:
        return [Finding("error", rel, f"cannot read image: {exc}")]

    if img.size != CANVAS:
        findings.append(Finding("error", rel, f"canvas must be 1024x1365, got {img.size[0]}x{img.size[1]}"))

    rgba = img.convert("RGBA")
    alpha = rgba.getchannel("A")
    bbox = alpha.getbbox()
    vbbox = visible_bbox(alpha)
    if slot == "arkaplanlar":
        corners = [
            alpha.getpixel((0, 0)),
            alpha.getpixel((img.width - 1, 0)),
            alpha.getpixel((0, img.height - 1)),
            alpha.getpixel((img.width - 1, img.height - 1)),
        ]
        if min(corners) < 248:
            findings.append(Finding("error", rel, "background corners must be opaque"))
    else:
        if not bbox:
            findings.append(Finding("error", rel, "transparent/empty PNG"))
            return findings
        corners = [
            alpha.getpixel((0, 0)),
            alpha.getpixel((img.width - 1, 0)),
            alpha.getpixel((0, img.height - 1)),
            alpha.getpixel((img.width - 1, img.height - 1)),
        ]
        if max(corners) > 7:
            findings.append(Finding("error", rel, "non-background layer corners must be transparent"))

    item_id = path.stem
    if slot in {"modeller", "elbiseler", "ozel", "ayakkabilar", "takilar", "taclar"}:
        if item_id not in metadata.get(slot, {}):
            findings.append(Finding("warning", rel, "missing metadata entry"))

    if slot == "modeller" and bbox:
        mb = vbbox or bbox
        bbox_width = mb[2] - mb[0]
        bbox_height = mb[3] - mb[1]
        center_x = (mb[0] + mb[2]) / 2
        widths = {name: row_width(alpha, y) for name, y in LANDMARKS.items()}
        checks = {
            "bbox_width": bbox_width,
            "bbox_height": bbox_height,
            "center_x": center_x,
            "waist_width": widths["waist"],
            "hip_width": widths["hip"],
        }
        for key, value in checks.items():
            if not in_range(value, MODEL_LIMITS[key]):
                findings.append(Finding("error", rel, f"{key} out of range: {value} not in {MODEL_LIMITS[key]}"))
        if strict_shape and widths["hip"] and widths["waist"] / widths["hip"] > 0.92:
            findings.append(Finding("warning", rel, f"weak hourglass pixel ratio waist/hip={widths['waist'] / widths['hip']:.2f}"))

    if slot == "ayakkabilar" and vbbox:
        if vbbox[1] < 1050:
            findings.append(Finding("error", rel, f"shoe layer starts too high: y={vbbox[1]}"))
        if vbbox[3] < 1240:
            findings.append(Finding("error", rel, f"shoe layer ends too high: y={vbbox[3]}"))

    if slot == "taclar" and vbbox:
        if vbbox[3] > 330:
            findings.append(Finding("error", rel, f"headwear layer contains body/face ghost below y=330: y={vbbox[3]}"))

    if slot == "takilar" and vbbox:
        if vbbox[1] < 250 or vbbox[3] > 620:
            findings.append(Finding("error", rel, f"jewelry layer outside neck/chest band: {vbbox}"))

    if slot == "elbiseler" and vbbox:
        torso_rows = [row_width(alpha, y) for y in (420, 512, 645, 708)]
        if vbbox[3] > 900 and sum(1 for w in torso_rows if w > 40) < 2:
            findings.append(Finding("error", rel, "dress is long but missing torso alignment pixels"))

    return findings


def audit_assets(*, strict_shape: bool = False) -> list[Finding]:
    metadata = load_metadata()
    findings: list[Finding] = []
    for slot in SLOTS:
        root = ASSETS / slot
        if not root.is_dir():
            continue
        for path in sorted(root.glob("*.png")):
            findings.extend(audit_png(path, slot, metadata, strict_shape=strict_shape))
    return findings


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--strict", action="store_true", help="Exit nonzero on warnings as well as errors.")
    parser.add_argument("--strict-shape", action="store_true", help="Also report soft body-shape warnings.")
    parser.add_argument("--json", action="store_true", help="Print machine-readable findings.")
    args = parser.parse_args()

    findings = audit_assets(strict_shape=args.strict_shape)
    if args.json:
        print(json.dumps([f.__dict__ for f in findings], ensure_ascii=False, indent=2))
    else:
        if not findings:
            print("asset quality ok")
        for f in findings:
            print(f"{f.severity.upper():7} {f.path}: {f.message}")

    has_error = any(f.severity == "error" for f in findings)
    has_warning = any(f.severity == "warning" for f in findings)
    return 1 if has_error or (args.strict and has_warning) else 0


if __name__ == "__main__":
    raise SystemExit(main())
