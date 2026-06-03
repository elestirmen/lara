# 👑 Lara'nın Sihirli Dolabı

Lara için kişisel, kendi fotoğraflarınızla çalışan bir giydirme oyunu.
Her şey **kendi bilgisayarınızda** çalışır — fotoğraflar internete gönderilmez. 🔒

---

## ▶️ Nasıl başlatılır?

Bir terminal açıp şunu yazın:

```bash
bash /opt/lara/baslat.sh
```

(veya `cd /opt/lara` sonra `node server.js`)

Ekranda şuna benzer adresler çıkar:

```
Bu bilgisayarda aç:   http://localhost:8080
Tablet/telefonda aç:  http://192.168.1.25:8080   (aynı wifi'de)
```

- **Bilgisayarda oynamak için:** tarayıcıda `http://localhost:8080` adresini açın.
- **Tablette/telefonda oynamak için:** cihaz **aynı wifi'ye** bağlıyken,
  yukarıda yazan `http://192.168.x.x:8080` adresini o cihazın tarayıcısına yazın.

Durdurmak için terminalde **Ctrl + C** yapın.

> İpucu: Tablette tarayıcı menüsünden **"Ana ekrana ekle"** derseniz,
> oyun uygulama gibi bir simge olur. 📱

---

## 🖼️ Fotoğraf nasıl eklenir?

İki yol var:

### 1) Siz önceden ekleyin
Fotoğrafları doğru klasöre kopyalayın, oyun otomatik görür:

```
/opt/lara/fotograflar/
├── karakterler/   → Lara'nın fotoğrafı, çizgi karakterler
├── kiyafetler/    → elbiseler, üstler, etekler
├── saclar/        → saç modelleri
├── aksesuarlar/   → taç, çanta, gözlük, asa...
└── arkaplanlar/   → ev, bahçe, saray fotoğrafları
```

Desteklenen tipler: `png, jpg, jpeg, gif, webp, svg`

### 2) Lara oyunun içinden eklesin
Oyunda **➕ Fotoğraf Ekle** butonu → kategoriyi seçer → tabletle anında
fotoğraf çeker ya da galeriden seçer. Fotoğraf hem sahneye gelir hem de
ilgili rafa kaydedilir.

---

## ✨ Daha güzel görünmesi için ipuçları

- **Kıyafet/aksesuar fotoğrafları:** kıyafeti **düz, sade bir zemine**
  (beyaz çarşaf gibi) koyup tepeden çekin. Daha sonra arka planı şeffaf
  yapmak isterseniz birlikte yapabiliriz (sonraki adım).
- **Lara'yı karakter yapmak:** boydan, düz duvar önünde çekilmiş bir
  fotoğraf en iyi sonucu verir.
- Sahnede her parçayı **parmakla sürükleyin**; köşedeki ⤡ ile büyütün,
  üstteki ⟳ ile döndürün, ✕ ile silin.
- **💾 Kaydet** ile kombinin fotoğrafını **🖼️ Albüm**'e atarsınız;
  oradan ⬇️ ile cihaza indirebilirsiniz.

---

## 🎨 Kişiselleştirme

- Başlık ve renkler: `public/index.html` (başlık) ve `public/style.css`
  (`--turuncu` vb. renkler) içinden değiştirilebilir.
- Port (adresteki 8080) değiştirilebilir: `PORT=3000 node server.js`

Yeni özellik (animasyon, müzik, çıkartmalar, kıyafet kesme/arka plan silme...)
istediğinizde söyleyin, ekleyelim. 🧡
