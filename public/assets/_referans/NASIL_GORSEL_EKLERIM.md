# Gerçekçi Görsel Ekleme Rehberi

Bu oyun PNG öncelikli hibrit çalışır: `public/assets/<slot>/<id>.png` varsa o parça
fotogerçekçi PNG ile çizilir; yoksa aynı ID'nin vektör fallback'i kullanılır.

## Temel Kurallar
| Kural | Değer |
|---|---|
| Boyut | Tam 1024x1365 px |
| Model/Parça | Önden, ayakta, A-poz hizasına uygun |
| Arka plan | Model/parça için dört köşe şeffaf; arka plan slotu için opak |
| Hizalama | `sablon.png` referans çizgileriyle aynı |
| Dosya adı | `<slot>/<id>.png`, örn. `modeller/m_lara.png` |

Slotlar:
`modeller, arkaplanlar, kanatlar, elbiseler, ayakkabilar, takilar, saclar, taclar, asalar, ozel`

## Katman Sırası
```text
arkaplanlar -> kanatlar -> model -> ayakkabilar -> elbiseler -> ozel -> takilar -> saclar -> taclar -> asalar
```

`ozel` elbisenin üstünde, takının altında durur. Beden slider varyantı
`modeller/elbiseler/takilar/ozel` için üretilir.

## Yeni PNG Ekleme
1. PNG'yi tam 1024x1365 ve doğru hizalı hazırla.
2. Admin panelinden slot ve ID ile yükle veya dosyayı `public/assets/<slot>/` altına koy.
3. Görünen ad/emoji/görev etiketleri için `public/assets/metadata.json` dosyasını güncelle.
4. Kalite denetimi, thumbnail ve manifest üret:
   ```bash
   bash /opt/lara/guncelle.sh
   ```
5. Beden slider etkileniyorsa:
   ```bash
   /opt/lara/.venv/bin/python /opt/lara/beden_uret.py --clean
   node /opt/lara/tara.js
   ```

## AI Üretim
Fotogerçekçi prompt seti:
```text
public/assets/_referans/AI_PROMPTLAR.md
```

Slot/ID metadata'sına göre tek prompt üretmek için:
```bash
/opt/lara/.venv/bin/python /opt/lara/prompt_build.py elb_yeni_latex --slot elbiseler \
  --description "glossy black sleeveless latex mini dress"
```

Model üretirken `m_lara` teknik ID'si kullanılır; ekranda adı Leyla görünür. Model
PNG'sinde sade siyah iç çamaşırı ve bake'li saç beklenir. Yeni model üretirken mevcut
model ölçeğini koru: merkez x yaklaşık 512, görünür bbox genişliği yaklaşık 270 px.
Yakın plan/iri manken üretmek tüm elbiseleri bozar.

Kıyafet/ayakkabı/takı/özel parça için en güvenli yöntem:
- Parçayı tek başına, beyaz veya şeffaf arka planla üret.
- Şeffaf hazır PNG ise doğrudan yükle.
- Beyaz arka planlı izole ürün ise kes:
  ```bash
  /opt/lara/.venv/bin/python /opt/lara/process_images.py /opt/lara/_ham --apply
  bash /opt/lara/guncelle.sh
  ```

`process_images.py` kişiyi veya izole ürünü keser; ürünü giymiş kişiden yalnız kıyafet
çıkaramaz. Bu yüzden kıyafet/aksesuarı model üzerinde değil, tek başına üret.

## Kalite Denetimi
```bash
/opt/lara/.venv/bin/python /opt/lara/asset_quality.py
```

Bu komut yanlış boyut, şeffaf olmayan parça köşesi, merkezden kaymış veya fazla büyük
model gibi ölçülebilir uyumsuzlukları raporlar. Uyarılar kalite borcudur; `ERROR`
satırları oyuna alınmadan düzeltilmelidir.

## Production
Perinet yayını Node konteynerdir, statik yayın değildir. `server.js` değiştiyse:
```bash
docker restart lara-web
```

JS/CSS/assets değiştiyse restart gerekmez; tarayıcıda Ctrl+Shift+R yeterlidir.
