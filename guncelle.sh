#!/usr/bin/env bash
# Görsel ekledikten/değiştirdikten sonra: kalite denetimi + thumbnail + manifest.
# Slider beden varyantlarını yeniden üretmek için:
#   /opt/lara/.venv/bin/python /opt/lara/beden_uret.py --clean
# Yeni PNG'lerin ad/emoji/etiket bilgisi için public/assets/metadata.json dosyasını güncelle.
set -euo pipefail

bash /opt/lara/thumbnails.sh
node /opt/lara/tara.js
/opt/lara/.venv/bin/python /opt/lara/quality_gate.py
echo "✅ Hazır — tarayıcıda Ctrl+Shift+R yap"
