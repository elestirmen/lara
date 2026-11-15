# Görev 2: parantezli cümleleri yeniden üret ve bütün sesleri konuşma tanımayla denetle

Bu dosya, proje bilgisayarındaki Claude Code oturumu içindir (ilk görev: `GOREV.md`; senin notun: `uretim-notu.txt`).
Kullanıcı Türkçe yazar; yanıtlar Türkçe ve kısa olsun. Kurallar `GOREV.md` ile aynı.

## Sunucuda bulunan sorun

Üretilen 19.834 sesin hepsi açılıyor, hiçbirinde uzun duraklama yok. Ama içinde parantez olan 705 cümle bozuk:
Ahenk `(…)` biçimini yönerge sandığı için parantezi ve çoğu zaman cümlenin geri kalanını okumuyor (ör. “mor” kelimesindeki
ünsüz (sessiz) harflerin hepsine dokun → 1,8 sn). Atlanan 8 cümle de bunlardan. Sunucu şimdilik bu 705 cümleyi eski sesle
okuyor; diğer 19.137 ses yayına hazırlanıyor.

`uret.py` güncellendi (sunucudaki depoda `tts/pc/uret.py`, paylaşımda `lara-ses\uret.py`): modele giden yazımda
“ünlü (sesli) harf” → “ünlü, yani sesli, harf” olur, yalnız işaret içeren parantez (“Nokta (.).”) atılır. Bir de `--tohum N`
seçeneği var: aynı cümleyi farklı tohumla üretir. Dosya adları değişmedi (anahtar yine sunucudaki metnin sha256'sı).

## 1. Parantezli cümleler

1. Paylaşımdaki yeni `uret.py`'yi yerel kopyanın (`E:\lara-ses\uret.py`) üstüne al ve `lara-ses\duzelt\liste.json`'u
   yerele kopyala (ör. `E:\lara-ses\duzelt\liste.json`).
2. `uret.py --dene --liste E:\lara-ses\duzelt\liste.json` → `duzelt\deneme` klasöründe 5 örnek. `*-duz.m4a` dosyalarının
   parantezi “yani …” diye okuduğunu konuşma tanımayla (aşağıdaki 2. bölümdeki araçla) ya da kullanıcıya dinleterek doğrula.
3. `uret.py --adim 16 --liste E:\lara-ses\duzelt\liste.json --cikti E:\lara-ses\duzelt\cikti` (705 cümle; iki paralel iş
   istersen önceki gibi böl). Çıktıyı sunucuda `lara-ses/duzelt/cikti/` klasörüne gönder (eşitleme betiğinle, yarım dosya
   görünmeden).

## 2. Bütün sesleri konuşma tanımayla denetle

Hiçbir ses kulakla tek tek dinlenmedi; parantez sorunu yalnız süre ölçümüyle tesadüfen bulundu. Sayıların, eklerin ya da
tırnaklı cümlelerin yanlış ya da eksik okunduğu başka durumlar olabilir. Bunu ölç:

- Bütün sesler: `cikti\*.m4a` (19.834; parantezlilerin eski hâlleri hariç tutulabilir) ve `duzelt\cikti\*.m4a`.
- Konuşma tanıma: Whisper (ör. `openai/whisper-large-v3` ya da `-turbo`, transformers ile, var olan CUDA torch'uyla;
  dil `turkish`). m4a dosyalarını PyAV ile 16 kHz mono diziye çevirip ver (ffmpeg gerekmesin).
- Karşılaştırma: beklenen metin = `uret.model_text(t)` (modele giden yazım). İki tarafı da `trnorm.normalize_for_eval`
  ile düzleştir ve harf hata oranı (CER = Levenshtein uzaklığı / beklenen uzunluk) hesapla.
- Çıktı: `lara-ses\denetim.json` = `[{"k": …, "t": …, "cer": 0.03, "asr": "…"}]`, CER'e göre azalan sıralı. Kullanıcıya ve
  bana dağılımı yaz (ortanca, %95, CER > 0,10 / 0,20 sayısı) ve en kötü 15 örneği göster.
- Eşiği dağılıma göre seç (Whisper'ın kendi hatası da sayılara ve tek harflere yansır; “a, e, ı” gibi harf listelerinde
  yüksek CER normal olabilir). Eşiği aşanları `--tohum 100` ile yeniden üret (`--cikti` ayrı bir klasör, ör. `yeniden\cikti`),
  yeniden ölç; her cümlede CER'i daha düşük olan hâli tut ve sunucudaki `lara-ses/yeniden/cikti/` klasörüne gönder.
- Bitince `uretim-notu.txt`'ye bir “Görev 2” eki yaz: kaç cümle yeniden üretildi, hâlâ eşiğin üstünde kalanlar (`denetim.json`
  içinde işaretle) ve yazdığın denetim betiğinin yolu. Betiği `lara-ses\denetle.py` olarak paylaşıma da koy ki depoya girsin.
