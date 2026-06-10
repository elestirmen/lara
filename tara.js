// Gardırop görsellerini tarayıp public/assets/gorseller.json üretir.
// Statik yayında gerçekçi PNG override'larının yüklenmesi için gerekir.
// Kullanım: yeni görsel ekledikten/sildikten sonra  ->  node /opt/lara/tara.js
"use strict";
const fs = require("fs");
const path = require("path");

const ASSETS = path.join(__dirname, "public", "assets");
const GORSEL_SLOTLAR = ["modeller", "arkaplanlar", "kanatlar", "elbiseler", "ayakkabilar", "takilar", "saclar", "taclar", "asalar", "ozel"];
const UZANTI = [".png", ".webp", ".jpg", ".jpeg"];

function slotTara(kok, slot) {
  const harita = {};
  try {
    for (const f of fs.readdirSync(path.join(kok, slot))) {
      if (!UZANTI.includes(path.extname(f).toLowerCase())) continue;
      const rel = path
        .relative(ASSETS, path.join(kok, slot, f))
        .split(path.sep)
        .map(encodeURIComponent)
        .join("/");
      harita[path.parse(f).name] = "/assets/" + rel;
    }
  } catch (e) {}
  return harita;
}

function tara() {
  const sonuc = {};
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

if (require.main === module) {
  const veri = tara();
  fs.writeFileSync(path.join(ASSETS, "gorseller.json"), JSON.stringify(veri, null, 1));
  fs.writeFileSync(path.join(ASSETS, "beden.json"), JSON.stringify(veri.beden || {}, null, 1));
  const say = Object.entries(veri).reduce((t, [k, m]) =>
    t + (k === "beden" ? 0 : Object.keys(m).length), 0);
  const bedenSay = Object.values(veri.beden || {}).reduce((t, bySlot) =>
    t + Object.values(bySlot).reduce((n, h) => n + Object.keys(h).length, 0), 0);
  console.log("✅ gorseller.json güncellendi — " + say + " görsel + " + bedenSay + " beden varyantı.");
}

module.exports = { tara };
