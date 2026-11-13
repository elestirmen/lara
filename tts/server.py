#!/usr/bin/env python3
"""Lara'nın Dünyası seslendirme servisi.

GET /ses?t=<metin>        → AAC ses (audio/mp4). Metin en çok 400 karakterdir; aynı metin bir kez üretilir,
                            sonra diskteki önbellekten verilir.
GET /ses?t=<metin>&p=1    → ön hazırlık: ses önbellekte yoksa arka planda sıraya alınır ve 202 döner (ses gönderilmez).
GET /saglik               → "ok"

python server.py --warm liste.json   → listedeki metinleri sırayla üretip önbelleğe yazar (önceden üretim).

Ses motoru SES_ENGINE ile seçilir:
  yazgi  yazgı-tts-1 (Apache-2.0), kadın ses “female-01”; doğal ama bu sunucuda yavaş (cümle süresinin ~1,4 katı),
         bu yüzden sabit metinler önceden üretilir.
  piper  Piper tr_TR-dfki-medium (erkek ses); çok hızlı, yedek seçenek.

Site bu adresi kendi nginx'i üzerinden çağırır; servis port açmaz ve internete çıkamaz.
"""
import collections, hashlib, json, os, re, sys, tempfile, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

ENGINE = os.environ.get('SES_ENGINE', 'piper')
VOICE = os.environ.get('SES_VOICE', 'female-01')
MODEL = os.environ.get('SES_MODEL', '/voices/tr_TR-dfki-medium.onnx')
WEIGHTS = os.environ.get('SES_WEIGHTS') or None
CACHE = os.environ.get('SES_CACHE', '/cache')
CACHE_LIMIT = int(os.environ.get('SES_CACHE_MB', '1500')) * 1024 * 1024
LENGTH_SCALE = float(os.environ.get('SES_LENGTH_SCALE', '1.08'))  # yalnız piper: 1'den büyük = biraz daha yavaş
THREADS = int(os.environ.get('SES_THREADS', '3'))
BITRATE = int(os.environ.get('SES_BITRATE', '48000'))
PORT = int(os.environ.get('SES_PORT', '8090'))
MAX_CHARS = 400
READABLE = re.compile(r'[0-9A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]')

ORDINALS = ['sıfırıncı', 'birinci', 'ikinci', 'üçüncü', 'dördüncü', 'beşinci', 'altıncı', 'yedinci', 'sekizinci', 'dokuzuncu', 'onuncu']
LETTERS = {'A': 'a', 'B': 'be', 'C': 'ce', 'Ç': 'çe', 'D': 'de', 'E': 'e', 'F': 'fe', 'G': 'ge', 'Ğ': 'yumuşak ge', 'H': 'he', 'I': 'ı', 'İ': 'i', 'J': 'je', 'K': 'ke', 'L': 'le', 'M': 'me', 'N': 'ne', 'O': 'o', 'Ö': 'ö', 'P': 'pe', 'R': 're', 'S': 'se', 'Ş': 'şe', 'T': 'te', 'U': 'u', 'Ü': 'ü', 'V': 've', 'Y': 'ye', 'Z': 'ze', 'Q': 'ku', 'W': 'çift ve', 'X': 'iks'}


def normalize(text: str, engine: str = ENGINE) -> str:
    """Ekrandaki yazıyı okunacak hâle getirir: işlem işaretleri, saat, boşluk çizgisi ve tek harfler söze çevrilir,
    okunmayan simgeler atılır. Sayıları ve ekleri yazgi kendi okur; piper için kesme işaretleri ve sıra sayıları da çevrilir."""
    t = text.strip()
    t = re.sub(r'_{2,}', ' boşluk ', t)
    t = re.sub(r'(\d+)\.00\b', r'\1', t)              # saat 4.00 → 4
    t = re.sub(r'(\d+)\.(\d\d)\b', r'\1 \2', t)       # saat 4.30 → dört otuz
    t = re.sub(r'\s\?\s', ' kaç ', t)                 # 19 + ? = 25
    t = re.sub(r'\s\?(?=[.,]|$)', ' kaç', t)
    for sign, word in ((' + ', ' artı '), (' − ', ' eksi '), (' - ', ' eksi '), (' × ', ' çarpı '), (' x ', ' çarpı '), (' ÷ ', ' bölü '), (' = ', ' eşittir '), (' < ', ' küçüktür '), (' > ', ' büyüktür ')):
        t = t.replace(sign, word)
    t = re.sub(r'(?<=[a-zçğıöşü])\s*-\s*(?=[a-zçğıöşü])', ', ', t)   # ke-le-bek → ke, le, bek
    t = t.replace('→', ', ').replace('|', ', ').replace('…', '. ').replace('/', ', ')
    # Tek başına duran büyük harf, harfin adıyla okunur: “K harfinden” → “ke harfinden”, “C’den” → “ce’den”.
    t = re.sub(r'(?<![0-9A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû’\'])([A-ZÇĞİÖŞÜ])(?![0-9A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû])', lambda m: LETTERS.get(m.group(1), m.group(1)), t)
    if engine == 'piper':
        t = re.sub(r'[“”"«»]', '', t)
        t = re.sub(r"(?<=\w)[’'](?=\w)", '', t)      # Lara’nın → Laranın, 6’dan → 6dan
        t = t.replace('’', '').replace("'", '')
        t = re.sub(r'\b(\d|10)\. (?=[a-zçğıöşü])', lambda m: ORDINALS[int(m.group(1))] + ' ', t)
        t = re.sub(r'[^0-9A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû .,;:!?()%]', ' ', t)
    else:
        t = re.sub(r'[^0-9A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû .,;:!?()%’\'“”"-]', ' ', t)
    t = re.sub(r'\s+([.,;:!?])', r'\1', t)
    return re.sub(r'\s+', ' ', t).strip()


def cache_path(text: str) -> str:
    voice = VOICE if ENGINE == 'yazgi' else f'{os.path.basename(MODEL)}|{LENGTH_SCALE}'
    key = hashlib.sha256(f'{ENGINE}|{voice}|{BITRATE}|{text}'.encode()).hexdigest()
    return os.path.join(CACHE, key[:2], key + '.m4a')


def prune():
    """Önbellek sınırı aşılınca en uzun süredir istenmeyen dosyaları siler."""
    files = []
    for root, _, names in os.walk(CACHE):
        for name in names:
            path = os.path.join(root, name)
            try:
                stat = os.stat(path)
                files.append((stat.st_mtime, stat.st_size, path))
            except OSError:
                pass
    total = sum(size for _, size, _ in files)
    for _, size, path in sorted(files):
        if total <= CACHE_LIMIT * 0.9:
            break
        try:
            os.remove(path)
            total -= size
        except OSError:
            pass


def encode_aac(samples, rate: int) -> bytes:
    """16 bit mono sesi AAC-LC (m4a) yapar; dosya başlığı öne alınır ki tarayıcı hemen çalabilsin."""
    import av
    fd, path = tempfile.mkstemp(suffix='.m4a')
    os.close(fd)
    try:
        with av.open(path, 'w', format='mp4', options={'movflags': 'faststart'}) as out:
            stream = out.add_stream('aac', rate=rate)
            stream.bit_rate = BITRATE
            stream.layout = 'mono'
            frame = av.AudioFrame.from_ndarray(samples.reshape(1, -1), format='s16', layout='mono')
            frame.sample_rate = rate
            for part in av.AudioResampler(format='fltp', layout='mono', rate=rate).resample(frame):
                for packet in stream.encode(part):
                    out.mux(packet)
            for packet in stream.encode(None):
                out.mux(packet)
        with open(path, 'rb') as f:
            return f.read()
    finally:
        try:
            os.remove(path)
        except OSError:
            pass


class Piper:
    def __init__(self):
        import onnxruntime
        if hasattr(onnxruntime, 'disable_telemetry_events'):
            onnxruntime.disable_telemetry_events()
        from piper import PiperVoice, SynthesisConfig
        self.voice = PiperVoice.load(MODEL)
        self.config = SynthesisConfig(length_scale=LENGTH_SCALE)

    def pcm(self, text: str):
        import numpy as np
        data, rate = b'', 22050
        for chunk in self.voice.synthesize(text, syn_config=self.config):
            data += chunk.audio_int16_bytes
            rate = chunk.sample_rate
        return np.frombuffer(data, dtype=np.int16), rate


class Yazgi:
    """yazgı-tts-1. Üretim rastgelelik içerir; tohum metinden türetilir ki aynı metin hep aynı sesi versin.
    Ses süresi metne göre beklenenden çok kısa ya da çok uzunsa ya da içinde uzun bir sessizlik varsa (model takılmış
    olabilir) başka tohumla yeniden denenir. İki noktadan sonra gelen kısa harf ya da hece listelerinde (“… indi: a, ra, ba.”)
    model susup kalabiliyor; bu yüzden son denemeler iki nokta yerine virgülle yapılır."""

    def __init__(self):
        import torch
        torch.set_num_threads(THREADS)
        from yazgi_tts import YazgiTTS, RATE
        from yazgi_tts.frontend import normalize as spoken
        self.tts, self.rate, self.spoken = YazgiTTS(root=WEIGHTS), RATE, spoken

    def pcm(self, text: str):
        import numpy as np
        expected = max(0.6, len(self.spoken(text)) / 11.5)  # bu ses saniyede yaklaşık 11–12 harf okur
        seed = int(hashlib.sha256(text.encode()).hexdigest()[:6], 16)
        plain = re.sub(r'\s*:(?=\s)', ',', text)
        tries = [(text, seed), (text, seed + 1)] + ([(plain, seed), (plain, seed + 1)] if plain != text else [(text, seed + 2)])
        for words, s in tries:
            audio = np.asarray(self.tts.say(words, voice=VOICE, seed=s), dtype=np.float32)
            seconds, gap = len(audio) / self.rate, self.silence(audio)
            if 0.5 * expected - 0.2 <= seconds <= 1.9 * expected + 1.5 and gap <= 3:
                return (np.clip(audio, -1, 1) * 32767).astype(np.int16), self.rate
        raise ValueError(f'ses süresi tutarsız: {seconds:.1f} sn (en uzun sessizlik {gap:.1f} sn), beklenen ~{expected:.1f} sn')

    def silence(self, audio) -> float:
        """Sesteki en uzun sessiz aralık, saniye (20 ms'lik dilimlerin enerjisine göre)."""
        import numpy as np
        size = int(self.rate * 0.02)
        count = len(audio) // size
        if not count:
            return 0.0
        energy = np.sqrt((audio[:count * size].reshape(count, size) ** 2).mean(axis=1))
        quiet = energy <= max(0.01, float(energy.max()) * 0.04)
        longest = run = 0
        for q in quiet:
            run = run + 1 if q else 0
            longest = max(longest, run)
        return longest * 0.02


class Speaker:
    """Önbellek + tek seferde tek üretim. Dinleme istekleri ön hazırlık kuyruğunun önüne geçer."""

    def __init__(self):
        self.engine = Yazgi() if ENGINE == 'yazgi' else Piper()
        self.lock = threading.Lock()
        self.waiting = 0              # ses bekleyen dinleme isteği sayısı
        self.queue = collections.deque(maxlen=8)   # ön hazırlık: en yeni metin önce, eskiler düşer
        self.made = 0
        threading.Thread(target=self.background, daemon=True).start()

    def cached(self, text: str):
        path = cache_path(text)
        try:
            with open(path, 'rb') as f:
                data = f.read()
            os.utime(path)
            return data
        except OSError:
            return None

    def make(self, text: str) -> bytes:
        data = self.cached(text)
        if data:
            return data
        samples, rate = self.engine.pcm(text)
        data = encode_aac(samples, rate)
        path = cache_path(text)
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            tmp = f'{path}.{os.getpid()}.{threading.get_ident()}.tmp'
            with open(tmp, 'wb') as f:
                f.write(data)
            os.replace(tmp, path)
            self.made += 1
            if self.made % 300 == 0:
                prune()
        except OSError:
            pass
        return data

    def audio(self, text: str) -> bytes:
        data = self.cached(text)
        if data:
            return data
        self.waiting += 1
        try:
            with self.lock:
                return self.make(text)
        finally:
            self.waiting -= 1

    def prepare(self, text: str):
        if not self.cached(text) and text not in self.queue:
            self.queue.append(text)

    def background(self):
        while True:
            if not self.queue or self.waiting:
                time.sleep(0.2)
                continue
            text = self.queue.pop()
            try:
                with self.lock:
                    self.make(text)
            except Exception as error:
                print('HAZIRLIK HATASI', type(error).__name__, error, flush=True)


class Handler(BaseHTTPRequestHandler):
    server_version = 'lara-ses'
    protocol_version = 'HTTP/1.1'

    def log_message(self, *args):
        pass

    def reply(self, status: int, body: bytes, kind: str, extra=None):
        self.send_response(status)
        self.send_header('Content-Type', kind)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('X-Content-Type-Options', 'nosniff')
        for name, value in (extra or {}).items():
            self.send_header(name, value)
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        url = urlparse(self.path)
        if url.path == '/saglik':
            return self.reply(200, b'ok', 'text/plain')
        if url.path != '/ses':
            return self.reply(404, b'yok', 'text/plain')
        query = parse_qs(url.query)
        raw = query.get('t', [''])[0]
        if not raw.strip() or len(raw) > MAX_CHARS:
            return self.reply(400, b'metin 1-400 karakter olmali', 'text/plain')
        text = normalize(raw)
        if not READABLE.search(text):
            return self.reply(400, b'okunacak metin yok', 'text/plain')
        if query.get('p', [''])[0] == '1':
            ready = SPEAKER.cached(text) is not None
            if not ready:
                SPEAKER.prepare(text)
            return self.reply(200 if ready else 202, b'hazir' if ready else b'siraya alindi', 'text/plain', {'Cache-Control': 'no-store'})
        try:
            data = SPEAKER.audio(text)
        except Exception as error:  # üretim hatası siteyi durdurmaz; tarayıcı kendi sesine döner
            print('HATA', type(error).__name__, error, flush=True)
            return self.reply(500, b'ses uretilemedi', 'text/plain')
        headers = {'Cache-Control': 'public, max-age=2592000', 'Accept-Ranges': 'bytes'}
        match = re.fullmatch(r'bytes=(\d*)-(\d*)', self.headers.get('Range', ''))
        if match and (match.group(1) or match.group(2)):  # Safari ses dosyasını parça parça ister
            size = len(data)
            start = int(match.group(1)) if match.group(1) else max(0, size - int(match.group(2)))
            end = min(int(match.group(2)), size - 1) if match.group(1) and match.group(2) else size - 1
            if start >= size or start > end:
                return self.reply(416, b'', 'text/plain', {'Content-Range': f'bytes */{size}'})
            headers['Content-Range'] = f'bytes {start}-{end}/{size}'
            return self.reply(206, data[start:end + 1], 'audio/mp4', headers)
        self.reply(200, data, 'audio/mp4', headers)


def warm(list_path: str):
    """Önceden üretim: listedeki metinleri (zaten sitenin gönderdiği cümle parçaları) sırayla önbelleğe yazar."""
    with open(list_path, encoding='utf-8') as f:
        texts = json.load(f)
    todo = []
    for raw in texts:
        text = normalize(raw)
        if READABLE.search(text) and len(raw) <= MAX_CHARS and not os.path.exists(cache_path(text)) and text not in todo:
            todo.append(text)
    print(f'{len(texts)} metin, {len(texts) - len(todo)} hazır ya da yinelenen, {len(todo)} üretilecek', flush=True)
    started, failed, seconds = time.time(), 0, 0.0
    for i, text in enumerate(todo, 1):
        try:
            SPEAKER.make(text)
        except Exception as error:
            failed += 1
            print('ATLANDI', repr(text[:80]), type(error).__name__, error, flush=True)
        if i % 50 == 0 or i == len(todo):
            elapsed = time.time() - started
            print(f'{i}/{len(todo)} üretildi, {failed} atlandı, {elapsed / 60:.0f} dk geçti, kalan ~{elapsed / i * (len(todo) - i) / 60:.0f} dk', flush=True)
    print('BİTTİ', flush=True)


if __name__ == '__main__':
    started = time.time()
    SPEAKER = Speaker()
    print(f'lara-ses hazır: {ENGINE} ({VOICE if ENGINE == "yazgi" else os.path.basename(MODEL)}), {time.time() - started:.1f} sn', flush=True)
    if len(sys.argv) == 3 and sys.argv[1] == '--warm':
        warm(sys.argv[2])
    else:
        ThreadingHTTPServer(('0.0.0.0', PORT), Handler).serve_forever()
