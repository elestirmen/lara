#!/usr/bin/env python3
"""Build production image prompts from repo metadata.

The goal is to keep AI generation requests tied to the same canvas, landmark,
alpha and slot contract used by the game. Use this instead of hand-written ad
hoc prompts when creating or replacing assets.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


ROOT = Path("/opt/lara")
ASSETS = ROOT / "public" / "assets"
PROMPT_CONTRACT = ASSETS / "_referans" / "prompt_contract.json"

SLOT_PREFIX = {
    "modeller": "m_",
    "arkaplanlar": "ap_",
    "kanatlar": "kanat_",
    "elbiseler": "elb_",
    "ayakkabilar": "ayk_",
    "takilar": "kly_",
    "saclar": "sac_",
    "taclar": "tac_",
    "asalar": "asa_",
    "ozel": "oz_",
}

FALLBACK_CONTRACT = {
    "master": "Photorealistic full-body fashion paper-doll layer for a local dress-up studio.\nExact canvas: 1024x1365 px, 3:4 portrait. Front view, centered on x512,\ncamera at chest height, no perspective tilt, no crop, head and both feet fully visible.\nSame adult female figure proportions and pose across every layer: standing straight,\nsymmetrical neutral A-pose, arms slightly away from torso, hands relaxed beside hips,\nlegs together, even weight, calm neutral expression.\n\nLock landmarks on the 1024x1365 canvas:\ntop of head y~130, eyes y~266, chin y~372, shoulders y~420, bust y~512,\nnarrow waist y~645, hips y~708, knees y~983, ankles y~1215, soles y~1269.\nVisible model alpha bbox target: x~378..647, y~100..1335, center x~512,\noverall visible width MUST BE exactly around 270 px. CRITICAL: Do NOT generate a larger, \ncloser, wider, zoomed-in, thicker, or different-scale body. Any deviation breaks the game. \nKeep arms near the existing A-pose reference.\nSoft even studio lighting, realistic fabric/material detail, no floor shadow unless\nthe slot is arkaplanlar.",
    "model": "Render one adult female model only. Transparent background.\nSimple matte black bra and brief set. Hair is baked into the model image.\nVisible alpha bbox target: x~378..647, y~100..1335, center x~512, visible width about 270 px.\nDo not make the body larger, closer to camera, wider, cropped, or different scale.",
    "layer": "Render ONLY the requested wardrobe item pixels. Transparent background.\nNo body, no skin, no mannequin, no face, no hair unless the slot is saclar,\nno background, no text. Align to Leyla/Yuna canonical 1024x1365 A-pose.\nFor fitted dresses and torso garments target: shoulder width ~200 px,\nbust ~205 px, waist ~245 px, hip ~255 px.",
    "background": "Render an opaque full-screen background, exact 1024x1365 px.\nNo person, no text, no watermark. Keep the center readable for the model layer.",
    "negative": "text, watermark, logo, extra people, cropped body, cropped head, cropped feet,\nside view, turned body, mismatched pose, extra limbs, bad hands, deformed fingers,\nbusy background, hard cast shadow, wrong canvas ratio, low quality, oversized body,\nzoomed body, thick proportions, giant model, wider pose, arms too far from torso, baked shoes in clothing layer,\nbaked skin/body in wardrobe layer, mismatched scale",
}


def load_metadata() -> dict:
    path = ASSETS / "metadata.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {}


def load_prompt_contract() -> dict:
    if PROMPT_CONTRACT.exists():
        data = json.loads(PROMPT_CONTRACT.read_text(encoding="utf-8"))
        return {**FALLBACK_CONTRACT, **data}
    return FALLBACK_CONTRACT


def infer_slot(asset_id: str, explicit: str | None) -> str:
    if explicit:
        if explicit not in SLOT_PREFIX:
            raise SystemExit(f"unknown slot: {explicit}")
        return explicit
    for slot, prefix in SLOT_PREFIX.items():
        if asset_id.startswith(prefix):
            return slot
    raise SystemExit("slot is required when id prefix is unknown")


def metadata_line(metadata: dict, slot: str, asset_id: str) -> dict:
    item = dict(metadata.get(slot, {}).get(asset_id, {}))
    item.setdefault("ad", asset_id)
    item.setdefault("emoji", "✨")
    item.setdefault("etiketler", [])
    return item


def prompt_for(slot: str, asset_id: str, description: str, meta: dict, prompts: dict) -> str:
    tags = json.dumps(meta["etiketler"], ensure_ascii=False, separators=(",", ":"))
    header = f"id={asset_id} | slot={slot} | ad={meta['ad']} | emoji={meta['emoji']} | etiketler={tags}"
    if slot == "arkaplanlar":
        contract = prompts["background"]
    elif slot == "modeller":
        contract = prompts["model"]
    else:
        contract = prompts["layer"]
    return f"""{header}

PROMPT:
{prompts["master"]}
{contract}
Requested item/model/background: {description}.

NEGATIVE PROMPT:
{prompts["negative"]}

OUTPUT CONTRACT:
PNG, exact 1024x1365 px. {'Opaque image.' if slot == 'arkaplanlar' else 'Transparent alpha outside the item; all four corners alpha=0.'}
Run after generation:
/opt/lara/.venv/bin/python /opt/lara/asset_quality.py
"""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("id", help="Asset id, e.g. m_lara or elb_siyah")
    parser.add_argument("--slot", choices=sorted(SLOT_PREFIX), help="Override inferred slot.")
    parser.add_argument("--description", "-d", help="Plain English item description. Defaults to metadata name.")
    args = parser.parse_args()

    slot = infer_slot(args.id, args.slot)
    metadata = load_metadata()
    meta = metadata_line(metadata, slot, args.id)
    description = args.description or meta["ad"]
    sys.stdout.write(prompt_for(slot, args.id, description, meta, load_prompt_contract()).rstrip())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
