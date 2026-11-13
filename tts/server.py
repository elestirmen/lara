#!/usr/bin/env python3
"""Lara'nın Dünyası seslendirme servisi.

GET /ses?t=<metin>  → MP3 (Piper sinirsel ses, Türkçe). Metin en çok 400 karakterdir; aynı metin
bir kez üretilir, sonra diskteki önbellekten verilir. Aynı anda tek üretim yapılır (işlemciyi korur).
GET /saglik         → "ok"

Site bu adresi kendi nginx'i üzerinden çağırır (deploy/nginx.conf); servis dışarıya port açmaz.
"""
import hashlib, os, re, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

MODEL = os.environ.get('SES_MODEL', '/voices/tr_TR-dfki-medium.onnx')
CACHE = os.environ.get('SES_CACHE', '/cache')
CACHE_LIMIT = int(os.environ.get('SES_CACHE_MB', '300')) * 1024 * 1024
LENGTH_SCALE = float(os.environ.get('SES_LENGTH_SCALE', '1.08'))  # 1'den büyük = biraz daha yavaş
PORT = int(os.environ.get('SES_PORT', '8090'))
MAX_CHARS = 400

ORDINALS = ['sıfırıncı', 'birinci', 'ikinci', 'üçüncü', 'dördüncü', 'beşinci', 'altıncı', 'yedinci', 'sekizinci', 'dokuzuncu', 'onuncu']


def normalize(text: str) -> str:
    """Ekrandaki yazıyı okunacak hâle getirir: işaretler söze çevrilir, okunmayan simgeler atılır."""
    t = text.strip()
    t = re.sub(r'[“”"«»]', '', t)
    t = re.sub(r"(?<=\w)[’'](?=\w)", '', t)          # Lara’nın → Laranın, 6’dan → 6dan
    t = t.replace('’', '').replace("'", '')
    t = re.sub(r'_{2,}', ' boşluk ', t)
    t = re.sub(r'(\d+)\.00\b', r'\1', t)              # saat 4.00 → 4
    t = re.sub(r'(\d+)\.(\d\d)\b', r'\1 \2', t)       # saat 4.30 → dört otuz
    t = re.sub(r'\b(\d|10)\. (?=[a-zçğıöşü])', lambda m: ORDINALS[int(m.group(1))] + ' ', t)  # 2. kelime → ikinci kelime
    t = re.sub(r'\s\?\s', ' kaç ', t)                 # 19 + ? = 25
    t = re.sub(r'\s\?(?=[.,]|$)', ' kaç', t)
    for sign, word in ((' + ', ' artı '), (' − ', ' eksi '), (' - ', ' eksi '), (' × ', ' çarpı '), (' x ', ' çarpı '), (' ÷ ', ' bölü '), (' = ', ' eşittir '), (' < ', ' küçüktür '), (' > ', ' büyüktür ')):
        t = t.replace(sign, word)
    t = re.sub(r'(?<=[a-zçğıöşü])\s*-\s*(?=[a-zçğıöşü])', ', ', t)   # ke-le-bek → ke, le, bek
    t = t.replace('→', ', ').replace('|', ', ').replace('…', '. ').replace('/', ', ')
    t = re.sub(r'[^0-9A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû .,;:!?()%]', ' ', t)  # emoji ve diğer simgeler
    return re.sub(r'\s+', ' ', t).strip()


def cache_path(text: str) -> str:
    key = hashlib.sha256(f'{os.path.basename(MODEL)}|{LENGTH_SCALE}|{text}'.encode()).hexdigest()
    return os.path.join(CACHE, key[:2], key + '.mp3')


def prune():
    """Önbellek sınırı aşılınca en eski dosyaları siler."""
    files = []
    for root, _, names in os.walk(CACHE):
        for name in names:
            path = os.path.join(root, name)
            try:
                stat = os.stat(path)
                files.append((stat.st_atime, stat.st_size, path))
            except OSError:
                pass
    total = sum(size for _, size, _ in files)
    for _, size, path in sorted(files):
        if total <= CACHE_LIMIT * 0.8:
            break
        try:
            os.remove(path)
            total -= size
        except OSError:
            pass


class Speaker:
    def __init__(self):
        import onnxruntime
        if hasattr(onnxruntime, 'disable_telemetry_events'):
            onnxruntime.disable_telemetry_events()  # servis dışarıya veri göndermez
        from piper import PiperVoice, SynthesisConfig
        import lameenc
        self.voice = PiperVoice.load(MODEL)
        self.config = SynthesisConfig(length_scale=LENGTH_SCALE)
        self.lameenc = lameenc
        self.lock = threading.Lock()
        self.made = 0

    def mp3(self, text: str) -> bytes:
        path = cache_path(text)
        try:
            with open(path, 'rb') as f:
                data = f.read()
            os.utime(path)
            return data
        except OSError:
            pass
        with self.lock:
            pcm, rate = b'', 22050
            for chunk in self.voice.synthesize(text, syn_config=self.config):
                pcm += chunk.audio_int16_bytes
                rate = chunk.sample_rate
            encoder = self.lameenc.Encoder()
            encoder.set_bit_rate(48)
            encoder.set_in_sample_rate(rate)
            encoder.set_channels(1)
            encoder.set_quality(2)
            data = bytes(encoder.encode(pcm)) + bytes(encoder.flush())
            try:
                os.makedirs(os.path.dirname(path), exist_ok=True)
                tmp = f'{path}.{threading.get_ident()}.tmp'
                with open(tmp, 'wb') as f:
                    f.write(data)
                os.replace(tmp, path)
                self.made += 1
                if self.made % 200 == 0:
                    prune()
            except OSError:
                pass
            return data


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
        raw = parse_qs(url.query).get('t', [''])[0]
        if not raw.strip() or len(raw) > MAX_CHARS:
            return self.reply(400, b'metin 1-400 karakter olmali', 'text/plain')
        text = normalize(raw)
        if not re.search(r'[0-9A-Za-zÇĞİÖŞÜçğıöşü]', text):
            return self.reply(400, b'okunacak metin yok', 'text/plain')
        try:
            data = SPEAKER.mp3(text)
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
            return self.reply(206, data[start:end + 1], 'audio/mpeg', headers)
        self.reply(200, data, 'audio/mpeg', headers)


if __name__ == '__main__':
    started = time.time()
    SPEAKER = Speaker()
    print(f'lara-ses hazır: {os.path.basename(MODEL)}, {time.time() - started:.1f} sn', flush=True)
    ThreadingHTTPServer(('0.0.0.0', PORT), Handler).serve_forever()
