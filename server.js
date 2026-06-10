// Leyla Stil Stüdyosu - küçük yerel sunucu
// Sadece Node.js'in kendi modüllerini kullanır (kurulum/npm gerekmez).
// Hiçbir şey internete gönderilmez; sadece evdeki cihazlara wifi üzerinden hizmet verir.

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const zlib = require("zlib");

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const FOTO = path.join(ROOT, "fotograflar");
const PORT = process.env.PORT || 8080;

// İnternetten yayınlarken koruma: LARA_PAROLA ayarlanırsa şifre sorulur.
// Ayarlanmazsa (sadece ev ağı için) serbest çalışır.
const PAROLA = process.env.LARA_PAROLA || "";
const KULLANICI = process.env.LARA_KULLANICI || "lara";

// Yönetim (admin) şifresi — gardıroba görsel ekleme/silme paneli için
const ADMIN = process.env.LARA_ADMIN || "lara2018";

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

function gonderDosya(res, dosyaYolu) {
  fs.readFile(dosyaYolu, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Bulunamadı");
      return;
    }
    const ext = path.extname(dosyaYolu).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      // Tarayıcı eski sürümü önbellekte tutmasın — güncellemeler hep taze gelsin
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    });
    res.end(data);
  });
}

// Güvenli yol: tabanın dışına çıkmayı engelle
function guvenliYol(taban, istek) {
  const temiz = path.normalize(decodeURIComponent(istek)).replace(/^(\.\.[\/\\])+/, "");
  const tam = path.resolve(taban, temiz);
  const sandBox = taban.endsWith(path.sep) ? taban : taban + path.sep;
  if (!tam.startsWith(sandBox) && tam !== path.resolve(taban)) return null;
  return tam;
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
      for (const f of fs.readdirSync(path.join(kok, slot))) {
        const ext = path.extname(f).toLowerCase();
        if (![".png", ".webp", ".jpg", ".jpeg"].includes(ext)) continue;
        const rel = path
          .relative(ASSETS, path.join(kok, slot, f))
          .split(path.sep)
          .map(encodeURIComponent)
          .join("/");
        harita[path.parse(f).name] = "/assets/" + rel;
      }
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

// Manifest: API ve statik fallback aynı asset listesini kullansın diye güncellenir.
function gorselleriYaz() {
  try {
    const gorseller = gorselleriListele();
    fs.writeFileSync(path.join(ASSETS, "gorseller.json"), JSON.stringify(gorseller, null, 1));
    fs.writeFileSync(path.join(ASSETS, "beden.json"), JSON.stringify(gorseller.beden || {}, null, 1));
  } catch (e) {}
}

function dosyaAdiTemizle(ad) {
  return (ad || "resim")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 40);
}

function yukle(req, res) {
  let govde = "";
  let cokBuyuk = false;
  req.on("data", (parca) => {
    govde += parca;
    if (govde.length > 15 * 1024 * 1024) {
      cokBuyuk = true;
      req.destroy();
    }
  });
  req.on("end", () => {
    if (cokBuyuk) {
      res.writeHead(413, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ hata: "Dosya çok büyük (en fazla 15MB)" }));
      return;
    }
    try {
      const veri = JSON.parse(govde);
      const kat = KATEGORILER.includes(veri.category) ? veri.category : null;
      if (!kat) throw new Error("Geçersiz kategori");
      const eslesme = /^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/.exec(veri.dataUrl || "");
      if (!eslesme) throw new Error("Geçersiz resim");
      let uzanti = eslesme[1] === "jpeg" ? "jpg" : eslesme[1];
      const tampon = Buffer.from(eslesme[2], "base64");
      const ad = dosyaAdiTemizle(veri.name) + "_" + Date.now() + "." + uzanti;
      const hedef = path.join(FOTO, kat, ad);
      fs.writeFileSync(hedef, tampon);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ url: "/fotograflar/" + kat + "/" + encodeURIComponent(ad), kategori: kat, ad: path.parse(ad).name }));
    } catch (e) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ hata: String(e.message || e) }));
    }
  });
}

/* ======================= YÖNETİM (ADMIN) PANELİ ======================= */
function govdeOku(req, limitMB, cb) {
  let g = "", asti = false;
  req.on("data", (p) => {
    g += p;
    if (g.length > limitMB * 1024 * 1024) { asti = true; req.destroy(); }
  });
  req.on("end", () => {
    if (asti) return cb(new Error("Dosya çok büyük"));
    try { cb(null, JSON.parse(g)); } catch (e) { cb(e); }
  });
}

// PNG kalite kontrolü — kütüphanesiz IHDR + alpha/corner kontrolü.
function pngAnaliz(buf) {
  const imza = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buf.length < 33 || !buf.subarray(0, 8).equals(imza)) return null;
  let p = 8;
  let ihdr = null;
  const idat = [];
  while (p + 8 <= buf.length) {
    const len = buf.readUInt32BE(p); p += 4;
    const type = buf.toString("ascii", p, p + 4); p += 4;
    if (p + len + 4 > buf.length) return null;
    const data = buf.subarray(p, p + len); p += len + 4; // CRC atlanır
    if (type === "IHDR") {
      ihdr = {
        w: data.readUInt32BE(0),
        h: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
      };
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
  }
  if (!ihdr) return null;
  const hasAlpha = ihdr.colorType === 4 || ihdr.colorType === 6;
  const sonuc = { ...ihdr, hasAlpha, cornerAlpha: null, transparentCorners: false };
  if (!hasAlpha || ihdr.bitDepth !== 8 || !idat.length) return sonuc;

  const channels = ihdr.colorType === 6 ? 4 : 2;
  const bpp = channels;
  const rowBytes = ihdr.w * channels;
  let raw;
  try { raw = zlib.inflateSync(Buffer.concat(idat)); } catch (e) { return sonuc; }
  if (raw.length < (rowBytes + 1) * ihdr.h) return sonuc;

  const rows = [];
  let prev = Buffer.alloc(rowBytes);
  let off = 0;
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
    rows.push(cur);
    prev = cur;
  }
  const alphaAt = (x, y) => rows[y][x * channels + channels - 1];
  const ca = [
    alphaAt(0, 0),
    alphaAt(ihdr.w - 1, 0),
    alphaAt(0, ihdr.h - 1),
    alphaAt(ihdr.w - 1, ihdr.h - 1),
  ];
  sonuc.cornerAlpha = ca;
  sonuc.transparentCorners = ca.every((a) => a < 8);
  sonuc.opaqueCorners = ca.every((a) => a > 247);
  return sonuc;
}

function adminYanit(res, kod, obj) {
  res.writeHead(kod, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

function adminYukle(req, res) {
  govdeOku(req, 25, (err, v) => {
    if (err) return adminYanit(res, 400, { hata: "Geçersiz istek" });
    if (!v || v.parola !== ADMIN) return adminYanit(res, 401, { hata: "Yönetim şifresi yanlış" });
    const slot = GORSEL_SLOTLAR.includes(v.slot) ? v.slot : null;
    if (!slot) return adminYanit(res, 400, { hata: "Geçersiz kategori" });
    const id = String(v.id || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
    if (!id) return adminYanit(res, 400, { hata: "Geçersiz dosya adı (id)" });
    const m = /^data:image\/png;base64,(.+)$/.exec(v.dataUrl || "");
    if (!m) return adminYanit(res, 400, { hata: "Sadece 1024×1365 PNG yüklenebilir" });
    const ext = "png";
    const buf = Buffer.from(m[1], "base64");
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
    try {
      for (const e of ["png", "webp", "jpg", "jpeg"]) {
        const p = path.join(ASSETS, slot, id + "." + e);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
      fs.mkdirSync(path.join(ASSETS, slot), { recursive: true });
      fs.writeFileSync(path.join(ASSETS, slot, id + "." + ext), buf);
      gorselleriYaz();
      adminYanit(res, 200, { ok: true, slot, id, url: "/assets/" + slot + "/" + id + "." + ext });
    } catch (e) {
      adminYanit(res, 500, { hata: String(e.message || e) });
    }
  });
}

function adminSil(req, res) {
  govdeOku(req, 1, (err, v) => {
    if (err) return adminYanit(res, 400, { hata: "Geçersiz istek" });
    if (!v || v.parola !== ADMIN) return adminYanit(res, 401, { hata: "Yönetim şifresi yanlış" });
    const slot = GORSEL_SLOTLAR.includes(v.slot) ? v.slot : null;
    const id = String(v.id || "").replace(/[^a-zA-Z0-9_-]/g, "");
    if (!slot || !id) return adminYanit(res, 400, { hata: "Geçersiz" });
    let silindi = false;
    for (const e of ["png", "webp", "jpg", "jpeg"]) {
      const p = path.join(ASSETS, slot, id + "." + e);
      if (fs.existsSync(p)) { fs.unlinkSync(p); silindi = true; }
    }
    gorselleriYaz();
    adminYanit(res, 200, { ok: silindi });
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
    if (err) return adminYanit(res, 400, { hata: "Geçersiz istek" });
    if (!v || v.parola !== ADMIN) return adminYanit(res, 401, { hata: "Yönetim şifresi yanlış" });
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
  const [u, p] = Buffer.from(m[1], "base64").toString().split(":");
  return u === KULLANICI && p === PAROLA;
}

const sunucu = http.createServer((req, res) => {
  const u = new URL(req.url, "http://localhost");
  const yol = u.pathname;

  // Parola koruması (internetten yayında)
  if (!yetkiVar(req)) {
    res.writeHead(401, {
      "WWW-Authenticate": 'Basic realm="Leyla Stil Studyosu"',
      "Content-Type": "text/plain; charset=utf-8",
    });
    res.end("Parola gerekli");
    return;
  }

  // API: varlık listesi (kullanıcı fotoğrafları)
  if (yol === "/api/assets" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(varliklariListele()));
    return;
  }

  // API: gerçekçi görsel override'ları (public/assets/<slot>/<id>.png)
  if (yol === "/api/gorseller" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(gorselleriListele()));
    return;
  }

  // API: yönetim (admin) — şifre kontrolü, görsel yükleme/silme
  if (yol === "/api/admin/giris" && req.method === "POST") {
    govdeOku(req, 1, (e, v) => adminYanit(res, 200, { ok: !!v && v.parola === ADMIN }));
    return;
  }
  if (yol === "/api/admin/yukle" && req.method === "POST") { adminYukle(req, res); return; }
  if (yol === "/api/admin/sil" && req.method === "POST") { adminSil(req, res); return; }
  if (yol === "/api/admin/prompt" && req.method === "POST") { adminPrompt(req, res); return; }

  // API: fotoğraf yükleme
  if (yol === "/api/upload" && req.method === "POST") {
    yukle(req, res);
    return;
  }

  // Statik: fotoğraflar
  if (yol.startsWith("/fotograflar/")) {
    const t = guvenliYol(FOTO, yol.replace("/fotograflar/", ""));
    if (t) return gonderDosya(res, t);
  }

  // Statik: public (oyun arayüzü)
  if (yol === "/") return gonderDosya(res, path.join(PUBLIC, "index.html"));
  // Baştaki "/" temizlenir; aksi halde path.resolve mutlak yolu taban dışına taşır
  const t = guvenliYol(PUBLIC, yol.replace(/^\/+/, ""));
  if (t) return gonderDosya(res, t);

  res.writeHead(404);
  res.end("Bulunamadı");
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
    if (ad.endsWith("gorseller.json") || ad.endsWith("beden.json")) return;
    clearTimeout(_yazZaman);
    _yazZaman = setTimeout(gorselleriYaz, 400);
  });
} catch (e) {}

sunucu.listen(PORT, "0.0.0.0", () => {
  console.log("\n👑  Leyla Stil Stüdyosu çalışıyor!\n");
  console.log("  Bu bilgisayarda aç:   http://localhost:" + PORT);
  for (const a of yerelAdresler()) {
    console.log("  Tablet/telefonda aç:  http://" + a + ":" + PORT + "   (aynı wifi'de)");
  }
  if (PAROLA) {
    console.log("\n  🔒 Parola koruması AÇIK  (kullanıcı: " + KULLANICI + ")");
    console.log("  🌐 Yayın adresi:        https://lara.urgup.keenetic.link  (router ayarı gerekir)");
  } else {
    console.log("\n  ⚠️  Parola koruması KAPALI — internetten yayınlamadan önce şununla başlat:");
    console.log('       LARA_PAROLA="seninParolan" node server.js');
  }
  console.log("\n  Durdurmak için bu pencerede Ctrl+C yap.\n");
});
