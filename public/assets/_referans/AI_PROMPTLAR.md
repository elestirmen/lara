# 🤖 Genişletilmiş AI Görsel Üretim Prompt'ları (Geniş Gardırop)

Tüm görseller İngilizce prompt'la daha iyi çıkar.
Hedef: **1024×1365 (3:4)**, **önden, ayakta, A-poz**, **tam boy**, sade arka plan.
Tutarlılık için **aynı seed** + ilk model olan `m_lara_raw`'u **referans görsel** olarak kullan.

---

## 0) MASTER BRIEF — Oranları Oyuna Kilitleyen Genel Prompt
Bunu **bir kez** ver, her görselde kullan; sonuna sadece "hangi parça" satırını ekle.

```
You are generating layered artwork for a 2D paper-doll dress-up game. Every image is a
separate PNG, exactly 1024x1365 px (3:4 portrait), TRANSPARENT background, and all layers
are stacked on top of each other — so they MUST share the EXACT same figure, pose, camera
and proportions in every image.

THE FIGURE (identical in every image):
- One young adult woman, front view, facing camera, standing straight and symmetrical,
  neutral friendly closed-mouth smile, arms relaxed and slightly away from the torso
  (A-pose), hands open and visible beside the hips, legs together, even weight.
- Lock these landmark heights on the 1024x1365 canvas in EVERY image:
    top of head   ~ 9%   of height (≈ y130)
    eyes          ~ 20%  (≈ y266)
    chin          ~ 27%  (≈ y372)
    shoulders     ~ 31%  (≈ y420)
    bust          ~ 37%  (≈ y512)
    waist (narrow)~ 47%  (≈ y645)
    hips          ~ 52%  (≈ y708, canvas mid-height)
    knees         ~ 72%  (≈ y983)
    ankles        ~ 89%  (≈ y1215)
    soles of feet ~ 93%  (≈ y1269, ~7% margin under the feet)
- Figure HORIZONTALLY CENTERED (center axis at x512). Whole body fully inside the frame,
  head and both feet visible, nothing cropped. Shoulder width ~15% of canvas width.
- Style: elegant modern digital fashion illustration, clean soft even studio lighting,
  smooth subtle shading, no harsh shadows, consistent camera (no perspective/tilt).
- Background: fully TRANSPARENT (alpha). No floor, no shadow, no props, no text, no border.

Negative: nudity, nsfw, suggestive pose, lingerie, lace, cleavage focus, thong, text,
watermark, logo, multiple people, cropped or cut-off head/feet, extra fingers, deformed
hands, extra limbs, low quality, blurry, busy background, furniture, harsh shadows.

NOW RENDER ONLY THIS PART (everything else transparent):
<<< buraya parça satırını ekle >>>
```

---

## 1) 8 GÖVDE MODELİ (modeller/)
Yukarıdaki prompt'ta sadece **ten + saç** satırını değiştir (poz/çerçeve/ışık AYNI kalsın):

- **m_lara** — `light-warm skin tone, long wavy copper-auburn hair`
- **m_mia** — `fair porcelain skin, sleek blonde high ponytail, blue eyes`
- **m_zoe** — `deep brown skin, black hair in two neat braids, green eyes`
- **m_elisa** — `bronze tan skin, long lavender-silver straight ponytail`
- **m_ayla** — `light-warm skin tone, sleek dark brown bob cut, hazel eyes`
- **m_selin** — `fair porcelain skin, long wavy golden blonde hair, blue eyes`
- **m_derya** — `bronze tan skin, high copper-red ponytail, green eyes`
- **m_yasemin** — `deep brown skin, black hair in neat braids, dark brown eyes`

---

## 2) 28 ELBİSE & TULUM (elbiseler/)
Kıyafeti **modelin üzerinde** üret, sonra `process_images.py` betiği ile gövdeyi sil.

- **elb_turuncu**: `a flowing floor-length orange satin ball gown`
- **elb_pembe**: `a flowing floor-length rose-pink satin ball gown`
- **elb_mor**: `a flowing floor-length lavender-purple gown with a gold sash and tiny gold stars`
- **elb_buz**: `a flowing floor-length ice-blue crystal gown decorated with delicate snowflakes`
- **elb_altin**: `a flowing floor-length shimmering gold glitter gown`
- **elb_kirmizi**: `a flowing floor-length red velvet ball gown with a gold waistband`
- **elb_yesil**: `a short emerald-green dress ending above the knees, styled with leaf motifs`
- **elb_tutu**: `a short rainbow tutu dress with a ruffled tulle skirt and peach bodice`
- **elb_siyah**: `a sleek short black bodycon mini dress with a thin gold belt`
- **elb_kirmizi_gece**: `a long red satin red-carpet evening gown with a thigh slit and gold belt`
- **elb_zumrut**: `an emerald-green satin column evening gown with a thin gold belt`
- **elb_yazlik**: `a short pale-pink floral summer sundress`
- **elb_tulum**: `a chic deep-purple wide-leg evening jumpsuit with a gold belt`
- **elb_kot_tulum**: `a casual denim blue wide-leg jumpsuit`
- **elb_gelinlik**: `a long elegant white satin wedding gown`
- **elb_balo_mavi**: `a flowing floor-length royal-blue satin ball gown`
- **elb_kimono**: `a long elegant floral satin kimono robe`
- **elb_kot_ceket**: `casual blue denim jacket over a white t-shirt and slim blue jeans`
- **elb_esofman**: `a sporty green tracksuit consisting of a zip-up jacket and matching joggers`
- **elb_kazak**: `a short cozy oversized beige knit sweater dress`
- **elb_okul**: `a short school uniform with a navy blazer, white collared shirt, and pleated skirt`
- **elb_mayo**: `a stylish black one-piece swimsuit with a light sheer black sarong wrapped at the waist`
- **elb_deri**: `a black leather jacket over a white crop top and sleek black leggings`
- **elb_vintage**: `a retro pink A-line vintage dress with white polka dots`
- **elb_gotik**: `a long dark gothic lace evening gown, elegant and mysterious`
- **elb_prenses_lila**: `a flowing floor-length lila tulle princess dress`
- **elb_cicek_desen**: `a short light-green sundress with white daisy patterns`
- **elb_safari**: `a casual khaki safari jumpsuit with a pocketed belt`

---

## 3) 10 TAÇ & ŞAPKA (taclar/)
- **tac_klasik**: `a small golden royal crown with ruby and sapphire gems`
- **tac_tiara**: `a delicate silver-crystal tiara sitting on top of the head`
- **tac_cicek**: `a colorful flower crown of pink, yellow, and purple blooms on a green leaf band`
- **tac_kar**: `a light-blue ice-crystal crown with delicate snowflake shapes`
- **tac_sapka**: `a tall purple magician top hat with a gold band and star`
- **tac_gunes**: `a wide-brim straw summer sun hat`
- **tac_bere**: `a cozy light-grey knit beanie`
- **tac_kovboy**: `a classic brown leather cowboy hat`
- **tac_kelebek_toka**: `a sparkly silver butterfly hair clip positioned on the side of the head`
- **tac_cadi**: `a tall pointed black witch hat with a purple ribbon`

---

## 4) 8 AYAKKABI (ayakkabilar/)
- **ayk_cam**: `clear glass high heels on the feet`
- **ayk_balerin**: `pink satin ballet flats with ribbons on the ankles`
- **ayk_cizme**: `long purple suede boots reaching the knees`
- **ayk_spor**: `chunky white sneakers with red accents`
- **ayk_topuk**: `classic black stiletto high heels`
- **ayk_sandalet**: `strappy brown leather summer sandals`
- **ayk_bot**: `casual brown leather ankle boots`
- **ayk_kar_cizme**: `warm winter boots with white fur lining`

---

## 5) 6 KOLYE (takilar/)
- **kly_kalp**: `a gold heart pendant necklace around the collarbone`
- **kly_inci**: `a white pearl strand necklace with a blue sapphire pendant`
- **kly_kelebek**: `a fine gold necklace with a purple amethyst butterfly pendant`
- **kly_altin**: `a layered gold chain necklace around the neck`
- **kly_choker**: `a simple thin black velvet choker`
- **kly_zumrut**: `a gold necklace with a brilliant green emerald pendant`

---

## 6) 6 KANAT (kanatlar/)
Gövdenin **arkasında** yer alır.
- **kanat_kelebek**: `large colorful butterfly wings, pink-to-purple gradients with white edges`
- **kanat_peri**: `translucent glowing green fairy wings`
- **kanat_melek**: `large white feathered angel wings with golden highlight edges`
- **kanat_ejderha**: `large purple-and-black scaled dragon wings`
- **kanat_karanlik**: `dark bat wings, gothic midnight-black color`
- **kanat_ates**: `fiery phoenix wings, bright orange and red feathers`

---

## 7) 6 ASA (asalar/)
- **asa_yildiz**: `a golden wand with a glowing five-point star topper`
- **asa_kalp**: `a pink wand with a glowing red heart topper`
- **asa_cicek**: `a green wand with a yellow daisy flower topper`
- **asa_unicorn**: `a pastel pink wand with a pearl unicorn horn topper`
- **asa_ay**: `a gold wand with a crescent moon topper`
- **asa_kristal**: `a blue wand with a snowflake ice crystal topper`

---

## 8) 12 ARKA PLAN (arkaplanlar/ — OPAK, tam ekran)
- **ap_balo**: `royal ballroom background, marble columns, gold chandelier`
- **ap_bahce**: `enchanted flower garden, glowing lights, stone archway`
- **ap_buz**: `sparkling blue ice castle hall with frozen spires`
- **ap_sahil**: `golden sunset beach, blue sea and palm trees`
- **ap_gece**: `starry night sky, glowing crescent moon, soft purple clouds`
- **ap_defile**: `fashion runway stage with bright pink spotlights`
- **ap_sehir**: `city street at dusk with glowing neon lights`
- **ap_kafe**: `cozy cafe interior with warm lighting and wooden tables`
- **ap_havuz**: `sunny pool party background with turquoise water and lounge chairs`
- **ap_uzay**: `dreamy cosmic galaxy with colorful nebulas and stars`
- **ap_sinif**: `cozy school classroom interior with a blackboard`
- **ap_kutuphane**: `antique library interior with bookshelves filled with old books`

---

## 🔪 TERTEMİZ KENAR İÇİN: İZOLE ÜRETİM + OTOMATİK KESİM (önerilen)

Kırpma izi (hale) olmaması için en temiz yol: ürünü **giydirilmeden, tek başına** üret,
sonra otomatik kestir. (Kişi-kesici "ürünü giymiş kişi"den yalnız ürünü çıkaramaz.)

**1) İzole üret** — MASTER BRIEF yerine şu kısa prompt'u kullan (model/gövde için eski brief aynı kalır):
```
A single [PARÇA] on a plain pure-white background, product/flat-lay style, no person, no body,
no mannequin, centered, vertical 3:4 framing (1024x1365), soft even studio lighting, no shadow.
```
`[PARÇA]` örn: `a long orange satin ball gown` / `a pair of clear glass high heels` /
`a small golden royal crown` / `a gold heart pendant necklace` / `a pair of butterfly wings`.

> Modeller (m_*) ESKİSİ gibi: tüm vücut, A-poz, iç çamaşırı (bölüm 0 + 1).

**2) Otomatik kestir + hizala** (arka planı tertemiz kaldırır, 1024×1365'e oturtur):
```
mkdir -p /opt/lara/_ham           # ürünleri <id>.png olarak buraya koy
/opt/lara/.venv/bin/python /opt/lara/process_images.py /opt/lara/_ham --apply
bash /opt/lara/thumbnails.sh && node /opt/lara/tara.js
```
Sonra tarayıcıda **Ctrl+Shift+R**. (Hazır/temiz PNG'lerin varsa kestirmeye gerek yok —
doğrudan ⚙️ Yönetim panelinden yükle.)
