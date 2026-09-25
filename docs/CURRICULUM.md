# Müfredat kaynağı ve kapsam

Hedef: 2026–2027 eğitim öğretim yılında 2. sınıf. Kontrol tarihi: 24 Eylül 2026.

TYMM portalındaki sınıf seçiminin URL değeri `3`, **2. sınıfı** ifade eder; 3. sınıf verisi olarak yorumlanmamalıdır. Resmî sayfa başlıkları ve çıktı kodları ayrıca kontrol edilmiştir.

| Ders | Tema/alan | Farklı çıktı | Resmî kaynak |
|---|---:|---:|---|
| Matematik | 6 | 25 | https://tymm.meb.gov.tr/ogretim-programlari/ilkokul-matematik-dersi/3 |
| Türkçe | 8 | 20 | https://tymm.meb.gov.tr/ogretim-programlari/ilkokul-turkce-dersi/3 |
| Hayat Bilgisi | 6 | 23 | https://tymm.meb.gov.tr/ogretim-programlari/hayat-bilgisi-dersi/3 |
| İngilizce | 6 | 138 | https://tymm.meb.gov.tr/ogretim-programlari/ingilizce-dersi-temel-egitim/3 |
| Görsel Sanatlar | 7 | 11 | https://tymm.meb.gov.tr/ogretim-programlari/gorsel-sanatlar-dersi-temel-egitim/3 |
| Müzik | 2 | 12 | https://tymm.meb.gov.tr/ogretim-programlari/muzik-dersi-temel-egitim/3 |
| Beden Eğitimi ve Oyun | 4 | 12 | https://tymm.meb.gov.tr/ogretim-programlari/beden-egitimi-ve-oyun-dersi/3 |

Toplam 39 tema/öğrenme alanı, 241 benzersiz kod. Türkçe becerileri temalar boyunca tekrarlandığı için temalardaki kayıt sayılarının toplamı farklı çıktı sayısından fazladır. `source-baseline.json` tema başına kod eşlemesini korur. `grade-2.json` benzersiz kod başına kısa özgün beceri özeti içerir. Her kayıtta sınıf, ders, tema, beceriler, kaynak adı/bağlantısı, yıl, son kontrol tarihi ve değerlendirme türü bulunur. Konu/etkinlik eşlemesi `content` modüllerinin `outcomes` alanındadır.

## Doğrulanan önemli sınırlar

- Sayılar 100'e kadar, onluk/birlik çözümleme iki basamaklıdır. Tahmin etkinliği nesnelerde 50'yi geçmez.
- İkişer ritmik sayma 20, üçer 30, dörder 40, beşer 100 sınırındadır.
- Bütün/yarım/çeyrek modelle işlenir; pay/payda gösterimi öğretilmez.
- Çarpma ve bölme resmî 2. sınıf programındadır. Eş gruplar ve tekrar eden toplamayla somutlaştırılır.
- Tam, yarım ve çeyrek saatler kullanılır.
- İngilizce altıncı tema “Life in the City & the World” başlığında **yiyecek ve öğünleri** içerir. Başlığa bakarak ulaşım içeriği üretilmemiştir.
- Normal ilkokul için Müzik ve Beden Eğitimi programları seçilmiştir; müzik okullarının ayrı “Beden Eğitimi, Oyun ve Müzik” programı kullanılmaz.

## Kaynak hiyerarşisi

Birincil kaynak TYMM'deki onaylı program ve ilgili çıktı sayfalarıdır. Aynı Müzik programı `mufredat.meb.gov.tr` üzerinde de yayımlanmıştır. MEB ders kitabı kataloğu TYMM ders ana sayfalarından ulaşılabilir. Kitap sayfaları, uzun metinleri veya telifli görseller uygulamaya kopyalanmaz. Ders anlatımları, hikâyeler, SVG rehber ve sorular özgündür. Resmî programın sözcüğü sözcüğüne aktarımı yerine kodlarla izlenebilir kısa özetler kullanılır. Bu ürün MEB tarafından geliştirilmiş veya onaylanmış bir yazılım iddiasında bulunmaz.

## Güncelleme ve inceleme

`npm run curriculum:update`, 7 sınıf dizinini ve tema sayfalarını getirir. Çıktı bölümünden 2. sınıf kodlarını ayrıştırır, normalize edilmiş bölümün SHA-256 özetini baseline ile karşılaştırır. Yeni/değişmiş kayıtları raporlar. Ağ, 500 veya ayrıştırma hatası rapora yazılır ve komut başarısız çıkar; bu durum doğrulama tarihini değiştirmez. Rapor tarihli ayrı klasörde kalır. Eski onaylı veri değişmez.

Editörün incelemesi: sınıf/yıl uygulaması, kodlar, süreç bileşenleri, sayısal sınırlar, soru eşlemesi, telif ve yaş uygunluğu. Değişen kodlarda eski ilerlemeye sessizce yeni anlam yüklenmez; sürümlü bir migration gerekir. Kaynak tarihini sadece kontrol tamamlanınca güncelleyin.

## Ölçüm sınırı

Uygulama bir kişisel pratik ortamıdır. Programdaki her çıktı sistemde kayıtlıdır; tüm süreç bileşenlerini tam olarak ölçen bir okul değerlendirmesi değildir. Etkinlik bulunmayan çıktılar kaynak ekranında görünür. Konuşma, yazı, gerçek nesnelerle çalışma, sosyal davranış, sanat ve fiziksel hareket için öğretmen/ebeveyn gözlemi gereklidir. Dijital ortam bir çizimin sanatsal değerini veya fiziksel hareketin doğru yapıldığını otomatik değerlendirmez.
