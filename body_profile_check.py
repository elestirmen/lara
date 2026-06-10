#!/usr/bin/env python3
"""Audit body-slider proportions for pre-rendered model variants.

The slider should not inflate the whole body uniformly. For this project the
intended direction is a healthier hourglass progression: hip/bust volume grows,
the waist stays comparatively stable, and waist-to-hip ratio improves as the
level increases.
"""
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path("/opt/lara")
ASSETS = ROOT / "public" / "assets"
LEVELS = ["base", "b20", "b40", "b60", "b80", "b100"]
Y_ROWS = {
    "bust": 512,
    "waist": 645,
    "hip": 708,
    "knee": 983,
}


@dataclass
class Finding:
    severity: str
    model: str
    message: str


def load_manifest() -> dict:
    return json.loads((ASSETS / "gorseller.json").read_text(encoding="utf-8"))


def layer_path(model_id: str, level: str) -> Path:
    if level == "base":
        return ASSETS / "modeller" / f"{model_id}.png"
    return ASSETS / "_beden" / level / "modeller" / f"{model_id}.png"


def row_width(alpha: np.ndarray, y: int) -> int:
    xs = np.where(alpha[y] > 32)[0]
    return int(xs.max() - xs.min() + 1) if len(xs) else 0


def metrics(model_id: str, level: str) -> dict[str, float]:
    path = layer_path(model_id, level)
    image = Image.open(path).convert("RGBA")
    alpha = np.array(image)[:, :, 3]
    widths = {name: row_width(alpha, y) for name, y in Y_ROWS.items()}
    widths["waist_hip"] = widths["waist"] / widths["hip"] if widths["hip"] else 0
    return widths


def audit_model(model_id: str) -> tuple[list[Finding], list[dict[str, float]]]:
    findings: list[Finding] = []
    rows: list[dict[str, float]] = []
    for level in LEVELS:
        path = layer_path(model_id, level)
        if not path.exists():
            findings.append(Finding("error", model_id, f"missing body level {level}: {path}"))
            continue
        row = {"level": level, **metrics(model_id, level)}
        rows.append(row)

    if len(rows) != len(LEVELS):
        return findings, rows

    base = rows[0]
    previous = base
    for row in rows[1:]:
        if row["waist_hip"] > previous["waist_hip"] + 0.020:
            findings.append(
                Finding(
                    "error",
                    model_id,
                    f"waist/hip ratio regresses at {row['level']}: {row['waist_hip']:.3f} after {previous['waist_hip']:.3f}",
                )
            )
        if row["hip"] < previous["hip"]:
            findings.append(Finding("error", model_id, f"hip width shrinks at {row['level']}"))
        previous = row

    b100 = rows[-1]
    if b100["waist_hip"] > 0.900:
        findings.append(Finding("error", model_id, f"b100 waist/hip too cylindrical: {b100['waist_hip']:.3f}"))
    if b100["waist_hip"] < 0.70:
        findings.append(Finding("error", model_id, f"b100 waist/hip too extreme: {b100['waist_hip']:.3f}"))
    if b100["waist"] > base["waist"] * 1.10:
        findings.append(Finding("error", model_id, f"waist grew too much: base={base['waist']} b100={b100['waist']}"))
    if b100["hip"] < base["hip"] * 1.14:
        findings.append(Finding("error", model_id, f"hip gain too weak: base={base['hip']} b100={b100['hip']}"))
    if b100["knee"] > b100["hip"] * 0.72:
        findings.append(Finding("error", model_id, f"knee/leg inflation too high: knee={b100['knee']} hip={b100['hip']}"))

    return findings, rows


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--report", action="store_true", help="Print per-level measurements.")
    args = parser.parse_args()

    manifest = load_manifest()
    all_findings: list[Finding] = []
    report: dict[str, list[dict[str, float]]] = {}
    for model_id in sorted(manifest.get("modeller", {})):
        findings, rows = audit_model(model_id)
        all_findings.extend(findings)
        report[model_id] = rows

    if args.json:
        print(json.dumps({"findings": [f.__dict__ for f in all_findings], "report": report}, ensure_ascii=False, indent=2))
    else:
        if args.report:
            for model_id, rows in report.items():
                print(model_id)
                for row in rows:
                    print(
                        f"  {row['level']:5} bust={row['bust']:3.0f} waist={row['waist']:3.0f} "
                        f"hip={row['hip']:3.0f} knee={row['knee']:3.0f} whr={row['waist_hip']:.3f}"
                    )
        if not all_findings:
            print("body profile ok")
        for finding in all_findings:
            print(f"{finding.severity.upper():7} {finding.model}: {finding.message}")

    return 1 if any(f.severity == "error" for f in all_findings) else 0


if __name__ == "__main__":
    raise SystemExit(main())
