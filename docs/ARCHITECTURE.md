# Mimari

Uygulama statik dışa aktarılır. Sunucuda Node süreci veya veri tabanı çalışmaz; container içindeki Nginx yalnız dosya sunar. Dış reverse proxy mevcut Nginx Proxy Manager'dır. Hesap, API ve gizli istemci değeri yoktur.

## Veri akışı

`Lesson → nextQuestion(seed, index, difficulty, seen) → makeQuestion → Activity → LessonPlayer → recordAttempt → localStorage`

İçerik, etkileşim ve değerlendirme birbirinden ayrıdır. `makeQuestion` bir seed ile tekrar üretilebilir; rastgelelik test edilebilir. Sonlu havuzlar (Hayat Bilgisi durumları, kelimeler, cisimler, modeller, bilgi soruları) `pick` destesinden gelir: aynı turdaki her soru sırası destede farklı bir öğe alır. `LessonPlayer` turda gösterilen soruların kimliklerini (`questionKeys`, öğren ekranındaki keşif dahil) tutar. `nextQuestion` çakışmada önce yalnız sayıları yeniden çeker, sürerse destede sıradaki öğeye geçer. Kimlik bir sorunun özüdür, örneğin blokta sayı, tahminde sayı ve resim, çarpmada gruplar ve kap. Böylece aynı sayı iki farklı cümleyle de tekrar etmez. `Activity` yalnız seçimi bildirir; tek dokunuşluk etkinlikler seçimi `check` bayrağıyla bildirir ve motor o anda kontrol eder (`instant` listesi). Yanlış denenen cevaplar motorda tutulur: seçenek ✗ ile kapanır, yapım etkinliğinde aynı cevap değiştirilmeden yeniden gönderilemez. Motor ilk gönderimi bir kez kaydeder, ipucu/yanlış tekrarlarını başarı diye saymaz. Ders sonunda `completeLesson` ayrı tamamlanma kaydı oluşturur. Soruların `skill` alanı gerçek `learningOutcomeCode` anahtarıdır.

Hash gezintisi tek statik belge içinde çalışır. Ders motoru, oyun oynatıcı ve ebeveyn alanı gerektiğinde dinamik yüklenir; ana sayfa bunların JavaScript kodunu ilk açılışta çalıştırmaz. Yeni sayfalar da hash rotası olarak eklenir: ayrı HTML sayfaları için `prepare-production.mjs` yalnız `index.html` script özetlerini CSP'ye koyduğundan, nginx `try_files` `$uri.html` içermediğinden ve Service Worker yalnız `/` sayfasını önbelleğe aldığından üçünün de güncellenmesi gerekir. Service Worker derlemedeki tüm yerel parçaları, yazı tiplerini, görselleri (`.webp`) ve içerik paketlerini önbelleğe alır. Böylece daha önce ziyaret edilmemiş bir ders de kurulum tamamlandıktan sonra çevrim dışı açılır. Önbellek 25 Eylül 2026 itibarıyla 79 dosya, yaklaşık 1,9 MB’tır (kil görseller iki boyutuyla ~790 KB, yazı tipleri ~165 KB; önceki sürüm 33 dosya, ~1,1 MB). Yeni büyük medya eklenirse önbellek bütçesi yeniden değerlendirilmelidir; görseller gösterildikleri boyutun iki katından büyük olmamalıdır.

## Somut öğrenme araçları

- `BaseTenBlocks`: on eş hücreli SVG çubuklar; sürükleme, dokunma, onluk oluşturma ve ayırma. Dönüşümlerde miktar değişmez. Ayrı öğretim animasyonu on birliği bir çubukta toplar.
- `ClockTool`: iki bağımsız tutma halkası; Pointer Events ile fare, kalem ve dokunma desteği. Tek bir toplam-dakika değeri iki kolun mekanik ilişkisini korur. Kollar bırakılınca en yakın çeyrek saate oturur. Ok tuşları ve etiketli seçim alanları alternatif kontroldür.
- `GeometryLab`: SVG düzlemsel şekiller/cisim çizimleri, döndürme/boyut değiştirme/köşe işaretleme, doğrulanan şekil yerleştirme ve kareli ayna yansıması. Cisim çizimleri fiziksel 3B nesnenin yerini tuttuğunu iddia etmez.
- `LanguageTools`: parmakla ve klavyeyle yeniden sıralanabilen kartlar; cümle sonuna taşınabilen noktalama. Editörün onayladığı alternatif Türkçe sözcük sıraları `acceptedAnswers` ile kabul edilir.
- `NumberLine`: işaretler ve karakter aynı piksel koordinat sistemindedir; karakteri görünür tutmak için yatay alan kaydırılır.
- `Drawing`: serbest çizgi/nokta, şekil ekleme, parmakla veya yön düğmeleriyle taşıma, SVG indirme. Çizim bellekte tutulur; kişisel veriler sunucuya aktarılmaz.

Saf geometri/sayı dönüşümleri `lib/manipulatives.ts` içinde test edilir. Pointer capture sürüklemeyi ekran dışına çıkan bir imleçte de güvenilir biçimde bitirir; tüm temel sürükleme görevlerinde tıklama/klavye alternatifi vardır. Hareket azaltma tercihi geçişleri kapatır, etkinliğin işlevini değiştirmez.

Kart taşıma, hedef kartın sol/sağ yarısına göre yerleştirme aralığını hesaplar. Sürükleme sonundaki sentetik tıklama bastırılır; sonraki gerçek dokunuş veya klavye aktivasyonu bastırılmaz. Telefon görünümünde birlikler beş sütunlu onluk çerçeve oluşturur; dokunma düğmeleri en az 44 pikseldir. Şekil ölçeği piksel tabanlıdır ve kapsayıcı genişliğiyle sınırlandırılır; kaydırıcı bütün ekranlarda görünür boyut değiştirir.

Öğren aşamasındaki geometri seçimleri puan kaydetmeden açıklama verir. Saat soru görünümünde başlangıç saatini de bildirir; ayrı “Bu saati seç” onayı yoktur, çocuk kolları ayarlayıp “Kontrol et”e basar. Öz bildirim sonuçları otomatik ölçülmüş becerilerden ayrı sunulur; gözlem görevinin puan üretmemesi çocuğa başarısızlık geri bildirimi olarak yansıtılmaz.

## Oyun molası

Öncelik derslerdir; oyunlar ana sayfanın alt sırasındaki küçük bir kart ve menünün son bağlantısıyla açılan yan bölümdür.

`Game → lib/games.ts (seed ile üretim) → components/games/* → onFinish(score) → recordGame → localStorage`

Oyun mantığı saf fonksiyonlardadır ve birim testleriyle doğrulanır: her destede her eş tam iki kez bulunur, her balon turunda doğru cevap tek ve seçenekler arasındadır, her kod bölümünün kayıtlı çözümü eve ulaşır, harf treninde ipucu doğru başlangıcı korur. Oyunlar süre tutmaz ve sürekli hareket eden hedef kullanmaz; balonlar tur başında bir kez yükselip durur. Oyun kaydı yalnız oynama sayısı ve en iyi sonuçtur; müfredat becerisi, yıldız veya tekrar zamanı üretmez.

## İlerleme doğruluğu

Yeterlilik puanı bir eğitimsel gösterge olup resmî not değildir. Müfredat yüzdesi, tüm kayıtlı ders çıktıları payda olacak şekilde, en az beş değerlendirmesi bulunan ve yeterliliği 70 veya üzeri olan otomatik ölçülebilir çıktıları sayar. Gözlem gerektiren çıktılar otomatik kazanıldı sayılmaz. Konu sayısı bu yüzden müfredat yüzdesinden farklıdır.

Her konu bağımsız beceri kanıtı sunmaz; kaynak ekranı etkinlik bulunmayan çıktıları açıkça etiketler. Öz bildirim görevleri tamamlanabilir fakat ustalık puanı üretmez. Tek soru üzerinden başarı rozeti veya müfredat kazanımı oluşturulmaz.

## Depolama sınırları

İlerleme JSON şeması sürüm 1'dir. İçe aktarma anahtarları, sayısal aralıklar, tarih alanları, doğru/yanıt ilişkisi ve dosya boyutunu kontrol eder. Prototype pollution anahtarları reddedilir. Okunamayan mevcut veri otomatik silinmez veya üstüne yazılmaz. Kota sorunu kullanıcıya bildirilir; mevcut oturumdaki ilerleme yedeklenebilir. `storage` olayı diğer sekmelerin son kaydını yansıtır; eşzamanlı aktif iki sekmede öğrenme birincil kullanım değildir.

## Erişilebilirlik ve ses

HTML düğmeleri, görünen odak halkaları, semantik başlıklar, canlı geri bildirim, large touch targets ve reduced-motion vardır. Sürükleme eylemlerinin dokunma/klavye alternatifi bulunur. Çizim yüzeyinde klavyeden eklenebilir şekiller vardır. Yönerge sesleri sadece kullanıcı isteğiyle oynatılır. Yerel ses yoksa metin alternatifi korunur. Web Audio sesleri cihazda sentezlenir: `lib/audio.ts` içindeki `sfx(açık, ad)` doğru/yanlış/çözüm/bitiş ve dokunma seslerini, `tone` etkinlik içeriğindeki ince/kalın ve tempo seslerini üretir. İçerik sesleri harmonikli dalgayla çalınır; böylece kalın ses telefon hoparlöründe de duyulur ve iki ses aynı güçte kalır. Sesler yalnız dokunuşa yanıt olarak çalar, çakıştıklarında tepe seviyesi 0,6'yı geçmez. Soru çözülünce odak “Devam edelim” düğmesine geçer; yanlış denenen seçenek `aria-disabled` olur, böylece klavyedeki odak kaybolmaz.

## Güvenlik

CSP iç satır scriptleri derleme anındaki SHA-256 özetleriyle sınırlar. `unsafe-eval` ve script için `unsafe-inline` yoktur. Stillerde React'in dinamik görsel konumlarını desteklemek için inline stil izni vardır. Frame, MIME, referrer, HSTS ve izin başlıkları sunucuda uygulanır. Container dosya sistemi salt okunur, uygulama portu loopback'tir. Proxy erişimi Docker ağı üzerinden gerçekleşir. Veriler hiçbir endpoint'e POST edilmez.
