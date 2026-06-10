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

Farklı port:
```bash
PORT=3000 node /opt/lara/server.js
```

## Kullanım
- Sağdaki sekmelerden model, elbise, özel parça, taç, kanat, ayakkabı, takı, asa ve
  arka plan seçilir.
- PNG parça varsa fotogerçekçi görsel kullanılır; yoksa vektör fallback görünür.
- Saçlar model PNG'sine bake'li kabul edilir. Ayrı `saclar/*.png` eklenirse saç
  sekmesi görünür.
- Beden slider'ı hazır `_beden/b20..b100` PNG varyantları arasında geçiş yapar.
- Kaydet/Albüm seçenekleri kombinleri tarayıcının localStorage alanında saklar.

## Yönetim Paneli
Üst bardaki ⚙️ butonu admin panelini açar.

Varsayılan şifre:
```bash
lara2018
```

Değiştirmek için:
```bash
LARA_ADMIN="yeniSifre" node /opt/lara/server.js
```

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
LARA_PAROLA="gizliParola" node /opt/lara/server.js
```
