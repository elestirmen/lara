# Fotogerçekçi AI Görsel Üretim Promptları

Tüm promptlar İngilizce kullanılmalı. Çıktı hedefi: 1024x1365 px, 3:4 portre,
aynı merkez eksen, aynı kamera, aynı ışık. Hazır PNG üretiyorsan alpha şeffaf olsun;
beyaz arka planlı izole ürün üretiyorsan sonrasında `process_images.py` ile kes.

## Master Canvas Contract
Her model ve katmanda aynı sözleşmeyi kullan:

```text
Photorealistic full-body fashion paper-doll layer for a local dress-up studio.
Exact canvas: 1024x1365 px, 3:4 portrait. Front view, centered on x512,
camera at chest height, no perspective tilt, no crop, head and both feet fully visible.
Same adult female figure proportions and pose across every layer: standing straight,
symmetrical neutral A-pose, arms slightly away from torso, hands relaxed beside hips,
legs together, even weight, calm neutral expression.

Lock landmarks on the 1024x1365 canvas:
top of head y~130, eyes y~266, chin y~372, shoulders y~420, bust y~512,
narrow waist y~645, hips y~708, knees y~983, ankles y~1215, soles y~1269.
Visible model alpha bbox target: x~378..647, y~100..1335, center x~512,
overall visible width MUST BE exactly around 270 px. CRITICAL: Do NOT generate a larger,
closer, wider, zoomed-in, thicker, or different-scale body. Any deviation breaks the game.
Keep arms near the existing A-pose reference.
Soft even studio lighting, realistic fabric/material detail, no floor shadow unless
the slot is arkaplanlar.
```

## Negative Prompt
```text
text, watermark, logo, extra people, cropped head, cropped feet, mismatched pose,
side view, turned body, deformed hands, extra fingers, extra limbs, blurry, low quality,
busy background, furniture, hard cast shadow, wrong canvas ratio, inconsistent camera,
zoomed body, oversized body, thick proportions, giant model, wider pose, arms too far from torso
```

## Model Prompt
`modeller/m_lara.png` teknik ID'si korunur; ekranda adı Leyla görünür.

```text
Use the Master Canvas Contract. Render one photorealistic young adult woman named Leyla,
healthy curvy hourglass silhouette, front-facing neutral A-pose, light warm skin tone,
long wavy copper-auburn hair baked into the model image, natural makeup, simple black
bra and brief set, transparent background, no props, no text, no floor.
```

Diğer model varyantları aynı poz ve landmark ile üretilir:
- `m_mia | modeller | Mia | 🧍 | []`: fair porcelain skin, blonde high ponytail, blue eyes.
- `m_zoe | modeller | Zoe | 🧍 | []`: deep brown skin, black hair in neat braids, green eyes.
- `m_elisa | modeller | Elisa | 🧍 | []`: bronze tan skin, lavender-silver ponytail.
- `m_ayla | modeller | Ayla | 🧍 | []`: light warm skin, sleek dark brown bob, hazel eyes.
- `m_selin | modeller | Selin | 🧍 | []`: fair porcelain skin, wavy golden blonde hair, blue eyes.
- `m_derya | modeller | Derya | 🧍 | []`: bronze tan skin, high copper-red ponytail, green eyes.
- `m_yasemin | modeller | Yasemin | 🧍 | []`: deep brown skin, black braids, dark brown eyes.
- `m_yuna | modeller | Yuna | 🧍 | [koreli,test]`: Korean adult woman, long straight black hair, same exact body scale as Leyla.

## Layer Prompt
Kıyafet, ayakkabı, takı, taç, kanat, asa, saç veya özel parça için:

```text
Use the Master Canvas Contract only for alignment. Render ONLY the requested wardrobe
item pixels for the matching paper-doll layer. Transparent background. No body, no skin,
no mannequin, no face, no hair unless the slot is saclar, no background, no text.
The item must align exactly to Leyla's 1024x1365 front-facing A-pose reference.
For fitted dresses and torso garments, keep the garment alpha around the canonical
body line: shoulder width ~200 px, bust ~205 px, waist ~245 px, hip ~255 px.
```

Beyaz arka planlı izole ürün üretip kestireceksen:
```text
A single [ITEM] product asset, centered, vertical 3:4 framing, plain pure-white
background, no person, no mannequin, no body, no text, soft even studio lighting,
photorealistic material detail.
```

## Background Prompt
`arkaplanlar` slotu şeffaf değildir:

```text
Photorealistic full-screen background for a fashion dress-up studio, exact 1024x1365 px,
3:4 portrait, opaque image, no person, no text, no watermark. Leave the center readable
for a full-body model layer.
```

## Slot Prompt Catalog
Her satır formatı: `id | slot | ad | emoji | etiketler | prompt`.

### Modeller
- `m_lara | modeller | Leyla | 🧍 | [] | photorealistic Leyla model, healthy curvy hourglass silhouette, black simple bra and brief set, copper-auburn wavy hair baked in`
- `m_mia | modeller | Mia | 🧍 | [] | photorealistic model, fair porcelain skin, blonde high ponytail, blue eyes`
- `m_zoe | modeller | Zoe | 🧍 | [] | photorealistic model, deep brown skin, black neat braids, green eyes`
- `m_elisa | modeller | Elisa | 🧍 | [] | photorealistic model, bronze tan skin, lavender-silver ponytail`
- `m_ayla | modeller | Ayla | 🧍 | [] | photorealistic model, light warm skin, dark brown bob, hazel eyes`
- `m_selin | modeller | Selin | 🧍 | [] | photorealistic model, fair porcelain skin, wavy golden blonde hair`
- `m_derya | modeller | Derya | 🧍 | [] | photorealistic model, bronze tan skin, copper-red ponytail`
- `m_yasemin | modeller | Yasemin | 🧍 | [] | photorealistic model, deep brown skin, black braids`

### Elbiseler ve Tulumlar
- `elb_turuncu | elbiseler | Gün Işığı Balo | 🧡 | [turuncu,balo,saray] | flowing floor-length orange satin ball gown`
- `elb_balo_mavi | elbiseler | Kraliyet Mavisi Balo | 💙 | [mavi,balo,saray] | royal-blue satin ball gown`
- `elb_gelinlik | elbiseler | Beyaz Gelinlik | 🤍 | [saray,balo,beyaz] | long elegant white satin wedding gown`
- `elb_kirmizi_gece | elbiseler | Kırmızı Gece | ❤️ | [gece,kirmizi,balo] | red satin evening gown with elegant belt`
- `elb_zumrut | elbiseler | Zümrüt Saten | 💚 | [gece,yesil,balo] | emerald satin evening gown`
- `elb_siyah | elbiseler | Siyah Mini | 🖤 | [modern,gece,siyah] | sleek black bodycon mini dress`
- `elb_mor_saten | elbiseler | Mor Saten | 💜 | [mor,gece,balo] | purple satin evening dress`
- `elb_lacivert_gece | elbiseler | Lacivert Gece | 🌌 | [gece,modern,mavi] | navy blue evening gown`
- `elb_gece_bordo_tulum | elbiseler | Bordo Gece Tulumu | 🍷 | [gece,modern,kirmizi] | burgundy wide-leg evening jumpsuit`
- `elb_tulum | elbiseler | Mor Gece Tulumu | 🌃 | [gece,modern,mor] | deep-purple wide-leg evening jumpsuit`
- `elb_kot_tulum | elbiseler | Kot Tulum | 👖 | [gunluk,modern,spor] | casual denim wide-leg jumpsuit`
- `elb_kot_ceket | elbiseler | Kot Ceket | 🧥 | [gunluk,spor,mavi] | blue denim jacket with white top and jeans`
- `elb_esofman | elbiseler | Yeşil Eşofman | 🏃 | [gunluk,spor,yesil] | sporty green tracksuit`
- `elb_esr_siyah_gece | elbiseler | Siyah Gece Elbisesi | 🖤 | [modern,gece,siyah] | black photorealistic evening dress layer`
- `elb_esr_yesil_mini | elbiseler | Yeşil Mini Elbise | 💚 | [yesil,modern] | green fitted mini dress layer`
- `elb_esr_kirmizi_balik | elbiseler | Kırmızı Balık Elbise | ❤️ | [kirmizi,balo,modern] | red mermaid evening gown layer`
- `elb_esr_kirmizi_siyah | elbiseler | Kırmızı Siyah Kokteyl | 🖤 | [kirmizi,siyah,modern] | red and black cocktail dress layer`
- `elb_esr_mavi_tuy | elbiseler | Mavi Tüylü Elbise | 💙 | [mavi,modern,balo] | blue feather-trim evening dress layer`
- `elb_spor_lila | elbiseler | Lila Spor | 💜 | [gunluk,spor,mor] | lavender sporty lounge set`
- `elb_kazak | elbiseler | Örgü Kazak Elbise | 🧶 | [gunluk,kis] | cozy oversized knit sweater dress`
- `elb_okul | elbiseler | Lacivert Üniforma | 🎒 | [gunluk,modern] | navy blazer, white shirt, pleated skirt`
- `elb_yazlik | elbiseler | Pembe Yazlık | 🌼 | [gunluk,yaz,bahce] | pale pink floral summer sundress`
- `elb_deniz_turkuaz | elbiseler | Deniz Turkuazı | 🌊 | [mavi,yaz,sahil] | turquoise summer dress`
- `elb_gul_pembe | elbiseler | Gül Pembe Elbise | 🌸 | [pembe,balo,dogumgunu] | rose pink satin dress`
- `elb_inci_balo | elbiseler | İnci Balo Elbisesi | 🦪 | [balo,saray,beyaz] | pearl-white formal ball gown`
- `elb_kimono | elbiseler | Çiçekli Kimono | 👘 | [gunluk,yaz,mor] | floral satin kimono robe`
- `elb_kis_mavi | elbiseler | Kış Mavisi | ❄️ | [mavi,kis,kar] | ice-blue winter dress`
- `elb_mayo | elbiseler | Mayo ve Sarong | 🩱 | [yaz,sahil,mavi] | black one-piece swimsuit with sheer sarong`
- `elb_yuna_latex | elbiseler | Siyah Lateks Mini | 🖤 | [siyah,gece,modern,lateks,test] | glossy black sleeveless latex bodycon mini dress layer, only dress pixels, aligned to Leyla/Yuna canonical body scale`

### Özel
- `oz_bodysuit | ozel | Siyah Bodysuit | 🖤 | [ozel,siyah,modern] | fitted black bodysuit layer aligned over the torso`
- `oz_harness | ozel | Deri Harness | 🖤 | [ozel,siyah,gece] | black leather harness accessory over torso`
- `oz_latex | ozel | Siyah Lateks | 🖤 | [ozel,siyah,gece] | glossy black latex overlay outfit layer`
- `oz_catears | ozel | Kedi Kulakları | 🐾 | [ozel,modern,siyah] | black headband with cat-ear silhouette aligned to the head`

### Ayakkabılar
- `ayk_cam | ayakkabilar | Cam Topuklu | 👠 | [balo,saray,mavi] | clear glass high heels`
- `ayk_gumus_cam | ayakkabilar | Gümüş Cam Topuklu | 👠 | [balo,gece] | silver clear high heels`
- `ayk_kirmizi_topuk | ayakkabilar | Kırmızı Topuklu | 👠 | [gece,kirmizi] | red stiletto high heels`
- `ayk_topuk | ayakkabilar | Siyah Stiletto | 👠 | [gece,modern,siyah] | classic black stiletto heels`
- `ayk_altin_sandalet | ayakkabilar | Altın Sandalet | 👡 | [yaz,sahil,altin] | gold strappy sandals`
- `ayk_sandalet | ayakkabilar | Yazlık Sandalet | 👡 | [yaz,sahil] | brown strappy summer sandals`
- `ayk_spor | ayakkabilar | Beyaz Spor | 👟 | [spor,gunluk] | white chunky sneakers`
- `ayk_pembe_spor | ayakkabilar | Pembe Spor | 👟 | [spor,pembe] | pink sporty sneakers`
- `ayk_bot | ayakkabilar | Deri Bot | 🥾 | [kis,modern] | brown leather ankle boots`
- `ayk_lila_bot | ayakkabilar | Lila Bot | 👢 | [mor,modern] | lavender ankle boots`

### Takılar, Taçlar, Kanatlar, Asalar, Saçlar
- `kly_kalp | takilar | Yakut Kalp | 💗 | [pembe,balo,dogumgunu] | gold necklace with ruby heart pendant`
- `kly_altin | takilar | Altın Zincir | 🪙 | [modern,altin] | layered gold chain necklace`
- `kly_gumus_kalp | takilar | Gümüş Kalp | 🤍 | [balo,pembe] | silver heart pendant necklace`
- `kly_mavi_kristal | takilar | Mavi Kristal | 💎 | [mavi,buz,gece] | blue crystal pendant necklace`
- `kly_pembe_altin | takilar | Pembe Altın | 🌸 | [pembe,altin] | rose-gold pendant necklace`
- `kly_zumrut_altin | takilar | Zümrüt Altın | 💚 | [yesil,saray,altin] | gold emerald pendant necklace`
- `tac_klasik | taclar | Altın Kraliyet Tacı | 👑 | [tac,balo,saray] | small golden royal crown`
- `tac_gumus_klasik | taclar | Gümüş Klasik Taç | 💎 | [tac,balo,gece] | silver crystal tiara`
- `tac_zumrut_kraliyet | taclar | Zümrüt Kraliyet Tacı | 👑 | [tac,saray,yesil] | golden crown with emerald gems`
- `tac_bere | taclar | Örgü Bere | 🧣 | [kis,kar] | light grey knit beanie`
- `tac_lila_bere | taclar | Lila Bere | 🧣 | [kis,mor] | lavender knit beanie`
- `tac_gunes | taclar | Güneş Şapkası | 👒 | [yaz,sahil] | wide-brim straw sun hat`
- `tac_kovboy | taclar | Kovboy Şapkası | 🤠 | [modern,spor] | brown cowboy hat`
- `tac_siyah_kovboy | taclar | Siyah Kovboy Şapkası | 🤠 | [modern,siyah] | black cowboy hat`
- `tac_kelebek_toka | taclar | Kelebek Toka | 🦋 | [modern,peri] | silver butterfly hair clip`
- `tac_pembe_kelebek | taclar | Pembe Kelebek Toka | 🦋 | [pembe,peri] | pink butterfly hair clip`
- `kanat_kelebek | kanatlar | Kelebek Kanatları | 🦋 | [kelebek,peri,bahce] | large colorful butterfly wings behind body`
- `kanat_peri | kanatlar | Peri Kanatları | 🦋 | [peri,yesil,bahce] | translucent green fairy wings`
- `kanat_melek | kanatlar | Beyaz Kanatlar | ✨ | [melek,beyaz,gece] | large white feathered wings`
- `kanat_ejderha | kanatlar | Mor Kanatlar | 🖤 | [sihir,mor] | purple-black fantasy wings`
- `kanat_karanlik | kanatlar | Gece Kanatları | 🖤 | [siyah,gece] | dark midnight-black wings`
- `kanat_ates | kanatlar | Ateş Kanatları | 🔥 | [turuncu,sihir] | fiery orange-red wings`
- `asa_yildiz | asalar | Yıldız Asa | ✨ | [yildiz,sihir,turuncu] | gold wand with star topper`
- `asa_kalp | asalar | Kalp Asa | 💗 | [kalp,pembe,sihir] | pink wand with heart topper`
- `asa_cicek | asalar | Çiçek Asa | 🌼 | [cicek,bahce,yaz] | green wand with flower topper`
- `asa_unicorn | asalar | İnci Asa | ✨ | [sihir,pembe] | pastel wand with pearl horn topper`
- `asa_ay | asalar | Hilal Asa | 🌙 | [sihir,gece] | gold wand with crescent moon topper`
- `asa_kristal | asalar | Kristal Asa | ❄️ | [sihir,buz] | blue wand with ice crystal topper`
- `sac_dalgali | saclar | Dalgalı Saç | 💇 | [] | separate transparent long wavy hair layer only if using hairless model base`

### Arka Planlar
- `ap_balo | arkaplanlar | Balo Salonu | 🏰 | [saray,balo] | royal ballroom, marble columns, gold chandelier`
- `ap_altin_salon | arkaplanlar | Altın Salon | 🏛️ | [saray,balo,altin] | golden palace hall`
- `ap_bahce | arkaplanlar | Büyülü Bahçe | 🌿 | [bahce,yaz,peri] | enchanted garden with soft lights`
- `ap_orman_aksam | arkaplanlar | Orman Akşamı | 🌲 | [bahce,gece,peri] | evening forest fashion backdrop`
- `ap_kis_bahce | arkaplanlar | Kış Bahçesi | ❄️ | [kis,kar,bahce] | snowy winter garden`
- `ap_gece_balo | arkaplanlar | Gece Balosu | 🌙 | [gece,balo] | night ballroom with soft spotlights`
- `ap_pembe_podyum | arkaplanlar | Pembe Podyum | 🎀 | [defile,sahne,pembe] | pink fashion runway stage`

## Kesim ve Yayına Alma
```bash
mkdir -p /opt/lara/_ham
/opt/lara/.venv/bin/python /opt/lara/process_images.py /opt/lara/_ham --apply
bash /opt/lara/guncelle.sh
/opt/lara/.venv/bin/python /opt/lara/asset_quality.py
```

`process_images.py` izole ürün veya model kesimi içindir. Ürünü giymiş kişi görselinden
yalnız kıyafeti çıkarma aracı değildir.

## Kalite Kapısı
Yüklenen veya üretilen her PNG için:
- Canvas tam `1024x1365` olmalı; sadece 3:4 oran yeterli değildir.
- `arkaplanlar` dışındaki slotlarda dört köşe alpha=0 olmalı.
- `modeller` slotunda bbox genişliği yaklaşık `240..325 px`, merkez x `492..532`
  aralığında olmalı. Daha geniş sonuçlar oyunda tüm kıyafetleri uyumsuz yapar.
- Kalite denetimi: `/opt/lara/.venv/bin/python /opt/lara/asset_quality.py`.

Araştırma notu: beden slider profili gerçek tıbbi ölçüm iddiası taşımaz; sadece moda
uyumu için görsel piksel genişliklerini yönetir. Ölçüm tanımları ISO 8559-1'deki
giysi antropometrisi yaklaşımına, nüfus ölçüleri CDC/NCHS antropometri tablolarına,
bel/kalça estetik hedefi ise literatürde sık kullanılan yaklaşık `0.7` WHR referansına
dayanarak teknik profile çevrilmiştir.
