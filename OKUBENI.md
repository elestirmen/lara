# ✨ Sihirli Stil Stüdyosu

**Tüm yaşlara** uygun, **premium** bir moda & stil giydirme oyunu (Lara için yapıldı —
varsayılan model **Lara** 🧡). Zarif bir manken/model figürünü giydirip stilliyorsun.
Tüm gardırop (saçlar, elbiseler, tulumlar, taçlar, kanatlar, ayakkabılar, takılar,
asalar, sahneler — **prenses, modern, gece ve günlük** stiller) oyunun içine
çizilmiştir; hepsi tek dokunuşla mankene **otomatik oturur**. İstersen kendi
fotoğraflarını da ekleyebilirsin. Her şey **kendi bilgisayarınızda** çalışır;
fotoğraflar internete gönderilmez. 🔒

---

## ▶️ Nasıl başlatılır?

```bash
bash /opt/lara/baslat.sh
```
(veya `cd /opt/lara` sonra `node server.js`)

Ekranda şuna benzer adresler çıkar:

```
Bu bilgisayarda aç:   http://localhost:8080
Tablet/telefonda aç:  http://192.168.1.25:8080   (aynı wifi'de)
```

- **Bilgisayarda:** tarayıcıda `http://localhost:8080`
- **Tablette/telefonda:** cihaz **aynı wifi'de** iken yukarıdaki `192.168.x.x:8080`

Durdurmak için terminalde **Ctrl + C**.

> İpucu: Tablette tarayıcı menüsünden **"Ana ekrana ekle"** → oyun uygulama gibi
> bir simge olur. 📱  En iyi deneyim için tablet/telefonu **yatay** tutun.

---

## 🎮 Oyun nasıl oynanır?

Sağdaki dolaptan sekmeleri (👗 Elbise, 💇 Saç, 👑 Taç, 🦋 Kanat, 👠 Ayakkabı,
💎 Takı, ✨ Asa) gez. Bir parçaya dokun → **anında mankene giydirilir**.
Aynı parçaya tekrar dokunursan çıkar. Her slot için tek parça takılır, yani
kombin hep tertemiz ve tutarlı görünür.

- 🎨 **Renkler:** ten rengini ve saç rengini seç (9 saç rengi!).
- 🎲 **Sürpriz:** tek tuşla rastgele, eğlenceli bir kombin oluşturur.
- 🌟 **Defile:** kombini sahnede spot ışık, konfeti ve müzikle sergiler.
- 🌟 **Görevler:** "Kar Prensesi", "Doğum Günü", "Orman Perisi" gibi tema
  görevlerini tamamla, **⭐ yıldız** kazan (sağ üstte birikir).
- 📸 **Kaydet / 🖼️ Albüm:** kombinin fotoğrafını çek, albümden cihaza indir.
- 🎵 / 🔊 sağ üstten müzik ve sesi aç/kapat.

---

## 🖼️ Lara kendi fotoğraflarını nasıl ekler?

Dolapta **➕ Eşyalarım** sekmesi → **📷 Fotoğraf Ekle** → kategori seç → tabletle
anında fotoğraf çek ya da galeriden seç. Fotoğraf **çıkartma** gibi sahnenin
üstüne yapışır: parmakla sürükle, köşedeki ⤡ ile büyüt, ⟳ ile döndür, ✕ ile sil.
Arka plan seçersen tüm sahneyi kaplar.

İsterseniz fotoğrafları elle de koyabilirsiniz (oyun otomatik görür):

```
/opt/lara/fotograflar/
├── karakterler/   → Lara'nın fotoğrafı, çizgi karakterler
├── kiyafetler/    → gerçek kıyafet fotoğrafları
├── aksesuarlar/   → taç, çanta, gözlük...
└── arkaplanlar/   → ev, bahçe, tatil fotoğrafları
```
Desteklenen tipler: `png, jpg, jpeg, gif, webp, svg`

> Eski örnek çizimler `/opt/lara/_eski_gorseller/` klasörüne taşındı (silinmedi).

---

## ⚙️ Yönetim — kolayca gerçekçi görsel ekleme (şifreli)

Üst bardaki **⚙️** butonu → **yönetim şifresi** (varsayılan `lara2018`; değiştirmek için
`LARA_ADMIN="yeniSifre" node server.js`). Panelde:

- **Kategori** seç (Model / Elbise / Ayakkabı / Taç / Kolye / Kanat / Asa / Arka plan),
  **dosya adı (id)** ver, **PNG** seç → otomatik kontrol: tür, **1024×1365 (3:4)** boyut,
  şeffaflık + önizleme. Uygunsa **⬆️ Yükle**. Eklenen parça anında dolapta görünür.
- Alttaki listeden **🗑️** ile silebilirsin. Yönergeler panelin içinde yazılıdır.

> Yükleme **yerel sunucu** gerektirir: tarayıcıda `http://localhost:8080` (ya da tabletten
> `http://<bilgisayar-ip>:8080`). Dosyalar `public/assets/`'e yazıldığı için yayında
> (perinet.org) otomatik görünür — izleyiciler **Ctrl+Shift+R** ile tazeler.
> Görselleri AI ile üretmek için: `public/assets/_referans/AI_PROMPTLAR.md`.

### Yeni parça eklerken kenarlar tertemiz olsun
İki yol var:
1. **Hazır PNG'yi panelden yükle** (en kolay): zaten kestiğin/temizlediğin 1024×1365 şeffaf PNG'yi
   ⚙️ panelinden ekle. Kenarda hâle kalırsa: `bash /opt/lara/guncelle.sh` (hâleyi kırpar + thumbnail + manifest).
2. **Ham (arka planlı) görseli otomatik kestir** — *yalnız ürünü izole üret, giydirilmiş değil*:
   - Ürünü **tek başına** (flat-lay / düz-beyaz veya şeffaf zemin), **1024×1365 (3:4)** üret.
   - `/opt/lara/_ham/` içine `<id>.png` olarak koy.
   - Çalıştır: `/opt/lara/.venv/bin/python /opt/lara/process_images.py _ham --apply`
     (BiRefNet/u2net + beyaz-despill ile arka planı tertemiz kaldırır, 1024×1365'e hizalar.)
   - Sonra: `bash /opt/lara/thumbnails.sh && node /opt/lara/tara.js` → tarayıcıda **Ctrl+Shift+R**.

> ⚠️ Not: `process_images.py` **kişiyi** keser. Modeller (gövde) ve **izole** ürünler için doğrudur;
> "ürünü giymiş kişi" görselinden **yalnız ürünü** çıkaramaz (gövdeyi de tutar) — o yüzden kıyafet/
> ayakkabı/aksesuarı **giydirilmeden, tek başına** üret.

---

## 🌐 İnternetten yayınlarken (keenetic.link)

Dışarıya açarken **mutlaka parola** koyun:

```bash
LARA_PAROLA="gizliParola" node server.js
```
Yayın adresi (router yönlendirmesi gerekir): `https://lara.urgup.keenetic.link`

---

## 🎨 Kişiselleştirme

- Başlık: `public/index.html`
- Renkler/yazı tipi/animasyonlar: `public/style.css` (`--turuncu` vb.)
- **Yeni kıyafet/saç/taç eklemek:** `public/dolap.js` — her parça 600×800
  ortak koordinatta çizilen küçük bir SVG'dir; mevcut bir tanesini kopyalayıp
  uyarlamak en kolayı. Sesler: `public/ses.js`. Oyun mantığı: `public/app.js`.
- Port: `PORT=3000 node server.js`

Yeni özellik (daha çok kıyafet, evcil hayvan, çıkartma paketleri, mevsimler…)
istediğinizde söyleyin, ekleyelim. 🧡
