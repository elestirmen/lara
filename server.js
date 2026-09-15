// Leyla Stil Stüdyosu - küçük yerel sunucu
// Sadece Node.js'in kendi modüllerini kullanır (kurulum/npm gerekmez).
// Hiçbir şey internete gönderilmez; sadece evdeki cihazlara wifi üzerinden hizmet verir.

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const zlib = require("zlib");
const crypto = require("crypto");

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const FOTO = path.join(ROOT, "fotograflar");
const PORT = process.env.PORT || 8080;
const HOST = process.env.LARA_HOST || "0.0.0.0";

// İnternetten yayınlarken koruma: LARA_PAROLA ayarlanırsa şifre sorulur.
// Ayarlanmazsa (sadece ev ağı için) serbest çalışır.
const PAROLA = process.env.LARA_PAROLA || "";
const KULLANICI = process.env.LARA_KULLANICI || "lara";

// Yönetim (admin) şifresi — gardıroba görsel ekleme/silme paneli için
const ADMIN = process.env.LARA_ADMIN || "";

// Kullanıcı fotoğrafları production'da yanlışlıkla açılmasın. Hem yükleme hem
// listeleme/statik erişim ancak açık opt-in ile etkinleşir.
const UPLOADLAR_ACIK = process.env.LARA_UPLOADS === "1";

// Fotoğraf kategorileri (klasör adları)
const KATEGORILER = ["karakterler", "kiyafetler", "saclar", "aksesuarlar", "arkaplanlar"];
const RESIM_UZANTI = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];

// Gerçekçi (raster) gardırop override'ları: public/assets/<slot>/<id>.png varsa
// oyun o parçanın vektör çizimi yerine bu PNG'yi kullanır.
const GORSEL_SLOTLAR = ["modeller", "arkaplanlar", "kanatlar", "elbiseler", "ayakkabilar", "takilar", "saclar", "taclar", "asalar", "ozel"];
const ASSETS = path.join(PUBLIC, "assets");
const PROMPT_CONTRACT_PATH = path.join(ASSETS, "_referans", "prompt_contract.json");

const PROMPT_FALLBACK = {
  master: "Photorealistic full-body fashion paper-doll layer for a local dress-up studio.\nExact canvas: 1024x1365 px, 3:4 portrait. Front view, centered on x512,\ncamera at chest height, no perspective tilt, no crop, head and both feet fully visible.\nSame adult female figure proportions and pose across every layer: standing straight,\nsymmetrical neutral A-pose, arms slightly away from torso, hands relaxed beside hips,\nlegs together, even weight, calm neutral expression.\n\nLock landmarks on the 1024x1365 canvas:\ntop of head y~130, eyes y~266, chin y~372, shoulders y~420, bust y~512,\nnarrow waist y~645, hips y~708, knees y~983, ankles y~1215, soles y~1269.\nVisible model alpha bbox target: x~378..647, y~100..1335, center x~512,\noverall visible width MUST BE exactly around 270 px. CRITICAL: Do NOT generate a larger, \ncloser, wider, zoomed-in, thicker, or different-scale body. Any deviation breaks the game. \nKeep arms near the existing A-pose reference.\nSoft even studio lighting, realistic fabric/material detail, no floor shadow unless\nthe slot is arkaplanlar.",
  model: "Render one adult female model only. Transparent background.\nSimple matte black bra and brief set. Hair is baked into the model image.\nVisible alpha bbox target: x~378..647, y~100..1335, center x~512, visible width about 270 px.\nDo not make the body larger, closer to camera, wider, cropped, or different scale.",
  layer: "Render ONLY the requested wardrobe item pixels. Transparent background.\nNo body, no skin, no mannequin, no face, no hair unless the slot is saclar,\nno background, no text. Align to Leyla/Yuna canonical 1024x1365 A-pose.\nFor fitted dresses and torso garments target: shoulder width ~200 px,\nbust ~205 px, waist ~245 px, hip ~255 px.",
  background: "Render an opaque full-screen background, exact 1024x1365 px.\nNo person, no text, no watermark. Keep the center readable for the model layer.",
  negative: "text, watermark, logo, extra people, cropped body, cropped head, cropped feet,\nside view, turned body, mismatched pose, extra limbs, bad hands, deformed fingers,\nbusy background, hard cast shadow, wrong canvas ratio, low quality, oversized body,\nzoomed body, thick proportions, giant model, wider pose, arms too far from torso, baked shoes in clothing layer,\nbaked skin/body in wardrobe layer, mismatched scale",
};

function promptContractOku() {
  try {
    return { ...PROMPT_FALLBACK, ...JSON.parse(fs.readFileSync(PROMPT_CONTRACT_PATH, "utf8")) };
  } catch (e) {
    return PROMPT_FALLBACK;
  }
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const ORAN_PENCERELERI = new Map();

function guvenlikBasliklari(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; " +
      "script-src 'self'; style-src 'self' 'unsafe-inline'; " +
      "font-src 'self'; img-src 'self' data: blob:; connect-src 'self'"
  );
}

function jsonYanit(res, kod, obj, ekBasliklar = {}) {
  if (res.writableEnded || res.destroyed) return;
  res.writeHead(kod, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...ekBasliklar,
  });
  res.end(JSON.stringify(obj));
}

function metinYanit(res, kod, mesaj, ekBasliklar = {}) {
  if (res.writableEnded || res.destroyed) return;
  res.writeHead(kod, { "Content-Type": "text/plain; charset=utf-8", ...ekBasliklar });
  res.end(mesaj);
}

function istemciIp(req) {
  // Nginx Proxy Manager son X-Forwarded-For değerine gerçek istemci IP'sini ekler.
  // Doğrudan yerel kullanımda socket adresine düşer.
  const xff = String(req.headers["x-forwarded-for"] || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return xff.length ? xff[xff.length - 1] : (req.socket.remoteAddress || "bilinmiyor");
}

function oranSiniri(req, res, grup, limit, pencereMs) {
  const simdi = Date.now();
  const anahtar = grup + ":" + istemciIp(req);
  let kayit = ORAN_PENCERELERI.get(anahtar);
  if (!kayit || kayit.bitis <= simdi) kayit = { sayi: 0, bitis: simdi + pencereMs };
  kayit.sayi += 1;
  ORAN_PENCERELERI.set(anahtar, kayit);

  // Sahte/çok sayıda IP ile Map'in sınırsız büyümesini engelle.
  if (ORAN_PENCERELERI.size > 5000) {
    for (const [k, v] of ORAN_PENCERELERI) {
      if (v.bitis <= simdi) ORAN_PENCERELERI.delete(k);
    }
    while (ORAN_PENCERELERI.size > 5000) {
      ORAN_PENCERELERI.delete(ORAN_PENCERELERI.keys().next().value);
    }
  }

  if (kayit.sayi <= limit) return true;
  const bekle = Math.max(1, Math.ceil((kayit.bitis - simdi) / 1000));
  jsonYanit(res, 429, { hata: "Çok fazla istek; lütfen biraz sonra tekrar dene" }, { "Retry-After": String(bekle) });
  return false;
}

function ayniKaynakMi(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // curl/kalite kapısı gibi tarayıcı dışı aynı makine istemcileri
  try {
    const gelen = new URL(origin);
    const iletilenProtokol = String(req.headers["x-forwarded-proto"] || "")
      .split(",").pop().trim().toLowerCase();
    const beklenenProtokol = iletilenProtokol || (req.socket.encrypted ? "https" : "http");
    return gelen.host.toLowerCase() === String(req.headers.host || "").toLowerCase()
      && gelen.protocol.toLowerCase() === beklenenProtokol + ":";
  } catch (e) {
    return false;
  }
}

function jsonMutasyonKontrol(req, res, grup, limit, pencereMs) {
  if (!oranSiniri(req, res, grup, limit, pencereMs)) return false;
  const tip = String(req.headers["content-type"] || "");
  if (!/^application\/json(?:\s*;|\s*$)/i.test(tip)) {
    jsonYanit(res, 415, { hata: "Content-Type application/json olmalı" });
    return false;
  }
  if (!ayniKaynakMi(req)) {
    jsonYanit(res, 403, { hata: "Çapraz kaynak isteğine izin verilmiyor" });
    return false;
  }
  return true;
}

function etagUret(stat) {
  return `W/"${stat.size.toString(16)}-${Math.trunc(stat.mtimeMs).toString(16)}"`;
}

function gonderDosya(req, res, dosyaYolu, { ozel = false } = {}) {
  fs.stat(dosyaYolu, (statErr, stat) => {
    if (statErr || !stat.isFile()) return metinYanit(res, 404, "Bulunamadı");

    const ext = path.extname(dosyaYolu).toLowerCase();
    const etag = etagUret(stat);
    const sonDegisim = stat.mtime.toUTCString();
    const kodDosyasi = [".html", ".js", ".css", ".json", ".svg"].includes(ext);
    const raster = [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext);
    const cache = ozel || PAROLA
      ? "private, no-cache"
      : (kodDosyasi || !raster ? "no-cache" : "public, max-age=0, must-revalidate");
    res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
    res.setHeader("Cache-Control", cache);
    res.setHeader("ETag", etag);
    res.setHeader("Last-Modified", sonDegisim);
    if (PAROLA) res.setHeader("Vary", "Authorization");

    const inm = String(req.headers["if-none-match"] || "");
    const ims = req.headers["if-modified-since"];
    const etagUydu = inm && inm.split(",").map((v) => v.trim()).includes(etag);
    const tarihUydu = !inm && ims && !Number.isNaN(Date.parse(ims)) && stat.mtimeMs <= Date.parse(ims) + 999;
    if (etagUydu || tarihUydu) {
      res.writeHead(304);
      res.end();
      return;
    }

    res.setHeader("Content-Length", String(stat.size));
    if (req.method === "HEAD") {
      res.writeHead(200);
      res.end();
      return;
    }

    res.writeHead(200);
    const akis = fs.createReadStream(dosyaYolu);
    akis.on("error", (err) => {
      console.error("Statik dosya okuma hatası:", err.message);
      if (!res.headersSent) metinYanit(res, 500, "Dosya okunamadı");
      else res.destroy();
    });
    akis.pipe(res);
  });
}

// Güvenli yol: tabanın dışına çıkmayı engelle
function guvenliYol(taban, istek) {
  try {
    const cozulmus = decodeURIComponent(String(istek || ""));
    if (cozulmus.includes("\0")) return null;
    const temiz = path.normalize(cozulmus).replace(/^(\.\.[\/\\])+/, "");
    const tam = path.resolve(taban, temiz);
    const sandBox = path.resolve(taban) + path.sep;
    if (!tam.startsWith(sandBox) && tam !== path.resolve(taban)) return null;
    return tam;
  } catch (e) {
    return null;
  }
}

function varliklariListele() {
  const sonuc = {};
  for (const kat of KATEGORILER) {
    const dizin = path.join(FOTO, kat);
    let dosyalar = [];
    try {
      dosyalar = fs
        .readdirSync(dizin)
        .filter((f) => RESIM_UZANTI.includes(path.extname(f).toLowerCase()))
        .sort()
        .map((f) => ({ ad: path.parse(f).name, url: "/fotograflar/" + kat + "/" + encodeURIComponent(f) }));
    } catch (e) {
      dosyalar = [];
    }
    sonuc[kat] = dosyalar;
  }
  return sonuc;
}

function gorselleriListele() {
  const sonuc = {};
  const slotTara = (kok, slot) => {
    const harita = {};
    try {
      const secilen = new Map();
      // Runtime sözleşmesi png/webp/jpg override'larını destekler. JPEG alpha
      // taşımadığı için en düşük önceliktedir; yayın uygunluğunu kalite kapısı
      // denetler. Aynı ID birden çok formatta varsa seçim deterministiktir.
      const oncelik = { ".png": 0, ".webp": 1, ".jpg": 2, ".jpeg": 3 };
      for (const f of fs.readdirSync(path.join(kok, slot)).sort()) {
        const ext = path.extname(f).toLowerCase();
        if (!(ext in oncelik)) continue;
        const id = path.parse(f).name;
        const onceki = secilen.get(id);
        if (onceki && onceki.oncelik <= oncelik[ext]) continue;
        const rel = path
          .relative(ASSETS, path.join(kok, slot, f))
          .split(path.sep)
          .map(encodeURIComponent)
          .join("/");
        secilen.set(id, { oncelik: oncelik[ext], url: "/assets/" + rel });
      }
      for (const id of [...secilen.keys()].sort()) harita[id] = secilen.get(id).url;
    } catch (e) {}
    return harita;
  };

  for (const slot of GORSEL_SLOTLAR) {
    sonuc[slot] = slotTara(ASSETS, slot);
  }
  // Slider icin onceden uretilmis beden seviyeleri: _beden/b20/<slot>/<id>.png
  const beden = {};
  try {
    const seviyeler = fs.readdirSync(path.join(ASSETS, "_beden"))
      .filter((level) => /^b\d{2,3}$/.test(level))
      .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
    for (const level of seviyeler) {
      const bySlot = {};
      for (const slot of GORSEL_SLOTLAR) {
        const h = slotTara(path.join(ASSETS, "_beden", level), slot);
        if (Object.keys(h).length) bySlot[slot] = h;
      }
      if (Object.keys(bySlot).length) beden[level] = bySlot;
    }
  } catch (e) {}
  sonuc.beden = beden;
  return sonuc;
}

function geciciDosyaYolu(hedef, ek = "tmp") {
  const token = `${process.pid}.${Date.now()}.${crypto.randomBytes(6).toString("hex")}`;
  return path.join(path.dirname(hedef), `.${path.basename(hedef)}.${token}.${ek}`);
}

function fsyncliGeciciYaz(hedef, veri, ek = "tmp") {
  fs.mkdirSync(path.dirname(hedef), { recursive: true });
  const gecici = geciciDosyaYolu(hedef, ek);
  let fd = null;
  try {
    fd = fs.openSync(gecici, "wx", 0o644);
    fs.writeFileSync(fd, veri);
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = null;
    return gecici;
  } catch (e) {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch (_e) {}
    }
    try { fs.unlinkSync(gecici); } catch (_e) {}
    throw e;
  }
}

function atomikBufferYaz(hedef, veri) {
  const gecici = fsyncliGeciciYaz(hedef, veri);
  try {
    fs.renameSync(gecici, hedef);
  } catch (e) {
    try { fs.unlinkSync(gecici); } catch (_e) {}
    throw e;
  }
}

function atomikJsonYaz(hedef, veri) {
  atomikBufferYaz(hedef, Buffer.from(JSON.stringify(veri, null, 1), "utf8"));
}

// Manifest: API ve statik fallback aynı asset listesini kullansın diye güncellenir.
function gorselleriYaz() {
  try {
    const gorseller = gorselleriListele();
    atomikJsonYaz(path.join(ASSETS, "gorseller.json"), gorseller);
    atomikJsonYaz(path.join(ASSETS, "beden.json"), gorseller.beden || {});
    return true;
  } catch (e) {
    console.error("Manifest yazılamadı:", e.message);
    return false;
  }
}

function dosyaAdiTemizle(ad) {
  return (ad || "resim")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 40);
}

function base64Coz(metin) {
  if (typeof metin !== "string" || !metin.length || metin.length % 4 !== 0) return null;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(metin)) return null;
  try {
    return Buffer.from(metin, "base64");
  } catch (e) {
    return null;
  }
}

function resimImzasiDogru(buf, tur) {
  if (!Buffer.isBuffer(buf)) return false;
  if (tur === "png") return buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (tur === "jpg") return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (tur === "gif") return buf.length >= 6 && ["GIF87a", "GIF89a"].includes(buf.toString("ascii", 0, 6));
  if (tur === "webp") return buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP";
  return false;
}

function yukle(req, res) {
  govdeOku(req, 15, (err, veri) => {
    if (err) return jsonYanit(res, err.statusCode || 400, { hata: err.statusCode === 413 ? "Dosya çok büyük (en fazla 15MB)" : "Geçersiz istek" });
    try {
      const kat = KATEGORILER.includes(veri.category) ? veri.category : null;
      if (!kat) throw new Error("Geçersiz kategori");
      const eslesme = /^data:image\/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(veri.dataUrl || "");
      if (!eslesme) throw new Error("Geçersiz resim");
      let uzanti = eslesme[1] === "jpeg" ? "jpg" : eslesme[1];
      const tampon = base64Coz(eslesme[2]);
      if (!tampon || !resimImzasiDogru(tampon, uzanti)) throw new Error("Resim içeriği dosya türüyle uyuşmuyor");
      const ad = dosyaAdiTemizle(veri.name) + "_" + Date.now() + "_" + crypto.randomBytes(3).toString("hex") + "." + uzanti;
      const hedef = path.join(FOTO, kat, ad);
      atomikBufferYaz(hedef, tampon);
      jsonYanit(res, 200, { url: "/fotograflar/" + kat + "/" + encodeURIComponent(ad), kategori: kat, ad: path.parse(ad).name });
    } catch (e) {
      jsonYanit(res, 400, { hata: String(e.message || e) });
    }
  });
}

/* ======================= YÖNETİM (ADMIN) PANELİ ======================= */
function govdeOku(req, limitMB, cb) {
  const limit = limitMB * 1024 * 1024;
  const parcalar = [];
  let toplam = 0;
  let bitti = false;
  const tamamla = (err, veri) => {
    if (bitti) return;
    bitti = true;
    cb(err, veri);
  };
  const boyutHatasi = () => {
    const e = new Error("Dosya çok büyük");
    e.statusCode = 413;
    tamamla(e);
  };

  const bildirilen = Number(req.headers["content-length"] || 0);
  if (Number.isFinite(bildirilen) && bildirilen > limit) {
    boyutHatasi();
    req.resume();
    return;
  }

  req.on("data", (p) => {
    if (bitti) return;
    toplam += p.length;
    if (toplam > limit) {
      parcalar.length = 0;
      boyutHatasi();
      return;
    }
    parcalar.push(p);
  });
  req.on("end", () => {
    if (bitti) return;
    try {
      tamamla(null, JSON.parse(Buffer.concat(parcalar, toplam).toString("utf8")));
    } catch (e) {
      e.statusCode = 400;
      tamamla(e);
    }
  });
  req.on("aborted", () => {
    const e = new Error("İstek yarıda kesildi");
    e.statusCode = 400;
    tamamla(e);
  });
  req.on("error", (hata) => {
    hata.statusCode = 400;
    tamamla(hata);
  });
}

// PNG kalite kontrolü — kütüphanesiz IHDR + alpha/corner kontrolü.
function pngAnaliz(buf) {
  try {
    const imza = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (!Buffer.isBuffer(buf) || buf.length < 33 || !buf.subarray(0, 8).equals(imza)) return null;
    let p = 8;
    let ihdr = null;
    const idat = [];
    let idatBoyutu = 0;
    let parcaSayisi = 0;
    while (p + 8 <= buf.length && parcaSayisi++ < 10000) {
      const len = buf.readUInt32BE(p); p += 4;
      const type = buf.toString("ascii", p, p + 4); p += 4;
      if (len > buf.length - p - 4) return null;
      const data = buf.subarray(p, p + len); p += len + 4; // CRC tarayıcı decoder'ına bırakılır
      if (type === "IHDR") {
        if (ihdr || len !== 13) return null;
        ihdr = {
          w: data.readUInt32BE(0),
          h: data.readUInt32BE(4),
          bitDepth: data[8],
          colorType: data[9],
          compression: data[10],
          filterMethod: data[11],
          interlace: data[12],
        };
      } else if (type === "IDAT") {
        idat.push(data);
        idatBoyutu += data.length;
      } else if (type === "IEND") {
        if (len !== 0) return null;
        break;
      }
    }
    if (!ihdr || parcaSayisi > 10000) return null;
    const hasAlpha = ihdr.colorType === 4 || ihdr.colorType === 6;
    const sonuc = { ...ihdr, hasAlpha, cornerAlpha: null, transparentCorners: false, opaqueCorners: false };

    // Admin yalnız bu tuvali kabul eder. Boyut yanlışsa sıkıştırılmış veriyi hiç
    // açmayarak sahte dev IHDR ile bellek tüketimini önle.
    if (ihdr.w !== 1024 || ihdr.h !== 1365) return sonuc;
    if (!hasAlpha || ihdr.bitDepth !== 8 || !idat.length) return sonuc;
    if (ihdr.compression !== 0 || ihdr.filterMethod !== 0 || ihdr.interlace !== 0) return sonuc;

    const channels = ihdr.colorType === 6 ? 4 : 2;
    const bpp = channels;
    const rowBytes = ihdr.w * channels;
    const beklenen = (rowBytes + 1) * ihdr.h;
    let raw;
    try {
      raw = zlib.inflateSync(Buffer.concat(idat, idatBoyutu), { maxOutputLength: beklenen });
    } catch (e) {
      return sonuc;
    }
    if (raw.length !== beklenen) return sonuc;

    let prev = Buffer.alloc(rowBytes);
    let off = 0;
    let ust = null;
    let alt = null;
    for (let y = 0; y < ihdr.h; y++) {
      const filter = raw[off++];
      const cur = Buffer.from(raw.subarray(off, off + rowBytes));
      off += rowBytes;
      for (let x = 0; x < rowBytes; x++) {
        const left = x >= bpp ? cur[x - bpp] : 0;
        const up = prev[x] || 0;
        const upLeft = x >= bpp ? prev[x - bpp] || 0 : 0;
        let val = cur[x];
        if (filter === 1) val = (val + left) & 255;
        else if (filter === 2) val = (val + up) & 255;
        else if (filter === 3) val = (val + Math.floor((left + up) / 2)) & 255;
        else if (filter === 4) {
          const pr = left + up - upLeft;
          const pa = Math.abs(pr - left), pb = Math.abs(pr - up), pc = Math.abs(pr - upLeft);
          val = (val + (pa <= pb && pa <= pc ? left : (pb <= pc ? up : upLeft))) & 255;
        } else if (filter !== 0) {
          return sonuc;
        }
        cur[x] = val;
      }
      if (y === 0) ust = [cur[channels - 1], cur[(ihdr.w - 1) * channels + channels - 1]];
      if (y === ihdr.h - 1) alt = [cur[channels - 1], cur[(ihdr.w - 1) * channels + channels - 1]];
      prev = cur;
    }
    if (!ust || !alt) return sonuc;
    const ca = [ust[0], ust[1], alt[0], alt[1]];
    sonuc.cornerAlpha = ca;
    sonuc.transparentCorners = ca.every((a) => a < 8);
    sonuc.opaqueCorners = ca.every((a) => a > 247);
    return sonuc;
  } catch (e) {
    return null;
  }
}

function adminYanit(res, kod, obj) {
  jsonYanit(res, kod, obj);
}

function sabitEsit(gelen, beklenen) {
  if (!beklenen || typeof gelen !== "string") return false;
  const a = Buffer.from(gelen, "utf8");
  const b = Buffer.from(beklenen, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function ilgiliAssetDosyalari(slot, id, turetilmisDahil = true) {
  const bulunan = [];
  const ekle = (tam) => {
    try {
      if (fs.statSync(tam).isFile()) bulunan.push({ tam, rel: path.relative(ASSETS, tam) });
    } catch (e) {}
  };
  for (const e of ["png", "webp", "jpg", "jpeg"]) ekle(path.join(ASSETS, slot, id + "." + e));
  if (!turetilmisDahil) return bulunan;

  for (const e of ["png", "webp", "jpg", "jpeg"]) ekle(path.join(ASSETS, "_thumb", slot, id + "." + e));
  try {
    for (const level of fs.readdirSync(path.join(ASSETS, "_beden"))) {
      if (!/^b\d{2,3}$/.test(level)) continue;
      for (const e of ["png", "webp"]) ekle(path.join(ASSETS, "_beden", level, slot, id + "." + e));
    }
  } catch (e) {}
  return bulunan;
}

function karantinaKoku(tur) {
  const damga = new Date().toISOString().replace(/[:.]/g, "-") + "_" + crypto.randomBytes(3).toString("hex");
  return path.join(ASSETS, "_karantina", tur, damga);
}

function karantinayaTasi(kayitlar, kok) {
  const tasinan = [];
  try {
    for (const kayit of kayitlar) {
      const hedef = path.join(kok, kayit.rel);
      fs.mkdirSync(path.dirname(hedef), { recursive: true });
      fs.renameSync(kayit.tam, hedef);
      tasinan.push({ kaynak: kayit.tam, hedef });
    }
    return tasinan;
  } catch (e) {
    for (const kayit of tasinan.reverse()) {
      try {
        fs.mkdirSync(path.dirname(kayit.kaynak), { recursive: true });
        fs.renameSync(kayit.hedef, kayit.kaynak);
      } catch (geriHata) {
        console.error("Karantina geri alma hatası:", geriHata.message);
      }
    }
    throw e;
  }
}

function tasimalariGeriAl(tasinan) {
  for (const kayit of [...tasinan].reverse()) {
    try {
      fs.mkdirSync(path.dirname(kayit.kaynak), { recursive: true });
      fs.renameSync(kayit.hedef, kayit.kaynak);
    } catch (e) {
      console.error("Dosya geri alma hatası:", e.message);
    }
  }
}

function adminYukle(req, res) {
  govdeOku(req, 25, (err, v) => {
    if (err) return adminYanit(res, err.statusCode || 400, { hata: err.statusCode === 413 ? "Dosya çok büyük" : "Geçersiz istek" });
    if (!ADMIN) return adminYanit(res, 503, { hata: "Yönetim devre dışı; sunucuda LARA_ADMIN tanımlanmalı" });
    if (!v || !sabitEsit(v.parola, ADMIN)) return adminYanit(res, 401, { hata: "Yönetim şifresi yanlış" });
    const slot = GORSEL_SLOTLAR.includes(v.slot) ? v.slot : null;
    if (!slot) return adminYanit(res, 400, { hata: "Geçersiz kategori" });
    const id = String(v.id || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
    if (!id) return adminYanit(res, 400, { hata: "Geçersiz dosya adı (id)" });
    const m = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(v.dataUrl || "");
    if (!m) return adminYanit(res, 400, { hata: "Sadece 1024×1365 PNG yüklenebilir" });
    const ext = "png";
    const buf = base64Coz(m[1]);
    if (!buf) return adminYanit(res, 400, { hata: "PNG base64 verisi geçersiz" });
    const b = pngAnaliz(buf);
    if (!b) return adminYanit(res, 400, { hata: "PNG okunamadı/bozuk" });
    if (b.w !== 1024 || b.h !== 1365) {
      return adminYanit(res, 400, { hata: `Boyut tam 1024×1365 olmalı. Gelen: ${b.w}×${b.h}` });
    }
    if (slot === "arkaplanlar") {
      if (b.hasAlpha && !b.opaqueCorners) {
        return adminYanit(res, 400, { hata: "Arka plan PNG'sinin köşeleri opak olmalı" });
      }
    } else {
      if (!b.hasAlpha) return adminYanit(res, 400, { hata: "Parça PNG'sinde alpha/şeffaflık kanalı olmalı" });
      if (!b.transparentCorners) {
        return adminYanit(res, 400, { hata: "Parça dışı şeffaf olmalı; dört köşe tamamen şeffaf bekleniyor" });
      }
    }
    const hedef = path.join(ASSETS, slot, id + "." + ext);
    let gecici = null;
    let yedek = null;
    let yeniKuruldu = false;
    let tasinan = [];
    const karantina = karantinaKoku("admin_replaced");
    try {
      gecici = fsyncliGeciciYaz(hedef, buf);
      if (fs.existsSync(hedef)) {
        yedek = geciciDosyaYolu(hedef, "bak");
        fs.copyFileSync(hedef, yedek, fs.constants.COPYFILE_EXCL);
      }

      // POSIX rename aynı adlı eski PNG'yi tek atomik adımda değiştirir; yazma
      // tamamlanmadan canlı dosyaya dokunulmaz.
      fs.renameSync(gecici, hedef);
      gecici = null;
      yeniKuruldu = true;

      // Eski format ve türetilmiş thumbnail/beden dosyaları yeni PNG ile
      // karışmasın; başarılı işlemde geri alınabilir karantinada tutulur.
      const eskiler = ilgiliAssetDosyalari(slot, id, true).filter((kayit) => kayit.tam !== hedef);
      tasinan = karantinayaTasi(eskiler, karantina);
      if (!gorselleriYaz()) throw new Error("Manifest güncellenemedi");

      if (yedek && fs.existsSync(yedek)) {
        const eskiHedef = path.join(karantina, path.relative(ASSETS, hedef));
        fs.mkdirSync(path.dirname(eskiHedef), { recursive: true });
        fs.renameSync(yedek, eskiHedef);
        yedek = null;
      }
      adminYanit(res, 200, {
        ok: true,
        slot,
        id,
        url: "/assets/" + slot + "/" + id + "." + ext,
        uyari: "Metadata, thumbnail ve beden varyantlarını yayın öncesi güncelleyin.",
      });
    } catch (e) {
      tasimalariGeriAl(tasinan);
      if (yeniKuruldu) {
        try {
          if (yedek && fs.existsSync(yedek)) fs.renameSync(yedek, hedef);
          else fs.unlinkSync(hedef);
        } catch (geriHata) {
          console.error("Yükleme geri alma hatası:", geriHata.message);
        }
      }
      if (gecici) try { fs.unlinkSync(gecici); } catch (_e) {}
      if (yedek) try { fs.unlinkSync(yedek); } catch (_e) {}
      gorselleriYaz();
      adminYanit(res, 500, { hata: "Yükleme tamamlanamadı: " + String(e.message || e) });
    }
  });
}

function adminSil(req, res) {
  govdeOku(req, 1, (err, v) => {
    if (err) return adminYanit(res, err.statusCode || 400, { hata: "Geçersiz istek" });
    if (!ADMIN) return adminYanit(res, 503, { hata: "Yönetim devre dışı; sunucuda LARA_ADMIN tanımlanmalı" });
    if (!v || !sabitEsit(v.parola, ADMIN)) return adminYanit(res, 401, { hata: "Yönetim şifresi yanlış" });
    const slot = GORSEL_SLOTLAR.includes(v.slot) ? v.slot : null;
    const id = String(v.id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
    if (!slot || !id) return adminYanit(res, 400, { hata: "Geçersiz" });
    const dosyalar = ilgiliAssetDosyalari(slot, id, true);
    if (!dosyalar.length) return adminYanit(res, 200, { ok: false });

    let tasinan = [];
    try {
      tasinan = karantinayaTasi(dosyalar, karantinaKoku("admin_deleted"));
      if (!gorselleriYaz()) throw new Error("Manifest güncellenemedi");
      adminYanit(res, 200, { ok: true, karantinayaTasinan: tasinan.length });
    } catch (e) {
      tasimalariGeriAl(tasinan);
      gorselleriYaz();
      adminYanit(res, 500, { hata: "Silme işlemi geri alındı: " + String(e.message || e) });
    }
  });
}

function metadataOku() {
  try {
    return JSON.parse(fs.readFileSync(path.join(ASSETS, "metadata.json"), "utf8"));
  } catch (e) {
    return {};
  }
}

function promptUret(slot, id, description) {
  const meta = (metadataOku()[slot] || {})[id] || {};
  const ad = meta.ad || id;
  const emoji = meta.emoji || "✨";
  const etiketler = Array.isArray(meta.etiketler) ? meta.etiketler : [];
  const prompts = promptContractOku();
  const contract = slot === "arkaplanlar" ? prompts.background : (slot === "modeller" ? prompts.model : prompts.layer);
  const output = slot === "arkaplanlar"
    ? "PNG, exact 1024x1365 px. Opaque image."
    : "PNG, exact 1024x1365 px. Transparent alpha outside the item; all four corners alpha=0.";
  return `id=${id} | slot=${slot} | ad=${ad} | emoji=${emoji} | etiketler=${JSON.stringify(etiketler)}

PROMPT:
${prompts.master}
${contract}
Requested item/model/background: ${description || ad}.

NEGATIVE PROMPT:
${prompts.negative}

OUTPUT CONTRACT:
${output}
Run after generation:
/opt/lara/.venv/bin/python /opt/lara/asset_quality.py`;
}

function adminPrompt(req, res) {
  govdeOku(req, 1, (err, v) => {
    if (err) return adminYanit(res, err.statusCode || 400, { hata: "Geçersiz istek" });
    if (!ADMIN) return adminYanit(res, 503, { hata: "Yönetim devre dışı; sunucuda LARA_ADMIN tanımlanmalı" });
    if (!v || !sabitEsit(v.parola, ADMIN)) return adminYanit(res, 401, { hata: "Yönetim şifresi yanlış" });
    const slot = GORSEL_SLOTLAR.includes(v.slot) ? v.slot : null;
    const id = String(v.id || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
    const desc = String(v.description || "").slice(0, 240);
    if (!slot || !id) return adminYanit(res, 400, { hata: "Geçersiz slot/id" });
    adminYanit(res, 200, { ok: true, prompt: promptUret(slot, id, desc) });
  });
}

function yetkiVar(req) {
  if (!PAROLA) return true; // parola ayarlı değilse serbest (ev ağı)
  const m = /^Basic (.+)$/.exec(req.headers.authorization || "");
  if (!m) return false;
  try {
    const acik = Buffer.from(m[1], "base64").toString("utf8");
    const ikiNokta = acik.indexOf(":");
    if (ikiNokta < 0) return false;
    return sabitEsit(acik.slice(0, ikiNokta), KULLANICI) && sabitEsit(acik.slice(ikiNokta + 1), PAROLA);
  } catch (e) {
    return false;
  }
}

function istegiIsle(req, res) {
  guvenlikBasliklari(res);
  let yol;
  try {
    yol = new URL(req.url, "http://localhost").pathname;
  } catch (e) {
    return metinYanit(res, 400, "Geçersiz istek yolu");
  }

  // Fotoğraf özelliği parola korumasından bağımsız olarak açık opt-in ister.
  if (!UPLOADLAR_ACIK && (yol === "/api/assets" || yol === "/api/upload")) {
    return jsonYanit(res, 403, { hata: "Fotoğraf yükleme özelliği devre dışı; LARA_UPLOADS=1 ile açılabilir" });
  }
  if (!UPLOADLAR_ACIK && (yol === "/fotograflar" || yol.startsWith("/fotograflar/"))) {
    return metinYanit(res, 404, "Bulunamadı");
  }

  // Parola koruması (internetten yayında)
  if (!yetkiVar(req)) {
    if (!oranSiniri(req, res, "site-auth", 30, 5 * 60 * 1000)) return;
    const baslik = { "WWW-Authenticate": 'Basic realm="Leyla Stil Studyosu"' };
    if (yol.startsWith("/api/")) return jsonYanit(res, 401, { hata: "Parola gerekli" }, baslik);
    return metinYanit(res, 401, "Parola gerekli", baslik);
  }

  // API: varlık listesi (kullanıcı fotoğrafları)
  if (yol === "/api/assets") {
    if (req.method !== "GET") return jsonYanit(res, 405, { hata: "Yönteme izin verilmiyor" }, { Allow: "GET" });
    return jsonYanit(res, 200, varliklariListele());
  }

  // API: gerçekçi görsel override'ları
  if (yol === "/api/gorseller") {
    if (req.method !== "GET") return jsonYanit(res, 405, { hata: "Yönteme izin verilmiyor" }, { Allow: "GET" });
    return jsonYanit(res, 200, gorselleriListele());
  }

  // API: yönetim — LARA_ADMIN yoksa kapalı ve fail-closed.
  if (yol.startsWith("/api/admin/")) {
    if (!ADMIN) return jsonYanit(res, 503, { hata: "Yönetim devre dışı; sunucuda LARA_ADMIN tanımlanmalı" });
    if (req.method !== "POST") return jsonYanit(res, 405, { hata: "Yönteme izin verilmiyor" }, { Allow: "POST" });

    if (yol === "/api/admin/giris") {
      if (!jsonMutasyonKontrol(req, res, "admin-login", 12, 5 * 60 * 1000)) return;
      govdeOku(req, 1, (e, v) => {
        if (e) return adminYanit(res, e.statusCode || 400, { hata: "Geçersiz istek" });
        if (!v || !sabitEsit(v.parola, ADMIN)) return adminYanit(res, 401, { ok: false, hata: "Yönetim şifresi yanlış" });
        return adminYanit(res, 200, { ok: true });
      });
      return;
    }
    if (yol === "/api/admin/yukle") {
      if (!jsonMutasyonKontrol(req, res, "admin-upload", 20, 10 * 60 * 1000)) return;
      return adminYukle(req, res);
    }
    if (yol === "/api/admin/sil") {
      if (!jsonMutasyonKontrol(req, res, "admin-mutation", 60, 5 * 60 * 1000)) return;
      return adminSil(req, res);
    }
    if (yol === "/api/admin/prompt") {
      if (!jsonMutasyonKontrol(req, res, "admin-mutation", 60, 5 * 60 * 1000)) return;
      return adminPrompt(req, res);
    }
    return jsonYanit(res, 404, { hata: "API bulunamadı" });
  }

  // API: kullanıcı fotoğrafı yükleme
  if (yol === "/api/upload") {
    if (req.method !== "POST") return jsonYanit(res, 405, { hata: "Yönteme izin verilmiyor" }, { Allow: "POST" });
    if (!jsonMutasyonKontrol(req, res, "photo-upload", 12, 10 * 60 * 1000)) return;
    return yukle(req, res);
  }
  if (yol.startsWith("/api/")) return jsonYanit(res, 404, { hata: "API bulunamadı" });

  if (req.method !== "GET" && req.method !== "HEAD") {
    return metinYanit(res, 405, "Yönteme izin verilmiyor", { Allow: "GET, HEAD" });
  }

  // Statik: kullanıcı fotoğrafları
  if (yol.startsWith("/fotograflar/")) {
    const t = guvenliYol(FOTO, yol.slice("/fotograflar/".length));
    if (!t) return metinYanit(res, 404, "Bulunamadı");
    return gonderDosya(req, res, t, { ozel: true });
  }

  // Statik: public (oyun arayüzü)
  if (yol === "/") return gonderDosya(req, res, path.join(PUBLIC, "index.html"));
  const t = guvenliYol(PUBLIC, yol.replace(/^\/+/, ""));
  if (!t) return metinYanit(res, 404, "Bulunamadı");
  return gonderDosya(req, res, t);
}

const sunucu = http.createServer((req, res) => {
  try {
    istegiIsle(req, res);
  } catch (e) {
    console.error("İstek işleme hatası:", e.stack || e.message || e);
    if (!res.headersSent) jsonYanit(res, 500, { hata: "Sunucu isteği işleyemedi" });
    else res.destroy();
  }
});

sunucu.on("clientError", (_err, socket) => {
  if (socket.writable) socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
});

function yerelAdresler() {
  const tum = [];
  const arayuzler = os.networkInterfaces();
  for (const ad in arayuzler) {
    for (const i of arayuzler[ad]) {
      if (i.family === "IPv4" && !i.internal) tum.push(i.address);
    }
  }
  // Ev ağı adreslerini öne al (192.168.* ve 10.*); docker/tailscale gibi sanal olanları gizle
  const tercih = tum.filter((a) => a.startsWith("192.168.") || a.startsWith("10."));
  return tercih.length ? tercih : tum;
}

gorselleriYaz(); // başlangıçta statik manifesti tazele (statik yayın için)

// Asset klasörü değişince manifesti otomatik tazele — yeni PNG atınca elle tara gerekmez
let _yazZaman = null;
try {
  fs.watch(ASSETS, { recursive: true }, (_event, dosya) => {
    const ad = String(dosya || "").replace(/\\/g, "/");
    const taban = path.basename(ad);
    if (ad.endsWith("gorseller.json") || ad.endsWith("beden.json")) return;
    if (/\.(?:tmp|bak)$/.test(taban) || ad.startsWith("_karantina/") || ad.startsWith("_thumb/")) return;
    clearTimeout(_yazZaman);
    _yazZaman = setTimeout(gorselleriYaz, 400);
  });
} catch (e) {
  console.error("Asset izleyici başlatılamadı:", e.message);
}

sunucu.listen(PORT, HOST, () => {
  console.log("\n👑  Leyla Stil Stüdyosu çalışıyor!\n");
  console.log("  Dinleme adresi:        " + HOST + ":" + PORT);
  console.log("  Bu bilgisayarda aç:    http://localhost:" + PORT);
  if (!["127.0.0.1", "::1", "localhost"].includes(HOST)) {
    for (const a of yerelAdresler()) {
      console.log("  Tablet/telefonda aç:   http://" + a + ":" + PORT + "   (aynı wifi'de)");
    }
  }
  if (PAROLA) {
    console.log("\n  🔒 Parola koruması AÇIK  (kullanıcı: " + KULLANICI + ")");
    console.log("  🌐 Yayın adresi:        https://lara.perinet.org");
  } else {
    console.log("\n  ⚠️  Parola koruması KAPALI — internetten yayınlamadan önce şununla başlat:");
    console.log('       LARA_PAROLA="seninParolan" node server.js');
  }
  console.log(ADMIN
    ? "  🔧 Yönetim paneli AÇIK (LARA_ADMIN tanımlı)"
    : "  🔒 Yönetim paneli KAPALI — açmak için LARA_ADMIN tanımla");
  console.log(UPLOADLAR_ACIK
    ? "  📷 Kullanıcı fotoğrafları AÇIK (LARA_UPLOADS=1)"
    : "  🔒 Kullanıcı fotoğrafları KAPALI");
  console.log("\n  Durdurmak için bu pencerede Ctrl+C yap.\n");
});

sunucu.on("error", (e) => {
  console.error("Sunucu başlatılamadı:", e.message);
  process.exitCode = 1;
});
