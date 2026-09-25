# Görseller

`public/art/` altındaki kil görseller 25 Eylül 2026’da Codex CLI’daki `imagegen` becerisiyle (yerleşik `image_gen` aracı, API anahtarı gerekmez) üretildi. Yeni bir ders adası, oyun veya rozet gerektiğinde aynı yönerge kullanılırsa yeni görsel setle uyumlu kalır.

## Stil yönergesi

Her isteğe aynen eklenen metin:

```text
Premium children's learning app art for "Lara'nın Dünyası" (8-year-old 2nd grader). High-end, warm, calm, cohesive.
- Medium: soft 3D clay / designer-vinyl-toy render. Matte, slightly velvety materials; rounded chunky forms; soft-box key light from the upper left; soft ambient occlusion; gentle rim light; no harsh specular highlights; no black outlines.
- Palette: warm cream #f8f3e6, greens #8ebd78 #7caa69 #44856a #2e7250, peach/coral #f4b6a6 #eab495, butter yellow #f3d375, powder blue #a9d3e8, lavender #c9bbe6, blush pink #f2c4cc, warm wood #c89f7a.
- Simple silhouettes that still read at 120 px. Few, well-chosen details.
- NEVER include people or children. NEVER include text, letters or numbers unless asked.
- Isolated assets: perfectly flat pure magenta #FF00FF background, no gradient, no floor, no cast shadow; keep magenta out of the subject; ~10% padding.
```

Piko için `components/Illustration.tsx` içindeki SVG, PNG’ye çevrilip karakter referansı olarak eklendi (`codex exec -i`). Diğer istekler, ilk Piko görselinin bulunduğu oturumdan `codex exec fork` ile çatallandı; böylece aynı ışık ve malzeme korunur. Tutarlı kalması gereken setler (yedi ada, yedi rozet) tek oturumda sırayla üretildi.

Ada tarifi: “3/4 elevated view (~30°), round grassy top plate with a chunky rounded warm-clay underside tapering to a soft point, props fill ~70% of the width”, ardından dersin öğeleri ve baskın rengi (ör. `island-math`: şeftali, halkalı gezegen, mavi onluk çubuğu #5896ae, sarı birlikler #e6b653, abaküs). Rozet tarifi: “thick round clay medallion, scalloped butter-cream rim with a gentle gold tone, recessed colored face, one raised 3D clay icon”.

## Dışa aktarma

1. Paralel Codex oturumları kullanılırsa her görseli oturumun kendi klasöründen (`~/.codex/generated_images/<oturum-id>/`) alın. “En yeni dosya” kısayolu başka oturumun görselini kopyalar.
2. Arka planı silin: `python3 ~/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py --input ham.png --out anahtarli.png --auto-key border --soft-matte --despill`
3. `python3 scripts/export-art.py anahtarli.png island-yeni 520 --sm` alfadaki başıboş pikselleri siler, gövdeye göre kırpar, kareye yerleştirir ve WebP yazar. `--sm`, yarım boyutlu `-sm` kopyasını da üretir.

Boyutlar gösterimin iki katını aşmaz: adalar 520 (+260), Piko pozları 400 (+200), `piko-head` 128, oyunlar 256, rozetler 240, çiçekler 192. Sahneler (`hero-world` 1536/960/768, `garden-bed` 1400×705) şeffaf değildir ve doğrudan WebP’ye çevrilir. `-sm` kopyası olan adların listesi `Art` bileşenindeki `fullWidth` ile aynı olmalıdır.
