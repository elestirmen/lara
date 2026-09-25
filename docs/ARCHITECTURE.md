# Mimari

Uygulama statik dışa aktarılır. Sunucuda Node süreci veya veri tabanı çalışmaz; container içindeki Nginx yalnız dosya sunar. Dış reverse proxy mevcut Nginx Proxy Manager'dır. Hesap, API ve gizli istemci değeri yoktur.

## Veri akışı

`Lesson → makeQuestion(seed, index, difficulty) → Activity → LessonPlayer → recordAttempt → localStorage`

İçerik, etkileşim ve değerlendirme birbirinden ayrıdır. `makeQuestion` bir seed ile tekrar üretilebilir; rastgelelik test edilebilir. `Activity` yalnız seçimi bildirir. Motor ilk gönderimi bir kez kaydeder, ipucu/yanlış tekrarlarını başarı diye saymaz. Ders sonunda `completeLesson` ayrı tamamlanma kaydı oluşturur. Soruların `skill` alanı gerçek `learningOutcomeCode` anahtarıdır.

Hash gezintisi tek statik belge içinde çalışır. Ders motoru ve ebeveyn alanı gerektiğinde dinamik yüklenir; ana sayfa bunların JavaScript kodunu ilk açılışta çalıştırmaz. Service Worker derlemedeki tüm yerel parçaları, yazı tiplerini ve içerik paketlerini önbelleğe alır. Böylece daha önce ziyaret edilmemiş bir ders de kurulum tamamlandıktan sonra çevrim dışı açılır. Yeni büyük medya eklenirse önbellek bütçesi yeniden değerlendirilmelidir.

## Somut öğrenme araçları

- `BaseTenBlocks`: on eş hücreli SVG çubuklar; sürükleme, dokunma, onluk oluşturma ve ayırma. Dönüşümlerde miktar değişmez. Ayrı öğretim animasyonu on birliği bir çubukta toplar.
- `ClockTool`: iki bağımsız tutma halkası; Pointer Events ile fare, kalem ve dokunma desteği. Tek bir toplam-dakika değeri iki kolun mekanik ilişkisini korur. Kollar bırakılınca en yakın çeyrek saate oturur. Ok tuşları ve etiketli seçim alanları alternatif kontroldür.
- `GeometryLab`: SVG düzlemsel şekiller/cisim çizimleri, döndürme/boyut değiştirme/köşe işaretleme, doğrulanan şekil yerleştirme ve kareli ayna yansıması. Cisim çizimleri fiziksel 3B nesnenin yerini tuttuğunu iddia etmez.
- `LanguageTools`: parmakla ve klavyeyle yeniden sıralanabilen kartlar; cümle sonuna taşınabilen noktalama. Editörün onayladığı alternatif Türkçe sözcük sıraları `acceptedAnswers` ile kabul edilir.
- `NumberLine`: işaretler ve karakter aynı piksel koordinat sistemindedir; karakteri görünür tutmak için yatay alan kaydırılır.
- `Drawing`: serbest çizgi/nokta, şekil ekleme, parmakla veya yön düğmeleriyle taşıma, SVG indirme. Çizim bellekte tutulur; kişisel veriler sunucuya aktarılmaz.

Saf geometri/sayı dönüşümleri `lib/manipulatives.ts` içinde test edilir. Pointer capture sürüklemeyi ekran dışına çıkan bir imleçte de güvenilir biçimde bitirir; tüm temel sürükleme görevlerinde tıklama/klavye alternatifi vardır. Hareket azaltma tercihi geçişleri kapatır, etkinliğin işlevini değiştirmez.

Kart taşıma, hedef kartın sol/sağ yarısına göre yerleştirme aralığını hesaplar. Sürükleme sonundaki sentetik tıklama bastırılır; sonraki gerçek dokunuş veya klavye aktivasyonu bastırılmaz. Telefon görünümünde birlikler beş sütunlu onluk çerçeve oluşturur; dokunma düğmeleri en az 44 pikseldir. Şekil ölçeği piksel tabanlıdır ve kapsayıcı genişliğiyle sınırlandırılır; kaydırıcı bütün ekranlarda görünür boyut değiştirir.

Öğren aşamasındaki geometri seçimleri puan kaydetmeden açıklama verir. Saatin serbest keşif görünümünde değerlendirme düğmesi gösterilmez. Öz bildirim sonuçları otomatik ölçülmüş becerilerden ayrı sunulur; gözlem görevinin puan üretmemesi çocuğa başarısızlık geri bildirimi olarak yansıtılmaz.

## İlerleme doğruluğu

Yeterlilik puanı bir eğitimsel gösterge olup resmî not değildir. Müfredat yüzdesi, tüm kayıtlı ders çıktıları payda olacak şekilde, en az beş değerlendirmesi bulunan ve yeterliliği 70 veya üzeri olan otomatik ölçülebilir çıktıları sayar. Gözlem gerektiren çıktılar otomatik kazanıldı sayılmaz. Konu sayısı bu yüzden müfredat yüzdesinden farklıdır.

Her konu bağımsız beceri kanıtı sunmaz; kaynak ekranı etkinlik bulunmayan çıktıları açıkça etiketler. Öz bildirim görevleri tamamlanabilir fakat ustalık puanı üretmez. Tek soru üzerinden başarı rozeti veya müfredat kazanımı oluşturulmaz.

## Depolama sınırları

İlerleme JSON şeması sürüm 1'dir. İçe aktarma anahtarları, sayısal aralıklar, tarih alanları, doğru/yanıt ilişkisi ve dosya boyutunu kontrol eder. Prototype pollution anahtarları reddedilir. Okunamayan mevcut veri otomatik silinmez veya üstüne yazılmaz. Kota sorunu kullanıcıya bildirilir; mevcut oturumdaki ilerleme yedeklenebilir. `storage` olayı diğer sekmelerin son kaydını yansıtır; eşzamanlı aktif iki sekmede öğrenme birincil kullanım değildir.

## Erişilebilirlik ve ses

HTML düğmeleri, görünen odak halkaları, semantik başlıklar, canlı geri bildirim, large touch targets ve reduced-motion vardır. Sürükleme eylemlerinin dokunma/klavye alternatifi bulunur. Çizim yüzeyinde klavyeden eklenebilir şekiller vardır. Yönerge sesleri sadece kullanıcı isteğiyle oynatılır. Yerel ses yoksa metin alternatifi korunur. Web Audio sesleri cihazda sentezlenir.

## Güvenlik

CSP iç satır scriptleri derleme anındaki SHA-256 özetleriyle sınırlar. `unsafe-eval` ve script için `unsafe-inline` yoktur. Stillerde React'in dinamik görsel konumlarını desteklemek için inline stil izni vardır. Frame, MIME, referrer, HSTS ve izin başlıkları sunucuda uygulanır. Container dosya sistemi salt okunur, uygulama portu loopback'tir. Proxy erişimi Docker ağı üzerinden gerçekleşir. Veriler hiçbir endpoint'e POST edilmez.
