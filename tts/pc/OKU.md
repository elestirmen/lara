# Lara'nın Dünyası sesleri: güçlü bilgisayarda üretim (Ahenk)

Sesler bu bilgisayarda Ahenk ile (VoxCPM2 2B + Türkçe LoRA, kadın ses) üretilir, sunucudaki paylaşılan klasöre
yazılır; sunucu onları kendi önbelleğine aktarır. Komutlar Windows PowerShell içindir.

Paylaşılan klasör: `\\192.168.1.81\medyaDisk\lara-ses` (evin dışındaysan `\\100.73.105.36\medyaDisk\lara-ses`).
İçinde `uret.py`, `liste.json` (19.842 cümle) ve bu dosya var.

## 1. Gerekenler

- NVIDIA ekran kartı. Model kartı bellek miktarını yazmıyor; 2 milyar parametreli model için tahminen en az 8 GB,
  rahat çalışması için 12 GB ve üstü.
- Birkaç GB boş disk (model ilk çalıştırmada indirilir) ve internet.
- Python 3.11: https://www.python.org/downloads/ → kurarken “Add python.exe to PATH” kutusunu işaretle.

## 2. Ortamı kur (bir kez)

PowerShell'i aç ve sırayla çalıştır:

```powershell
py -3.11 -m venv $HOME\lara-ses-venv
$py = "$HOME\lara-ses-venv\Scripts\python.exe"
& $py -m pip install --upgrade pip
& $py -m pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu128
& $py -m pip install https://github.com/OpenBMB/VoxCPM/archive/f0c787f0937dc1c9a8f4f64d9a332d9c5da2e629.zip soundfile scipy av
& $py -m pip install https://github.com/ozguradmin/ahenk-turkish-tts/archive/refs/heads/main.zip
```

Ekran kartını gördüğünü denetle (`True` ve kartın adı yazmalı):

```powershell
& $py -c "import torch; print(torch.cuda.is_available(), torch.cuda.get_device_name(0))"
```

`False` yazarsa torch'u yeniden kur:
`& $py -m pip install --force-reinstall torch torchaudio --index-url https://download.pytorch.org/whl/cu128`

## 3. Deneme (yaklaşık 10–30 dakika)

Yeni bir PowerShell açtıysan önce `$py = "$HOME\lara-ses-venv\Scripts\python.exe"` satırını yeniden çalıştır.

```powershell
& $py \\192.168.1.81\medyaDisk\lara-ses\uret.py --dene
```

İlk çalıştırmada model iner. Sonra `lara-ses\deneme` klasöründe 11 cümlenin dört hâli oluşur:
`düz`, `neşeli`, `sakin` ve hızlı `düz-10adim`. Ekrandaki “hız” sayısı, 1 saniyelik sesin kaç saniyede
üretildiğidir. Dinle ve şunları söyle: hangi hâl (düz / neşeli / sakin), 10 adım yetiyor mu, hız kaç çıktı.

## 4. Bütün cümleler

Seçimine göre (örnek: neşeli, 10 adım):

```powershell
& $py \\192.168.1.81\medyaDisk\lara-ses\uret.py --duygu cheerful --adim 10
```

- `--duygu`: düz için yazma; neşeli `cheerful`, sakin `calm`.
- Cümleler önem sırasıyla üretilir: önce hikâyeler, anlatımlar ve sabit sorular, sonra en sık çıkan değişken
  cümleler. Yarıda bırakılsa bile en çok duyulanlar hazır olur.
- Toplam yaklaşık 20 saatlik ses. Model kartına göre A100 kartta 1 saniyelik ses 2,3 saniyede üretiliyor (16 adım);
  yani iş birkaç gece sürebilir. Ekranda kalan süre tahmini yazar.
- Durdurmak için Ctrl+C. Aynı komut kaldığı yerden sürer. Bilgisayarın uykuya geçmesini kapat.
- Üretilemeyen cümleler `cikti\atlanan.txt` dosyasına yazılır; sunucu onları kendisi üretir.

Bitince (ya da arada) haber ver; sunucu hazır olan sesleri önbelleğe aktarır.

## Lisans

Ahenk (https://github.com/ozguradmin/ahenk-turkish-tts), CC BY 4.0. Model, Alania Turkish Synthetic Speech ve
Alania Turkish Domain Text (PatientDesk AI, CC BY 4.0) verileriyle eğitilmiştir. Sitede bu satır anılır.
