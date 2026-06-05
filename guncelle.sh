#!/usr/bin/env bash
# Görsel ekledikten/değiştirdikten sonra: thumbnail + manifest (güvenli, idempotent).
# Slider beden varyantlarını yeniden üretmek için:
#   python3 /opt/lara/beden_uret.py --clean
bash /opt/lara/thumbnails.sh
node /opt/lara/tara.js
echo "✅ Hazır — tarayıcıda Ctrl+Shift+R yap"
