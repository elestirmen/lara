#!/usr/bin/env bash
# Panel için küçük önizleme (thumbnail) üretir → tablette hızlı yüklenir.
# Yeni görsel ekleyince tekrar çalıştır: bash /opt/lara/thumbnails.sh
set -e
A="/opt/lara/public/assets"
for slot in modeller elbiseler ayakkabilar taclar takilar kanatlar asalar arkaplanlar; do
  mkdir -p "$A/_thumb/$slot"
  for f in "$A/$slot"/*.png "$A/$slot"/*.webp; do
    [ -e "$f" ] || continue
    id=$(basename "$f"); id="${id%.*}"
    magick "$f" -resize 300x400 -strip -quality 82 "$A/_thumb/$slot/$id.webp"
  done
done
echo "Thumbnail'ler güncellendi."
