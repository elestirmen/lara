# AGENTS.md — Leyla Stil Stüdyosu

> Bu dosya repodaki tek agent talimat kaynağıdır. Claude Code `CLAUDE.md` üzerinden
> `@AGENTS.md` okur. Son kullanıcı kılavuzu ayrıdır: bkz. [OKUBENI.md](OKUBENI.md).

## Proje Özeti
`/opt/lara`, fotogerçekçi PNG katmanları ve vektör fallback gardırobu ile çalışan
slot tabanlı kağıt-bebek/giydirme stüdyosudur. Uygulama yetişkin kullanımına göre
tasarlanır. Varsayılan görünen model adı **Leyla**; teknik ID ve dosya adı uyumluluk
için **`m_lara`** olarak kalır. Her şey yerelde çalışır; fotoğraflar internete
gönderilmez.

## Mimari
- **Backend:** bağımlılıksız Node.js `server.js` (varsayılan port 8080). `public/`
  statik dosyalarını ve `/api/gorseller`, `/api/upload`, `/api/admin/*` uçlarını sunar.
- **Frontend:** `public/index.html`, `style.css`, `dolap.js`, `ses.js`, `app.js`,
  `admin.js`. `index.html` bu dosyaları doğrudan yüklemelidir.
- **Tasarım jetonları:** renk, boşluk (`--sp-*`), tipografi (`--fs-*`), yarıçap,
  gölge ve hareket yalnız `style.css` `:root` bloğunda tanımlanır. Bileşenler ham
  değer yazmaz. Dokunma hedefi `--dokun` üzerinden gelir; `pointer: coarse`
  ekranlarda 44px'e çıkar.
- **İkon dili:** arayüz ikonları `index.html` içindeki `<symbol id="i-*">`
  deposundan gelir; JS tarafında `ikon(ad)` (`window.LARA_IKON`) ile `<use>`
  düğümü üretilir. Tek çizgi ağırlığı (24 grid, stroke 1.7). **Emoji yalnız
  içerik tarafında** kalır: parça/model/brief `emoji` alanları ve
  `metadata.json`. Yeni bir arayüz ikonu gerekiyorsa depoya `symbol` eklenir,
  emoji kullanılmaz.
- **Slotlar:** `modeller, arkaplanlar, kanatlar, elbiseler, ayakkabilar, takilar,
  saclar, taclar, asalar, ozel`.
- **PNG öncelik:** `public/assets/<slot>/<id>.png|webp|jpg` varsa ilgili vektörün
  yerine PNG kullanılır. PNG yoksa vektör fallback görünür. Saç istisnası: model PNG
  saç bake'li kabul edilir; `saclar` sekmesi yalnız PNG saç asset'i varsa görünür.
- **Gerçekçilik filtresi (`ogeKullanilabilir`):** fotogerçekçi bir model seçiliyken
  (`ovr("modeller", giyim.mankenler)`) PNG'si olmayan vektör parçalar gizlenir.
  İstisna: `vektorOk: true` işaretli parçalar (atmosferik stüdyo fonları) kalır.
  Hiç model PNG'si yoksa filtre kapanır ve tüm vektör gardırop yedek olarak çalışır.
  Bu kural, çizgi film vektörlerin fotoğraf gövdenin üzerinde bozuk görünmesini
  engeller; vektör fallback sözleşmesini kaldırmaz.
- **Metadata:** `public/assets/metadata.json`, PNG parçaların görünen ad, emoji ve
  görev etiketlerini taşır. Metadata yoksa ID'den fallback ad üretilir.
- **Tuval:** tüm katmanlar 1024x1365 (3:4), önden hizalı. Referans:
  `public/assets/_referans/sablon.png`.
- **Katman sırası:** `arkaplanlar, _golge, kanatlar, _vucut, ayakkabilar, elbiseler,
  ozel, takilar, saclar, taclar, asalar`.
- **Oyun döngüsü:** `DOLAP.gorevler` içindeki 12 brief her değişiklikte denetlenir
  (seçili brief şartı yoktur). Günün briefi tarihten türetilir ve ödülü iki katıdır.
  Defile, kombini jüri puanıyla (`juriDegerlendir`) değerlendirir; aynı kombin
  imzası (`kombinImzasi`) yalnız bir kez ödüllendirilir. Yıldızlar `RUTBELER`
  eşiklerine göre rütbe çubuğunu doldurur.
- **Panel düzeni:** kategoriler dikey ikon rayıdır (`.sekmeler`); dar dikey
  ekranlarda yatay şeride döner. Sahne `container-type: size` + `cqw/cqh` ile
  ölçeklenir, 3:4 oranı hiçbir kırılımda bozulmaz.
- **Alt sayfa (mobil dikey):** `≤980px` + portrait kırılımında dolap paneli üç
  duraklı bir bottom sheet olur: `mini` (yalnız kategori rayı) · varsayılan
  `orta` · `tam`. Durum `.panel` üzerindeki `mini`/`tam` sınıflarıyla taşınır,
  yükseklik `--sheet-h` jetonundan gelir. Kulp hem dokunuşla sırayla gezer hem
  sürüklenir (`panelKulpKur`); `panelSnapNoktalari()` içindeki değerler CSS'teki
  `--sheet-h` hesabıyla aynı tutulmalıdır. Ekran yüksekliği 640px altındaysa
  `tam` durağı sunulmaz — sahne pula dönmesin diye.
- **Üst bar:** üç bölgeli ızgara (marka · kariyer kapsülü · kontroller). Yıldız
  sayacı rütbe kapsülünün içindedir. İkincil kontroller (`#btnSes`, `#btnMuzik`,
  `#btnYardim`, `#btnYonetim`) her kırılımda `#ustMenu` içinde yaşar; üst barda
  yalnız geri/ileri ve menü düğmesi durur. `sesButonlari()` düğme içeriğini
  değiştirmez, yalnız `kapali` sınıfı + `[data-durum]` rozetini günceller.
- **Beden slider:** canlı warp yoktur. `public/assets/_beden/b{20,40,60,80,100}/`
  altındaki ön-render PNG varyantları kullanılır. Sadece `modeller/elbiseler/takilar/ozel`
  varyantlanır.

## Komutlar
```bash
bash /opt/lara/baslat.sh
PORT=3000 node /opt/lara/server.js
LARA_ADMIN="yeniSifre" node /opt/lara/server.js
LARA_PAROLA="gizliParola" node /opt/lara/server.js

bash /opt/lara/guncelle.sh
/opt/lara/.venv/bin/python /opt/lara/beden_uret.py --clean
node /opt/lara/tara.js
/opt/lara/.venv/bin/python /opt/lara/quality_gate.py
/opt/lara/.venv/bin/python /opt/lara/process_images.py /opt/lara/_ham --apply
```

Python işleri için her zaman `/opt/lara/.venv` kullanılır.

## Görsel Üretim
- Prompt kaynağı: `public/assets/_referans/AI_PROMPTLAR.md`.
- Hazır temiz PNG doğrudan admin panelinden yüklenebilir.
- Ham beyaz arka planlı izole ürünler için `process_images.py` kullanılabilir.
- `process_images.py` kişiyi/izole ürünü keser; ürünü giymiş kişiden yalnız kıyafet
  çıkaramaz. Kıyafet/ayakkabı/takı/özel parçaları tek başına üret.
- Yeni PNG eklenince `metadata.json` güncellenmeli, sonra thumbnail + manifest
  tazelenmelidir.
- `thumbnails.sh` parça slotlarında (`kanatlar, elbiseler, ayakkabilar, takilar,
  saclar, taclar, asalar, ozel`) thumbnail'i saydam kenarlarından kırpıp karta
  ortalar; tuvalin tamamı küçültülürse şapka/kolye gibi parçalar kartta görünmez
  bir lekeye döner. `modeller` ve `arkaplanlar` kırpılmaz (kartlar arası ölçek
  tutarlılığı ve opak sahne).
- Yayına almadan önce `quality_gate.py` çalıştırılır. Bu kapı PNG sözleşmesini,
  beden slider oranlarını, kompozitleri, elbise kontakt sayfasını, manifest
  invariantlarını ve admin prompt endpoint'i ile `prompt_build.py` çıktısının
  birebir aynı olduğunu denetler.

## Yayın
- `https://lara.perinet.org` → Nginx Proxy Manager → `lara-web` Docker konteyneri.
- Konteyner `node:20-alpine`, `/opt/lara -> /app` mount ve `node server.js` ile çalışır.
- `server.js` değişince `docker restart lara-web` şarttır. HTML/JS/CSS/assets mount
  olduğu için tarayıcıda Ctrl+Shift+R yeterlidir.

## Kritik Kurallar
- `pkill -f "server.js"` kullanma. Gerekirse açık PID ile sonlandır.
- SVG önizlemede ImageMagick'e güvenme; gerekiyorsa resvg kullan.
- İç çamaşırlı sade manken temeli proje kararının parçasıdır; geri alma.
- `_dolgun` eski sistemdir; manifest/kod akışında kullanılmaz. Beden için `_beden`
  varyantları kullanılır.
