#!/usr/bin/env python3
"""Anahtar rengi silinmiş bir PNG'yi public/art/<ad>.webp olarak dışa aktarır (bkz. docs/ART.md).

Kullanım: python3 scripts/export-art.py anahtarli.png island-yeni 520 [--sm]
"""
import sys
from PIL import Image

src, name, size = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src).convert('RGBA')
r, g, b, a = im.split()
# Anahtar renkten kalan başıboş yarı saydam pikselleri sil; kırpmayı yalnız dolu gövdeye göre yap.
a = a.point(lambda v: 0 if v < 40 else v)
im = Image.merge('RGBA', (r, g, b, a))
x0, y0, x1, y1 = a.point(lambda v: 255 if v > 128 else 0).getbbox()
m = 6
im = im.crop((max(0, x0 - m), max(0, y0 - m), min(im.width, x1 + m), min(im.height, y1 + m)))
side = int(max(im.size) * 1.04)
square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
square.alpha_composite(im, ((side - im.width) // 2, (side - im.height) // 2))
for suffix, px in [('', size)] + ([('-sm', size // 2)] if '--sm' in sys.argv else []):
    out = f'public/art/{name}{suffix}.webp'
    square.resize((px, px), Image.LANCZOS).save(out, 'WEBP', quality=84, method=6, alpha_quality=92)
    print(out, px)
