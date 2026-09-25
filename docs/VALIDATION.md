# Doğrulama

## 25 Eylül 2026 — Etkinliklerde anlaşılırlık düzeltmeleri (yerel QA paketi)

Güvenli yolculuk sahnesi yeniden çizildi: ışık “Yaya ışığı” olarak etiketlidir ve duran/yürüyen insan simgesi taşır; araç gittiği yöne bakar, kırmızıda bir kez geçer ve yeniden oynatılabilir, yeşilde durma çizgisinde bekler; çocuk yalnız doğru cevap onaylanınca karşıya geçer. Yön bulma dersinde yol haritası gösterilir ve adım kartları numarasızdır (önceden harita görünmüyor, numaralar cevabı veriyordu). Örüntü soruları kuralı bulmayı ölçer; tempo dersi iki örneğin hızını karşılaştırır. Çarpma ve bölme görselleri tabaklarla çizilir; bölmede sonuç önceden gösterilmez. Kiraz tahmini beşerli gruplu, cetveldeki kalem çizimi nettir. Hayat Bilgisi durumları soru cümlesiyle biter. Tekrar önerisi en düşük puanlı beceriyi seçer. “Tüm ders rotaları” testi 81 konunun tamamını açtığını doğrular; önceden sayfa yüklenirken yapılan hızlı gezinme matematik konularını atlatabiliyordu.

| Kontrol | Sonuç |
| --- | --- |
| TypeScript ve production build | Başarılı |
| Birim testleri | 30 / 30 |
| Production paketindeki Playwright testleri | 45 / 45 |

## 25 Eylül 2026 — Lara’nın Dünyası: tanıtım, dersler ve oyun molası

Tanıtım kartı, derslerin öne alındığı ana sayfa, kenardaki oyun molası bölümü, dört oyun ve ders içeriği düzeltmeleri production paketiyle ayrı bir yerel test container'ında (`127.0.0.1:18743`) sınandı. Ana sayfa testi derslerin oyun kartından önce geldiğini ve menü sırasını da denetler.

| Kontrol | Sonuç |
| --- | --- |
| TypeScript ve production build | Başarılı |
| Birim testleri | 25 / 25 |
| Production paketindeki Playwright testleri (12 yeni oyun testi dahil) | 45 / 45 |
| Yayından sonra production container'ında Playwright testleri | 45 / 45 |
| Canlı HTTPS adresinde eski sürümden yeni sürüme geçiş (`verify-live-upgrade.mjs`) | Geçti |
| HTTPS / HTTP / eski adres | 200 / 301 → HTTPS / 301 → `lara.perinet.org` |

Yayınlanan imajın dosyaları, testten geçen yerel QA imajıyla birebir aynıdır (dosya özetleri karşılaştırıldı). Canlı geçiş testinde eski Service Worker açıkken yeni paket kuruldu, güncelle düğmesiyle etkinleştirildi; örnek ilerleme korundu ve saat dersi internet kapalıyken yeniden açıldı. Geri dönüş imajı: `laranin-dersleri:before-games-20260925`.

Oyun ekranları 360, 390, 768 ve 1280 piksel genişlikte taşma ve Axe WCAG A/AA kontrollerinden geçti. İlk koşuda sürekli süzülen balonlar tıklama kararlılık kontrolünü geçemedi; sürekli hareket eden hedef çocuklar için de zor olduğundan balonlar tur başında bir kez yükselip duracak şekilde değiştirildi. Oyun molası kartındaki küçük yazının kontrastı (4,41:1) Axe ile yakalanıp 4,5:1 üstüne çıkarıldı.

## 24 Eylül 2026

Yayın: https://laranindersleri.perinet.org (bu kontrol tarihindeki adres; artık https://lara.perinet.org adresine yönlenir)

Bu kayıt matematik/Türkçe etkileşim yenilemesi içindir. Otomatik testler, gerçek çocuk kullanım gözleminin veya pedagojik uzman incelemesinin yerine geçmez.

| Kontrol | Sonuç |
| --- | --- |
| TypeScript ve production build | Başarılı |
| Birim testleri | 18 / 18 |
| Production paketindeki Playwright testleri | 33 / 33 |
| Canlı HTTPS adresindeki yeni etkileşim kontrolleri | 8 / 8 |
| Tüm bağımlılıklar için npm audit | Bildirilen açık yok |
| HTTPS / HTTP yönlendirme | 200 / 301 → HTTPS |
| Production container | Healthy, loopback portu, unless-stopped |

Lighthouse mobil simülasyonu, yerel Nginx ile sunulan son production paketinde: Performance **90**, Accessibility **100**, Best Practices **100**, SEO **100**. Değerler test koşullarına aittir; her cihaz ve ağ için garanti değildir. HTML/JSON raporları `artifacts/lighthouse.*` altında üretilir.

## İkinci kontrol ve düzeltmeler

- Şekil büyüklüğü kontrolünün CSS sınırı nedeniyle etkisiz kalması düzeltildi; 390, 768 ve 1280 piksel ekranlarda gerçek çizim boyutu ölçülerek sınandı.
- Yan yana Türkçe kartlarını sağa/sola sürükleyerek sıralama ve sürükleme sonrasındaki ilk dokunuşun kaybolması düzeltildi. Klavye erişimi korunur.
- Telefonda birlikler 5 + 5 düzeninde, en az 44×44 piksel dokunma alanlarıyla gösterilir. Onluk ve birlik alanları dar ekranda alt alta gelir.
- Öğrenme ekranındaki şekil seçimleri açıklama verir; serbest saat keşfinde işlem yapmayan onay düğmesi gösterilmez.
- Fiziksel hareket gibi öz bildirim görevleri, otomatik değerlendirme yapılmadığı için başarısız beceri olarak gösterilmez.
- Production hazırlığı tekrar çalıştırıldığında Service Worker kendi cache listesine girmez; aynı paket aynı cache sürümünü üretir.

Bu değişiklikler için 8 yeni tarayıcı testi eklendi. İlk altı regresyon kontrolü eski pakette sorunu yeniden üretti; düzeltilmiş paket 33 testin tamamından geçti.

## Etkileşim kapsamı

- Akrep/yelkovan sürükleme, birlikte ilerleme, 12 geçişi ve ok tuşları; ayrıca Chromium dokunma olaylarıyla tablet emülasyonu.
- Blok sürüklemede çift ekleme olmaması, 10 birlik ↔ 1 onluk dönüşümünde miktarın korunması.
- Şekil döndürme, köşe işaretleme, sürükleyerek model kurma ve matematiksel ayna yansıması.
- Türkçe kartlarını sürükleme/klavyeyle sıralama, onaylanmış alternatif kelime sırasını kabul etme ve noktalama yerleştirme.
- Tek dokunuşla çizim, şekil taşıma ve SVG indirme.
- Tam ders ve mini değerlendirme, kalıcı ilerleme, ebeveyn PIN'i, geçersiz yedeğin reddi ve geçerli yedeğin onaylı geri yüklenmesi.
- Bütün ders rotalarının açılması; daha önce ziyaret edilmemiş dersin çevrim dışı açılması.

Ana ekran 360×800, 390×844, 768×1024, 1024×768, 1280×720 ve 1920×1080 boyutlarında kontrol edildi. Etkileşim ekranları 360, 390, 768, 1280 ve 1920 piksel genişliklerde taşma ve Axe WCAG A/AA kontrollerinden geçti. Azaltılmış hareket tercihi ayrıca denendi. Bunlar tam WCAG sertifikasyonu iddiası değildir.

## PWA sürüm geçişi

Önceki ve yeni production imajları önce ayrı yerel test origininde, ikinci kontrol yayını sırasında da gerçek HTTPS adresinde sınandı. Eski Service Worker açıkken yeni paket kuruldu ve güncelle düğmesiyle etkinleştirildi. Yalıtılmış tarayıcıdaki örnek ilerleme korundu; saat internet kapatıldıktan sonra yeniden yüklenebildi. Kanıt: `artifacts/live-upgrade-clock.png`.

İlk geçiş testi sayfa içindeki asenkron koşulu erken sonuçlandırdığı için yanlış alarm verdi. Test, Node tarafında çözümlenmiş durumu `expect.poll` ile bekleyecek ve sayfa yenilenmesini tamamlayacak şekilde düzeltildi. Bu nedenle uygulama güncelleme mekanizmasında değişiklik gerekmedi.

Önceki yayında canlı adreste saat, bloklar, Türkçe, tam matematik/ilerleme ve çevrim dışı açılış için 5 temel akış testi geçti. İkinci kontrol yayınında 8 yeni etkileşim testi canlı HTTPS adresinde ayrıca geçti. Geçici test container'ı kaldırılır; önceki production imajı geri dönüş için korunur.

## Tekrar çalıştırma

```sh
npm run typecheck
npm test
npm run build
node scripts/prepare-production.mjs
npm run test:e2e
node scripts/lighthouse.mjs
```

`TEST_URL` ile test adresi değiştirilebilir. `node scripts/verify-live-upgrade.mjs --qa`, yerel test ortamında eski sürüm hazırken başlatılır; `OLD_CACHE_READY` mesajından sonra yalnız o ortam yeni imaja geçirilir. Bayraksız komut canlı adreste yayın bekler. Testler gerçek çocuk verisine erişmeyen geçici tarayıcı profilleri kullanır.
