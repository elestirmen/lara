"use strict";
/*
  Leyla Stil Stüdyosu — Oyun Mantığı (Yenilenmiş & Güvenli)
  -------------------------------------------------------------
  Manken değiştirme sistemi entegre edilmiş, XSS engelleme kurallarına göre
  innerHTML kullanımı tamamen temizlenmiş ve güvenli DOM API'leri kullanılmıştır.
*/

const $ = (s) => document.querySelector(s);
const sahne = $("#sahne");

/* =============================== DURUM (STATE) =============================== */
const slotById = {};
DOLAP.slotlar.forEach((s) => (slotById[s.id] = s));

// Varsayılan kombin (Leyla mankeniyle başlar)
const giyim = {
  mankenler: "m_lara", // Seçili manken ID'si
  arkaplanlar: "ap_balo",
  kanatlar: null,
  elbiseler: "elb_turuncu",
  ozel: null,
  ayakkabilar: "ayk_cam",
  takilar: null,
  saclar: "sac_dalgali",
  taclar: "tac_klasik",
  asalar: null,
};

const renkler = {
  ten: DOLAP.mankenler[0].ten,
  sac: DOLAP.mankenler[0].sacRenk || DOLAP.sacRenkleri[0].renk,
  goz: DOLAP.mankenler[0].goz,
  ruj: DOLAP.mankenler[0].ruj,
  allik: DOLAP.mankenler[0].allik,
};

let arkaPlanOzel = null;
let aktifSekme = "mankenler";
let stickerlar = [];
let seciliSticker = null;
let stickerSayac = 1;
let bekleyenKategori = null;
let customVarliklar = {};

// Gerçekçi (raster) görsel override'ları: { slot: { id: url } }
// public/assets/<slot>/<id>.png varsa, o parça için vektör çizim yerine PNG kullanılır.
let gorselOverride = {};
let gorselMetadata = {};
function ovr(slot, id) {
  return (gorselOverride[slot] && gorselOverride[slot][id]) || null;
}

// Gerçekçi mod: en az bir model PNG'si varsa ten/makyaj gövdeye bake'lidir.
function gercekciAktif() {
  return Object.keys(gorselOverride.modeller || {}).length > 0;
}

// ===== Beden slider'i — canlı piksel şişirme yerine önceden üretilmiş PNG varyantları =====
// Varyantlar: public/assets/_beden/b20..b100/<slot>/<id>.png
const BEDEN_KATMAN = new Set(["_vucut", "elbiseler", "takilar", "ozel"]);
const BEDEN_SEVIYELERI = [20, 40, 60, 80, 100];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
let dolgunlukDurum = {};
try { dolgunlukDurum = JSON.parse(localStorage.getItem("lara_dolgunluk") || "{}"); } catch (e) {}

function aktifDolgunluk() {
  const v = Number(dolgunlukDurum[giyim.mankenler] || 0);
  // Eski sürüm 0..2 arası güç saklıyordu; mevcut sürüm 0..100 yüzde saklar.
  if (v > 0 && v <= 2) return clamp(Math.round((v / 2) * 100), 0, 100);
  return clamp(Math.round(v), 0, 100);
}

function bedenVaryant(slot, id) {
  if (!slot || !id || aktifDolgunluk() < 10) return null;
  const beden = gorselOverride.beden || {};
  let enYakin = null;
  let fark = Infinity;
  for (const seviye of BEDEN_SEVIYELERI) {
    const anahtar = "b" + String(seviye).padStart(2, "0");
    const url = beden[anahtar] && beden[anahtar][slot] && beden[anahtar][slot][id];
    if (!url) continue;
    const d = Math.abs(aktifDolgunluk() - seviye);
    if (d < fark) {
      fark = d;
      enYakin = url;
    }
  }
  return enYakin;
}
function sliderGuncelle() {
  const sl = $("#dolgunlukSlider");
  if (sl) sl.value = aktifDolgunluk();
}
function dolgunlukUygula() {
  for (const id of BEDEN_KATMAN) katmanGuncelle(id, false);
  sliderGuncelle();
  if (aktifSekme === "mankenler") urunleriGoster("mankenler");
}
function sliderKur() {
  const sl = $("#dolgunlukSlider");
  if (!sl) return;
  let bekle = false;
  const ayarla = (kaydet) => {
    dolgunlukDurum[giyim.mankenler] = clamp(Number(sl.value) || 0, 0, 100);
    if (kaydet) { try { localStorage.setItem("lara_dolgunluk", JSON.stringify(dolgunlukDurum)); } catch (e) {} }
    if (bekle) return;
    bekle = true;
    requestAnimationFrame(() => { bekle = false; for (const id of BEDEN_KATMAN) katmanGuncelle(id, false); });
  };
  sl.addEventListener("input", () => ayarla(false));
  sl.addEventListener("change", () => ayarla(true));
  sliderGuncelle();
}
// Panel küçük resmi: gerçekçi PNG'ler için küçük thumbnail (hız), yoksa tam görsele düş; lazy yükle
function panelGorsel(img, slot, id, tamUrl) {
  img.loading = "lazy";
  img.decoding = "async";
  if (ovr(slot, id)) {
    img.src = "/assets/_thumb/" + slot + "/" + encodeURIComponent(id) + ".webp";
    img.onerror = () => { img.onerror = null; img.src = tamUrl; };
  } else {
    img.src = tamUrl;
  }
}
async function gorselleriYukle() {
  // Yerel node'da canlı API en taze veriyi verir; statik yayında manifest kullanılır.
  for (const url of ["/api/gorseller", "/assets/gorseller.json"]) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (r.ok) { gorselOverride = await r.json(); break; }
    } catch (e) {}
  }
  if (!gorselOverride || !Object.keys(gorselOverride).length) gorselOverride = {};

  // Eski çalışan sunucular gorseller.json dosyasını geri yazsa bile beden manifesti
  // ayrı dosyada kalır. Statik yayında da slider bu dosyadan çalışır.
  try {
    const r = await fetch("/assets/beden.json", { cache: "no-store" });
    if (r.ok) {
      const beden = await r.json();
      if (beden && Object.keys(beden).length) gorselOverride.beden = beden;
    }
  } catch (e) {}
}

async function metadataYukle() {
  try {
    const r = await fetch("/assets/metadata.json", { cache: "no-store" });
    gorselMetadata = r.ok ? await r.json() : {};
  } catch (e) {
    gorselMetadata = {};
  }
}

const BOS_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800"></svg>';
function idGuzelAd(id) {
  const s = id.replace(/^[a-z]+_/, "").replace(/_/g, " ").trim();
  return (s || id).replace(/\b\w/g, (c) => c.toUpperCase());
}
function meta(slot, id) {
  return (gorselMetadata[slot] && gorselMetadata[slot][id]) || {};
}
function etiketler(metaObj, eski) {
  return Array.isArray(metaObj.etiketler) ? metaObj.etiketler : (eski || []);
}
function metaUygula(slot, oge) {
  const m = meta(slot, oge.id);
  if (m.ad) oge.ad = m.ad;
  if (m.emoji) oge.emoji = m.emoji;
  oge.etiketler = etiketler(m, oge.etiketler);
  return oge;
}
function manifestOgesi(slot, id) {
  const m = meta(slot, id);
  return {
    id,
    ad: m.ad || idGuzelAd(id),
    emoji: m.emoji || "✨",
    svg: BOS_SVG,
    etiketler: etiketler(m, []),
  };
}

// Manifestte olup dolap.js'te tanımlı OLMAYAN parçaları otomatik ekle:
// kullanıcı yeni bir PNG atıp tara.js çalıştırınca yeni parça kod gerektirmeden görünür.
function manifestiBirlestir() {
  for (const slot of DOLAP.slotlar) {
    slot.liste.forEach((oge) => metaUygula(slot.id, oge));
    const harita = gorselOverride[slot.id];
    if (!harita) continue;
    const mevcut = new Set(slot.liste.map((x) => x.id));
    for (const id of Object.keys(harita)) {
      if (mevcut.has(id)) continue;
      slot.liste.push(manifestOgesi(slot.id, id));
    }
  }
  // Yeni modeller (gövdeler)
  const ilk = DOLAP.mankenler[0] || {};
  DOLAP.mankenler.forEach((manken) => metaUygula("modeller", manken));
  const mevcutM = new Set(DOLAP.mankenler.map((m) => m.id));
  for (const id of Object.keys(gorselOverride.modeller || {})) {
    if (mevcutM.has(id)) continue;
    const m = meta("modeller", id);
    DOLAP.mankenler.push({
      id, ad: m.ad || idGuzelAd(id), emoji: m.emoji || "🧍",
      ten: ilk.ten, goz: ilk.goz, ruj: ilk.ruj, allik: ilk.allik, sac: ilk.sac, sacRenk: ilk.sacRenk,
      svg: DOLAP.vucut,
      etiketler: etiketler(m, []),
    });
  }
}

let yildizlar = Number(localStorage.getItem("lara_yildiz") || 0);
let bitenGorevler = new Set(JSON.parse(localStorage.getItem("lara_gorevler") || "[]"));

// Panel sekme sırası
const SEKME_SIRASI = [
  "mankenler", "elbiseler", "ozel", "saclar", "taclar", "kanatlar", "ayakkabilar", "takilar", "asalar",
  "renkler", "makyaj", "arkaplanlar", "gorevler", "eslerim",
];

const OZEL_SEKME = {
  mankenler: { ad: "Modeller", emoji: "🧍" },
  renkler: { ad: "Renkler", emoji: "🎨" },
  makyaj: { ad: "Makyaj", emoji: "💄" },
  gorevler: { ad: "Görevler", emoji: "🌟" },
  eslerim: { ad: "Eşyalarım", emoji: "➕" },
};

/* =============================== YARDIMCI METODLAR =============================== */
function bul(slotId, itemId) {
  if (!itemId || !slotById[slotId]) return null;
  return slotById[slotId].liste.find((x) => x.id === itemId) || null;
}

function getSkinShades(hex) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  let rl = Math.min(255, Math.floor(r + (255 - r) * 0.45));
  let gl = Math.min(255, Math.floor(g + (255 - g) * 0.45));
  let bl = Math.min(255, Math.floor(b + (255 - b) * 0.45));

  let rd = Math.max(0, Math.floor(r * 0.72));
  let gd = Math.max(0, Math.floor(g * 0.67));
  let bd = Math.max(0, Math.floor(b * 0.62));

  const toHex = (x) => x.toString(16).padStart(2, "0");
  return {
    light: "#" + toHex(rl) + toHex(gl) + toHex(bl),
    dark: "#" + toHex(rd) + toHex(gd) + toHex(bd)
  };
}

function renkUygula(svg, r) {
  if (r.ten) {
    const shades = getSkinShades(r.ten);
    svg = svg.split("%TEN%").join(r.ten);
    svg = svg.split("%TEN_LIGHT%").join(shades.light);
    svg = svg.split("%TEN_DARK%").join(shades.dark);
  }
  if (r.sac) svg = svg.split("%SAC%").join(r.sac);
  if (r.goz) svg = svg.split("%GOZ%").join(r.goz);
  if (r.ruj) svg = svg.split("%RUJ%").join(r.ruj);
  if (r.allik) svg = svg.split("%ALLIK%").join(r.allik);
  return svg;
}

function svgURL(svg) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

const svgInner = (s) => s.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const svgSar = (g) =>
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">' + g + "</svg>";

// Karakter kartı için bebek + varsayılan saç önizlemesi (renkleri uygulanmış)
function mankenOnizlemeSVG(m) {
  const govde = svgInner(renkUygula(DOLAP.vucut, { ten: m.ten, goz: m.goz, ruj: m.ruj, allik: m.allik }));
  const sacItem = bul("saclar", m.sac);
  const sacKat = sacItem ? svgInner(renkUygula(sacItem.svg, { sac: m.sacRenk })) : "";
  return svgSar(govde + sacKat);
}

function titre(ms) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch (e) {}
}

/* =============================== BEBEK KATMAN YÖNETİMİ =============================== */
const katmanEl = {};

function katmanlariKur() {
  const kap = $("#katmanlar");
  kap.replaceChildren(); // Güvenli temizleme

  for (const id of DOLAP.cizimSirasi) {
    const img = document.createElement("img");
    img.dataset.kat = id;
    kap.appendChild(img);
    katmanEl[id] = img;
    katmanGuncelle(id, false);
  }
  kap.classList.add("nefes");
}

function katmanKaynak(id) {
  if (id === "_golge") return svgURL(DOLAP.golge); // zemin gölgesi (sabit)
  if (id === "_vucut") {
    // Gerçekçi model PNG'si varsa onu kullan; yoksa vektör bebeği canlı renklendir
    const b = bedenVaryant("modeller", giyim.mankenler);
    if (b) return b;
    const o = ovr("modeller", giyim.mankenler);
    if (o) return o;
    return svgURL(renkUygula(DOLAP.vucut, {
      ten: renkler.ten, goz: renkler.goz, ruj: renkler.ruj, allik: renkler.allik,
    }));
  }
  if (id === "arkaplanlar") {
    if (arkaPlanOzel) return arkaPlanOzel;
    const o = ovr("arkaplanlar", giyim[id]);
    if (o) return o;
    const it = bul(id, giyim[id]);
    return it ? svgURL(it.svg) : "";
  }
  const it = bul(id, giyim[id]);
  if (!it) return "";

  const b = bedenVaryant(id, giyim[id]);
  if (b) return b;

  const o = ovr(id, giyim[id]); // gerçekçi PNG override (saç override'ı renklendirilemez)
  if (o) return o;

  // Gerçekçi model gövdesinde saç görsele gömülüdür; ayrı saç PNG'si yoksa vektör saç çizme
  if (id === "saclar" && ovr("modeller", giyim.mankenler)) return "";

  let svg = it.svg;
  if (id === "saclar") {
    svg = renkUygula(svg, { sac: renkler.sac });
  }
  return svgURL(svg);
}

function katmanGuncelle(id, anim) {
  const img = katmanEl[id];
  if (!img) return;
  const src = katmanKaynak(id);
  if (!src) {
    img.removeAttribute("src");
    img.style.display = "none";
    return;
  }
  img.style.display = "";
  img.src = src;
  if (anim) {
    img.classList.remove("giris");
    void img.offsetWidth; // animasyon tetikle
    img.classList.add("giris");
  }
}

/* =============================== GİYDİRME & MANKEN & MAKYAJ =============================== */
function giy(slotId, itemId) {
  const slot = slotById[slotId];
  if (!slot) return;

  if (giyim[slotId] === itemId && !slot.zorunlu) {
    giyim[slotId] = null; // çıkar
    SES.efekt("cikar");
  } else {
    giyim[slotId] = itemId;
    SES.efekt("tak");
    pirilti();
    titre(8);
  }

  if (slotId === "arkaplanlar") {
    arkaPlanOzel = null;
    SES.muzikDegistir(itemId);
  }

  katmanGuncelle(slotId, true);
  if (aktifSekme === slotId) urunleriGoster(slotId);
  gorevleriDenetle();
}

function mankenDegistir(mankenId) {
  const m = DOLAP.mankenler.find(x => x.id === mankenId);
  if (!m) return;
  giyim.mankenler = mankenId;

  // Karakterin varsayılan ten/makyaj + saç görünümünü uygula
  renkler.ten = m.ten;
  renkler.goz = m.goz;
  renkler.ruj = m.ruj;
  renkler.allik = m.allik;
  if (m.sac) giyim.saclar = m.sac;
  if (m.sacRenk) renkler.sac = m.sacRenk;

  katmanGuncelle("_vucut", true);
  katmanGuncelle("saclar", true);
  dolgunlukUygula(); // bu modelin dolgunluk değerini uygula (gövde+elbise+özel+kolye) + slider'ı senkronla
  SES.efekt("buyu");
  pirilti();
  titre(12);

  if (aktifSekme === "mankenler") urunleriGoster("mankenler");
  if (aktifSekme === "renkler") urunleriGoster("renkler");
  if (aktifSekme === "makyaj") urunleriGoster("makyaj");
  if (aktifSekme === "saclar") urunleriGoster("saclar");
}

function tenSec(renk) {
  renkler.ten = renk;
  katmanGuncelle("_vucut", false);
  SES.efekt("dokun");
  if (aktifSekme === "renkler") urunleriGoster("renkler");
}

function sacSec(renk) {
  renkler.sac = renk;
  katmanGuncelle("saclar", true);
  SES.efekt("dokun");
  if (aktifSekme === "renkler") urunleriGoster("renkler");
  pirilti();
}

function makyajSec(kat, renk) {
  renkler[kat] = renk;
  katmanGuncelle("_vucut", false);
  SES.efekt("makyaj");
  if (aktifSekme === "makyaj") urunleriGoster("makyaj");
  pirilti();
}

/* =============================== GARDOROP PANELİ & SEKMELER =============================== */
function sekmeleriKur() {
  const kap = $("#sekmeler");
  kap.replaceChildren(); // Güvenli temizleme

  // Gerçekçi modelde ten/makyaj gövdeye, saç da çoğu modelde PNG'ye bake'lidir.
  const gercekci = gercekciAktif();
  const gizli = new Set(gercekci ? ["renkler", "makyaj"] : []);
  if (gercekci && Object.keys(gorselOverride.saclar || {}).length === 0) gizli.add("saclar");
  for (const slot of DOLAP.slotlar) {
    const hasPngs = slot.liste.some((x) => ovr(slot.id, x.id));
    if (gercekci && !hasPngs && !slot.zorunlu) gizli.add(slot.id);
    if (!slot.zorunlu && slot.liste.length === 0) gizli.add(slot.id);
  }
  if (gizli.has(aktifSekme)) aktifSekme = "mankenler";

  for (const id of SEKME_SIRASI) {
    if (gizli.has(id)) continue;
    const meta = slotById[id] || OZEL_SEKME[id];
    const b = document.createElement("button");
    b.className = "sekme" + (id === aktifSekme ? " aktif" : "");

    const ikonSpan = document.createElement("span");
    ikonSpan.className = "ikon";
    ikonSpan.textContent = meta.emoji;

    b.appendChild(ikonSpan);
    b.appendChild(document.createTextNode(meta.ad));

    b.onclick = () => {
      aktifSekme = id;
      document.querySelectorAll(".sekme").forEach((s) => s.classList.remove("aktif"));
      b.classList.add("aktif");
      urunleriGoster(id);
      const panel = $(".panel");
      if (panel) panel.classList.remove("mini");
      SES.efekt("dokun");
    };
    kap.appendChild(b);
  }
}

function urunleriGoster(id) {
  const kap = $("#urunler");
  kap.replaceChildren(); // Güvenli temizleme

  if (id === "mankenler") return mankenleriGoster(kap);
  if (id === "renkler") return renkleriGoster(kap);
  if (id === "makyaj") return makyajGoster(kap);
  if (id === "gorevler") return gorevleriGoster(kap);
  if (id === "eslerim") return eslerimiGoster(kap);

  // Normal dolap eşyaları
  const slot = slotById[id];
  if (!slot.zorunlu) kap.appendChild(cikarHucresi(id));

  const liste = slot.liste.slice().sort((a, b) => {
    const pa = ovr(id, a.id) ? 1 : 0;
    const pb = ovr(id, b.id) ? 1 : 0;
    return pb - pa || a.ad.localeCompare(b.ad, "tr");
  });
  for (const oge of liste) {
    if (gercekciAktif() && !ovr(id, oge.id)) continue;
    const d = document.createElement("div");
    d.className = "urun" + (giyim[id] === oge.id ? " secili" : "");
    d.dataset.ad = oge.ad;

    const img = document.createElement("img");
    const tam = ovr(id, oge.id) ||
      svgURL(id === "saclar" ? renkUygula(oge.svg, { sac: renkler.sac }) : oge.svg);
    panelGorsel(img, id, oge.id, tam);
    img.alt = oge.ad;
    d.appendChild(img);

    d.onclick = () => giy(id, oge.id);
    kap.appendChild(d);
  }
}

function cikarHucresi(id) {
  const d = document.createElement("div");
  d.className = "urun cikar" + (!giyim[id] ? " secili" : "");

  const emoji = document.createElement("span");
  emoji.className = "cikar-emoji";
  emoji.textContent = "🚫";

  d.appendChild(emoji);
  d.appendChild(document.createTextNode("Çıkar"));
  d.onclick = () => {
    if (giyim[id]) giy(id, giyim[id]);
  };
  return d;
}

function mankenleriGoster(kap) {
  for (const m of DOLAP.mankenler) {
    if (gercekciAktif() && !ovr("modeller", m.id)) continue;
    const d = document.createElement("div");
    d.className = "urun manken-kart" + (giyim.mankenler === m.id ? " secili" : "");
    d.dataset.ad = m.ad;

    const img = document.createElement("img");
    panelGorsel(img, "modeller", m.id, ovr("modeller", m.id) || svgURL(mankenOnizlemeSVG(m)));
    img.alt = m.ad;
    img.style.objectFit = "contain";
    d.appendChild(img);

    // Manken adı etiketi
    const etiket = document.createElement("div");
    etiket.className = "manken-etiket";
    etiket.textContent = m.emoji + " " + m.ad;
    d.appendChild(etiket);

    d.onclick = () => mankenDegistir(m.id);
    kap.appendChild(d);
  }
}

function renkleriGoster(kap) {
  const b1 = document.createElement("div");
  b1.className = "renk-baslik";
  b1.textContent = "🌈 Ten Rengi Tonu";
  kap.appendChild(b1);

  for (const t of DOLAP.tenRenkleri) {
    const s = document.createElement("div");
    s.className = "swatch" + (renkler.ten === t.renk ? " secili" : "");
    s.style.background = t.renk;
    s.title = t.ad;
    s.onclick = () => tenSec(t.renk);
    kap.appendChild(s);
  }

  const b2 = document.createElement("div");
  b2.className = "renk-baslik";
  b2.textContent = "💇 Saç Rengi";
  kap.appendChild(b2);

  for (const t of DOLAP.sacRenkleri) {
    const s = document.createElement("div");
    s.className = "swatch" + (renkler.sac === t.renk ? " secili" : "");
    s.style.background = t.renk;
    s.title = t.ad;
    s.onclick = () => sacSec(t.renk);
    kap.appendChild(s);
  }
}

function makyajGoster(kap) {
  const b1 = document.createElement("div");
  b1.className = "renk-baslik";
  b1.textContent = "👁️ Göz Rengi";
  kap.appendChild(b1);

  for (const g of DOLAP.gozRenkleri) {
    const s = document.createElement("div");
    s.className = "swatch" + (renkler.goz === g.renk ? " secili" : "");
    s.style.background = g.renk;
    s.title = g.ad;
    s.onclick = () => makyajSec("goz", g.renk);
    kap.appendChild(s);
  }

  const b2 = document.createElement("div");
  b2.className = "renk-baslik";
  b2.textContent = "💄 Dudak Parlatıcısı (Ruj)";
  kap.appendChild(b2);

  for (const r of DOLAP.rujRenkleri) {
    const s = document.createElement("div");
    s.className = "swatch" + (renkler.ruj === r.renk ? " secili" : "");
    s.style.background = r.renk;
    s.title = r.ad;
    s.onclick = () => makyajSec("ruj", r.ruj); // Not: model'e göre renk
    // düzeltme: ruj seçimi
    s.onclick = () => makyajSec("ruj", r.renk);
    kap.appendChild(s);
  }

  const b3 = document.createElement("div");
  b3.className = "renk-baslik";
  b3.textContent = "😊 Yanak Allığı";
  kap.appendChild(b3);

  for (const a of DOLAP.allikRenkleri) {
    const s = document.createElement("div");
    s.className = "swatch" + (renkler.allik === a.renk ? " secili" : "");
    s.style.background = a.renk;
    s.title = a.ad;
    s.onclick = () => makyajSec("allik", a.renk);
    kap.appendChild(s);
  }
}

/* =============================== GÖREVLER =============================== */
function aktifEtiketler() {
  const set = new Set();
  for (const slot of DOLAP.slotlar) {
    const it = bul(slot.id, giyim[slot.id]);
    if (it && it.etiketler) it.etiketler.forEach((e) => set.add(e));
  }
  return set;
}

function gorevTamamMi(g, etiketler) {
  return g.gerek.every((e) => etiketler.has(e));
}

function gorevleriDenetle() {
  const etk = aktifEtiketler();
  for (const g of DOLAP.gorevler) {
    if (!bitenGorevler.has(g.id) && gorevTamamMi(g, etk)) {
      bitenGorevler.add(g.id);
      yildizEkle(g.yildiz);
      localStorage.setItem("lara_gorevler", JSON.stringify([...bitenGorevler]));
      SES.efekt("yildiz");
      konfetiPatlat();
      bildir(`${g.emoji} Görev tamamlandı: ${g.ad}! +${g.yildiz}⭐`);
      if (aktifSekme === "gorevler") urunleriGoster("gorevler");
    }
  }
}

function gorevleriGoster(kap) {
  for (const g of DOLAP.gorevler) {
    const bitti = bitenGorevler.has(g.id);
    const d = document.createElement("div");
    d.className = "gorev" + (bitti ? " bitti" : "");

    const emoji = document.createElement("div");
    emoji.className = "gorev-emoji";
    emoji.textContent = g.emoji;
    d.appendChild(emoji);

    const ic = document.createElement("div");
    ic.className = "gorev-ic";
    const ad = document.createElement("div");
    ad.className = "gorev-ad";
    ad.textContent = g.ad;
    const desc = document.createElement("div");
    desc.className = "gorev-aciklama";
    desc.textContent = g.aciklama;
    ic.appendChild(ad);
    ic.appendChild(desc);
    d.appendChild(ic);

    const odul = document.createElement("div");
    odul.className = "gorev-odul";
    odul.textContent = `+${g.yildiz}⭐`;
    d.appendChild(odul);

    const durum = document.createElement("div");
    durum.className = "gorev-durum";
    durum.textContent = bitti ? "✅" : "🔒";
    d.appendChild(durum);

    kap.appendChild(d);
  }
}

function yildizEkle(n) {
  yildizlar += n;
  localStorage.setItem("lara_yildiz", String(yildizlar));
  yildizGoster();
}

function yildizGoster() {
  $("#yildizSayi").textContent = yildizlar;
  const k = $("#yildizKutu");
  k.classList.remove("zipla");
  void k.offsetWidth;
  k.classList.add("zipla");
}

/* =============================== SÜRPRİZ KOMBİN =============================== */
function rastgele(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Bir slot için rastgele parça id'si; PNG varsa onu, yoksa vektör fallback'i tercih eder.
function rastgeleId(slotId) {
  let liste = slotById[slotId].liste;
  if (gercekciAktif()) liste = liste.filter((x) => ovr(slotId, x.id));
  const pngListe = liste.filter((x) => ovr(slotId, x.id));
  if (pngListe.length) liste = pngListe;
  return liste.length ? rastgele(liste).id : null;
}

function surpriz() {
  SES.efekt("buyu");
  let adim = 0;
  const gercekci = gercekciAktif();

  const ara = setInterval(() => {
    const e = rastgeleId("elbiseler");
    if (e) giyim.elbiseler = e;
    if (!gercekci) {
      giyim.saclar = rastgele(slotById.saclar.liste).id;
      renkler.sac = rastgele(DOLAP.sacRenkleri).renk;
      katmanGuncelle("saclar", false);
    }
    katmanGuncelle("elbiseler", false);

    if (++adim >= 8) {
      clearInterval(ara);

      // Sürpriz model seçimi
      const rManken = rastgele(DOLAP.mankenler);
      giyim.mankenler = rManken.id;

      giyim.taclar = Math.random() < 0.85 ? rastgeleId("taclar") : null;
      giyim.kanatlar = Math.random() < 0.6 ? rastgeleId("kanatlar") : null;
      giyim.ayakkabilar = rastgeleId("ayakkabilar");
      giyim.ozel = Math.random() < 0.35 ? rastgeleId("ozel") : null;
      giyim.takilar = Math.random() < 0.7 ? rastgeleId("takilar") : null;
      giyim.asalar = Math.random() < 0.65 ? rastgeleId("asalar") : null;

      const rArkaplan = rastgeleId("arkaplanlar");
      if (rArkaplan) giyim.arkaplanlar = rArkaplan;

      if (!gercekci) {
        renkler.ten = rManken.ten;
        renkler.goz = rManken.goz;
        renkler.ruj = rManken.ruj;
        renkler.allik = rManken.allik;
      } else if (rManken.sac) {
        giyim.saclar = rManken.sac;
      }

      arkaPlanOzel = null;
      SES.muzikDegistir(giyim.arkaplanlar);

      DOLAP.cizimSirasi.forEach((s) => katmanGuncelle(s, true));
      SES.efekt("tak");
      pirilti();
      bildir("✨ Sürpriz podyum kombini hazır!");

      if (slotById[aktifSekme] || ["mankenler", "renkler", "makyaj"].includes(aktifSekme)) {
        urunleriGoster(aktifSekme);
      }
      gorevleriDenetle();
    }
  }, 90);
}

/* =============================== EŞYALARIM (Fotoğraf Yükleme) =============================== */
const EKLE_KATEGORI = {
  karakterler: { ad: "Karakterler", emoji: "🧍" },
  kiyafetler: { ad: "Kıyafetler", emoji: "👗" },
  aksesuarlar: { ad: "Aksesuarlar", emoji: "👜" },
  arkaplanlar: { ad: "Arka Planlar", emoji: "🌅" },
};

async function varliklariYukle() {
  try {
    const r = await fetch("/api/assets");
    customVarliklar = await r.json();
  } catch (e) {
    customVarliklar = {};
  }
}

function eslerimiGoster(kap) {
  const ekle = document.createElement("div");
  ekle.className = "ekle-btn";

  const btn = document.createElement("button");
  btn.className = "arac-btn vurgu";
  btn.style.width = "100%";
  btn.textContent = "📷 Fotoğraf Ekle";
  btn.onclick = () => {
    $("#fotoModal").classList.remove("gizli");
    SES.efekt("dokun");
  };
  ekle.appendChild(btn);
  kap.appendChild(ekle);

  let toplam = 0;
  for (const katId of Object.keys(EKLE_KATEGORI)) {
    const liste = customVarliklar[katId] || [];
    if (!liste.length) continue;
    toplam += liste.length;

    const bas = document.createElement("div");
    bas.className = "renk-baslik";
    bas.textContent = `${EKLE_KATEGORI[katId].emoji} ${EKLE_KATEGORI[katId].ad}`;
    kap.appendChild(bas);

    for (const oge of liste) {
      const d = document.createElement("div");
      d.className = "urun";
      d.dataset.ad = oge.ad;

      const img = document.createElement("img");
      img.src = oge.url;
      img.alt = oge.ad;
      d.appendChild(img);

      d.onclick = () => {
        if (katId === "arkaplanlar") {
          arkaPlanOzel = oge.url;
          katmanGuncelle("arkaplanlar", true);
          SES.efekt("tak");
          bildir("🌅 Arka plan değişti");
        } else {
          stickerEkle(oge.url);
          SES.efekt("tak");
        }
      };
      kap.appendChild(d);
    }
  }

  if (!toplam) {
    const bos = document.createElement("div");
    bos.className = "bos-not";
    bos.textContent = "Henüz kendi fotoğrafın yok. 📷 ile tabletten çek ya da galeriden seç — sahneye çıkartma gibi yapışır! 🧡";
    kap.appendChild(bos);
  }
}

/* =============================== STICKER İŞLEMLERİ =============================== */
function resimYukle(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function stickerEkle(src) {
  let img;
  try {
    img = await resimYukle(src);
  } catch (e) {
    bildir("Fotoğraf yüklenemedi 😕");
    return;
  }

  const oran = img.naturalHeight / img.naturalWidth || 1;
  const p = { id: stickerSayac++, src, xRel: 0.5, yRel: 0.45, wRel: 0.34, rot: 0, oran, dugum: null };
  stickerlar.push(p);
  stickerDugumu(p);
  stickerSec(p.id);
  pirilti();
}

function stickerDugumu(p) {
  const d = document.createElement("div");
  d.className = "parca";
  d.dataset.id = p.id;

  const img = document.createElement("img");
  img.src = p.src;
  img.alt = "Sticker";
  d.appendChild(img);

  const kontrol = document.createElement("div");
  kontrol.className = "kontrol";

  const cerceve = document.createElement("div");
  cerceve.className = "secim-cercevesi";
  kontrol.appendChild(cerceve);

  const btnDondur = document.createElement("div");
  btnDondur.className = "tutamac t-dondur";
  btnDondur.textContent = "⟳";
  kontrol.appendChild(btnDondur);

  const btnSil = document.createElement("div");
  btnSil.className = "tutamac t-sil";
  btnSil.textContent = "✕";
  kontrol.appendChild(btnSil);

  const btnBoyut = document.createElement("div");
  btnBoyut.className = "tutamac t-boyut";
  btnBoyut.textContent = "⤡";
  kontrol.appendChild(btnBoyut);

  d.appendChild(kontrol);
  p.dugum = d;

  $("#stickerKat").appendChild(d);
  stickerStil(p);

  d.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".tutamac")) return;
    e.preventDefault();
    stickerSec(p.id);
    stickerTasi(e, p);
  });

  btnSil.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); stickerSil(p); });
  btnBoyut.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); stickerBoyut(e, p); });
  btnDondur.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); stickerDondur(e, p); });
}

function stickerStil(p) {
  const d = p.dugum;
  d.style.left = p.xRel * 100 + "%";
  d.style.top = p.yRel * 100 + "%";
  d.style.width = p.wRel * 100 + "%";
  d.style.transform = `translate(-50%, -50%) rotate(${p.rot}deg)`;
}

function stickerSec(id) {
  seciliSticker = id;
  for (const p of stickerlar) {
    p.dugum.classList.toggle("secili", p.id === id);
  }
  const p = stickerlar.find((x) => x.id === id);
  if (p) {
    const i = stickerlar.indexOf(p);
    stickerlar.splice(i, 1);
    stickerlar.push(p);
    $("#stickerKat").appendChild(p.dugum);
  }
}

function stickerSil(p) {
  p.dugum.remove();
  stickerlar = stickerlar.filter((x) => x !== p);
  if (seciliSticker === p.id) seciliSticker = null;
  SES.efekt("cikar");
}

function sahneKutu() {
  return sahne.getBoundingClientRect();
}

function stickerTasi(e, p) {
  const r = sahneKutu();
  const bas = { x: e.clientX, y: e.clientY, xRel: p.xRel, yRel: p.yRel };
  surukle((ev) => {
    p.xRel = clamp(bas.xRel + (ev.clientX - bas.x) / r.width, 0, 1);
    p.yRel = clamp(bas.yRel + (ev.clientY - bas.y) / r.height, 0, 1);
    stickerStil(p);
  });
}

function stickerBoyut(e, p) {
  const r = sahneKutu();
  surukle((ev) => {
    const cx = r.left + p.xRel * r.width, cy = r.top + p.yRel * r.height;
    const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy);
    const wPx = (2 * dist) / Math.sqrt(1 + p.oran * p.oran);
    p.wRel = clamp(wPx / r.width, 0.06, 2.4);
    stickerStil(p);
  });
}

function stickerDondur(e, p) {
  const r = sahneKutu();
  surukle((ev) => {
    const cx = r.left + p.xRel * r.width, cy = r.top + p.yRel * r.height;
    p.rot = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90;
    stickerStil(p);
  });
}

function surukle(hareket) {
  function up() {
    window.removeEventListener("pointermove", hareket);
    window.removeEventListener("pointerup", up);
  }
  window.addEventListener("pointermove", hareket);
  window.addEventListener("pointerup", up);
}

sahne.addEventListener("pointerdown", (e) => {
  if (e.target === sahne || e.target.closest(".katmanlar")) {
    seciliSticker = null;
    for (const p of stickerlar) {
      p.dugum.classList.remove("secili");
    }
    const panel = $(".panel");
    if (panel) {
      panel.classList.add("mini");
    }
  }
});

/* =============================== TUVAL SNAPSHOT KOMBİN KAYDETME =============================== */
async function kombinResmi() {
  const W = 900, H = 1200;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#fde9f3";
  ctx.fillRect(0, 0, W, H);

  for (const id of DOLAP.cizimSirasi) {
    const src = katmanKaynak(id);
    if (!src) continue;
    try {
      const img = await resimYukle(src);
      ctx.drawImage(img, 0, 0, W, H);
    } catch (e) {}
  }

  for (const p of stickerlar) {
    try {
      const img = await resimYukle(p.src);
      const wPx = p.wRel * W;
      const hPx = wPx * p.oran;
      ctx.save();
      ctx.translate(p.xRel * W, p.yRel * H);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.drawImage(img, -wPx / 2, -hPx / 2, wPx, hPx);
      ctx.restore();
    } catch (e) {}
  }
  return c.toDataURL("image/jpeg", 0.95);
}

/* =============================== ALBÜM KUTUSU =============================== */
function albumOku() {
  try {
    return JSON.parse(localStorage.getItem("lara_album") || "[]");
  } catch (e) {
    return [];
  }
}

function albumeEkle(url) {
  const a = albumOku();
  a.unshift({ url, tarih: Date.now() });
  while (a.length > 30) a.pop();
  try {
    localStorage.setItem("lara_album", JSON.stringify(a));
  } catch (e) {
    bildir("Albüm dolu, eski kombinleri sil 🗑️");
  }
}

async function kombinKaydet() {
  bildir("Fotoğraf albüme kaydediliyor… ✨");
  const url = await kombinResmi();
  albumeEkle(url);
  SES.efekt("parla");
  konfetiPatlat();
  bildir("📸 Kombin albüme kaydedildi!");
}

function albumAc() {
  const grid = $("#albumGrid");
  grid.replaceChildren(); // Güvenli temizleme

  const a = albumOku();
  if (!a.length) {
    const notice = document.createElement("div");
    notice.className = "bos-not";
    notice.textContent = "Henüz kombin kaydetmedin. 📸 Kaydet ile başla!";
    grid.appendChild(notice);
  } else {
    a.forEach((oge, i) => {
      const d = document.createElement("div");
      d.className = "album-oge";

      const img = document.createElement("img");
      img.src = oge.url;
      img.alt = `Kombin ${i + 1}`;
      d.appendChild(img);

      const aIndir = document.createElement("a");
      aIndir.className = "mini indir";
      aIndir.href = oge.url;
      aIndir.download = `lara-kombin-${i + 1}.jpg`;
      aIndir.title = "İndir";
      aIndir.textContent = "⬇️";
      d.appendChild(aIndir);

      const aSil = document.createElement("a");
      aSil.className = "mini sil";
      aSil.title = "Sil";
      aSil.textContent = "🗑️";
      aSil.onclick = (e) => {
        e.preventDefault();
        albumSil(i);
      };
      d.appendChild(aSil);

      grid.appendChild(d);
    });
  }
  $("#albumModal").classList.remove("gizli");
}

function albumSil(i) {
  const a = albumOku();
  a.splice(i, 1);
  localStorage.setItem("lara_album", JSON.stringify(a));
  SES.efekt("cikar");
  albumAc();
}

/* =============================== DEFİLE BÖLÜMÜ =============================== */
async function defileAc() {
  SES.efekt("parla");
  bildir("Defile hazırlanıyor… 🌟");
  const url = await kombinResmi();

  const defileGorsel = $("#defileGorsel");
  defileGorsel.replaceChildren(); // Güvenli temizleme

  const img = document.createElement("img");
  img.src = url;
  img.alt = "Defile Kombin";
  defileGorsel.appendChild(img);

  $("#defileModal").dataset.url = url;
  $("#defileModal").classList.remove("gizli");

  SES.muzikDegistir("ap_defile");
  SES.efekt("fanfar");

  konfetiPatlat();
  setTimeout(konfetiPatlat, 600);
  setTimeout(konfetiPatlat, 1200);
}

function defileKapat() {
  $("#defileModal").classList.add("gizli");
  SES.muzikDegistir(giyim.arkaplanlar); // normal sahne müziği
}

/* =============================== DOLABI SIFIRLAMA =============================== */
function sifirla() {
  if (!confirm("Yeni bir kombine baştan başlayalım mı?")) return;
  giyim.mankenler = "m_lara";
  giyim.arkaplanlar = "ap_balo";
  giyim.kanatlar = null;
  giyim.elbiseler = "elb_turuncu";
  giyim.ozel = null;
  giyim.ayakkabilar = "ayk_cam";
  giyim.takilar = null;
  giyim.saclar = "sac_dalgali";
  giyim.taclar = "tac_klasik";
  giyim.asalar = null;

  renkler.ten = DOLAP.mankenler[0].ten;
  renkler.sac = DOLAP.mankenler[0].sacRenk || DOLAP.sacRenkleri[0].renk;
  renkler.goz = DOLAP.mankenler[0].goz;
  renkler.ruj = DOLAP.mankenler[0].ruj;
  renkler.allik = DOLAP.mankenler[0].allik;

  arkaPlanOzel = null;
  SES.muzikDegistir("ap_balo");

  for (const p of stickerlar) {
    p.dugum.remove();
  }
  stickerlar = [];
  seciliSticker = null;

  for (const id of DOLAP.cizimSirasi) {
    katmanGuncelle(id, true);
  }

  if (slotById[aktifSekme] || aktifSekme === "renkler" || aktifSekme === "makyaj" || aktifSekme === "mankenler") {
    urunleriGoster(aktifSekme);
  }

  SES.efekt("cikar");
  bildir("🧹 Dolap sıfırlandı!");
}

/* =============================== DOSYADAN RESİM YÜKLEME =============================== */
async function dosyaSecildi(e) {
  const dosya = e.target.files[0];
  e.target.value = "";
  if (!dosya || !bekleyenKategori) return;

  const kat = bekleyenKategori;
  bekleyenKategori = null;
  bildir("Fotoğraf yükleniyor… ⏳");

  try {
    const dataUrl = await kucult(dosya, 1200);
    const r = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: kat, name: dosya.name.replace(/\.[^.]+$/, ""), dataUrl }),
    });
    const sonuc = await r.json();
    if (sonuc.url) {
      (customVarliklar[kat] = customVarliklar[kat] || []).push({ ad: sonuc.ad, url: sonuc.url });
      if (kat === "arkaplanlar") {
        arkaPlanOzel = sonuc.url;
        katmanGuncelle("arkaplanlar", true);
      } else {
        stickerEkle(sonuc.url);
      }
      if (aktifSekme === "eslerim") urunleriGoster("eslerim");
      SES.efekt("tak");
      bildir("🎉 Fotoğraf başarıyla eklendi!");
    } else {
      bildir("Eklenemedi: " + (sonuc.hata || "hata"));
    }
  } catch (err) {
    bildir("Fotoğraf eklenemedi 😕");
  }
}

function kucult(dosya, maxKenar) {
  return new Promise((resolve, reject) => {
    const okuyucu = new FileReader();
    okuyucu.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        const olcek = Math.min(1, maxKenar / Math.max(w, h));
        w = Math.round(w * olcek);
        h = Math.round(h * olcek);

        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        const png = dosya.type === "image/png";
        resolve(c.toDataURL(png ? "image/png" : "image/jpeg", 0.9));
      };
      img.onerror = reject;
      img.src = okuyucu.result;
    };
    okuyucu.onerror = reject;
    okuyucu.readAsDataURL(dosya);
  });
}

/* =============================== PARILTILAR & KONFETİLER =============================== */
function pirilti() {
  const kat = $("#parlamaKat");
  const semboller = ["✨", "⭐", "💫", "🌟"];
  for (let i = 0; i < 6; i++) {
    const s = document.createElement("span");
    s.className = "pirilti";
    s.textContent = semboller[Math.floor(Math.random() * semboller.length)];
    s.style.left = 20 + Math.random() * 60 + "%";
    s.style.top = 25 + Math.random() * 55 + "%";
    s.style.fontSize = 16 + Math.random() * 20 + "px";
    kat.appendChild(s);
    setTimeout(() => s.remove(), 1000);
  }
}

let konfetiParcalari = [];
let konfetiCizimAcik = false;

function konfetiPatlat() {
  const c = $("#konfeti");
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  const renkVar = ["#ff7a1a", "#ff5fa8", "#9a63ff", "#ffc24b", "#5bb8ff", "#69db7c"];
  for (let i = 0; i < 90; i++) {
    konfetiParcalari.push({
      x: Math.random() * c.width,
      y: -20 - Math.random() * c.height * 0.3,
      vx: (Math.random() - 0.5) * 3,
      vy: 3 + Math.random() * 4,
      r: 5 + Math.random() * 7,
      renk: renkVar[Math.floor(Math.random() * renkVar.length)],
      d: Math.random() * Math.PI,
      vd: (Math.random() - 0.5) * 0.3,
    });
  }
  if (!konfetiCizimAcik) {
    konfetiCizimAcik = true;
    konfetiCiz();
  }
}

function konfetiCiz() {
  const c = $("#konfeti");
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  konfetiParcalari = konfetiParcalari.filter((p) => p.y < c.height + 30);
  for (const p of konfetiParcalari) {
    p.x += p.vx;
    p.y += p.vy;
    p.d += p.vd;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.d);
    ctx.fillStyle = p.renk;
    ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
    ctx.restore();
  }
  if (konfetiParcalari.length) {
    requestAnimationFrame(konfetiCiz);
  } else {
    ctx.clearRect(0, 0, c.width, c.height);
    konfetiCizimAcik = false;
  }
}

/* =============================== BİLDİRİM VE SES =============================== */
let bildirimZaman = null;
function bildir(mesaj) {
  const b = $("#bildirim");
  b.textContent = mesaj;
  b.classList.remove("gizli");
  clearTimeout(bildirimZaman);
  bildirimZaman = setTimeout(() => b.classList.add("gizli"), 2400);
}

function sesButonlari() {
  const m = $("#btnMuzik"), s = $("#btnSes");
  m.onclick = () => {
    if (SES.muzikAcik) {
      SES.muzikKapat();
      m.classList.add("kapali");
    } else {
      SES.muzikAc();
      m.classList.remove("kapali");
    }
  };
  m.classList.add("kapali");

  s.onclick = () => {
    const yeni = !SES.sessizMi;
    SES.sessiz(yeni);
    s.textContent = yeni ? "🔇" : "🔊";
    s.classList.toggle("kapali", yeni);
    if (yeni) m.classList.add("kapali");
  };
}

/* =============================== ETKİLEŞİM VE BAĞLANTILAR =============================== */
function araclariBagla() {
  $("#btnSurpriz").onclick = surpriz;
  $("#btnDefile").onclick = defileAc;
  $("#btnKaydet").onclick = kombinKaydet;
  $("#btnAlbum").onclick = albumAc;
  $("#btnTemizle").onclick = sifirla;
  $("#defileKapat").onclick = defileKapat;

  const kulp = $("#panelKulp");
  if (kulp) {
    kulp.onclick = () => {
      const p = $(".panel");
      if (p) p.classList.toggle("mini");
      SES.efekt("dokun");
    };
  }

  $("#defileKaydet").onclick = () => {
    const url = $("#defileModal").dataset.url;
    if (url) {
      albumeEkle(url);
      SES.efekt("yildiz");
      bildir("📸 Kombin albüme kaydedildi!");
    }
  };

  document.querySelectorAll("[data-kapat]").forEach((b) => {
    b.onclick = () => {
      b.closest(".modal").classList.add("gizli");
      SES.efekt("dokun");
    };
  });

  document.querySelectorAll(".secim").forEach((b) => {
    b.onclick = () => {
      bekleyenKategori = b.dataset.kat;
      $("#fotoModal").classList.add("gizli");
      $("#dosyaGirisi").click();
    };
  });

  $("#dosyaGirisi").addEventListener("change", dosyaSecildi);
  window.addEventListener("pointerdown", () => SES.uyandir(), { once: true });
}

/* =============================== BAŞLAT =============================== */
async function basla() {
  await varliklariYukle();
  await gorselleriYukle();
  await metadataYukle();
  manifestiBirlestir(); // manifestteki yeni (PNG'li) parçaları dolaba ekle
  katmanlariKur();
  dolgunlukUygula(); // seçili modelin dolgunluk değerini uygula
  sekmeleriKur();
  urunleriGoster(aktifSekme);
  yildizGoster();
  sesButonlari();
  araclariBagla();
  sliderKur();
  SES.muzikDegistir("ap_balo"); // İlk müzik vals
}

// Yönetim paneli (admin.js) bir görsel ekleyince/silince gardırobu tazelemek için
window.dolabiYenile = async function () {
  await gorselleriYukle();
  await metadataYukle();
  manifestiBirlestir();
  sekmeleriKur();
  urunleriGoster(aktifSekme);
  DOLAP.cizimSirasi.forEach((s) => katmanGuncelle(s, false));
};

basla();
