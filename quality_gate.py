#!/usr/bin/env python3
"""Run the local release-quality checks for Sihirli Stil Stüdyosu.

This is the one command to run after changing code, prompts or assets. It covers
syntax, PNG contracts, composite smoke tests, visual contact sheet generation,
manifest invariants and prompt parity between the CLI and the admin endpoint.
"""
from __future__ import annotations

import json
import os
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path("/opt/lara")
ASSETS = ROOT / "public" / "assets"
PYTHON = ROOT / ".venv" / "bin" / "python"
EXPECTED_SLOTS = [
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
    "beden",
]
EXPECTED_LEVELS = ["b20", "b40", "b60", "b80", "b100"]
BODY_VARIANT_SLOTS = ["modeller", "elbiseler", "takilar", "ozel"]
QUARANTINED_DRESS_IDS = {
    "elb_esofman",
    "elb_kazak",
    "elb_kot_ceket",
    "elb_okul",
    "elb_spor_lila",
    "elb_kis_mavi",
    "elb_deniz_turkuaz",
}
QUARANTINED_OZEL_IDS = {
    "oz_bodysuit",
    "oz_catears",
    "oz_harness",
    "oz_latex",
}
FORBIDDEN_VECTOR_DRESS_IDS = {
    "elb_tisort_jean",
    "elb_cizgili_tisort",
}
FORBIDDEN_ACTIVE_HEADWEAR_IDS = {
    "tac_cicek",
}


def run(cmd: list[str], *, env: dict[str, str] | None = None) -> None:
    printable = " ".join(cmd)
    print(f"$ {printable}")
    subprocess.run(cmd, cwd=ROOT, env=env, check=True)


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def manifest_checks() -> None:
    manifest = load_json(ASSETS / "gorseller.json")
    keys = list(manifest)
    if keys != EXPECTED_SLOTS:
        raise SystemExit(f"manifest slot order mismatch: {keys}")

    metadata = load_json(ASSETS / "metadata.json")
    for slot in EXPECTED_SLOTS:
        if slot == "beden":
            continue
        for item_id in manifest.get(slot, {}):
            if item_id not in metadata.get(slot, {}):
                raise SystemExit(f"missing metadata for active asset: {slot}/{item_id}")

    active_bad = sorted(QUARANTINED_DRESS_IDS & set(manifest.get("elbiseler", {})))
    if active_bad:
        raise SystemExit(f"quarantined dress PNGs are still active: {active_bad}")
    active_bad_ozel = sorted(QUARANTINED_OZEL_IDS & set(manifest.get("ozel", {})))
    if active_bad_ozel:
        raise SystemExit(f"quarantined ozel PNGs are still active: {active_bad_ozel}")
    active_bad_headwear = sorted(FORBIDDEN_ACTIVE_HEADWEAR_IDS & set(manifest.get("taclar", {})))
    if active_bad_headwear:
        raise SystemExit(f"forbidden headwear PNGs are still active: {active_bad_headwear}")
    dolap = (ROOT / "public" / "dolap.js").read_text(encoding="utf-8")
    app_js = (ROOT / "public" / "app.js").read_text(encoding="utf-8")
    if '"ozel"' not in app_js.partition("const SEKME_SIRASI = [")[2].partition("];")[0]:
        raise SystemExit("ozel tab is missing from SEKME_SIRASI")
    if "Özel deaktif" in app_js:
        raise SystemExit("ozel slot is still explicitly disabled in app.js")
    forbidden_vectors = sorted(item_id for item_id in FORBIDDEN_VECTOR_DRESS_IDS if item_id in dolap)
    if forbidden_vectors:
        raise SystemExit(f"forbidden vector dress drawings are present: {forbidden_vectors}")
    if "function ogeKullanilabilir" not in app_js:
        raise SystemExit("realistic-mode availability filter is missing")
    missing_vectors = [
        item_id for item_id in manifest.get("elbiseler", {})
        if f'id: "{item_id}"' not in dolap and f"id: '{item_id}'" not in dolap
    ]
    if missing_vectors:
        raise SystemExit(f"active dress PNGs without vector fallback: {missing_vectors}")

    manifest_beden = manifest.get("beden", {})
    static_beden = load_json(ASSETS / "beden.json")
    if static_beden != manifest_beden:
        raise SystemExit("beden.json does not exactly match gorseller.json.beden")

    levels = list(manifest_beden)
    if levels != EXPECTED_LEVELS:
        raise SystemExit(f"beden levels mismatch: {levels}")

    active_by_slot = {slot: set(manifest.get(slot, {})) for slot in BODY_VARIANT_SLOTS}
    for level in EXPECTED_LEVELS:
        level_data = manifest_beden.get(level, {})
        unexpected_slots = sorted(set(level_data) - set(BODY_VARIANT_SLOTS))
        if unexpected_slots:
            raise SystemExit(f"{level} contains non-body variant slots: {unexpected_slots}")
        for slot, active_ids in active_by_slot.items():
            level_ids = set(level_data.get(slot, {}))
            if level_ids != active_ids:
                missing = sorted(active_ids - level_ids)
                extra = sorted(level_ids - active_ids)
                raise SystemExit(f"{level}/{slot} mismatch: missing={missing} extra={extra}")

    print("manifest checks ok")


def wait_for_port(port: int, proc: subprocess.Popen, timeout: float = 6.0) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        if proc.poll() is not None:
            raise SystemExit(f"server exited early with code {proc.returncode}")
        with socket.socket() as sock:
            sock.settimeout(0.25)
            try:
                sock.connect(("127.0.0.1", port))
                return
            except OSError:
                time.sleep(0.1)
    raise SystemExit(f"server did not listen on port {port}")


def prompt_parity_check() -> None:
    port = 3091
    admin = "qualitygate"
    description = "glossy black sleeveless latex bodycon mini dress layer"
    with tempfile.NamedTemporaryFile("w+b") as cli_out:
        subprocess.run(
            [
                str(PYTHON),
                "prompt_build.py",
                "--slot",
                "elbiseler",
                "--description",
                description,
                "elb_yuna_latex",
            ],
            cwd=ROOT,
            stdout=cli_out,
            check=True,
        )
        cli_out.flush()
        cli_text = Path(cli_out.name).read_text(encoding="utf-8")

    env = os.environ.copy()
    env.update({"PORT": str(port), "LARA_HOST": "127.0.0.1", "LARA_ADMIN": admin})
    proc = subprocess.Popen(
        ["node", "server.js"],
        cwd=ROOT,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
    )
    try:
        wait_for_port(port, proc)
        payload = json.dumps(
            {
                "parola": admin,
                "slot": "elbiseler",
                "id": "elb_yuna_latex",
                "description": description,
            }
        ).encode("utf-8")
        req = Request(
            f"http://127.0.0.1:{port}/api/admin/prompt",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
        if not data.get("ok"):
            raise SystemExit(f"prompt endpoint failed: {data}")
        if cli_text != data.get("prompt"):
            raise SystemExit("prompt parity mismatch between CLI and admin endpoint")
        with urlopen(f"http://127.0.0.1:{port}/api/gorseller", timeout=5) as response:
            manifest = json.loads(response.read().decode("utf-8"))
        api_levels = list(manifest.get("beden", {}))
        if api_levels != EXPECTED_LEVELS:
            raise SystemExit(f"api beden levels mismatch: {api_levels}")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait(timeout=3)

    print("prompt parity ok")


def main() -> int:
    run(["node", "--check", "server.js"])
    run(["node", "--check", "tara.js"])
    run(["node", "--check", "public/app.js"])
    run(["node", "--check", "public/admin.js"])
    run(["node", "--check", "public/dolap.js"])
    run(["node", "--check", "public/ses.js"])
    run(["node", "frontend_contract_test.js"])
    run([
        str(PYTHON),
        "-m",
        "py_compile",
        "asset_quality.py",
        "asset_contact.py",
        "body_profile_check.py",
        "composite_check.py",
        "prompt_build.py",
        "beden_uret.py",
        "quality_gate.py",
    ])
    run([str(PYTHON), "asset_quality.py"])
    run([str(PYTHON), "body_profile_check.py"])
    run([str(PYTHON), "composite_check.py", "--write"])
    run([str(PYTHON), "asset_contact.py", "--slot", "elbiseler", "--out", "/tmp/lara_contact_check.png"])
    run([str(PYTHON), "asset_contact.py", "--slot", "ayakkabilar", "--out", "/tmp/lara_contact_ayakkabilar.png"])
    run([str(PYTHON), "asset_contact.py", "--slot", "ozel", "--out", "/tmp/lara_contact_ozel.png"])
    manifest_checks()
    prompt_parity_check()
    run(["git", "diff", "--check"])
    print("quality gate ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
