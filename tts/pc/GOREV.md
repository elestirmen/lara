# Görev: Lara'nın Dünyası seslerini bu bilgisayarda Ahenk ile üret

Bu dosya, güçlü proje bilgisayarındaki Claude Code oturumu içindir. Kullanıcı Türkçe yazar; yanıtlar Türkçe ve kısa olsun.

## Bağlam

Lara'nın Dünyası (https://lara.perinet.org), kullanıcının 8 yaşındaki kızı için bir ders sitesidir. Türkçe metinler
sunucuda (`192.168.1.81`, ekran kartı yok) önceden üretilmiş seslerle okunuyor; kullanıcı mevcut sesi beğenmedi.
Daha kaliteli ama ekran kartı isteyen **Ahenk** (VoxCPM2 2B + Türkçe LoRA, kadın ses, CC BY 4.0;
https://huggingface.co/ozgurguler/ahenk-tts-tr) ile bütün cümleler bu bilgisayarda üretilecek ve sunucudaki
paylaşılan klasöre yazılacak. Sunucudaki Claude oturumu dosyaları oradan alıp sitenin önbelleğine aktaracak.

Paylaşılan klasör (Samba): `\\192.168.1.81\medyaDisk\lara-ses` (ev ağı dışından Tailscale ile `\\100.73.105.36\medyaDisk\lara-ses`).
İçindekiler:

- `uret.py`: üretim betiği (sunucuda sahte sesle sınandı; gerçek modelle hiç çalıştırılmadı).
- `liste.json`: `deneme` (11 zor cümle) ve `cumleler` (19.842 cümle; önem sırasında, `{"k": sha256, "t": metin}`).
- `OKU.md`: kullanıcı için elle kurulum adımları (Windows PowerShell). Komutlar orada.

## Yapılacaklar

1. **Ekran kartını denetle:** `nvidia-smi`. Ekran kartında başka bir iş (ör. model eğitimi) çalışıyorsa ya da boş bellek
   ~8 GB'tan azsa başlamadan önce kullanıcıya sor; onun işini durdurma.
2. **Ortamı kur:** Ayrı bir sanal ortam (ör. `~/lara-ses-venv`, Python 3.10–3.12) kullan; sistem Python'una ya da başka
   projelerin ortamlarına dokunma. Paketler `OKU.md` 2. adımda: önce CUDA'lı torch (`--index-url
   https://download.pytorch.org/whl/cu128` ya da kartın sürücüsüne uyan), sonra VoxCPM (sabit sürüm
   `f0c787f0937dc1c9a8f4f64d9a332d9c5da2e629`), `soundfile scipy av`, sonra Ahenk deposundan `trnorm`. Kurulumdan sonra
   `torch.cuda.is_available()` `True` olmalı (VoxCPM kurulumu torch'u CPU sürümüyle değiştirirse torch'u yeniden kur).
3. **Deneme:** `python \\192.168.1.81\medyaDisk\lara-ses\uret.py --dene` (Linux'ta paylaşımı bağlayıp o yolu ver).
   İlk çalıştırmada model iner. `deneme` klasörüne her cümlenin `duz`, `neseli`, `sakin`, `duz-10adim` hâlleri yazılır;
   satırlarda “hız” = üretim süresi / ses süresi. Kullanıcıya klasörün yerini, ortalama hızı ve tahmini toplam süreyi
   (toplam yaklaşık 20 saatlik ses × hız) bildir. Kullanıcı dinleyip hâli (düz / neşeli / sakin) ve adım sayısını
   (16 ya da 10) seçsin.
4. **Bütün cümleler:** Seçime göre, ör. `python …\uret.py --duygu cheerful --adim 10` (düz için `--duygu` verme,
   sakin `calm`). Uzun sürer (birkaç gece olabilir); oturum kapansa da sürmesi için arka planda/ayrı süreçle başlat.
   Bilgisayarın uykuya geçmesini kapatmak gerekirse kullanıcıya sor. Betik yarıda kalırsa aynı komutla kaldığı yerden sürer.
5. **Bitince** kullanıcıya bildir: kaç ses üretildi, `cikti\atlanan.txt` içinde kaç cümle var.

## Kurallar

- Yalnız `lara-ses` klasörüne yaz; `liste.json`'u değiştirme. Çıktı adlarına dokunma: sunucu dosyayı `cikti/<k>.m4a`
  adından tanır.
- `uret.py` bu bilgisayarda çalışmazsa (kütüphane sürümü, Windows'a özgü sorun) düzeltebilirsin. Yaptığın her değişikliği
  aynı klasördeki `uret-degisiklik.txt` dosyasına neden/ne olarak yaz ki sunucudaki depoya da işlensin. Model çağrısını
  (cfg 2.0, trnorm, `normalize=False`, `pause_clean.clean`) model kartının hızlı başlangıç kodundan ayırma.
- İlerleme `lara-ses\uret.log` dosyasına da yazılır; sunucu oradan izler.
- Sır, parola ya da token yazdırma; başka paylaşımlara ya da sunucudaki başka klasörlere dokunma.
