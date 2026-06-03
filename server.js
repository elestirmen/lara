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

// Fotoğraf kategorileri (klasör adları)
const KATEGORILER = ["karakterler", "kiyafetler", "saclar", "aksesuarlar", "arkaplanlar"];
const RESIM_UZANTI = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];

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
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

// Güvenli yol: tabanın dışına çıkmayı engelle
function guvenliYol(taban, istek) {
  const temiz = path.normalize(decodeURIComponent(istek)).replace(/^(\.\.[\/\\])+/, "");
  const tam = path.join(taban, temiz);
  if (!tam.startsWith(taban)) return null;
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

  // API: varlık listesi
  if (yol === "/api/assets" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(varliklariListele()));
    return;
  }

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
  const t = guvenliYol(PUBLIC, yol);
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
