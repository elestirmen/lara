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

## Soru görselleri

26 Eylül 2026’da soru kutularındaki emojiler de aynı stille üretilmiş kil görsellere çevrildi. İstekler `scripts/question-art.json` dosyasındadır; stil metni her isteğe eklenir ve referans olarak mevcut görsellerden bir şerit (`flower-tulip`, `game-memory`, `badge-books`) `codex exec -i` ile verilir. Görsel durumu anlatır, cevabı göstermez: “Bisiklete bineceksin” sorusunda kask değil yalnız bisiklet, “Evdeki çiçeklerin toprağı kurumuş” sorusunda sulama kabı yoktur.

- `hb/<ders>-<ad>`: Hayat Bilgisi durumları, 256 px (en çok 144 px gösterilir). İçerikte senaryonun üçüncü alanı bu addır; trafik sahnesiyle sorulan iki durumda boştur.
- `q/<ad>`: matematikte tek nesne veya durum gösteren sorular (cisimler, kütle, ölçme, kesir, sıvı, kelebek), 256 px. Soruda `art:q/<ad>` biçiminde yazılır.
- `i/<ad>`: sayma, gruplama, paylaştırma ve grafik resimlerinde tekrar eden küçük simgeler, 96 px. Emoji → simge eşlemesi `components/activities/Picture.tsx` içindeki `icons` listesindedir; listede olmayan emoji olduğu gibi yazılır.

İngilizce kelime resimleri emojidir, çünkü anne, öğretmen, bebek gibi kelimeler insan çizmeden gösterilemez. Örüntü dizileri ve seçenek düğmelerindeki simgeler metnin parçası olduğu için emoji kalır. `tests/art.test.ts`, soruların kullandığı her görselin ve listedeki her dosyanın var olduğunu denetler. Dışa aktarma notları: Codex bazen arka planı magenta yerine saydam verir; o görsellerde anahtar silme atlanır, yoksa koyu yerler (benekler, göz bebekleri) de silinir. Magentaya yakın pembelerde (`i/tulip`) `--despill` kullanılmaz, yoksa renk griye döner.

## Etkinlik görselleri

26 Eylül 2026’da etkinlik araçlarındaki basit çizimler ve emojiler de aynı stille üretildi. İstekler `scripts/activity-art.json` dosyasındadır. Her görsel ayrı bir Codex oturumunda istenir; tek oturumda on iki görsel istenince Codex birkaçından sonra bırakabiliyor. Piko pozları, ilk Piko görselinin bulunduğu oturumdan `codex exec fork` ile çatallanır, böylece karakter birebir aynı kalır. Güvenlik filtresi bir Piko isteğini reddettiğinde, “vücut”, “bacaklar altında” gibi ifadeler çıkarılıp poz kısa anlatılınca geçti.

- Piko pozları (400 px + `-sm`): `piko-jump`, `piko-balance`, `piko-clap`, `piko-statue`, `piko-stretch` hareket derslerinin görevini canlandırır (`lib/questions.ts` → `movePoses`). `piko-talk` konuşma görevlerinde, `piko-clap` şarkı görevinde ve ritimdeki vuruş simgesinde, `piko-walk` ve `piko-wait` trafik sahnesinde kullanılır.
- `tool/street`: 1536×1024 sahnenin y 120–888 bandı, 1200×600. `Traffic` bileşenindeki koordinatlar bu kırpımın pikselleridir: uzak kaldırım y 216–278, yol 285–608, orta çizgi 430, yakın kaldırım 616–720, yaya geçidi x 910–1190.
- `tool/car`, `tool/ped-light`: saydam arka planla geldi, oran korunarak yazıldı. Işık görseli boş lambalıdır; yanan lamba, parıltı ve duran/yürüyen simgesi SVG ile çizilir.
- `tool/route-tile`, `tool/house`: yön haritasının karosu ve evi. Izgara tam 5×4 kalsın diye hücreleri tek karo döşer.
- `tool/coin-gold` (25 ve 50 kr), `tool/coin-lira` (iki renkli 1 TL), `tool/piggy`: paralar yazısızdır, değer HTML ile üstüne yazılır.
- `tool/clock-frame`: kadran yarıçapı dış çerçevenin 0,77’si. Saat SVG’sinin görüş alanı `-26 -26 372 372` olarak genişletildi; rakamlar, çizgiler ve kollar yerinde kaldı.
- `tool/pencil-end`, `pencil-body`, `pencil-tip`: yatay kalemin silgi, gövde ve uç dilimleri, 48 px yükseklik. Gövde dilimi kalemin boyuna göre uzar; uç her zaman ölçülen santimetrede biter.
- `tool/block-one`, `tool/block-blue` → `tool/block-ten`: onluk çubuğu mavi küpün on kez alt alta dizilmesiyle üretilir; görsel her zaman tam 10 hücre gösterir. Çubuklar CSS’te 1:10 oranında tutulur.
- `tool/solid-cube`, `solid-sphere`, `solid-cylinder`, `solid-prism`: SVG çizimlerle aynı renkte (küp, silindir ve prizma mavi, küre yeşil); model kurmadaki boş yer aynı görselin gri, soluk hâlidir. İlk prizma üstü açık bir tepsi çıktı; “kapalı, dolu, kapaklı ayakkabı kutusu gibi” tarifiyle yeniden üretildi.
- `tool/pizza`, `cake`, `pie`: tepeden, dört dilime bölünmüş. Kesir aracı her dilime görselin bir çeyreğini `background-position` ile gösterir; boyanmamış dilim gri ve soluktur. Yönergede “pasta” geçerse pasta, “turta” geçerse turta, diğerlerinde pizza gösterilir.
- `i/` örüntü simgeleri (96 px): `blossom`, `clover`, `triangle`, `circle`, `square-green`, `square-red`, `square-yellow`, `square-blue`, `bee`, `moon`; `butterfly` ve `orange` `q/` görsellerinden küçültüldü. `IconText` yönergede ve seçeneklerde listedeki emojiyi kil simgeye çevirir; ekran okuyucu simgenin Türkçe adını okur.
- `en/<kelime>` (256 px): İngilizce kelime resimleri. Kelime `content/english/lessons.ts` içindeki `pictured` listesindeyse görsel kullanılır; `hello` için el sallayan Piko, `pencil` için `q/pencil`. İnsan ve vücut kelimeleri (teacher, mother, baby, eye, hand…) emoji kalır; `tests/art.test.ts` her İngilizce kelimenin ya görseli olduğunu ya da bu listede olduğunu denetler. Hafıza oyununun İngilizce destesi de aynı görselleri kullanır.

Dışa aktarma aynı kurallarla yapılır. Kumbara, pasta ve kanepe gibi pembe ve lila nesnelerde `--despill` kullanılmaz; saydam gelen görsellerde anahtar silme atlanır.
