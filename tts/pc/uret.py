"""Lara'nın Dünyası: cümle seslerini Ahenk ile (VoxCPM2 2B + LoRA, Türkçe kadın ses) güçlü bir bilgisayarda üretir.

NVIDIA ekran kartı gerekir. Kurulum ve adımlar: OKU.md.

    python uret.py --dene          # 11 örnek cümle; düz / neşeli / sakin ve 10 adımlı hızlı sürüm: deneme klasörüne
    python uret.py                 # liste.json'daki bütün cümleler: cikti klasörüne
    python uret.py --duygu cheerful --adim 10

Yarıda kesilirse (Ctrl+C, kapanma) aynı komut kaldığı yerden sürer: hazır dosyalar atlanır.
Çıktı: cikti/<sha256(metin)>.m4a (AAC-LC, 48 kb/sn, mono). Sunucu dosyaları metne göre kendi önbelleğine aktarır.

Ahenk (https://github.com/ozguradmin/ahenk-turkish-tts), CC BY 4.0.
"""
import argparse
import hashlib
import json
import os
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
DUYGU = {'duz': '', 'neseli': 'cheerful', 'sakin': 'calm'}


def options():
    p = argparse.ArgumentParser(description="Lara'nın Dünyası seslerini Ahenk ile üretir.")
    p.add_argument('--dene', action='store_true', help='yalnız örnek cümleleri üret (deneme klasörü)')
    p.add_argument('--duygu', default='', help="'' (düz), cheerful, calm … ya da Türkçe bir yönerge")
    p.add_argument('--adim', type=int, default=16, help='inference_timesteps: 16 (model kartı) ya da daha hızlı 10')
    p.add_argument('--liste', default=str(HERE / 'liste.json'))
    p.add_argument('--cikti', default=None, help='varsayılan: listenin yanındaki cikti klasörü')
    p.add_argument('--sahte', action='store_true', help='model yüklemeden bip sesiyle dene (betiği sınamak için)')
    p.add_argument('--cpu', action='store_true', help='ekran kartı yoksa yine de dene (çok yavaş)')
    return p.parse_args()


def ahenk(cpu: bool):
    """Model kartındaki (huggingface.co/ozgurguler/ahenk-tts-tr) hızlı başlangıç kodu; metin önce trnorm ile okunuş biçimine çevrilir."""
    import numpy as np
    import torch
    if not torch.cuda.is_available() and not cpu:
        sys.exit('Ekran kartı (CUDA) görünmüyor. OKU.md 3. adımdaki torch kurulumunu ve "torch.cuda.is_available()" denetimini yap.')
    from huggingface_hub import snapshot_download
    from voxcpm import VoxCPM
    from voxcpm.model.voxcpm import LoRAConfig
    from trnorm import normalize
    repo = snapshot_download('ozgurguler/ahenk-tts-tr', allow_patterns=['lora_*', '*.py', 'instructions_tr.json'])
    sys.path.insert(0, repo)
    from instruction_pick import compose, pick
    from pause_clean import clean
    config = json.loads(Path(repo, 'lora_config.json').read_text(encoding='utf-8'))['lora_config']
    tts = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False, optimize=False,
                                 lora_config=LoRAConfig(**config), lora_weights_path=repo)
    rate = tts.tts_model.sample_rate

    def say(text: str, emotion: str, seed: int, steps: int):
        torch.manual_seed(seed)
        plain = text.replace('’', "'").replace(',.', '.')  # trnorm düz kesme işaretini tanır; “19,.” gibi biten diziler noktayla biter
        instruction, spoken, _ = pick(emotion, normalize(plain), 'auto')
        wav = tts.generate(text=compose(instruction, spoken), cfg_value=2.0, inference_timesteps=steps, normalize=False)
        return np.asarray(clean(np.asarray(wav), rate)[0], dtype=np.float32).reshape(-1), len(spoken)

    return say, rate


def fake():
    """Betiği sınamak için: metnin uzunluğunda bip sesi; '…' görünce 3 sn susar (takılma denetimini dener)."""
    import numpy as np
    rate = 48000

    def say(text: str, emotion: str, seed: int, steps: int):
        seconds = max(0.6, len(text) / 12)
        t = np.arange(int(rate * seconds)) / rate
        audio = (0.3 * np.sin(2 * np.pi * 220 * t) * (np.sin(2 * np.pi * 3 * t) > -0.6)).astype(np.float32)
        if '…' in text and seed % 2 == 0:
            audio = np.concatenate([audio[:rate], np.zeros(rate * 3, np.float32), audio[rate:]])
        return audio, len(text)

    return say, rate


# ---- Takılma denetimi (sunucudaki tts/server.py ile aynı ölçü) ----
PAUSE = 1.2


def quiet_runs(audio, rate):
    import numpy as np
    size = int(rate * 0.02)
    count = len(audio) // size
    if not count:
        return size, []
    energy = np.sqrt((audio[:count * size].reshape(count, size) ** 2).mean(axis=1))
    flags = list(energy <= max(0.01, float(energy.max()) * 0.04)) + [False]
    runs, start = [], None
    for i, q in enumerate(flags):
        if q and start is None:
            start = i
        elif not q and start is not None:
            runs.append((start, i))
            start = None
    return size, runs


def longest_quiet(audio, rate) -> float:
    return max((b - a for a, b in quiet_runs(audio, rate)[1]), default=0) * 0.02


def tighten(audio, rate, keep: float = 0.3):
    import numpy as np
    size, runs = quiet_runs(audio, rate)
    k, parts, at = int(keep / 0.02), [], 0
    for a, b in runs:
        if (b - a) * 0.02 > PAUSE:
            parts.append(audio[at:(a + k) * size])
            at = (b - k) * size
    parts.append(audio[at:])
    return np.concatenate(parts)


def make(say, rate, text: str, emotion: str, steps: int):
    """Üç tohumla dener: süresi metne uygun ve içinde uzun sessizlik olmayan ilk ses alınır;
    hiçbiri temiz değilse en kısa duraklamalısının uzun sessizlikleri kısaltılır. Uygun ses yoksa None."""
    seed = int(hashlib.sha256(text.encode()).hexdigest()[:6], 16)
    best = None
    for attempt in range(3):
        audio, letters = say(text, emotion, seed + attempt, steps)
        expected = max(0.6, letters / 12)
        gap = longest_quiet(audio, rate)
        short = tighten(audio, rate) if gap > PAUSE else audio
        seconds = len(short) / rate
        if not 0.4 * expected - 0.3 <= seconds <= 2.2 * expected + 1.5:
            continue
        if gap <= PAUSE:
            return audio
        if best is None or gap < best[0]:
            best = (gap, short)
    return best[1] if best else None


def write_m4a(audio, rate: int, path: Path):
    """Ses düzeyi eşitlenir (tepe 0,9) ve AAC-LC m4a yazılır; dosya önce .tmp adıyla yazılıp sonra adlandırılır ki yarım dosya kalmasın."""
    import av
    import numpy as np
    peak = float(np.abs(audio).max()) or 1.0
    pcm = (np.clip(audio * (0.9 / peak), -1, 1) * 32767).astype(np.int16)
    tmp = path.with_name(path.name + '.tmp')
    with av.open(str(tmp), 'w', format='mp4', options={'movflags': 'faststart'}) as out:
        stream = out.add_stream('aac', rate=rate)
        stream.bit_rate = 48000
        stream.layout = 'mono'
        frame = av.AudioFrame.from_ndarray(pcm.reshape(1, -1), format='s16', layout='mono')
        frame.sample_rate = rate
        for part in av.AudioResampler(format='fltp', layout='mono', rate=rate).resample(frame):
            for packet in stream.encode(part):
                out.mux(packet)
        for packet in stream.encode(None):
            out.mux(packet)
    os.replace(tmp, path)


def clock(seconds: float) -> str:
    seconds = int(seconds)
    return f'{seconds // 3600} sa {seconds % 3600 // 60:02d} dk' if seconds >= 3600 else f'{seconds // 60} dk {seconds % 60:02d} sn'


def main():
    o = options()
    data = json.loads(Path(o.liste).read_text(encoding='utf-8'))
    started = time.time()
    say, rate = fake() if o.sahte else ahenk(o.cpu)
    print(f'Model hazır ({clock(time.time() - started)}).', flush=True)

    if o.dene:
        folder = Path(o.liste).parent / 'deneme'
        folder.mkdir(exist_ok=True)
        variants = [(name, emotion, o.adim) for name, emotion in DUYGU.items()] + [('duz-10adim', '', 10)]
        for i, text in enumerate(data['deneme'], 1):
            for name, emotion, steps in variants:
                t0 = time.time()
                audio = make(say, rate, text, emotion, steps)
                spent = time.time() - t0
                if audio is None:
                    print(f'{i:02d} {name}: üretilemedi | {text}', flush=True)
                    continue
                write_m4a(audio, rate, folder / f'{i:02d}-{name}.m4a')
                print(f'{i:02d} {name:11s} {len(audio) / rate:4.1f} sn ses, {spent:5.1f} sn sürdü (hız {spent / (len(audio) / rate):.2f}) | {text}', flush=True)
        print(f'BİTTİ: {folder}', flush=True)
        return

    folder = Path(o.cikti) if o.cikti else Path(o.liste).parent / 'cikti'
    folder.mkdir(parents=True, exist_ok=True)
    items = data['cumleler']
    todo = [x for x in items if not (folder / f"{x['k']}.m4a").exists()]
    total_letters = sum(len(x['t']) for x in todo)
    print(f'{len(items)} cümle, {len(items) - len(todo)} hazır, {len(todo)} üretilecek. Çıktı: {folder}', flush=True)
    skipped = open(folder / 'atlanan.txt', 'a', encoding='utf-8')
    t0, done_letters, audio_seconds = time.time(), 0, 0.0
    for i, x in enumerate(todo, 1):
        try:
            audio = make(say, rate, x['t'], o.duygu, o.adim)
        except KeyboardInterrupt:
            raise
        except Exception as error:  # tek cümlenin hatası bütün işi durdurmasın
            audio = None
            print(f'HATA {type(error).__name__}: {error} | {x["t"]}', flush=True)
        if audio is None:
            skipped.write(x['t'] + '\n')
            skipped.flush()
        else:
            write_m4a(audio, rate, folder / f"{x['k']}.m4a")
            audio_seconds += len(audio) / rate
        done_letters += len(x['t'])
        if i % 20 == 0 or i == len(todo):
            spent = time.time() - t0
            left = spent / done_letters * (total_letters - done_letters)
            print(f'{i}/{len(todo)} | {audio_seconds / 60:.0f} dk ses, {clock(spent)} geçti, hız {spent / max(audio_seconds, 1):.2f}, kalan ~{clock(left)}', flush=True)
    print('BİTTİ', flush=True)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\nDurduruldu. Aynı komutla kaldığın yerden sürer.')
