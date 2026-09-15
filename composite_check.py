#!/usr/bin/env python3
"""Smoke-test wardrobe PNG composites.

This catches a different class of issue from asset_quality.py: individual files
can be valid PNG layers, but the combined model+dress+shoe result may still be
blank, oversized, off-center or missing expected layers.
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
LAYER_ORDER = {
    "arkaplanlar": 0,
    "kanatlar": 2,
    "modeller": 3,
    "ayakkabilar": 4,
    "elbiseler": 5,
    "ozel": 6,
    "takilar": 7,
    "saclar": 8,
    "taclar": 9,
    "asalar": 10,
}


@dataclass
class Finding:
    severity: str
    combo: str
    message: str


COMBOS = [
    {
        "name": "leyla_default_png",
        "layers": [
            ("modeller", "m_lara"),
            ("elbiseler", "elb_turuncu"),
            ("ayakkabilar", "ayk_cam"),
        ],
    },
    {
        "name": "yuna_latex_test",
        "layers": [
            ("modeller", "m_yuna"),
            ("elbiseler", "elb_yuna_latex"),
            ("ayakkabilar", "ayk_topuk"),
        ],
    },
    {
        "name": "leyla_evening_bodycon",
        "layers": [
            ("modeller", "m_lara"),
            ("elbiseler", "elb_mor_saten"),
            ("ayakkabilar", "ayk_gumus_cam"),
        ],
    },
]


def load_manifest() -> dict:
    return json.loads((ASSETS / "gorseller.json").read_text(encoding="utf-8"))


def alpha_bbox(img: Image.Image, threshold: int = 32):
    alpha = img.convert("RGBA").getchannel("A")
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


def layer_path(manifest: dict, slot: str, item_id: str) -> Path | None:
    url = manifest.get(slot, {}).get(item_id)
    if not url:
        return None
    return ASSETS / url.removeprefix("/assets/")


def compose(combo: dict, manifest: dict) -> tuple[Image.Image | None, list[Finding]]:
    findings: list[Finding] = []
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    # Preview exactly the same z-order as the browser runtime, regardless of
    # how a smoke-test combo happens to list its ingredients.
    for slot, item_id in sorted(combo["layers"], key=lambda layer: LAYER_ORDER.get(layer[0], 99)):
        path = layer_path(manifest, slot, item_id)
        if not path or not path.exists():
            findings.append(Finding("error", combo["name"], f"missing layer {slot}/{item_id}"))
            continue
        img = Image.open(path).convert("RGBA")
        if img.size != CANVAS:
            findings.append(Finding("error", combo["name"], f"bad layer size {slot}/{item_id}: {img.size}"))
            continue
        canvas = Image.alpha_composite(canvas, img)
    return canvas, findings


def audit_combo(combo: dict, manifest: dict, out_dir: Path | None = None) -> list[Finding]:
    img, findings = compose(combo, manifest)
    if img is None:
        return findings
    bbox = alpha_bbox(img)
    if not bbox:
        findings.append(Finding("error", combo["name"], "blank composite"))
        return findings
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    cx = (bbox[0] + bbox[2]) / 2
    if not 230 <= w <= 760:
        findings.append(Finding("error", combo["name"], f"composite width out of range: {w}"))
    if not 1000 <= h <= 1295:
        findings.append(Finding("error", combo["name"], f"composite height out of range: {h}"))
    if not 470 <= cx <= 550:
        findings.append(Finding("error", combo["name"], f"composite off center: x={cx:.1f}"))
    if out_dir:
        out_dir.mkdir(parents=True, exist_ok=True)
        img.save(out_dir / f"{combo['name']}.png")
    return findings


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true", help="Write composite PNG previews under /tmp/lara_composites.")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    manifest = load_manifest()
    out_dir = Path("/tmp/lara_composites") if args.write else None
    findings: list[Finding] = []
    for combo in COMBOS:
        findings.extend(audit_combo(combo, manifest, out_dir))

    if args.json:
        print(json.dumps([f.__dict__ for f in findings], ensure_ascii=False, indent=2))
    else:
        if not findings:
            print("composite check ok")
        for f in findings:
            print(f"{f.severity.upper():7} {f.combo}: {f.message}")
        if out_dir:
            print(f"wrote previews: {out_dir}")

    return 1 if any(f.severity == "error" for f in findings) else 0


if __name__ == "__main__":
    raise SystemExit(main())
