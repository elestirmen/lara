"""Güçlü bilgisayarda üretilecek cümle listesini hazırlar (sunucuda çalışır).

    VOICE_LIST=/var/tmp/lara-tts/liste.json npx vitest run tests/voice-list.test.ts   # sitenin okuyacağı cümleler
    python3 tts/pc/liste.py /var/tmp/lara-tts/liste.json /mnt/storage/lara-ses/liste.json

Metinler sunucunun okuma biçimine (tts/server.py normalize) çevrilir; sıra önceliğe göredir: önce sabit metinler,
sonra değişken cümleler en sık çıkandan en seyreğe. Dosya adı (k) metnin sha256 özetidir.
"""
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

spec = importlib.util.spec_from_file_location('server', Path(__file__).resolve().parent.parent / 'server.py')
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)

# Denemede dinlenecek, modelleri zorlayan örnekler: hikâye, tırnaklı soru, harf listesi, harf adı, saat, işlem, ekli sayı,
# virgülle biten dizi, kısa övgü, hece listesi, noktalı virgüllü soru.
SAMPLES = [
    'Bir gün müzik odasında küçük bir davul gördü.',
    '“Hangi çiçeği daha güzel buluyorsun?” anketine toplam kaç kişi katıldı?',
    'Sekiz harf ünlüdür: A, E, I, İ, O, Ö, U, Ü.',
    'Alfabe treni H harfinden yola çıkıyor.',
    'Oyun saati geldi: 11.15.',
    '8 + 5 için önce 8’e 2 ekle: 10.',
    '9’dan 3 çıkarırken sayı doğrusunda 3 adım geri gideriz: 8, 7, 6.',
    '7 sayısından başlayıp dörder dörder sayıyoruz: 7, 11, 15, 19, …',
    'Aferin sana!',
    'Çenen üç kez aşağı indi: a-ra-ba.',
    'Ölçüm ile tahminini karşılaştır; yakın mıydı?',
]


def spoken(raw: str):
    text = server.normalize(raw, 'ahenk')
    return text if server.READABLE.search(text) and len(raw) <= server.MAX_CHARS else None


def main(source: str, target: str):
    data = json.loads(Path(source).read_text(encoding='utf-8'))
    seen, items = set(), []
    for raw in data['sabit'] + [text for text, _count in data['degisken']]:
        text = spoken(raw)
        if text and text not in seen:
            seen.add(text)
            items.append({'k': hashlib.sha256(text.encode()).hexdigest(), 't': text})
    out = {'deneme': [spoken(raw) for raw in SAMPLES], 'cumleler': items}
    Path(target).write_text(json.dumps(out, ensure_ascii=False, indent=0), encoding='utf-8')
    print(f'{len(items)} cümle ({len(data["sabit"])} sabit), {sum(len(x["t"]) for x in items)} harf → {target}')


if __name__ == '__main__':
    main(*sys.argv[1:3])
