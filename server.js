// Lara'nın Sihirli Dolabı - küçük yerel sunucu
// Sadece Node.js'in kendi modüllerini kullanır (kurulum/npm gerekmez).
// Hiçbir şey internete gönderilmez; sadece evdeki cihazlara wifi üzerinden hizmet verir.

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

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
// oyun o parçanın vektör çizimi yerine bu PNG'yi kullanır. (drop-in; kod değişmez)
const GORSEL_SLOTLAR = ["modeller", "arkaplanlar", "kanatlar", "elbiseler", "ayakkabilar", "takilar", "saclar", "taclar", "asalar"];
const ASSETS = path.join(PUBLIC, "assets");

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
  // Dolgun (balık etli) beden varyantları
  const dolgun = {};
  for (const slot of GORSEL_SLOTLAR) {
    const h = slotTara(path.join(ASSETS, "_dolgun"), slot);
    if (Object.keys(h).length) dolgun[slot] = h;
  }
  sonuc.dolgun = dolgun;

  // Slider icin onceden uretilmis beden seviyeleri: _beden/b20/<slot>/<id>.png
  const beden = {};
  try {
    for (const level of fs.readdirSync(path.join(ASSETS, "_beden")).sort()) {
      if (!/^b\d{2,3}$/.test(level)) continue;
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

// Statik manifest: node'suz (statik) yayında da override'lar yüklensin diye
// public/assets/gorseller.json dosyasını günceller.
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

// PNG genişlik/yükseklik (IHDR'den) — kütüphanesiz boyut kontrolü
function pngBoyut(buf) {
  if (buf.length < 24 || buf.toString("ascii", 12, 16) !== "IHDR") return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
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
    const m = /^data:image\/(png|webp);base64,(.+)$/.exec(v.dataUrl || "");
    if (!m) return adminYanit(res, 400, { hata: "Sadece PNG veya WebP yüklenebilir" });
    const ext = m[1] === "webp" ? "webp" : "png";
    const buf = Buffer.from(m[2], "base64");
    if (ext === "png") {
      const b = pngBoyut(buf);
      if (!b) return adminYanit(res, 400, { hata: "PNG okunamadı/bozuk" });
      if (Math.abs(b.w / b.h - 3 / 4) > 0.02) {
        return adminYanit(res, 400, { hata: `Oran 3:4 olmalı (1024×1365). Gelen: ${b.w}×${b.h}` });
      }
    }
    try {
      for (const e of ["png", "webp", "jpg", "jpeg"]) {
        const p = path.join(ASSETS, slot, id + "." + e);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
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
      "WWW-Authenticate": 'Basic realm="Lara\'nin Sihirli Dolabi"',
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
  console.log("\n👑  Lara'nın Sihirli Dolabı çalışıyor!\n");
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
