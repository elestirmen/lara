"use strict";

// Bağımlılıksız frontend sözleşme testi: tarayıcı açılmadan kırık DOM bağlarını,
// görev şemasını ve mahremiyet/offline invariantlarını yakalar.
const fs = require("fs");
const vm = require("vm");

const html = fs.readFileSync("public/index.html", "utf8");
const app = fs.readFileSync("public/app.js", "utf8");
const ses = fs.readFileSync("public/ses.js", "utf8");
const css = fs.readFileSync("public/style.css", "utf8");

const htmlIdList = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const htmlIds = new Set(htmlIdList);
const tekrarIds = [...new Set(htmlIdList.filter((id, i) => htmlIdList.indexOf(id) !== i))];
if (tekrarIds.length) throw new Error(`HTML'de tekrarlanan id: ${tekrarIds.join(", ")}`);
const selectorIds = [...app.matchAll(/\$\("#([A-Za-z0-9_-]+)"\)/g)].map((m) => m[1]);
const eksik = [...new Set(selectorIds.filter((id) => !htmlIds.has(id)))];
if (eksik.length) throw new Error(`HTML'de bulunmayan app.js id seçicileri: ${eksik.join(", ")}`);

if (/fonts\.(googleapis|gstatic)\.com/i.test(html)) throw new Error("Harici Google font bağlantısı yerel çalışma sözleşmesini bozuyor");
if (/url\(\s*["']?https?:\/\//i.test(css)) throw new Error("CSS harici kaynağa bağlanıyor");
if (/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i.test(html)) throw new Error("Viewport yakınlaştırması kapatılmış");
const scriptler = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)].map((m) => m[1]);
const beklenenScriptler = ["dolap.js", "ses.js", "app.js", "admin.js"];
if (JSON.stringify(scriptler) !== JSON.stringify(beklenenScriptler)) {
  throw new Error(`Frontend dosyaları doğrudan ve doğru sırada yüklenmeli: ${scriptler.join(", ")}`);
}
if (app.includes('fetch("/api/upload"')) throw new Error("Kullanıcı fotoğrafı tekrar sunucu upload ucuna bağlanmış");
if (app.includes('fetch("/api/assets"')) throw new Error("Ortak sunucu fotoğraf havuzu kişisel koleksiyona bağlanmış");
for (const invariant of [
  "indexedDB",
  "function geriAl",
  "function ileriAl",
  "function stilAnaliziGuncelle",
  "function stickerlariDurumdanKur",
  "function legacyAlbumId",
  "setPointerCapture",
  "aktifPointerId",
]) {
  if (!app.includes(invariant)) throw new Error(`Frontend invariantı eksik: ${invariant}`);
}

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync("public/dolap.js", "utf8"), context);
const dolap = context.window.DOLAP;
for (const gorev of dolap.gorevler) {
  if (!Array.isArray(gorev.kosullar) || gorev.kosullar.length < 2) {
    throw new Error(`${gorev.id}: görev en az iki slot-bazlı koşul içermeli`);
  }
  if (new Set(gorev.kosullar.map((k) => k.slot)).size !== gorev.kosullar.length) {
    throw new Error(`${gorev.id}: görev koşulları farklı slotlara ait olmalı`);
  }
}

const notaBlog = ses.match(/const NOTA\s*=\s*\{([\s\S]*?)\};/);
if (!notaBlog) throw new Error("NOTA haritası bulunamadı");
const tanimliNotalar = new Set([...notaBlog[1].matchAll(/\b([A-G]\d)\s*:/g)].map((m) => m[1]));
const kullanilanNotalar = new Set([...ses.matchAll(/\["([A-G]\d)"\s*,/g)].map((m) => m[1]));
const eksikNotalar = [...kullanilanNotalar].filter((nota) => !tanimliNotalar.has(nota));
if (eksikNotalar.length) throw new Error(`Melodide tanımsız notalar: ${eksikNotalar.join(", ")}`);

console.log(`frontend contracts ok: ${new Set(selectorIds).size} DOM bağı, ${dolap.gorevler.length} slot-bazlı brief`);
