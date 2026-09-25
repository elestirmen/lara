# Lara'nın Dünyası

Lara’nın kişisel öğrenme sayfası: kısa bir tanıtım, MEB 2. sınıf programına bağlı Türkçe dersler ve kenarda küçük bir oyun molası köşesi. Production: **https://lara.perinet.org**.

Next.js 16 + React 19 + TypeScript, yerel Nunito yazı tipi, Lucide, SVG çizim yüzeyi ve Web Audio. Ağır oyun motoru, hesap sistemi, reklam ve analitik SDK yok. Stil sistemi düz CSS'tir; animasyonlar CSS/SVG ile yapılır.

## Kurulum

Node.js 22 veya üzeri ve npm gerekir.

```sh
npm ci
npm run dev
```

Geliştirme adresi: `http://127.0.0.1:3000`. Service Worker sadece production derlemesinde çalışır. Playwright için ilk kez `npx playwright install chromium` çalıştırın.

```sh
npm run typecheck
npm test
npm run build
node scripts/prepare-production.mjs
docker compose up -d --build
npm run test:e2e
node scripts/lighthouse.mjs
```

Yerel production kontrolü: `http://127.0.0.1:18742`. Compose mevcut `npm-net` Docker ağına bağlanır; başka sunucuda bu ağı oluşturun veya Compose'u o sunucunun proxy ağına uyarlayın. Ayrıntılar: [Deployment](docs/DEPLOYMENT.md).

## Lara’nın sayfası ve oyun molası

Öncelik derslerdir. Ana sayfa (`#home`) Lara’nın tanıtım kartıyla açılır; hemen ardından günün dersi ve öğrenme adaları gelir. Oyunlar kenarda kalır: ana sayfanın alt sırasındaki küçük “Oyun molası” kartı ve menünün son sırasındaki bağlantıyla açılır. Yalnız oyun oynamaya gelen biri de oraya doğrudan ulaşabilir. Tanıtım metni `content/profile.ts` dosyasından gelir. Site herkese açıktır: soyadı, okul, adres, telefon veya konum bilgisi eklemeyin. `favorites` alanı sevdiklerini, `drawings` alanı `public/galeri/` altına konan resimleri gösterir; ikisi de boşken görünmez. Fotoğraf eklenecekse konum (EXIF) bilgisini önce silin.

Oyun molası (`#games`, `#game/<id>`) dört eğitici oyun içerir:

- **Eşini bul:** İngilizce kelime–resim, onluk-birlik–sayı ve toplama–sonuç desteleriyle hafıza oyunu.
- **Balon patlat:** toplama, çıkarma, onluk-birlik, ritmik sayma ve karşılaştırma turları.
- **Piko’yu eve götür:** ok kartlarıyla yol tarifi yazılan altı bölümlük kodlama oyunu.
- **Harf treni:** resimdeki kelimeyi Türkçe harf vagonlarıyla kurma.

Oyunlarda süre ve yarış yoktur. Yanlış seçim ipucu verir. Oyun sonuçları (`progress.games`: oynama sayısı, en iyi sonuç, son tarih) yıldızlara ve müfredat puanına karışmaz; yedeğe dahildir. Başarı bahçesindeki “Oyun kâşifi” rozeti her oyundan bir tur bitirilince açılır. Teknik adlar (`laranin-dersleri` imajı, `lara-dersleri` container'ı, `lara-*` depolama anahtarları) geriye dönük uyum için değişmemiştir.

## Öğrenme deneyimi

Öğren → birlikte yap → bağımsız dene → mini oyun → beş adımlı değerlendirme → beceri geri bildirimi. Onluk/birlik blokları, grupla/ayır, hareketli sayı doğrusu, kelime kartları, saat, para, parça-bütün, cetvel, grafik, trafik sahnesi, yol haritası, çizim ve renk karışımı, ritim, tempo ve ses karşılaştırma ve ekran dışı hareket görevleri çalışır. Parmağı kullanmak istemeyen çocuk aynı işlemleri büyük düğmelerle yapabilir. Azaltılmış hareket tercihi desteklenir.

Etkileşim yenilemesi: Saatin akrep ve yelkovanı doğrudan sürüklenir ve birbirine bağlı ilerler. Onluk çubukları on eş hücreden oluşur. Şekiller döndürülür, köşeleri işaretlenir, parçalar bir modele yerleştirilir ve simetri deseni tamamlanır. Türkçe kartları parmakla/klavyeyle yeniden sıralanır; noktalama işaretleri cümleye bırakılır. Sanat alanındaki şekiller sonradan taşınabilir. `tests/e2e/manipulatives.spec.ts` bu araçları fare, dokunma ve klavye ile denetler.

Tek dokunuşluk yanıtlar (seçenekler, trafik sahnesi, ince/kalın ses, tempo, noktalama işareti, dört vuruşluk ritim, tamamlanan şekil modeli, “Yaptım/Anlattım”) dokunulduğu anda kontrol edilir; ayrıca “Kontrol et”e basılmaz. Yanlış denenen seçenek ✗ ile kapanır ve bir daha sayılmaz, doğru olan ✓ ile yeşil kalır; telefonda geri bildirim ve devam düğmesi görünür alana kayar. Sayı kurma, sıralama, saat, para, grafik, kesir ve ayna gibi düzeltilebilen yapımlarda çocuk hazır olunca “Kontrol et”e basar; aynı yanlış cevap değiştirilmeden yeniden gönderilemez.

Sesler cihazda Web Audio ile üretilir, dosya indirilmez: doğru cevapta kısa bir zil, yanlışta yumuşak iki nota, çözüm gösterilince sakin bir ton, ders ve oyun sonunda küçük bir fanfar; blok, kart, şekil parçası, para, sayı doğrusu ve saatte kısa dokunma sesleri, ritimde el çırpma. Ses yeni cihazlarda açık başlar; üst çubuktaki hoparlör düğmesi hepsini kapatır ve tercih cihazda saklanır.

İlk yanıt değerlendirilir; yanlış cevap ipucu verir. Üçüncü denemede açıklama/çözüm gösterilir. Yardımlı doğru ile bağımsız doğru ayrılır. Bir dersin tamamlanması otomatik olarak tüm kazanımın edinildiğini göstermez. Açık uçlu yazı, konuşma, çizim ve hareket öz bildirimdir; yapay bir otomatik not verilmez. Bunlar ebeveyn gözlemiyle desteklenmelidir.

Her beceri için başlangıç puanı 0; bağımsız doğru +12, yardımlı doğru +3, yanlış −8; 0–100 sınırı. İlk yanıt kayıtları tekilleştirilir. 0–39, 40–69, 70–100 aralıklarında üç zorluk seviyesi vardır. Tekrar zamanı zorlanmada 1, başarıda 3, güçlü başarıda 7 gün sonradır. Kaçırılan gün cezası yoktur.

## Mimari ve içerik ekleme

- `app/`: statik Next.js kabuğu, metadata ve responsive stil.
- `components/World.tsx`: ana ekran, adalar, başarı bahçesi, PWA ve cihaz kaydı.
- `components/LessonPlayer.tsx`: altı aşamalı ders motoru.
- `components/GamePlayer.tsx`, `components/games/`: oyun sayfası ve dört oyun; stilleri `app/games.css`.
- `components/activities/`: yeniden kullanılabilir öğrenme araçları.
- `content/{math,tr,life,english,creative}/`: özgün anlatımlar, hikâyeler, senaryolar.
- `content/profile.ts`, `content/games.ts`: Lara’nın tanıtımı ve oyun listesi.
- `lib/questions.ts`: deterministik, yaş ve sayı sınırları olan soru üreticileri.
- `lib/progress.ts`: cevap değerlendirme, uyarlama, tekrar ve doğrulanmış yedek modeli.
- `lib/games.ts`: saf ve test edilen oyun mantığı (desteler, balon turları, kod bölümleri, harf treni).
- `lib/turkish.ts`: rakamla yazılan sayılara doğru Türkçe ek (5’ten, 2’şer, 6’ya).
- `curriculum/grade-2.json`: kaynağı izlenebilen 241 farklı çıktı.
- `curriculum/source-baseline.json`: 39 resmî tema sayfasının kod listeleri ve SHA-256 özetleri.
- `scripts/`: müfredat kontrolü, production paketleme, sertifika yenileme, canlı güncelleme testi ve Lighthouse.

Yeni konu için ilgili `content/` dosyasına `Lesson` ekleyin. `id` kalıcı ve benzersiz olmalı; değiştirmek eski ilerlemeyi yeni konuya otomatik taşımaz. `outcomes` yalnızca doğrulanmış kayıtlardaki kodlardan oluşmalıdır. `learn` kısa anlatım adımlarını, `questions` özgün soru havuzunu veya `generator` üretici seçimini içerir. Her soru ipucu ve açıklama içerir.

Yeni ders için `SubjectId`, `content/subjects.ts`, içerik modülü ve `content/index.ts` güncellenir. Önce resmî kaynak kaydı eklenir. Yeni sınıf için ayrı `curriculum/grade-N.json` ve sınıf seçimi eklenebilir; grade ve academicYear veri modelindedir, 2. sınıf verileri üzerine yazılmaz.

Yeni oyun için `content/games.ts` listesine kayıt, `lib/games.ts` içine test edilebilir mantık, `components/games/` altına bileşen ve `GamePlayer.tsx` içine bağlantı eklenir. Oyun bileşeni `onFinish(score)` çağırır; `better` alanı düşük mü yüksek mi skorun iyi olduğunu belirtir.

Yeni etkinlik tipi için `ActivityType` birliği, tipli soru üreticisi ve `Activity.tsx` bileşen kaydı eklenir. Yanıt bileşeni `onAnswer(değer)` ile motorla haberleşir; son dokunuş kararın kendisiyse `onAnswer(değer, true)` çağırır ve tip `Activity.tsx` içindeki `instant` listesine eklenir. Seçenekler için `Choices` bileşeni ✓/✗ durumlarını hazır verir. Yanıtı bileşen puanlamaz. Erişilebilir yönerge, düğme/klavye alternatifi, disabled durumu ve gerekirse çözüm gösterimi bulunmalıdır. [Mimari ayrıntıları](docs/ARCHITECTURE.md).

## Müfredatı güncelleme

```sh
npm run curriculum:update
```

Bu komut MEB'e salt okunur istekler gönderir. Raporu tarihli `curriculum/reviews/` klasöründe oluşturur; mevcut onaylı veriyi **silmez veya değiştirmez**. HTTP hataları başarı sayılmaz. Değişiklikleri karşılaştırın; kod, sınıf, tema ve süreç bileşenlerini pedagojik olarak inceleyin. Ardından kaynak JSON'unu ve gerekiyorsa etkinlikleri düzenleyip test edin. Baseline ancak bu incelemeden sonra yeni raporun hash/kod bilgileriyle yenilenir. Kaynak metnini otomatik etkinliğe dönüştürme veya ders kitabını kopyalama yapılmaz. [Müfredat notları](docs/CURRICULUM.md).

## Ebeveyn, gizlilik, backup/restore

Ebeveyn Alanı ilk girişte bu cihaza özel 4–8 rakamlı PIN oluşturur. PIN rastgele tuz ile SHA-256 olarak saklanır. Bu kilit çocuk arayüzünden yanlışlıkla geçişi önler; cihaz sahibi veya geliştirici araçlarına karşı kimlik doğrulama sınırı değildir. PIN unutulduğunda yalnız `lara-parent-pin-v1` kaydı silinebilir; `lara-progress-v1` silinmemelidir.

İlerleme `localStorage` içinde kalır, sunucuya gönderilmez. Ebeveyn Alanı → Yedek ve gizlilik → **İlerlemeyi Yedekle** JSON indirir. **Yedeği Geri Yükle** boyut/sürüm/yapı/tarih/puan doğrulaması ve önizleme yapar. Onaylanan yüklemeden önce mevcut veri indirilir. PIN yedeğe girmez. Son 5.000 soru kaydı tutulur; toplam beceri sayımları saklanır. Tarayıcı verileri temizlenmeden yedek alın. Cihazlar arası otomatik senkronizasyon yoktur.

Sesli okuma cihazda uygun **yerel** Türkçe/İngilizce ses varsa kullanılabilir. Yoksa metin ve görsel alternatif gösterilir; bulut TTS'ye metin gönderilmez. Konuşma kaydı/mikrofon, konum veya kamera kullanılmaz. Yazı etkinliği metni kalıcı tutulmaz. Çizim yalnız indirme düğmesiyle dosyaya dönüşür. Hosting/DNS/TLS ağ altyapısının bağlantı işlemesi uygulama verisinden ayrıdır.

## PWA ve güncelleme

`prepare-production.mjs`, derlenmiş dosyalardan hash sürümlü Service Worker, PNG ikonlar ve hash tabanlı CSP üretir. İlk başarılı kurulumda tüm temel uygulama, içerik, font ve statik dosyalar cache'e alınır. Yeni sürüm otomatik olarak açık dersi kesmez; güncelle düğmesiyle etkinleştirilir. Yeni cache hazır olmadan eski cache silinmez. Mobil Safari'de Paylaş → Ana Ekrana Ekle; Android'de yükle menüsü kullanılabilir.

## Doğrulama

Son yayın ve etkileşim test sonuçları: [docs/VALIDATION.md](docs/VALIDATION.md).

Unit testler: yanıt, puan, tekrar, uyarlama, tamamlama, yedek doğrulama, soru üretici sınırları, Türkçe sayı ekleri, oyun mantığı ve müfredat ilişkileri. E2E: dört oyunun baştan sona oynanışı, tam matematik akışı, kalıcı ilerleme, ebeveyn kilidi/yedek, ders rotaları, offline açılış ve 360×800, 390×844, 768×1024, 1024×768, 1280×720, 1920×1080 ekranlarında Axe taraması. Lighthouse raporları `artifacts/` altında oluşturulur. Tarayıcı testleri gerçek cihaz ergonomisi veya öğretmen değerlendirmesinin yerine geçmez.
