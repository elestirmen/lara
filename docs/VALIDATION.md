# Doğrulama

## 26 Eylül 2026 — Soru tekrarları

Sorun: Bir ders turunda (üç uygulama sorusu ve beş soruluk mini test) aynı soru yeniden çıkıyordu. Eski kodla her ders için 300 tur ölçüldü. Hayat Bilgisi derslerinin hepsinde mini test, uygulamadaki üç durumu yeniden soruyordu, çünkü her havuzda 5 durum vardı. Matematikte 28 konunun 21'inde turların çoğunda tekrar vardı. Kesirde yalnız 3, yapı kurmada 2 farklı soru vardı. Türkçe kelime ve anlatım, sanat, hareket ve müzik derslerinde de her turda en az bir tekrar vardı.

Yapılanlar:

- Soru motoru: turun tohumuyla karılan deste (`pick`), soru kimlikleri (`questionKeys`) ve çakışmada yeniden üreten `nextQuestion`. `LessonPlayer` turda çıkan soruları ve öğren ekranındaki keşfi hatırlar.
- İçerik: Hayat Bilgisi'ne 49 yeni durum (her derste 5 → 12), İngilizceye 18 kelime (her derste 5 → 8), Türkçe atölyelere 24 cümle ve 8 ünlem cümlesi, sanat, hareket ve şarkı derslerine 26 uygulama görevi eklendi. Matematikte yeni soru türleri var: sayıların okunuşu, sıralama ve karşılaştırma, geri ritmik sayma ve onar sayma, günlük problemler, 10'a tamamlama ve tahmin, şekil örüntüleri, bütün–yarım–çeyrek, para, ay ve mevsim sıralama, ortak birim ve kütle, nesne–cisim eşleme, resim grafiği okuma. Ayrıca beş yeni cisim modeli, iki yeni şekil modeli ile rastgele harita ve ayna desenleri eklendi.
- Görsel: resim grafiği (`chart:`), gruplama yığını (`pile:`) ve kalanlı beşli gruplar eklendi. Grafik aracı konuya göre simge ve etiket gösterir. İngilizce kelime kartları 4 sütundur.
- Düzeltilen içerik hataları: Filiz Şarkısı dersi hikâyeye son yazdırıyordu. “Aklımdaki kısa yol” 10'a tamamlama yerine birer sayma soruyordu. Ölçme ve uzunluk dersleri aynı soruları, “Yüze kadar keşif” ile “Onluk ve birlik” de aynı soruları üretiyordu. Araba modelinde tekerlek yuvası gövde yuvasının ortasını örttüğü için gövde dokunarak yerleştirilemiyordu.
- Cisim çizimleri sabit renklidir (küre ve daire yeşil), bu yüzden modeller bu renklere uygun seçildi: ağaç, merdiven, kapı, heykel, şapkalı tırtıl.

| Kontrol | Sonuç |
| --- | --- |
| TypeScript ve production build | Başarılı |
| Birim testleri (5 yeni çeşitlilik testi dahil) | 36 / 36 |
| Çeşitlilik ölçümü: 87 ders × 1.500 tur, 5 farklı zorluk düzeni | Turda tekrar eden soru da, yönerge de yok |
| Tekrar önleyici kapatılınca yeni testler | Başarısız, yani tekrarı yakalıyor |
| QA container'ında Playwright (içerik her turda karıştığı için testler ekrandaki soruyu okuyor) | İki tam turda 50 / 50 |
| Yeni ekranlarda (grafik, resim grafiği, yapı modelleri, örüntü, İngilizce kartlar vb.) Axe WCAG A/AA ve taşma, 390 ve 1280 px | İhlal yok, taşma yok |

Yeni soru ekranları 390 ve 1280 piksel genişlikte görsel olarak incelendi.

## 25 Eylül 2026 — Premium görsel dil

Arayüz yeniden tasarlandı. Codex `imagegen` ile aynı stil yönergesinden üretilen 3B kil görseller eklendi: Piko’nun beş pozu, yedi öğrenme adası, dört oyun, dört çiçek, yedi rozet, ana sayfa ve başarı bahçesi sahneleri. Görsellerde insan yoktur. Başlıklar Fredoka ile yazılır. Kartlar katmanlı gölgeli, düğmeler basılınca çöker; masaüstünde kenar çubuğu, telefonda alt menü yüzer. Ana sayfada tanıtım ile ada sahnesi tek bölümde, günün macerası ise dersin adasıyla birlikte gösterilir. Ada kartları ilerleme çubuğu taşır. Ders adımları dolan bir çizgiyle ilerler. Piko öğrenme adımında konuşma balonuyla anlatır, doğru cevapta sevinir, çözümde düşünür. Ders sonunda konfeti atılır. Başarı bahçesinde her tamamlanan konu toprağa bir çiçek eker; rozetler kazanılana kadar gri kalır.

Testlerde bulunup düzeltilenler: dar ekranda logo bağlantısının erişilebilir adı yoktu (`aria-label` eklendi). Sayfa geçişindeki saydamlık animasyonu, Axe taramasında metin karşıtlığını geçici olarak düşürüyordu; geçiş yalnız kaydırmaya çevrildi. Düğmelerdeki hızlı ve taşan geçiş eğrisi, Playwright’ın sabitlik denetimini bozup sayfayı yapışkan üst çubuğun altına kaydırıyordu; yay eğrisine dönüldü ve tıklama süresi ~2 sn’den ~60 ms’ye indi.

| Kontrol | Sonuç |
| --- | --- |
| TypeScript ve production build | Başarılı |
| Birim testleri | 31 / 31 |
| Production paketindeki Playwright testleri (QA container, nginx + CSP) | 50 / 50 |
| 360–1920 piksel ekranlarda Axe WCAG A/AA taraması | İhlal yok |
| Lighthouse mobil simülasyonu (QA container) | Performance 81, Accessibility 100, Best Practices 100, SEO 100 |
| Aynı makinede o sıradaki canlı imaj | Performance 84 |
| Yayından sonra production container'ında Playwright testleri | İlk turda 49 / 50; hafıza testi yarışı düzeltildikten sonra iki hafıza testi 20 / 20 |
| Canlı HTTPS adresinde eski sürümden yeni sürüme geçiş (`verify-live-upgrade.mjs`) | Geçti |
| HTTPS / HTTP / eski adres | 200 / 301 → HTTPS / 301 → `lara.perinet.org` |
| Canlı HTTPS sayfasında görünen görseller | Masaüstü 15 / 15, telefon 13 / 13 yüklendi |

26 Eylül’de yayınlandı. Yayınlanan imajın 103 dosyası, testten geçen QA imajıyla birebir aynıdır (dosya özetleri karşılaştırıldı). Geri dönüş imajı: `laranin-dersleri:before-art-20260926`. Canlı turda kalan tek hata test kaynaklıydı: “eş olmayan kartlar kapanır” testi çiftleri kartlar yüklenmeden okuyordu. Liste boş gelince ilk ve son karta tıklıyor, ikisi eşse (yaklaşık %9) başarısız oluyordu; bu durum önceki sürümde de ölçüldü. Test artık 12 kartı bekliyor; oyun kodu değişmedi. Cloudflare’in sayfaya kendisi eklediği analitik betiği (`static.cloudflareinsights.com`) CSP tarafından engellenir; uygulama analitik kullanmaz.

LCP öğesi artık ana sayfa sahnesidir (önceden bir başlıktı). Kısıtlamasız ölçümde ilk boyama ve LCP iki sürümde de ~1,3 sn’dir. Simülasyondaki fark, erken inen görsel ve yazı tipi baytlarından gelir. Bunun için adalar ve Piko pozları yarım boyutlu kopyalarla `srcset` üzerinden sunulur. Ekran altındaki adalar Chrome’un tembel yükleme eşiği içinde kaldığı için yine erken iner. Çevrim dışı önbellek 33 dosya / ~1,1 MB’tan 79 dosya / ~1,9 MB’a çıktı.

Ana sayfa, dersler, konu sayfası, ders akışı (öğren, yanlış, doğru, sonuç), başarı bahçesi (boş ve çiçekli), oyunlar, oyun ekranları, ebeveyn alanı ve 404 ekranı 360, 390, 768, 1024, 1280 ve 1440 piksel genişliklerde görsel olarak incelendi.

## 25 Eylül 2026 — Anında kontrol ve sesli geri bildirim

Tek dokunuşluk yanıtlarda (seçenekler, trafik sahnesi, ince/kalın ses, tempo, noktalama, dört vuruşluk ritim, tamamlanan şekil modeli, “Yaptım/Anlattım”) ayrı “Kontrol et” adımı kaldırıldı; seçim o anda kontrol edilir. Yanlış denenen seçenek ✗ ile kapanır ve ikinci kez sayılmaz, doğru seçenek ✓ ile yeşil kalır. Telefonda geri bildirim ve “Devam edelim” düğmesi alt menünün üstüne kayar (önceden ekranın altında, menünün arkasında kalıyordu); soru çözülünce odak bu düğmeye geçer. Düzeltilebilen yapımlarda “Kontrol et” kalır, aynı yanlış cevap değiştirilmeden yeniden gönderilemez. Saatte ayrı “Bu saati seç” onayı kaldırıldı.

Ses artık yeni cihazlarda açık başlar (önceden kapalıydı ve açıkken yalnız doğru cevapta 0,13 saniyelik kısık bir bip vardı). Doğru, yanlış, çözüm ve bitiş sesleri ile araçlardaki dokunma sesleri cihazda sentezlenir. Sesler OfflineAudioContext ile işlenip ölçüldü: doğru cevap tepe 0,27 / RMS 0,055; yanlış daha yumuşak (0,20 / 0,036); dokunma sesleri 0,06–0,12 saniye ve daha kısık; içerik tonları 220 ve 660 Hz'de eşit güçte (RMS 0,06). En büyük çakışma (balon patlaması + doğru zili) tepe 0,6'nın altında kalır.

| Kontrol | Sonuç |
| --- | --- |
| TypeScript ve production build | Başarılı |
| Birim testleri (anında kontrol edilen her sorunun tek dokunuşla cevaplanabildiği dahil) | 31 / 31 |
| Production paketindeki Playwright testleri (5 yeni geri bildirim testi dahil) | 50 / 50 |
| Cevaplanmış ekranlarda (yanlış, doğru, çözüm) Axe WCAG A/AA taraması | İhlal yok |
| Yayından sonra production container'ında Playwright testleri | 50 / 50 |
| Canlı HTTPS adresinde eski sürümden yeni sürüme geçiş (`verify-live-upgrade.mjs`) | Geçti |
| HTTPS / HTTP / eski adres | 200 / 301 → HTTPS / 301 → `lara.perinet.org` |

Yayınlanan imajın 56 dosyası testten geçen QA imajıyla birebir aynıdır (dosya özetleri karşılaştırıldı). Geri dönüş imajı: `laranin-dersleri:before-feedback-20260925`.
| Yeni geri bildirim testleri önceki yayın imajında | 5 / 5 başarısız (beklenen) |

Seçenek, trafik, İngilizce eşleştirme, geometri, ince/kalın ses, tempo, noktalama, ritim, hareket görevi, şekil modeli ve saat ekranları 390 piksel telefonda ve 1280 piksel masaüstünde yanlış, doğru ve çözüm gösterilen durumlarda görsel olarak incelendi.

## 25 Eylül 2026 — Etkinliklerde anlaşılırlık düzeltmeleri

Güvenli yolculuk sahnesi yeniden çizildi: ışık “Yaya ışığı” olarak etiketlidir ve duran/yürüyen insan simgesi taşır; araç gittiği yöne bakar, kırmızıda bir kez geçer ve yeniden oynatılabilir, yeşilde durma çizgisinde bekler; çocuk yalnız doğru cevap onaylanınca karşıya geçer. Yön bulma dersinde yol haritası gösterilir ve adım kartları numarasızdır (önceden harita görünmüyor, numaralar cevabı veriyordu). Örüntü soruları kuralı bulmayı ölçer; tempo dersi iki örneğin hızını karşılaştırır. Çarpma ve bölme görselleri tabaklarla çizilir; bölmede sonuç önceden gösterilmez. Kiraz tahmini beşerli gruplu, cetveldeki kalem çizimi nettir. Hayat Bilgisi durumları soru cümlesiyle biter. Tekrar önerisi en düşük puanlı beceriyi seçer. “Tüm ders rotaları” testi 81 konunun tamamını açtığını doğrular; önceden sayfa yüklenirken yapılan hızlı gezinme matematik konularını atlatabiliyordu.

| Kontrol | Sonuç |
| --- | --- |
| TypeScript ve production build | Başarılı |
| Birim testleri | 30 / 30 |
| Production paketindeki Playwright testleri | 45 / 45 |
| Yayından sonra production container'ında Playwright testleri | 45 / 45 |
| Canlı HTTPS adresinde eski sürümden yeni sürüme geçiş (`verify-live-upgrade.mjs`) | Geçti |
| HTTPS / HTTP / eski adres | 200 / 301 → HTTPS / 301 → `lara.perinet.org` |

Yayınlanan imajın dosyaları testten geçen QA imajıyla birebir aynıdır. Geri dönüş imajı: `laranin-dersleri:before-clarity-20260925`.

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
