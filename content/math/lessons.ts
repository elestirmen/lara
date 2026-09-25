import type {Lesson,ActivityType} from '@/lib/types';
import curriculum from '@/curriculum/grade-2.json';
const entries:[string,string,string,string,ActivityType,string[]][]=[
 ['blocks','Onluk ve birlik atölyesi','2.1.2','🧱','baseTenBlocks',['On küçük birlik birleşince bir onluk olur.','24 sayısı, 2 onluk ve 4 birliktir. Blokları alana taşı; sonra birlikte sayalım.']],
 ['count','Yüze kadar keşif','2.1.1','🔎','baseTenBlocks',['Nesneleri onarlı gruplamak saymayı kolaylaştırır.','Önce onlukları, sonra tek kalan birlikleri say.']],
 ['order','Sayıların yolu','2.1.3','🛤️','numberLine',['Sayı doğrusunda sağa gittikçe sayılar büyür.','32, 35’ten önce gelir. 35, 30 ile 40’ın tam ortasındadır.']],
 ['skip','Zıplayarak sayalım','2.1.4','🐸','numberLine',['Her zıplayış aynı büyüklükte olsun.','İkişer sayarken 2, 4, 6, 8 deriz. Geri giderken sayılar küçülür.']],
 ['pattern','Örüntü dedektifi','2.1.5','🔮','ordering',['Örüntüde bir kural tekrar eder.','3, 6, 9… Her adımda 3 eklenir. Sıradaki sayı 12 olur.']],
 ['estimate','Bir bakışta tahmin','2.1.6','🍒','choice',['Tahmin etmek, saymadan önce yaklaşık bir sayı düşünmektir.','Önce küçük bir gruba bak. Kaç böyle grup var? Tahminini sayarak kontrol et.']],
 ['fractions','Paylaşım pikniği','2.1.7','🍕','fractions',['Bir bütünü iki eş parçaya bölersen her parça yarımdır.','Dört eş parçanın her biri çeyrektir. İki çeyrek bir yarım eder.']],
 ['money','Minik pazar','2.1.8','🪙','money',['Paranın üzerinde değeri yazar. Parça sayısı ile değer aynı şey değildir.','İki tane 50 kuruş, 100 kuruş eder. 100 kuruş da 1 liradır.']],
 ['clock','Saat ustası','2.1.9','🕒','clock',['Kısa kol akrep saati, uzun kol yelkovan dakikayı gösterir.','Yelkovan 12’deyse tam saat, 6’daysa buçuktur. 3’te çeyrek geçer, 9’da çeyrek kalır.']],
 ['calendar','Takvim yolculuğu','2.1.9','📅','ordering',['Bir hafta 7 gündür. Bir yılda 12 ay ve 4 mevsim vardır.','Günleri sırayla söylemek plan yaparken işimize yarar.']],
 ['measure','Ölçü atölyesi','2.1.10','📏','measure',['Karışlarımız farklı büyüklükte olabilir. Aynı masayı farklı sayıda karış ölçebiliriz.','Cetvelde herkes için aynı santimetreler vardır. Ölçmeye sıfır çizgisinden başla.']],
 ['length','Önce tahmin, sonra ölç','2.1.11','✏️','measure',['Bir kalemin uzunluğunu ölçmeden önce tahmin et.','Cetveli sıfıra hizala. Ölçüm ile tahminini karşılaştır; yakın mıydı?']],
 ['add','Bloklarla toplama','2.2.1','➕','baseTenBlocks',['Toplamak iki grubu bir araya getirmektir.','24 ile 13 birleşince 3 onluk ve 7 birlik olur: 37. On birlik birikirse bir onluğa dönüştürebilirsin.']],
 ['subtract','Geriye zıplayalım','2.2.1','➖','numberLine',['Çıkarmak, bir gruptan bir kısmını ayırmaktır.','9’dan 3 çıkarırken sayı doğrusunda 3 adım geri gideriz: 8, 7, 6.']],
 ['mental','Aklımdaki kısa yol','2.2.2','💭','numberLine',['10’a tamamlamak zihinden toplamayı kolaylaştırır.','8 + 5 için önce 8’e 2 ekle: 10. Kalan 3’ü ekle: 13.']],
 ['inverse','İşlem ailesi','2.2.3','🔄','choice',['Toplama ile çıkarma birbirini kontrol eder.','12 + 5 = 17 ise 17 − 5 = 12 olur. Aynı üç sayı bir ailedir.']],
 ['multiply','Eş gruplar bahçesi','2.2.4','🌼','choice',['3 saksının her birinde 2 çiçek olsun. 2 + 2 + 2 = 6.','3 tane 2’yi kısa yoldan 3 × 2 diye yazarız.']],
 ['divide','Eşit paylaşalım','2.2.4','🧺','choice',['Bölmek, eşit gruplara paylaştırmak olabilir.','8 çileği 2 tabağa eşit paylaştırınca her tabakta 4 çilek olur.']],
 ['multimental','Grupları aklımda tutarım','2.2.5','🌻','choice',['5 tane 2’yi, ikişer sayarak bulabilirsin.','10’u iki eş gruba ayırınca her grupta 5 olur. İşlemler birbirine yardım eder.']],
 ['balance','Dengeyi bul','2.2.6','⚖️','choice',['Eşittir işareti iki tarafın aynı değerde olduğunu söyler.','4 + 3 = 5 + 2. İki tarafta da toplam 7 var.']],
 ['solids','Şekiller çevremizde','2.3.1','📦','geometry',['Bir top küreye, bir zar küpe benzer.','Cisimlerin yüzlerine bak: yuvarlak mı, düz mü? Bir kutunun yüzlerinde hangi şekiller var?']],
 ['build','Küplerden kent','2.3.2','🏙️','geometry',['Cisimleri üst üste veya yan yana koyarak yapılar oluşturabiliriz.','Küp çizimlerini uygun yerlere taşı, bir yapı kur. Gerçekte de oyuncak bloklarla deneyebilirsin.']],
 ['shapes','Şekillerden bir dünya','2.3.3','🔺','geometry',['Bir kare ile bir üçgen bir evin çizimine dönüşebilir.','Daireleri, üçgenleri ve dörtgenleri yerlerine taşı; parçaları bir modele dönüştür.']],
 ['rotate','Dönen şekiller','2.3.4','🔷','geometry',['Bir kareyi döndürünce yine karedir.','Büyüklüğü ve yönü değişse de dört eş kenarı ve dört köşesi kalır.']],
 ['liquid','Bardak bardak ölçelim','2.3.5','🥛','choice',['Bir sürahiyi kaç bardak su doldurur? Önce tahmin et.','Karşılaştırma yaparken aynı büyüklükte bardaklar kullan.']],
 ['directions','Piko eve dönüyor','2.3.6','🧭','ordering',['Bir yol tarifi hem yönü hem kaç adım gideceğini söyler.','Önce yolu gözünle izle. Sağa iki, yukarı bir adım gibi sırayla anlat.']],
 ['symmetry','Aynadaki şekiller','2.3.7','🦋','geometry',['Bir şekli uygun yerinden katlayınca iki taraf üst üste geliyorsa simetriyi buldun.','Kelebeğin iki kanadını düşün. Bir taraf, diğerinin aynadaki görüntüsü gibidir.']],
 ['graph','Sınıfın meyve sepeti','2.4.1','📊','graph',['Bir soru sor, cevapları topla, sonra bir grafik yap.','Grafikte her meyve resmi bir cevabı gösterir. En çok hangi meyve seçilmiş?']]
];
export const mathLessons:Lesson[]=entries.map(([id,title,code,icon,kind,learn])=>{const outcome=curriculum.find(x=>x.learningOutcomeCode===`MAT.${code}`)!;return {id:`math-${id}`,subject:'math',theme:outcome.theme,title,subtitle:learn[0],icon,minutes:8,outcomes:[`MAT.${code}`],learn,kind,generator:id}});
