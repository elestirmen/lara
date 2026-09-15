# Leyla Stil Stüdyosu

Yetişkin kullanıma yönelik, fotogerçekçi PNG katmanlarıyla çalışan yerel giydirme
stüdyosu. Varsayılan model ekranda **Leyla** olarak görünür; teknik dosya adı
`m_lara` olarak korunur. Fotoğraflar ve yüklenen görseller yerel makineden dışarı
gönderilmez.

## Başlatma
```bash
bash /opt/lara/baslat.sh
```

Terminalde çıkan adreslerden biriyle aç:
- Bu bilgisayarda: `http://localhost:8080`
- Aynı ağdaki tablette/telefonda: `http://<bilgisayar-ip>:8080`

Farklı port veya yalnız bu bilgisayardan erişim:
```bash
PORT=3000 node /opt/lara/server.js
LARA_HOST=127.0.0.1 node /opt/lara/server.js
```

## Kullanım
Sağ paneldeki dikey kategori rayından model, elbise, şapka, kanat, ayakkabı, kolye,
sahne, brief ve kendi fotoğrafların arasında geçilir. Sahnenin altındaki şeritte
beden formu kaydırıcısı ve Sürpriz / Defile / Kaydet / Albüm / Sıfırla düğmeleri yer alır.

Üst barda solda marka, ortada rütbe + yıldız kapsülü, sağda geri/ileri ve **⋮**
menüsü bulunur. Ses, müzik, "Nasıl oynanır?" ve Yönetim bu menüdedir.

**Telefon ve tablette (dikey):** dolap alttan açılan bir sayfa olarak çalışır.
Üstündeki tutamağa dokununca sırayla **küçük → normal → tam** boyuta geçer;
tutamağı yukarı/aşağı sürükleyerek de ayarlayabilirsin. Sahneye dokunmak dolabı
toplayıp mankeni tam boy gösterir.

### Oyun döngüsü
- **Stil analizi:** panelin üstündeki kart, seçili parçaların uyumuna göre 0–100
  arası canlı bir puan ve baskın temayı gösterir.
- **Briefler:** 12 stil görevi vardır; her biri farklı slotlara bağlı 2–3 koşul içerir.
  Koşullar tamamlandığında brief seçili olmasa bile ★ kazanılır. Her gün bir brief
  "günün briefi" olur ve iki kat ★ verir.
- **Defile:** kombini jüriye çıkarır. Puan; parça bütünlüğü, tema tekrarı ve sahne
  uyumundan hesaplanır. 66 puan üstü kombinler ★ kazandırır — aynı kombin yalnızca
  bir kez ödüllendirilir.
- **Rütbe:** toplanan ★ üst bardaki kariyer çubuğunu doldurur; Çırak Stilist'ten
  Moda İkonu'na kadar yedi rütbe vardır.

### Kısayollar
`R` Sürpriz · `D` Defile · `S` Kaydet · `A` Albüm · `/` Arama · `Ctrl+Z` Geri al ·
`Ctrl+Shift+Z` İleri al

### Görsel kuralları
- PNG parça varsa fotogerçekçi görsel kullanılır.
- Fotogerçekçi bir model seçiliyken düşük çözünürlüklü vektör yedekler gizlenir;
  çizgi elbise/ayakkabı fotoğraf gövdenin üzerinde bozuk görünürdü. Yalnızca bu iş
  için tasarlanmış atmosferik stüdyo fonları (`vektorOk: true`) sahnede kalır.
  Hiç model PNG'si yoksa tüm vektör gardırop yedek olarak devreye girer.
- Saçlar model PNG'sine bake'li kabul edilir. Ayrı `saclar/*.png` eklenirse saç
  sekmesi görünür.
- Beden slider'ı hazır `_beden/b20..b100` PNG varyantları arasında geçiş yapar.
- Kaydet/Albüm kombinleri tarayıcının IndexedDB deposunda tutar; kendi eklediğin
  fotoğraflar da cihazdan çıkmaz.

## Yönetim Paneli
Üst bardaki **⋮** menüsündeki "Yönetim" satırı admin panelini açar.

Güvenlik gereği varsayılan yönetim şifresi yoktur. `LARA_ADMIN` tanımlı değilse
yönetim API'leri `503` ile kapalı kalır. Yönetimi açmak için:
```bash
LARA_ADMIN="yeniSifre" node /opt/lara/server.js
```

Kullanıcı fotoğrafı yükleme, listeleme ve `/fotograflar/` erişimi de varsayılan
kapalıdır. Bu yerel özelliğe gerçekten ihtiyaç varsa açıkça etkinleştir:
```bash
LARA_UPLOADS=1 node /opt/lara/server.js
```
`LARA_PAROLA` kullanılması fotoğraf özelliğini kendiliğinden açmaz.

Yükleme kuralları:
- PNG
- Tam 1024x1365 px
- Arka planlar opak, diğer tüm slotlarda dört köşe şeffaf alpha
- Önden hizalı, sablonla uyumlu
- Slotlar: `modeller, arkaplanlar, kanatlar, elbiseler, ayakkabilar, takilar, saclar,
  taclar, asalar, ozel`

Yeni PNG için görünen ad, emoji ve görev etiketleri:
```text
public/assets/metadata.json
```

Görsel ekledikten sonra:
```bash
bash /opt/lara/guncelle.sh
```

Tam kalite kapısını tek başına çalıştırmak için:
```bash
/opt/lara/.venv/bin/python /opt/lara/quality_gate.py
```
Bu komut PNG sözleşmesini, beden slider oranlarını, kompozit smoke testlerini,
elbise kontakt sayfasını, manifest invariantlarını ve prompt endpoint/CLI
eşleşmesini kontrol eder.

Beden slider varyantlarını yeniden üretmek için:
```bash
/opt/lara/.venv/bin/python /opt/lara/beden_uret.py --clean
node /opt/lara/tara.js
```

## AI Görsel Üretimi
Prompt rehberi:
```text
public/assets/_referans/AI_PROMPTLAR.md
```

Slot/ID'ye uygun tek prompt üret:
```bash
/opt/lara/.venv/bin/python /opt/lara/prompt_build.py elb_yeni --slot elbiseler \
  --description "red satin evening dress"
```

Temel kural: tüm katmanlar 1024x1365, aynı kamera, aynı hizalama ve aynı merkez eksenle
üretilir. Model `modeller/m_lara.png`, ekranda Leyla adını taşır. Yeni model
üretirken gövde ölçeği mevcut modellerle aynı kalmalı; büyük/zoomlu mankenler tüm
elbiseleri uyumsuz yapar.

Kıyafet ve aksesuar üretirken iki güvenli yol var:
- Hazır şeffaf 1024x1365 PNG üretip admin panelinden yükle.
- Ürünü tek başına beyaz arka planla üret, sonra kes:
```bash
mkdir -p /opt/lara/_ham
/opt/lara/.venv/bin/python /opt/lara/process_images.py /opt/lara/_ham --apply
bash /opt/lara/guncelle.sh
```

Önemli: `process_images.py` ürünü giymiş kişiden yalnız kıyafeti çıkaramaz. Ürünleri
tek başına, modelden ayrı üret.

## Production
`https://lara.perinet.org`, Nginx Proxy Manager üzerinden `lara-web` Docker konteynerine
gider. Konteyner `/opt/lara` klasörünü `/app` olarak mount eder ve `node server.js`
çalıştırır.

`server.js` değiştiyse:
```bash
docker restart lara-web
```

HTML/JS/CSS/assets değiştiyse restart gerekmez; tarayıcıda Ctrl+Shift+R yeterlidir.

Dış yayında mutlaka parola kullan:
```bash
LARA_PAROLA="gizliParola" LARA_ADMIN="ayriGucluAdminSifresi" node /opt/lara/server.js
```
Kullanıcı fotoğrafı özelliğini dış yayında gerekmiyorsa kapalı bırak.
