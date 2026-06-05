#!/usr/bin/env bash
# Kenar hâlesini NAZİKÇE temizler: alfayı 1px aşındırır (dış kenardaki ince halkayı keser),
# iç yarı-saydamlığı (tül/cam/dantel) KORUR. Eşikleme (-level) YOK → "bazı bölümler full transparan
# oldu" hatası olmaz. Arka planlara dokunmaz. IDEMPOTENT (.kenar_temizlendi mtime takibi). Yedek: _yedek_assets/
# Not: temiz kaynaklarla (BiRefNet/orijinal) genelde GEREKMEZ; sadece elle, gerekirse çalıştır.
set -e
A="/opt/lara/public/assets"; STATE="/opt/lara/.kenar_temizlendi"; YEDEK="/opt/lara/_yedek_assets"
touch "$STATE"; mkdir -p "$YEDEK"; islendi=0
temizle() {
  local f="$1" mt; mt=$(stat -c %Y "$f")
  grep -qxF "$f|$mt" "$STATE" && return 0
  cp "$f" "$YEDEK/$(echo "${f#$A/}" | sed 's#/#__#g')"
  # SADECE alfayı 1px aşındır — renk/iç saydamlık korunur (eşikleme yok)
  magick "$f" -channel A -morphology Erode Disk:1 +channel "$f.t.png" && mv "$f.t.png" "$f"
  echo "$f|$(stat -c %Y "$f")" >> "$STATE"; echo "  ✓ ${f#$A/}"; islendi=$((islendi + 1))
}
# Yalnız büyük dolu şekiller (model/elbise/ayakkabı/kanat). İnce parçalara (taç/kolye/asa) DOKUNMA.
for s in modeller elbiseler ayakkabilar kanatlar; do
  for f in "$A/$s"/*.png; do [ -e "$f" ] || continue; temizle "$f"; done
done
echo "Bitti ($islendi dosya). Yedek: $YEDEK"
