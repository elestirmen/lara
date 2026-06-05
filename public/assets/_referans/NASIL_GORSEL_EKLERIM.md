# 🎨 Gerçekçi Görsel Ekleme Rehberi (raster override)

Bu oyun artık **drop-in raster** destekliyor: `public/assets/<slot>/<id>.png` dosyası
koyarsan, o parçanın vektör çizimi yerine **senin PNG'in** kullanılır. Dosya yoksa eski
vektör görünür, yani parçaları **tek tek** gerçekçiyle değiştirebilirsin (önce gövde, sonra
kıyafetler…).

> ⚠️ **ÖNEMLİ — görsel ekledikten/sildikten sonra manifesti tazele:** Yayın (perinet.org)
> **statik** sunulduğu için override listesi `public/assets/gorseller.json` dosyasından
> okunur. Yeni PNG koyunca bu dosyayı güncellemen gerekir:
> ```bash
> node /opt/lara/tara.js
> ```
> (veya `baslat.sh` ile sunucuyu yeniden başlat — açılışta otomatik tarar.) Sonra tarayıcıda
> **Ctrl+Shift+R** ile sert yenile. Bunu yapmazsan yeni görsel yayında görünmez.

---

## 1) Tuval & dosya kuralları (ÇOK ÖNEMLİ)

| Kural | Değer |
|---|---|
| **Boyut** | **1024 × 1365 piksel** (3:4 oran). Bu oranı koru. |
| **Format** | **PNG**, **şeffaf arka planlı** (alpha) — *arka plan görselleri hariç* |
| **Hizalama** | Her parça **tam ekran** çizilir, doğru yerde durur. `_referans/sablon.png`'i üstüne koyup hizala |
| **Poz** | **Önden, ayakta, düz duruş**, kollar gövdeden hafif açık (A-poz). Tüm gövde ve kıyafetlerde **AYNI** poz |
| **Dosya adı** | `<id>.png` (aşağıdaki tablodaki id). Örn. `modeller/m_lara.png`, `elbiseler/elb_turuncu.png` |

> **Şeffaflık:** Her parça yalnızca kendi pikselini boyar; gerisi şeffaf olmalı.
> Örn. kısa elbisede etek altı şeffaf kalmalı ki bacaklar görünsün. Saç, yüzün
> görünmesi gereken yerde şeffaf olmalı. **Arka planlar** ise tam ekranı **opak** doldurur.

### Hizalama çapaları (sablon.png üzerindeki çizgiler)
`_referans/sablon.png`'i resim üreticinde/düzenleyicinde referans katman olarak aç.
Üzerindeki kırmızı çizgiler (1024×1365 tuvalde) şu hizaları işaretler:
KAFA ÜST · GÖZ HATTI · ÇENE · OMUZ · GÖĞÜS · BEL · KALÇA · DİZ · BİLEK · AYAK TABANI,
ve mavi merkez ekseni. **Gövdeni bu çizgilere göre üret; sonra kıyafetleri AYNI gövdeye göre üret.**

---

## 2) Katman (z) sırası — arkadan öne

```
arkaplanlar → kanatlar → MODEL(gövde) → elbiseler → ayakkabilar → takilar → saclar → taclar → asalar
```

Yani saç, elbisenin ve gövdenin **üstünde**; taç saçın üstünde; kanatlar gövdenin **arkasında**.

---

## 3) İş akışı önerisi (en kolayı)

1. **Önce 1 model gövdesi** üret: `modeller/m_lara.png` (1024×1365, şeffaf, sablon'a hizalı, iç çamaşırlı manken). Oyunu aç → gövde anında gerçekçi olur.
2. O gövdeyi beğenince, **kıyafetleri AYNI gövde üzerinde** üret, sonra gövdeyi silip sadece kıyafeti şeffaf PNG olarak dışa aktar (böylece kusursuz oturur).
3. İstediğin parçayı ekledikçe oyunda görürsün; eklemediğin parçalar vektör kalır.

> **Not (model & makyaj):** Bir model PNG'si kullanıldığında **Ten/Makyaj sekmeleri o
> gövdeyi boyayamaz** (gerçekçi görselin tenini kod değiştiremez). Farklı tenler/yüzler
> istiyorsan her birini ayrı **model** olarak üret (aşağıda 4 model var: m_lara, m_mia,
> m_zoe, m_elisa). Daha fazla model eklemek istersen söyle, `dolap.js`'e tanım eklerim.

> **Saç:** İki seçenek — (a) saçı **modelin içine** bake et (her model = saçıyla bir kişi;
> saç sekmesini şapka/taç için kullanırsın), ya da (b) saçı **ayrı şeffaf PNG** olarak
> `saclar/<id>.png` üret (kafaya hizalı; alttan saç stilini değiştirebilirsin). İkisi de çalışır.

---

## 4) Dosya yerleşimi ve ID tabloları

Klasörler: `public/assets/<slot>/`

### 🧍 modeller/  (gövde — `_vucut` katmanı)
`m_lara.png` · `m_mia.png` · `m_zoe.png` · `m_elisa.png`

### 🌅 arkaplanlar/  (tam ekran, **opak**)
| id | ad |
|---|---|
| ap_balo | Kraliyet Balo Salonu |
| ap_bahce | Büyülü Çiçek Ormanı |
| ap_buz | Işıltılı Kar Kalesi |
| ap_sahil | Altın Kum Gün Batımı |
| ap_gece | Yıldızlı Gece Gökyüzü |
| ap_defile | Podyum Işıkları |

### 👗 elbiseler/
| id | ad |
|---|---|
| elb_turuncu | Gün Işığı Balo Elbisesi |
| elb_pembe | Gül Kurusu Balo Elbisesi |
| elb_mor | Ametist Gece Yıldızı |
| elb_buz | Kristal Buz Kraliçesi |
| elb_altin | Altın Varaklı Işıltı |
| elb_kirmizi | Kırmızı Kadife Balo |
| elb_yesil | Zümrüt Yeşili Yaprak (kısa) |
| elb_tutu | Gökkuşağı Tütü Etek (kısa) |
| elb_siyah | Siyah Bodikon Mini (kısa) |
| elb_kirmizi_gece | Kırmızı Halı Gecesi |
| elb_zumrut | Zümrüt Saten Gece |
| elb_yazlik | Çiçekli Yazlık (kısa) |
| elb_tulum | Şık Gece Tulumu (pantolon) |
| elb_kot_tulum | Kot Tulum (pantolon) |

### 💇 saclar/
| id | ad |
|---|---|
| sac_dalgali | Uzun Dalgalı |
| sac_at | Fiyonklu At Kuyruğu |
| sac_orgu | Kurdeleli İki Örgü |
| sac_topuz | Topuz |
| sac_bob | Modern Bob |

### 👑 taclar/
| id | ad |
|---|---|
| tac_klasik | Altın Kraliyet Tacı |
| tac_tiara | Pırlanta Tiara |
| tac_cicek | Kır Çiçekleri Tacı |
| tac_kar | Buz Kristali Tacı |
| tac_sapka | Silindir Şapka |

### 👠 ayakkabilar/
| id | ad |
|---|---|
| ayk_cam | Cam Topuklu |
| ayk_balerin | Balerin Babet |
| ayk_cizme | Süet Çizme |
| ayk_spor | Spor Ayakkabı |

### 💎 takilar/
| id | ad |
|---|---|
| kly_kalp | Kalp Kolye |
| kly_inci | İnci Kolye |
| kly_kelebek | Ametist Kolye |

### 🦋 kanatlar/  (gövdenin **arkasında**)
| id | ad |
|---|---|
| kanat_kelebek | Kelebek Kanatları |
| kanat_peri | Peri Kanatları |
| kanat_melek | Melek Kanatları |

### ✨ asalar/
| id | ad |
|---|---|
| asa_yildiz | Yıldız Asası |
| asa_kalp | Kalp Asası |
| asa_cicek | Çiçek Asası |

---

## 5) Üretim ipuçları (AI ile)
- Hep **"front view, standing, full body, neutral A-pose, plain transparent/white background"** iste.
- Tüm görsellerde **aynı kamera açısı/uzaklık/ışık** olsun (sablon hizasını koru).
- Beyaz arka planla üretip sonra arka planı **şeffaf**a çevir (kıyafet/saç/aksesuarlar için).
- Kıyafetleri **modelin üzerinde** üretip sonra gövdeyi silmek, hizayı garantiler.
- Bittiğinde **1024×1365**'e ölçekle ve sablon ile üst üste koyup çapaları kontrol et.

Yeni model/parça eklemek veya bir şeyi otomatikleştirmek istersen söyle. 🧡
