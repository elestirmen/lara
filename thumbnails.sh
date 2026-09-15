#!/usr/bin/env bash
# Panel için küçük önizleme (thumbnail) üretir → tablette hızlı yüklenir.
# Yeni görsel ekleyince tekrar çalıştır: bash /opt/lara/thumbnails.sh
#
# Parça slotlarında görsel, 1024x1365 tuvalin yalnız küçük bir bölümünü kaplar
# (şapka ~225x164, kolye ~148x50). Tuvali olduğu gibi küçültmek kartta görünmez
# bir leke bırakır; bu yüzden parça thumbnail'leri saydam kenarlarından kırpılıp
# karta oturtulur. Model ve sahne kartları ölçek tutarlılığı için kırpılmaz.
set -euo pipefail
shopt -s nullglob nocaseglob
A="/opt/lara/public/assets"

# Kırpılmayanlar: modeller (kartlar arası boy oranı korunmalı), arkaplanlar (opak sahne).
KIRPMA_YOK=" modeller arkaplanlar "

for slot in modeller arkaplanlar kanatlar elbiseler ayakkabilar takilar saclar taclar asalar ozel; do
  mkdir -p "$A/_thumb/$slot"
  declare -A goruldu=()
  for f in "$A/$slot"/*.png "$A/$slot"/*.webp "$A/$slot"/*.jpg "$A/$slot"/*.jpeg; do
    id=$(basename "$f"); id="${id%.*}"
    # Runtime ile aynı deterministik öncelik: PNG > WebP > JPG > JPEG.
    [[ ${goruldu["$id"]+var} ]] && continue
    goruldu["$id"]=1
    hedef="$A/_thumb/$slot/$id.webp"

    if [[ "$KIRPMA_YOK" == *" $slot "* ]]; then
      magick "$f" -resize 300x400 -strip -quality 82 "$hedef"
      continue
    fi

    # Saydam kenarları at, parçayı karta ortala. Tamamen saydam/kırpılamayan
    # dosyalarda eski davranışa düş.
    if ! magick "$f" -background none -alpha set -fuzz 1% -trim +repage \
        -resize 276x376 -gravity center -extent 300x400 \
        -strip -quality 82 "$hedef" 2>/dev/null; then
      magick "$f" -resize 300x400 -strip -quality 82 "$hedef"
    fi
  done
  # Kaynağı artık bulunmayan kart görsellerini güvenle temizle.
  for f in "$A/_thumb/$slot"/*.webp; do
    id=$(basename "$f"); id="${id%.*}"
    if [[ ! ${goruldu["$id"]+var} ]]; then
      rm -- "$f"
    fi
  done
  unset goruldu
done
echo "Thumbnail'ler güncellendi."
