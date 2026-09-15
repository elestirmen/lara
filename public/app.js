"use strict";
/*
  Leyla Stil Stüdyosu — Oyun Mantığı (Yenilenmiş & Güvenli)
  -------------------------------------------------------------
  Manken değiştirme sistemi entegre edilmiş, XSS engelleme kurallarına göre
  innerHTML kullanımı tamamen temizlenmiş ve güvenli DOM API'leri kullanılmıştır.
*/

const $ = (s) => document.querySelector(s);
const sahne = $("#sahne");
const AZ_HAREKET = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* =============================== İKON DİLİ ===============================
   Arayüz ikonları index.html'deki <symbol> deposundan gelir; tek çizgi
   ağırlığı ve tek grid kullanır. Emoji yalnız içerik (parça/brief) tarafında
   kalır, böylece kroma platformdan platforma değişmez. */
const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

function ikon(ad, sinif) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "ikon-svg" + (sinif ? " " + sinif : ""));
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const use = document.createElementNS(SVG_NS, "use");
  use.setAttribute("href", "#i-" + ad);
  use.setAttributeNS(XLINK_NS, "xlink:href", "#i-" + ad);
  svg.appendChild(use);
  return svg;
}
window.LARA_IKON = ikon;

// Slot/sekme kimliği → ikon adı. Listede olmayan her şey genel yıldıza düşer.
const SEKME_IKONU = {
  mankenler: "model",
  modeller: "model",
  elbiseler: "elbise",
  ozel: "ozel",
  saclar: "sac",
  taclar: "tac",
  kanatlar: "kanat",
  ayakkabilar: "ayakkabi",
  takilar: "taki",
  asalar: "asa",
  arkaplanlar: "sahne",
  gorevler: "brief",
  eslerim: "foto",
  renkler: "renk",
  makyaj: "makyaj",
};

const sekmeIkonu = (id) => SEKME_IKONU[id] || "defile";

// İkonlu düğmelerde yalnız yazı bölümünü değiştirir; SVG yerinde kalır.
function btnYaziAyarla(btn, yazi) {
  if (!btn) return;
  const alan = btn.querySelector(".btn-yazi");
  if (alan) alan.textContent = yazi;
  else btn.textContent = yazi;
}

function depodanJSON(anahtar, varsayilan) {
  try {
    const ham = localStorage.getItem(anahtar);
    return ham === null ? varsayilan : JSON.parse(ham);
  } catch (e) {
    return varsayilan;
  }
}

function depoyaJSON(anahtar, deger) {
  try {
    localStorage.setItem(anahtar, JSON.stringify(deger));
    return true;
  } catch (e) {
    return false;
  }
}

function depodanMetin(anahtar, varsayilan = null) {
  try {
    const deger = localStorage.getItem(anahtar);
    return deger === null ? varsayilan : deger;
  } catch (e) {
    return varsayilan;
  }
}

/* =============================== DURUM (STATE) =============================== */
const slotById = {};
DOLAP.slotlar.forEach((s) => (slotById[s.id] = s));

// Varsayılan kombin (Leyla mankeniyle başlar)
const VARSAYILAN_GIYIM = Object.freeze({
  mankenler: "m_lara", // Seçili manken ID'si
  arkaplanlar: "ap_altin_salon",
  kanatlar: null,
  elbiseler: "elb_turuncu",
  ozel: null,
  ayakkabilar: "ayk_cam",
  takilar: null,
  saclar: "sac_dalgali",
  taclar: null,
  asalar: null,
});
const giyim = { ...VARSAYILAN_GIYIM };

const VARSAYILAN_RENKLER = Object.freeze({
  ten: DOLAP.mankenler[0].ten,
  sac: DOLAP.mankenler[0].sacRenk || DOLAP.sacRenkleri[0].renk,
  goz: DOLAP.mankenler[0].goz,
  ruj: DOLAP.mankenler[0].ruj,
  allik: DOLAP.mankenler[0].allik,
});
const renkler = { ...VARSAYILAN_RENKLER };

let arkaPlanOzel = null;
let arkaPlanOzelId = null;
let aktifSekme = "mankenler";
let stickerlar = [];
let seciliSticker = null;
let stickerSayac = 1;
let bekleyenKategori = null;
let customVarliklar = {};

/* Cihazda kalan kullanıcı fotoğrafları ve kota güvenli albüm için IndexedDB. */
const YEREL_DB_ADI = "leyla-stil-studyosu";
const YEREL_DB_SURUM = 1;
let yerelDbSozu = null;

function yerelDbAc() {
  if (!("indexedDB" in window)) return Promise.resolve(null);
  if (yerelDbSozu) return yerelDbSozu;
  yerelDbSozu = new Promise((resolve) => {
    let istek;
    try {
      istek = window.indexedDB.open(YEREL_DB_ADI, YEREL_DB_SURUM);
    } catch (e) {
      resolve(null);
      return;
    }
    istek.onupgradeneeded = () => {
      const db = istek.result;
      if (!db.objectStoreNames.contains("varliklar")) db.createObjectStore("varliklar", { keyPath: "id" });
      if (!db.objectStoreNames.contains("album")) db.createObjectStore("album", { keyPath: "id" });
    };
    istek.onsuccess = () => resolve(istek.result);
    istek.onerror = () => resolve(null);
    istek.onblocked = () => resolve(null);
  });
  return yerelDbSozu;
}

async function dbTum(depo) {
  const db = await yerelDbAc();
  if (!db) return null;
  return new Promise((resolve) => {
    let tx, istek;
    try {
      tx = db.transaction(depo, "readonly");
      istek = tx.objectStore(depo).getAll();
    } catch (e) {
      resolve(null);
      return;
    }
    istek.onsuccess = () => resolve(istek.result || []);
    istek.onerror = () => resolve(null);
  });
}

async function dbYaz(depo, kayit) {
  const db = await yerelDbAc();
  if (!db) return false;
  return new Promise((resolve) => {
    let tx;
    try {
      tx = db.transaction(depo, "readwrite");
      tx.objectStore(depo).put(kayit);
    } catch (e) {
      resolve(false);
      return;
    }
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
    tx.onabort = () => resolve(false);
  });
}

async function dbSil(depo, id) {
  const db = await yerelDbAc();
  if (!db) return false;
  return new Promise((resolve) => {
    let tx;
    try {
      tx = db.transaction(depo, "readwrite");
      tx.objectStore(depo).delete(id);
    } catch (e) {
      resolve(false);
      return;
    }
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
    tx.onabort = () => resolve(false);
  });
}

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
let dolgunlukDurum = depodanJSON("lara_dolgunluk", {});
if (!dolgunlukDurum || typeof dolgunlukDurum !== "object" || Array.isArray(dolgunlukDurum)) dolgunlukDurum = {};

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
  if (sl) {
    const deger = aktifDolgunluk();
    sl.value = deger;
    sl.setAttribute("aria-valuetext", deger === 0 ? "İnce" : (deger === 100 ? "Dolgun" : `%${deger} beden formu`));
  }
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
    const deger = aktifDolgunluk();
    sl.setAttribute("aria-valuetext", deger === 0 ? "İnce" : (deger === 100 ? "Dolgun" : `%${deger} beden formu`));
    if (kaydet) {
      depoyaJSON("lara_dolgunluk", dolgunlukDurum);
      durumDegisti();
    }
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
  oge.pasif = Boolean(m.pasif);
  oge.etiketler = etiketler(m, oge.etiketler);
  return oge;
}
function ogeAktif(slot, oge) {
  if (!oge) return false;
  return !oge.pasif && !meta(slot, oge.id).pasif;
}
function gercekciModel() {
  return Boolean(ovr("modeller", giyim.mankenler));
}

function ogeKullanilabilir(slot, oge) {
  if (!ogeAktif(slot, oge)) return false;
  // Gerçek görseli olan parça her zaman kullanılabilir.
  if (ovr(slot, oge.id)) return true;
  // Manifestten eklenen bir parça silindiyse boş SVG kartı göstermeyelim.
  if (oge.svg === BOS_SVG) return false;
  // Fotogerçekçi bir model seçiliyken düşük çözünürlüklü vektör yedekler gizlenir:
  // çizgi elbise/ayakkabı fotoğraf gövdenin üzerinde bozuk görünür. Yalnızca bu iş
  // için tasarlanmış atmosferik stüdyo fonları (vektorOk) sahnede kalır.
  if (gercekciModel() && !oge.vektorOk) return false;
  return true;
}
function manifestOgesi(slot, id) {
  const m = meta(slot, id);
  return {
    id,
    ad: m.ad || idGuzelAd(id),
    emoji: m.emoji || "✨",
    svg: BOS_SVG,
    pasif: Boolean(m.pasif),
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
      const oge = manifestOgesi(slot.id, id);
      if (ogeAktif(slot.id, oge)) slot.liste.push(oge);
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

let yildizlar = Number(depodanMetin("lara_yildiz", "0") || 0);
if (!Number.isFinite(yildizlar) || yildizlar < 0) yildizlar = 0;

/* Yıldızların karşılığı: stil kariyeri. Her rütbe bir sonraki hedefi gösterir. */
const RUTBELER = [
  { esik: 0, ad: "Çırak Stilist" },
  { esik: 6, ad: "Stil Asistanı" },
  { esik: 15, ad: "Stilist" },
  { esik: 28, ad: "Kıdemli Stilist" },
  { esik: 45, ad: "Podyum Yıldızı" },
  { esik: 70, ad: "Moda Editörü" },
  { esik: 100, ad: "Moda İkonu" },
];

function rutbeBilgisi(puan) {
  let i = 0;
  for (let k = 0; k < RUTBELER.length; k++) if (puan >= RUTBELER[k].esik) i = k;
  const simdi = RUTBELER[i];
  const sonraki = RUTBELER[i + 1] || null;
  const taban = simdi.esik;
  const tavan = sonraki ? sonraki.esik : simdi.esik;
  const oran = sonraki ? clamp(Math.round(((puan - taban) / (tavan - taban)) * 100), 0, 100) : 100;
  return { seviye: i + 1, ad: simdi.ad, sonraki, oran, kalan: sonraki ? tavan - puan : 0 };
}

let sonRutbeSeviyesi = rutbeBilgisi(yildizlar).seviye;

function rutbeGuncelle(kutla) {
  const bilgi = rutbeBilgisi(yildizlar);
  const ad = $("#rutbeAd"), alt = $("#rutbeAlt"), dolgu = $("#rutbeDolgu"), bar = $("#rutbeBar");
  if (ad) ad.textContent = bilgi.ad;
  if (alt) alt.textContent = bilgi.sonraki ? `${bilgi.kalan}★ kaldı` : "Zirve";
  if (dolgu) dolgu.style.width = bilgi.oran + "%";
  if (bar) {
    bar.setAttribute("aria-valuenow", String(bilgi.oran));
    bar.setAttribute("aria-valuetext", `${bilgi.ad} — seviye ${bilgi.seviye}`);
  }
  const kutu = $("#rutbeKutu");
  if (kutu) kutu.title = `${bilgi.ad} · Seviye ${bilgi.seviye} · ${yildizlar}★`;

  if (bilgi.seviye > sonRutbeSeviyesi) {
    sonRutbeSeviyesi = bilgi.seviye;
    if (kutla !== false) {
      SES.efekt("fanfar");
      konfetiPatlat();
      bildir(`🏆 Yeni rütbe: ${bilgi.ad}!`);
      if (kutu) {
        kutu.classList.remove("terfi");
        void kutu.offsetWidth;
        kutu.classList.add("terfi");
      }
    }
  } else {
    sonRutbeSeviyesi = bilgi.seviye;
  }
}
const kayitliGorevler = depodanJSON("lara_gorevler", []);
let bitenGorevler = new Set(Array.isArray(kayitliGorevler) ? kayitliGorevler.filter((x) => typeof x === "string") : []);

// Panel sekme sırası
const SEKME_SIRASI = [
  "mankenler", "elbiseler", "ozel", "saclar", "taclar", "kanatlar", "ayakkabilar", "takilar", "asalar",
  "renkler", "makyaj", "arkaplanlar", "gorevler", "eslerim",
];

const OZEL_SEKME = {
  mankenler: { ad: "Model", emoji: "🧍" },
  renkler: { ad: "Renkler", emoji: "🎨" },
  makyaj: { ad: "Makyaj", emoji: "💄" },
  gorevler: { ad: "Brief", emoji: "🌟" },
  eslerim: { ad: "Fotoğraf", emoji: "➕" },
};

const AKIS_SEKMELERI = ["mankenler", "elbiseler", "ozel", "ayakkabilar", "takilar", "taclar", "kanatlar", "asalar", "arkaplanlar", "gorevler"];
const OZET_SEKMELERI = ["mankenler", "elbiseler", "ozel", "ayakkabilar", "takilar", "taclar", "kanatlar", "asalar", "arkaplanlar"];

let gorunenSekmeler = [];
let panelArama = "";
let panelEtiket = null;
let sonKayitZaman = null;
let aktifGorevId = depodanMetin("lara_aktif_gorev", null);

/* Günün briefi: tarihe göre belirlenir, ödülü iki katıdır. */
function bugununAnahtari() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function gununGoreviId() {
  const liste = DOLAP.gorevler;
  if (!liste.length) return null;
  const anahtar = bugununAnahtari();
  let toplam = 0;
  for (let i = 0; i < anahtar.length; i++) toplam = (toplam * 31 + anahtar.charCodeAt(i)) % 100000;
  return liste[toplam % liste.length].id;
}

function gorevOdulu(g) {
  return g.id === gununGoreviId() ? g.yildiz * 2 : g.yildiz;
}

const DURUM_ANAHTAR = "lara_studyo_durum_v2";
const GECMIS_SINIRI = 40;
let geriGecmisi = [];
let ileriGecmisi = [];
let sonDurum = null;
let durumUygulaniyor = false;

function durumKopyala(durum) {
  return JSON.parse(JSON.stringify(durum));
}

function durumAnlik() {
  return {
    surum: 2,
    giyim: { ...giyim },
    renkler: { ...renkler },
    dolgunluk: { ...dolgunlukDurum },
    arkaPlanOzelId,
    aktifGorevId,
    stickerlar: stickerlar
      .filter((p) => p.assetId)
      .map((p) => ({
        assetId: p.assetId,
        xRel: p.xRel,
        yRel: p.yRel,
        wRel: p.wRel,
        rot: p.rot,
        oran: p.oran,
      })),
  };
}

function customVarlikBul(id) {
  if (!id) return null;
  for (const liste of Object.values(customVarliklar)) {
    const oge = (liste || []).find((x) => x.id === id);
    if (oge) return oge;
  }
  return null;
}

function durumDogrula(ham) {
  const sonuc = {
    surum: 2,
    giyim: { ...VARSAYILAN_GIYIM },
    renkler: { ...VARSAYILAN_RENKLER },
    dolgunluk: {},
    arkaPlanOzelId: null,
    aktifGorevId: null,
    stickerlar: [],
  };
  if (!ham || typeof ham !== "object") return sonuc;

  const gelenGiyim = ham.giyim && typeof ham.giyim === "object" ? ham.giyim : {};
  const modelId = String(gelenGiyim.mankenler || "");
  const model = DOLAP.mankenler.find((m) => m.id === modelId && ogeKullanilabilir("modeller", m));
  sonuc.giyim.mankenler = model ? model.id : sonuc.giyim.mankenler;

  for (const slot of DOLAP.slotlar) {
    const gelen = gelenGiyim[slot.id];
    if (gelen === null && !slot.zorunlu) {
      sonuc.giyim[slot.id] = null;
      continue;
    }
    const oge = bul(slot.id, String(gelen || ""));
    if (ogeKullanilabilir(slot.id, oge)) sonuc.giyim[slot.id] = oge.id;
  }

  const gelenRenkler = ham.renkler && typeof ham.renkler === "object" ? ham.renkler : {};
  for (const anahtar of Object.keys(renkler)) {
    const deger = gelenRenkler[anahtar];
    if (typeof deger === "string" && /^#[0-9a-f]{3,8}$/i.test(deger)) sonuc.renkler[anahtar] = deger;
  }

  sonuc.dolgunluk = {};
  const gelenDolgunluk = ham.dolgunluk && typeof ham.dolgunluk === "object" ? ham.dolgunluk : {};
  for (const [id, deger] of Object.entries(gelenDolgunluk)) {
    const sayi = Number(deger);
    const yeniSayi = sayi > 0 && sayi <= 2 ? (sayi / 2) * 100 : sayi;
    if (Number.isFinite(yeniSayi)) sonuc.dolgunluk[id] = clamp(Math.round(yeniSayi / 20) * 20, 0, 100);
  }

  const yerel = customVarlikBul(ham.arkaPlanOzelId);
  sonuc.arkaPlanOzelId = yerel && yerel.kategori === "arkaplanlar" ? yerel.id : null;
  sonuc.aktifGorevId = DOLAP.gorevler.some((g) => g.id === ham.aktifGorevId) ? ham.aktifGorevId : null;
  const gelenStickerlar = Array.isArray(ham.stickerlar) ? ham.stickerlar : [];
  sonuc.stickerlar = gelenStickerlar.slice(0, 30).flatMap((p) => {
    const varlik = customVarlikBul(p && p.assetId);
    if (!varlik || varlik.kategori === "arkaplanlar") return [];
    const sayi = (deger, varsayilan) => Number.isFinite(Number(deger)) ? Number(deger) : varsayilan;
    return [{
      assetId: varlik.id,
      xRel: clamp(sayi(p.xRel, 0.5), 0, 1),
      yRel: clamp(sayi(p.yRel, 0.45), 0, 1),
      wRel: clamp(sayi(p.wRel, 0.34), 0.06, 2.4),
      rot: clamp(sayi(p.rot, 0), -3600, 3600),
      oran: clamp(sayi(p.oran, 1), 0.05, 20),
    }];
  });
  return sonuc;
}

function durumDugmeleriniGuncelle() {
  const geri = $("#btnGeri"), ileri = $("#btnIleri");
  if (geri) geri.disabled = geriGecmisi.length === 0;
  if (ileri) ileri.disabled = ileriGecmisi.length === 0;
}

function durumKaliciYaz() {
  depoyaJSON(DURUM_ANAHTAR, durumAnlik());
  depoyaJSON("lara_dolgunluk", dolgunlukDurum);
  try {
    if (aktifGorevId) localStorage.setItem("lara_aktif_gorev", aktifGorevId);
    else localStorage.removeItem("lara_aktif_gorev");
  } catch (e) {}
}

function durumUygula(ham, secenek = {}) {
  const yeni = durumDogrula(ham);
  durumUygulaniyor = true;
  Object.assign(giyim, yeni.giyim);
  Object.assign(renkler, yeni.renkler);
  dolgunlukDurum = { ...yeni.dolgunluk };
  aktifGorevId = yeni.aktifGorevId;
  arkaPlanOzelId = yeni.arkaPlanOzelId;
  const yerelArkaPlan = customVarlikBul(arkaPlanOzelId);
  arkaPlanOzel = yerelArkaPlan ? yerelArkaPlan.url : null;
  stickerlariDurumdanKur(yeni.stickerlar);

  if (typeof katmanEl !== "undefined") {
    for (const id of DOLAP.cizimSirasi) katmanGuncelle(id, false);
  }
  sliderGuncelle();
  if ($("#sekmeler")?.children.length) sekmeleriKur();
  kombinOzetGuncelle();
  stilAnaliziGuncelle();
  if (slotById[aktifSekme] || ["mankenler", "renkler", "makyaj", "gorevler"].includes(aktifSekme)) {
    urunleriGoster(aktifSekme);
  }
  SES.muzikDegistir(giyim.arkaplanlar);
  durumUygulaniyor = false;
  sonDurum = durumKopyala(yeni);
  if (secenek.kaydet !== false) durumKaliciYaz();
  durumDugmeleriniGuncelle();
  gorevleriDenetle();
}

function durumDegisti() {
  if (durumUygulaniyor) return;
  const yeni = durumAnlik();
  const yeniMetin = JSON.stringify(yeni);
  if (sonDurum && JSON.stringify(sonDurum) === yeniMetin) {
    stilAnaliziGuncelle();
    return;
  }
  if (sonDurum) {
    geriGecmisi.push(durumKopyala(sonDurum));
    if (geriGecmisi.length > GECMIS_SINIRI) geriGecmisi.shift();
  }
  ileriGecmisi = [];
  sonDurum = durumKopyala(yeni);
  durumKaliciYaz();
  durumDugmeleriniGuncelle();
  stilAnaliziGuncelle();
}

function geriAl() {
  if (!geriGecmisi.length) return;
  ileriGecmisi.push(durumAnlik());
  durumUygula(geriGecmisi.pop());
  SES.efekt("dokun");
  bildir("Son değişiklik geri alındı");
}

function ileriAl() {
  if (!ileriGecmisi.length) return;
  geriGecmisi.push(durumAnlik());
  durumUygula(ileriGecmisi.pop());
  SES.efekt("dokun");
  bildir("Değişiklik yeniden uygulandı");
}

function durumYeniAdimUygula(ham) {
  geriGecmisi.push(durumAnlik());
  if (geriGecmisi.length > GECMIS_SINIRI) geriGecmisi.shift();
  ileriGecmisi = [];
  durumUygula(ham);
}

/* =============================== YARDIMCI METODLAR =============================== */
function bul(slotId, itemId) {
  if (!itemId || !slotById[slotId]) return null;
  return slotById[slotId].liste.find((x) => x.id === itemId) || null;
}

function sekmeMeta(id) {
  return slotById[id] || OZEL_SEKME[id] || { ad: idGuzelAd(id), emoji: "✨" };
}

function mankenBul(id) {
  return DOLAP.mankenler.find((m) => m.id === id) || null;
}

function seciliParcaAdi(id) {
  if (id === "mankenler") {
    const m = mankenBul(giyim.mankenler);
    return m ? m.ad : "Model";
  }
  if (id === "arkaplanlar" && arkaPlanOzel) return "Kendi Sahnen";
  const it = bul(id, giyim[id]);
  return it ? it.ad : "Yok";
}

function kartErisilebilir(d, etiket, secili, tikla) {
  d.tabIndex = 0;
  d.setAttribute("role", "button");
  d.setAttribute("aria-label", etiket);
  d.setAttribute("aria-pressed", secili ? "true" : "false");
  d.onclick = tikla;
  d.onkeydown = (e) => {
    if (e.target !== d) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    tikla();
  };
}

function metinAraDegeri(oge, slotId) {
  const m = meta(slotId, oge.id);
  const tags = etiketler(m, oge.etiketler || []);
  return [oge.ad, oge.id, m.ad, m.emoji, ...tags].filter(Boolean).join(" ").toLocaleLowerCase("tr");
}

function listeyiFiltrele(liste, slotId) {
  const q = panelArama.trim().toLocaleLowerCase("tr");
  return liste.filter((oge) => {
    const tags = etiketler(meta(slotId, oge.id), oge.etiketler || []);
    if (panelEtiket && !tags.includes(panelEtiket)) return false;
    if (!q) return true;
    return metinAraDegeri(oge, slotId).includes(q);
  });
}

function etiketleriTopla(liste, slotId) {
  const sayac = new Map();
  for (const oge of liste) {
    for (const e of etiketler(meta(slotId, oge.id), oge.etiketler || [])) {
      sayac.set(e, (sayac.get(e) || 0) + 1);
    }
  }
  return [...sayac.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"))
    .slice(0, 9);
}

function filtreyiSifirla() {
  panelArama = "";
  panelEtiket = null;
  const ara = $("#urunArama");
  if (ara) ara.value = "";
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
    if (!AZ_HAREKET && navigator.vibrate) navigator.vibrate(ms);
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
  if (!ogeAktif(id, it)) return "";

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

/* Seçili parçalar mevcut gardıropla tutarsız kalabilir: varsayılan sahne silinmiş
   olabilir ya da model değişince gerçekçilik filtresi bir vektör parçayı devre dışı
   bırakmış olabilir. Bu durumda zorunlu slotlar ilk uygun parçayla doldurulur,
   diğerleri boşaltılır. */
function kombiniNormalize() {
  let degisti = false;
  const model = DOLAP.mankenler.find((m) => m.id === giyim.mankenler);
  if (!ogeKullanilabilir("modeller", model)) {
    const ilkModel = DOLAP.mankenler.find((m) => ogeKullanilabilir("modeller", m));
    if (ilkModel) {
      giyim.mankenler = ilkModel.id;
      degisti = true;
    }
  }
  for (const slot of DOLAP.slotlar) {
    if (!giyim[slot.id] && !slot.zorunlu) continue;
    if (ogeKullanilabilir(slot.id, bul(slot.id, giyim[slot.id]))) continue;
    const ilk = slot.liste.find((oge) => ogeKullanilabilir(slot.id, oge));
    if (ilk) {
      giyim[slot.id] = ilk.id;
      degisti = true;
    } else if (!slot.zorunlu) {
      giyim[slot.id] = null;
      degisti = true;
    }
    // Zorunlu ama hiç uygun parçası olmayan slot (gerçekçi modda saç) olduğu gibi
    // bırakılır; katman çizimi bu durumu zaten boş geçer.
  }
  return degisti;
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
    arkaPlanOzelId = null;
    SES.muzikDegistir(itemId);
  }

  katmanGuncelle(slotId, true);
  durumDegisti();
  kombinOzetGuncelle();
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

  if (kombiniNormalize()) {
    for (const id of DOLAP.cizimSirasi) katmanGuncelle(id, false);
    sekmeleriKur();
  }
  katmanGuncelle("_vucut", true);
  katmanGuncelle("saclar", true);
  dolgunlukUygula(); // bu modelin dolgunluk değerini uygula (gövde+elbise+özel+kolye) + slider'ı senkronla
  durumDegisti();
  kombinOzetGuncelle();
  SES.efekt("buyu");
  pirilti();
  titre(12);

  sekmeleriKur();
  urunleriGoster(aktifSekme);
}

function tenSec(renk) {
  renkler.ten = renk;
  katmanGuncelle("_vucut", false);
  durumDegisti();
  SES.efekt("dokun");
  if (aktifSekme === "renkler") urunleriGoster("renkler");
}

function sacSec(renk) {
  renkler.sac = renk;
  katmanGuncelle("saclar", true);
  durumDegisti();
  SES.efekt("dokun");
  if (aktifSekme === "renkler") urunleriGoster("renkler");
  pirilti();
}

function makyajSec(kat, renk) {
  renkler[kat] = renk;
  katmanGuncelle("_vucut", false);
  durumDegisti();
  SES.efekt("makyaj");
  if (aktifSekme === "makyaj") urunleriGoster("makyaj");
  pirilti();
}

/* =============================== GARDOROP PANELİ & SEKMELER =============================== */
/* Dikey ekranda dolap bir alt sayfadır: üç durak (mini / orta / tam) arasında
   hem dokunuşla hem sürükleyerek gezilir. Yatay ve masaüstü düzende bu
   sınıflar etkisizdir; panel yan sütun olarak kalır. */
let panelDurumu = "orta";

const altSayfaMi = () =>
  window.matchMedia("(max-width: 980px) and (orientation: portrait)").matches;

// Alçak ekranlarda "tam" durağı sahneyi pula çevirdiği için sunulmaz.
const panelDuraklari = () =>
  window.innerHeight >= 640 ? ["mini", "orta", "tam"] : ["mini", "orta"];

function panelSnapNoktalari() {
  const kulpH = $("#panelKulp")?.offsetHeight || 28;
  const ustH = document.querySelector(".ust-bar")?.offsetHeight || 56;
  const vh = window.innerHeight;
  const orta = Math.min(Math.max(220, vh * 0.46), 460);
  const noktalar = { mini: kulpH + 68, orta };
  if (panelDuraklari().includes("tam")) {
    noktalar.tam = Math.max(orta, Math.min(vh * 0.7, vh - ustH - 300));
  }
  return noktalar;
}

function panelDurumAyarla(durum) {
  if (!panelDuraklari().includes(durum)) durum = durum === "tam" ? "orta" : durum;
  if (!["mini", "orta", "tam"].includes(durum)) return;
  panelDurumu = durum;
  const panel = $(".panel"), kulp = $("#panelKulp");
  if (panel) {
    panel.style.height = "";
    panel.classList.remove("surukleniyor");
    panel.classList.toggle("mini", durum === "mini");
    panel.classList.toggle("tam", durum === "tam");
  }
  if (kulp) {
    kulp.setAttribute("aria-expanded", durum === "mini" ? "false" : "true");
    const buyutulebilir = panelDuraklari().includes("tam");
    kulp.setAttribute("aria-label",
      durum === "mini" ? "Dolabı aç" : (durum === "orta" && buyutulebilir ? "Dolabı büyüt" : "Dolabı küçült"));
  }
}

// Eski çağrı yüzeyi: sahneye dokunmak dolabı toplar, sekme seçimi geri açar.
function panelMiniAyarla(mini) {
  if (mini) panelDurumAyarla("mini");
  else if (panelDurumu === "mini") panelDurumAyarla("orta");
}

function panelKulpKur() {
  const panel = $(".panel"), kulp = $("#panelKulp");
  if (!panel || !kulp) return;

  const sorgu = window.matchMedia("(max-width: 980px) and (orientation: portrait)");
  const duzenDegisti = () => panelDurumAyarla("orta");
  if (sorgu.addEventListener) sorgu.addEventListener("change", duzenDegisti);
  else if (sorgu.addListener) sorgu.addListener(duzenDegisti);

  // mini → orta → tam → mini: her durak tek dokunuşla sırayla gezilir.
  const sonraki = () => {
    const duraklar = panelDuraklari();
    const i = duraklar.indexOf(panelDurumu);
    return duraklar[(i + 1) % duraklar.length];
  };
  let pid = null, basY = 0, basH = 0, kayma = 0;

  kulp.addEventListener("pointerdown", (e) => {
    if (!altSayfaMi()) return;
    pid = e.pointerId;
    basY = e.clientY;
    basH = panel.getBoundingClientRect().height;
    kayma = 0;
    panel.classList.add("surukleniyor");
    kulp.setPointerCapture(pid);
  });

  kulp.addEventListener("pointermove", (e) => {
    if (pid === null || e.pointerId !== pid) return;
    const fark = basY - e.clientY;
    kayma = Math.max(kayma, Math.abs(fark));
    const n = panelSnapNoktalari();
    panel.style.height = Math.min(Math.max(basH + fark, n.mini), n.tam) + "px";
  });

  const bitir = (e) => {
    if (pid === null || (e && e.pointerId !== pid)) return;
    const yukseklik = panel.getBoundingClientRect().height;
    try { kulp.releasePointerCapture(pid); } catch (hata) { /* yakalama zaten düşmüş */ }
    pid = null;
    if (kayma < 6) {
      panelDurumAyarla(sonraki());
    } else {
      const n = panelSnapNoktalari();
      const enYakin = Object.keys(n).sort(
        (a, b) => Math.abs(n[a] - yukseklik) - Math.abs(n[b] - yukseklik))[0];
      panelDurumAyarla(enYakin);
    }
    SES.efekt("dokun");
  };

  kulp.addEventListener("pointerup", bitir);
  kulp.addEventListener("pointercancel", bitir);

  // Klavye ile etkinleştirmede pointer akışı çalışmaz (detail === 0).
  kulp.addEventListener("click", (e) => {
    if (e.detail !== 0) return;
    panelDurumAyarla(sonraki());
    SES.efekt("dokun");
  });
}

function sekmeyeGec(id, secenek = {}) {
  if (secenek.filtreSifirla !== false) filtreyiSifirla();
  aktifSekme = id;
  $("#urunler")?.setAttribute("aria-labelledby", `sekme-${id}`);
  document.querySelectorAll(".sekme").forEach((s) => {
    const secili = s.dataset.sekme === id;
    s.classList.toggle("aktif", secili);
    s.setAttribute("aria-selected", secili ? "true" : "false");
    s.tabIndex = secili ? 0 : -1;
  });
  urunleriGoster(id);
  panelMiniAyarla(false);
  $("#sekme-" + id)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  $(".panel-govde")?.scrollTo({ top: 0 });
  if (!secenek.sessiz) SES.efekt("dokun");
}

function sonrakiSekme() {
  const aksta = AKIS_SEKMELERI.filter((id) => gorunenSekmeler.includes(id));
  if (!aksta.length) return;
  const i = aksta.indexOf(aktifSekme);
  sekmeyeGec(aksta[(i + 1 + aksta.length) % aksta.length], { filtreSifirla: true });
}

function panelKontrolleriniGuncelle(id, kaynakListe) {
  const kutu = $("#panelAramaKutu");
  if (!kutu) return;
  const filtrelenebilir = id === "mankenler" || Boolean(slotById[id]);
  kutu.classList.toggle("gizli", !filtrelenebilir);
  if (!filtrelenebilir) return;

  const ara = $("#urunArama");
  if (ara && document.activeElement !== ara) ara.value = panelArama;

  const gorunen = listeyiFiltrele(kaynakListe || [], id);
  const sayac = $("#panelSayac");
  if (sayac) sayac.textContent = String(gorunen.length);

  const temizle = $("#filtreTemizle");
  if (temizle) temizle.disabled = !panelArama && !panelEtiket;

  const etiketKap = $("#etiketFiltreleri");
  if (!etiketKap) return;
  etiketKap.replaceChildren();
  if (!slotById[id]) return;

  for (const [etiket, adet] of etiketleriTopla(kaynakListe || [], id)) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "etiket-chip" + (panelEtiket === etiket ? " aktif" : "");
    b.textContent = `${etiket} ${adet}`;
    b.onclick = () => {
      panelEtiket = panelEtiket === etiket ? null : etiket;
      urunleriGoster(aktifSekme);
      SES.efekt("dokun");
    };
    etiketKap.appendChild(b);
  }
}

function kombinOzetGuncelle() {
  const kap = $("#kombinOzet");
  if (!kap) return;
  kap.replaceChildren();

  for (const id of OZET_SEKMELERI) {
    if (gorunenSekmeler.length && !gorunenSekmeler.includes(id) && !giyim[id]) continue;
    const meta = sekmeMeta(id);
    const ad = seciliParcaAdi(id);
    const bos = ad === "Yok";
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ozet-chip" + (bos ? " bos" : "");
    b.dataset.sekme = id;
    b.setAttribute("aria-label", `${meta.ad}: ${ad}`);

    const ikonKutu = document.createElement("span");
    ikonKutu.className = "ozet-ikon";
    ikonKutu.appendChild(ikon(sekmeIkonu(id)));
    b.appendChild(ikonKutu);

    const yazi = document.createElement("span");
    yazi.className = "ozet-yazi";
    yazi.textContent = ad;
    b.appendChild(yazi);

    b.onclick = () => sekmeyeGec(id, { filtreSifirla: true });
    kap.appendChild(b);
  }
}

function sekmeleriKur() {
  const kap = $("#sekmeler");
  kap.replaceChildren(); // Güvenli temizleme

  // Gerçekçi modelde ten/makyaj gövdeye, saç da çoğu modelde PNG'ye bake'lidir.
  const gercekci = Boolean(ovr("modeller", giyim.mankenler));
  const gizli = new Set(gercekci ? ["renkler", "makyaj"] : []);
  if (gercekci && Object.keys(gorselOverride.saclar || {}).length === 0) gizli.add("saclar");
  for (const slot of DOLAP.slotlar) {
    if (!slot.zorunlu && slot.liste.filter((oge) => ogeKullanilabilir(slot.id, oge)).length === 0) gizli.add(slot.id);
  }
  if (gizli.has(aktifSekme)) aktifSekme = "mankenler";
  gorunenSekmeler = [];

  for (const id of SEKME_SIRASI) {
    if (gizli.has(id)) continue;
    gorunenSekmeler.push(id);
    const meta = slotById[id] || OZEL_SEKME[id];
    const b = document.createElement("button");
    b.type = "button";
    b.className = "sekme" + (id === aktifSekme ? " aktif" : "");
    b.id = `sekme-${id}`;
    b.dataset.sekme = id;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", id === aktifSekme ? "true" : "false");
    b.setAttribute("aria-controls", "urunler");
    b.tabIndex = id === aktifSekme ? 0 : -1;

    const ikonSpan = document.createElement("span");
    ikonSpan.className = "ikon";
    ikonSpan.appendChild(ikon(sekmeIkonu(id)));

    b.appendChild(ikonSpan);
    b.appendChild(document.createTextNode(meta.ad));

    b.onclick = () => {
      sekmeyeGec(id, { filtreSifirla: true });
    };
    kap.appendChild(b);
  }
  $("#urunler")?.setAttribute("aria-labelledby", `sekme-${aktifSekme}`);
  kombinOzetGuncelle();
}

function urunleriGoster(id) {
  const kap = $("#urunler");
  kap.replaceChildren(); // Güvenli temizleme

  if (id === "mankenler") return mankenleriGoster(kap);
  if (id === "renkler") { panelKontrolleriniGuncelle(id, []); return renkleriGoster(kap); }
  if (id === "makyaj") { panelKontrolleriniGuncelle(id, []); return makyajGoster(kap); }
  if (id === "gorevler") { panelKontrolleriniGuncelle(id, []); return gorevleriGoster(kap); }
  if (id === "eslerim") { panelKontrolleriniGuncelle(id, []); return eslerimiGoster(kap); }

  // Normal dolap eşyaları
  const slot = slotById[id];
  const kaynakListe = slot.liste.filter((oge) => ogeKullanilabilir(id, oge)).sort((a, b) => {
    const pa = ovr(id, a.id) ? 1 : 0;
    const pb = ovr(id, b.id) ? 1 : 0;
    return pb - pa || a.ad.localeCompare(b.ad, "tr");
  });
  panelKontrolleriniGuncelle(id, kaynakListe);

  if (!slot.zorunlu) kap.appendChild(cikarHucresi(id));

  const liste = listeyiFiltrele(kaynakListe, id);
  if (!liste.length) {
    const bos = document.createElement("div");
    bos.className = "bos-not";
    bos.textContent = "Bu filtrede parça yok.";
    kap.appendChild(bos);
    return;
  }

  for (const oge of liste) {
    const secili = giyim[id] === oge.id;
    const d = document.createElement("div");
    d.className = "urun" + (secili ? " secili" : "");
    d.dataset.ad = oge.ad;

    const img = document.createElement("img");
    const tam = ovr(id, oge.id) ||
      svgURL(id === "saclar" ? renkUygula(oge.svg, { sac: renkler.sac }) : oge.svg);
    panelGorsel(img, id, oge.id, tam);
    img.alt = oge.ad;
    d.appendChild(img);

    kartErisilebilir(d, oge.ad, secili, () => giy(id, oge.id));
    kap.appendChild(d);
  }
}

function cikarHucresi(id) {
  const d = document.createElement("div");
  d.className = "urun cikar" + (!giyim[id] ? " secili" : "");

  const emoji = document.createElement("span");
  emoji.className = "cikar-emoji";
  emoji.appendChild(ikon("yok"));

  d.appendChild(emoji);
  d.appendChild(document.createTextNode("Çıkar"));
  kartErisilebilir(d, sekmeMeta(id).ad + " çıkar", !giyim[id], () => {
    if (giyim[id]) giy(id, giyim[id]);
  });
  return d;
}

function mankenleriGoster(kap) {
  const kaynakListe = DOLAP.mankenler.filter((m) => ogeKullanilabilir("modeller", m));
  panelKontrolleriniGuncelle("mankenler", kaynakListe);
  const liste = listeyiFiltrele(kaynakListe, "mankenler");
  if (!liste.length) {
    const bos = document.createElement("div");
    bos.className = "bos-not";
    bos.textContent = "Bu aramada model yok.";
    kap.appendChild(bos);
    return;
  }

  for (const m of liste) {
    const secili = giyim.mankenler === m.id;
    const d = document.createElement("div");
    d.className = "urun manken-kart" + (secili ? " secili" : "");
    d.dataset.ad = m.ad;

    const img = document.createElement("img");
    panelGorsel(img, "modeller", m.id, ovr("modeller", m.id) || svgURL(mankenOnizlemeSVG(m)));
    img.alt = m.ad;
    img.style.objectFit = "contain";
    d.appendChild(img);

    // Manken adı etiketi
    const etiket = document.createElement("div");
    etiket.className = "manken-etiket";
    etiket.textContent = m.ad;
    d.appendChild(etiket);

    kartErisilebilir(d, m.ad, secili, () => mankenDegistir(m.id));
    kap.appendChild(d);
  }
}

function renkleriGoster(kap) {
  const b1 = document.createElement("div");
  b1.className = "renk-baslik";
  b1.textContent = "Ten rengi tonu";
  kap.appendChild(b1);

  for (const t of DOLAP.tenRenkleri) {
    const s = document.createElement("button");
    s.type = "button";
    s.className = "swatch" + (renkler.ten === t.renk ? " secili" : "");
    s.style.background = t.renk;
    s.title = t.ad;
    s.setAttribute("aria-label", "Ten rengi: " + t.ad);
    s.setAttribute("aria-pressed", renkler.ten === t.renk ? "true" : "false");
    s.onclick = () => tenSec(t.renk);
    kap.appendChild(s);
  }

  const b2 = document.createElement("div");
  b2.className = "renk-baslik";
  b2.textContent = "Saç rengi";
  kap.appendChild(b2);

  for (const t of DOLAP.sacRenkleri) {
    const s = document.createElement("button");
    s.type = "button";
    s.className = "swatch" + (renkler.sac === t.renk ? " secili" : "");
    s.style.background = t.renk;
    s.title = t.ad;
    s.setAttribute("aria-label", "Saç rengi: " + t.ad);
    s.setAttribute("aria-pressed", renkler.sac === t.renk ? "true" : "false");
    s.onclick = () => sacSec(t.renk);
    kap.appendChild(s);
  }
}

function makyajGoster(kap) {
  const b1 = document.createElement("div");
  b1.className = "renk-baslik";
  b1.textContent = "Göz rengi";
  kap.appendChild(b1);

  for (const g of DOLAP.gozRenkleri) {
    const s = document.createElement("button");
    s.type = "button";
    s.className = "swatch" + (renkler.goz === g.renk ? " secili" : "");
    s.style.background = g.renk;
    s.title = g.ad;
    s.setAttribute("aria-label", "Göz rengi: " + g.ad);
    s.setAttribute("aria-pressed", renkler.goz === g.renk ? "true" : "false");
    s.onclick = () => makyajSec("goz", g.renk);
    kap.appendChild(s);
  }

  const b2 = document.createElement("div");
  b2.className = "renk-baslik";
  b2.textContent = "Ruj";
  kap.appendChild(b2);

  for (const r of DOLAP.rujRenkleri) {
    const s = document.createElement("button");
    s.type = "button";
    s.className = "swatch" + (renkler.ruj === r.renk ? " secili" : "");
    s.style.background = r.renk;
    s.title = r.ad;
    s.setAttribute("aria-label", "Ruj: " + r.ad);
    s.setAttribute("aria-pressed", renkler.ruj === r.renk ? "true" : "false");
    s.onclick = () => makyajSec("ruj", r.renk);
    kap.appendChild(s);
  }

  const b3 = document.createElement("div");
  b3.className = "renk-baslik";
  b3.textContent = "Yanak allığı";
  kap.appendChild(b3);

  for (const a of DOLAP.allikRenkleri) {
    const s = document.createElement("button");
    s.type = "button";
    s.className = "swatch" + (renkler.allik === a.renk ? " secili" : "");
    s.style.background = a.renk;
    s.title = a.ad;
    s.setAttribute("aria-label", "Allık: " + a.ad);
    s.setAttribute("aria-pressed", renkler.allik === a.renk ? "true" : "false");
    s.onclick = () => makyajSec("allik", a.renk);
    kap.appendChild(s);
  }
}

/* =============================== GÖREVLER =============================== */
function aktifEtiketler() {
  const set = new Set();
  for (const slot of DOLAP.slotlar) {
    const it = bul(slot.id, giyim[slot.id]);
    if (ogeKullanilabilir(slot.id, it) && it.etiketler) it.etiketler.forEach((e) => set.add(e));
  }
  return set;
}

function gorevTamamMi(g, etiketler) {
  if (Array.isArray(g.kosullar) && g.kosullar.length) return g.kosullar.every(kosulTamamMi);
  return g.gerek.every((e) => etiketler.has(e));
}

function kosulTamamMi(kosul) {
  const it = bul(kosul.slot, giyim[kosul.slot]);
  if (!ogeKullanilabilir(kosul.slot, it)) return false;
  const tags = etiketler(meta(kosul.slot, it.id), it.etiketler || []);
  if (!Array.isArray(kosul.etiketler) || !kosul.etiketler.length) return true;
  return kosul.etiketler.some((etiket) => tags.includes(etiket));
}

function gorevIlerleme(g) {
  const kosullar = Array.isArray(g.kosullar) && g.kosullar.length
    ? g.kosullar
    : [{ slot: null, etiketler: g.gerek || [], ad: "Tema" }];
  const global = aktifEtiketler();
  const adimlar = kosullar.map((kosul) => ({
    ...kosul,
    tamam: kosul.slot ? kosulTamamMi(kosul) : kosul.etiketler.every((e) => global.has(e)),
  }));
  return { adimlar, tamam: adimlar.filter((x) => x.tamam).length, toplam: adimlar.length };
}

function gorevSec(g) {
  aktifGorevId = g.id;
  durumDegisti();
  const ilerleme = gorevIlerleme(g);
  const eksik = ilerleme.adimlar.find((x) => !x.tamam && x.slot);
  if (eksik && gorunenSekmeler.includes(eksik.slot)) sekmeyeGec(eksik.slot, { filtreSifirla: true });
  else urunleriGoster("gorevler");
  bildir(`${g.emoji} Stil briefi seçildi: ${ilerleme.tamam}/${ilerleme.toplam}`);
  gorevleriDenetle();
}

function stilAnaliziGuncelle() {
  const puanEl = $("#stilPuan"), temaEl = $("#stilTema"), ipucuEl = $("#stilIpucu");
  if (!puanEl || !temaEl || !ipucuEl) return;

  const sayac = new Map();
  const sayilanSlotlar = ["elbiseler", "ozel", "ayakkabilar", "takilar", "taclar", "kanatlar", "asalar", "arkaplanlar"];
  let secili = 0;
  for (const slot of sayilanSlotlar) {
    const it = bul(slot, giyim[slot]);
    if (!ogeKullanilabilir(slot, it)) continue;
    if (slot !== "arkaplanlar") secili += 1;
    for (const etiket of etiketler(meta(slot, it.id), it.etiketler || [])) {
      sayac.set(etiket, (sayac.get(etiket) || 0) + 1);
    }
  }
  const sirali = [...sayac.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"));
  const [baskin = "ozgun", tekrar = 1] = sirali[0] || [];
  const tamamlayici = giyim.elbiseler && giyim.ayakkabilar ? 8 : 0;
  const puan = clamp(24 + Math.min(secili, 7) * 7 + Math.max(0, tekrar - 1) * 9 + tamamlayici, 0, 100);
  const temaAdlari = {
    modern: "Modern çizgi", gece: "Gece zarafeti", balo: "Balo ışıltısı", saray: "Kraliyet stili",
    gunluk: "Rahat şıklık", spor: "Sportif enerji", yaz: "Yaz ferahlığı", kis: "Kış katmanları",
    peri: "Masalsı dokunuş", bahce: "Botanik romantizm", siyah: "Monokrom güç", pembe: "Romantik tonlar",
    mavi: "Mavi armoni", altin: "Altın vurgu", ozgun: "Özgün karışım",
  };

  const aktif = DOLAP.gorevler.find((g) => g.id === aktifGorevId);
  if (aktif) {
    const ilerleme = gorevIlerleme(aktif);
    temaEl.textContent = `${aktif.emoji} ${aktif.ad}`;
    ipucuEl.textContent = ilerleme.tamam === ilerleme.toplam
      ? "Brief tamamlandı — podyuma hazırsın."
      : `${ilerleme.tamam}/${ilerleme.toplam} adım tamamlandı · ${ilerleme.adimlar.find((x) => !x.tamam)?.ad || "Devam et"}`;
    const btn = $("#btnAktifGorev");
    if (btn) btn.textContent = `${ilerleme.tamam}/${ilerleme.toplam}`;
  } else {
    temaEl.textContent = temaAdlari[baskin] || idGuzelAd(baskin);
    const gunluk = DOLAP.gorevler.find((g) => g.id === gununGoreviId() && !bitenGorevler.has(g.id));
    ipucuEl.textContent = gunluk
      ? `Günün briefi: ${gunluk.ad} · +${gorevOdulu(gunluk)}★`
      : (tekrar > 1
        ? `${baskin} teması ${tekrar} parçada tekrar ediyor.`
        : "Bir brief seçerek kombine hedef kazandır.");
    const btn = $("#btnAktifGorev");
    if (btn) btn.textContent = gunluk ? "Günün briefi" : "Briefler";
  }
  puanEl.textContent = String(puan);
  $("#stilKarti")?.style.setProperty("--stil-puan", `${puan}%`);
}

function gorevleriDenetle() {
  const etk = aktifEtiketler();
  let tamamlanan = 0;
  // Seçili olsun olmasın tüm briefler denetlenir: oyuncu bir brief seçmeden de
  // yıldız kazanabilmelidir.
  for (const g of DOLAP.gorevler) {
    if (bitenGorevler.has(g.id) || !gorevTamamMi(g, etk)) continue;
    bitenGorevler.add(g.id);
    const odul = gorevOdulu(g);
    yildizEkle(odul);
    tamamlanan += 1;
    depoyaJSON("lara_gorevler", [...bitenGorevler]);
    SES.efekt("yildiz");
    konfetiPatlat();
    const gunluk = g.id === gununGoreviId() ? " (Günün briefi ×2)" : "";
    bildir(`${g.emoji} Brief tamamlandı: ${g.ad}! +${odul}★${gunluk}`);
    if (aktifGorevId === g.id) aktifGorevId = null;
  }
  if (tamamlanan) {
    if (aktifSekme === "gorevler") urunleriGoster("gorevler");
    stilAnaliziGuncelle();
    durumKaliciYaz();
  }
}

function gorevleriGoster(kap) {
  const gunlukId = gununGoreviId();
  const sirali = [...DOLAP.gorevler].sort((a, b) => {
    const bitA = bitenGorevler.has(a.id) ? 1 : 0;
    const bitB = bitenGorevler.has(b.id) ? 1 : 0;
    if (bitA !== bitB) return bitA - bitB;
    const gunA = a.id === gunlukId ? 0 : 1;
    const gunB = b.id === gunlukId ? 0 : 1;
    if (gunA !== gunB) return gunA - gunB;
    return gorevIlerleme(b).tamam - gorevIlerleme(a).tamam;
  });

  const bitti = DOLAP.gorevler.filter((g) => bitenGorevler.has(g.id)).length;
  const ust = document.createElement("div");
  ust.className = "renk-baslik";
  ust.textContent = `Stil briefleri — ${bitti}/${DOLAP.gorevler.length} tamamlandı`;
  kap.appendChild(ust);

  for (const g of sirali) {
    const tamamlandi = bitenGorevler.has(g.id);
    const gunluk = g.id === gunlukId;
    const ilerleme = gorevIlerleme(g);
    const d = document.createElement("div");
    d.className = "gorev" + (tamamlandi ? " bitti" : "") + (aktifGorevId === g.id ? " aktif" : "");

    const emoji = document.createElement("div");
    emoji.className = "gorev-emoji";
    emoji.textContent = tamamlandi ? "✓" : g.emoji;
    d.appendChild(emoji);

    const ic = document.createElement("div");
    ic.className = "gorev-ic";

    const ad = document.createElement("div");
    ad.className = "gorev-ad";
    ad.appendChild(document.createTextNode(g.ad));
    if (gunluk) {
      const rozet = document.createElement("span");
      rozet.className = "gorev-rozet";
      rozet.textContent = "Günün briefi ×2";
      ad.appendChild(rozet);
    }
    ic.appendChild(ad);

    const desc = document.createElement("div");
    desc.className = "gorev-aciklama";
    desc.textContent = g.aciklama;
    ic.appendChild(desc);

    const ilerlemeEl = document.createElement("div");
    ilerlemeEl.className = "gorev-ilerleme";
    for (const adim of ilerleme.adimlar) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "gorev-adim" + (adim.tamam ? " tamam" : "");
      chip.textContent = `${adim.tamam ? "✓" : "○"} ${adim.ad || "Tema"}`;
      if (adim.slot && gorunenSekmeler.includes(adim.slot)) {
        chip.title = `${sekmeMeta(adim.slot).ad} sekmesine git`;
        chip.onclick = () => {
          gorevSec(g);
          sekmeyeGec(adim.slot, { filtreSifirla: true });
        };
      } else {
        chip.disabled = true;
      }
      ilerlemeEl.appendChild(chip);
    }
    ic.appendChild(ilerlemeEl);
    d.appendChild(ic);

    const sag = document.createElement("div");
    sag.className = "gorev-sag";

    const odul = document.createElement("div");
    odul.className = "gorev-odul";
    odul.textContent = tamamlandi
      ? `${ilerleme.toplam}/${ilerleme.toplam} ✓`
      : `+${gorevOdulu(g)}★ · ${ilerleme.tamam}/${ilerleme.toplam}`;
    sag.appendChild(odul);

    const sec = document.createElement("button");
    sec.type = "button";
    sec.className = "gorev-cta";
    sec.textContent = aktifGorevId === g.id ? "Takipte" : (tamamlandi ? "Tekrar kur" : "Takip et");
    sec.onclick = () => gorevSec(g);
    sag.appendChild(sec);

    d.appendChild(sag);
    kap.appendChild(d);
  }
}

function yildizEkle(n) {
  yildizlar += n;
  try { localStorage.setItem("lara_yildiz", String(yildizlar)); } catch (e) {}
  yildizGoster();
}

function yildizGoster(kutla) {
  $("#yildizSayi").textContent = yildizlar;
  const k = $("#yildizKutu");
  k.classList.remove("zipla");
  void k.offsetWidth;
  k.classList.add("zipla");
  rutbeGuncelle(kutla);
}

/* =============================== SÜRPRİZ KOMBİN =============================== */
function rastgele(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Bir slot için rastgele parça id'si; katman çizimi PNG varsa onu, yoksa vektör fallback'i kullanır.
function rastgeleId(slotId) {
  const liste = slotById[slotId].liste.filter((oge) => ogeKullanilabilir(slotId, oge));
  return liste.length ? rastgele(liste).id : null;
}

let surprizCalisiyor = false;
let surprizZamanlayici = null;

function surpriz() {
  if (surprizCalisiyor) return;
  surprizCalisiyor = true;
  const btn = $("#btnSurpriz");
  if (btn) btn.disabled = true;
  SES.efekt("buyu");
  let adim = 0;
  const turSayisi = AZ_HAREKET ? 1 : 8;

  surprizZamanlayici = setInterval(() => {
    const e = rastgeleId("elbiseler");
    if (e) giyim.elbiseler = e;
    if (!ovr("modeller", giyim.mankenler)) {
      const saclar = slotById.saclar.liste.filter((oge) => ogeKullanilabilir("saclar", oge));
      if (saclar.length) giyim.saclar = rastgele(saclar).id;
      renkler.sac = rastgele(DOLAP.sacRenkleri).renk;
      katmanGuncelle("saclar", false);
    }
    katmanGuncelle("elbiseler", false);

    if (++adim >= turSayisi) {
      clearInterval(surprizZamanlayici);
      surprizZamanlayici = null;

      // Sürpriz model seçimi
      const mankenler = DOLAP.mankenler.filter((m) => ogeKullanilabilir("modeller", m));
      const rManken = rastgele(mankenler.length ? mankenler : DOLAP.mankenler);
      giyim.mankenler = rManken.id;

      giyim.taclar = Math.random() < 0.85 ? rastgeleId("taclar") : null;
      giyim.kanatlar = Math.random() < 0.6 ? rastgeleId("kanatlar") : null;
      giyim.ayakkabilar = rastgeleId("ayakkabilar");
      giyim.ozel = Math.random() < 0.35 ? rastgeleId("ozel") : null;
      giyim.takilar = Math.random() < 0.7 ? rastgeleId("takilar") : null;
      giyim.asalar = Math.random() < 0.65 ? rastgeleId("asalar") : null;

      const rArkaplan = rastgeleId("arkaplanlar");
      if (rArkaplan) giyim.arkaplanlar = rArkaplan;

      if (!ovr("modeller", rManken.id)) {
        renkler.ten = rManken.ten;
        renkler.goz = rManken.goz;
        renkler.ruj = rManken.ruj;
        renkler.allik = rManken.allik;
      } else if (rManken.sac) {
        giyim.saclar = rManken.sac;
      }

      arkaPlanOzel = null;
      arkaPlanOzelId = null;
      SES.muzikDegistir(giyim.arkaplanlar);

      DOLAP.cizimSirasi.forEach((s) => katmanGuncelle(s, true));
      sliderGuncelle();
      durumDegisti();
      kombinOzetGuncelle();
      SES.efekt("tak");
      pirilti();
      bildir("✨ Sürpriz podyum kombini hazır!");

      if (slotById[aktifSekme] || ["mankenler", "renkler", "makyaj"].includes(aktifSekme)) {
        urunleriGoster(aktifSekme);
      }
      gorevleriDenetle();
      surprizCalisiyor = false;
      if (btn) btn.disabled = false;
    }
  }, AZ_HAREKET ? 1 : 90);
}

/* =============================== EŞYALARIM (Fotoğraf Yükleme) =============================== */
const EKLE_KATEGORI = {
  karakterler: { ad: "Karakterler", emoji: "🧍" },
  kiyafetler: { ad: "Kıyafetler", emoji: "👗" },
  aksesuarlar: { ad: "Aksesuarlar", emoji: "👜" },
  arkaplanlar: { ad: "Arka Planlar", emoji: "🌅" },
};

async function varliklariYukle() {
  customVarliklar = Object.fromEntries(Object.keys(EKLE_KATEGORI).map((id) => [id, []]));
  const yereller = await dbTum("varliklar");
  for (const oge of yereller || []) {
    if (!EKLE_KATEGORI[oge.kategori] || typeof oge.url !== "string") continue;
    customVarliklar[oge.kategori].push({ ...oge, yerel: true });
  }
}

async function yerelVarlikKaydet(kategori, ad, url) {
  const id = window.crypto && typeof window.crypto.randomUUID === "function"
    ? window.crypto.randomUUID()
    : `yerel-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const oge = { id, kategori, ad, url, tarih: Date.now(), yerel: true };
  const kalici = await dbYaz("varliklar", oge);
  return { ...oge, kalici };
}

async function yerelVarlikKaldir(oge) {
  if (!oge || !oge.yerel) return;
  if (!await onayAl("Fotoğrafı sil", `“${oge.ad}” cihazdaki koleksiyondan silinsin mi?`, "Sil")) return;
  const silindi = oge.kalici === false ? true : await dbSil("varliklar", oge.id);
  if (!silindi) {
    bildir("Fotoğraf silinemedi");
    return;
  }
  customVarliklar[oge.kategori] = (customVarliklar[oge.kategori] || []).filter((x) => x.id !== oge.id);
  const bagliStickerlar = stickerlar.filter((p) => p.assetId === oge.id);
  for (const p of bagliStickerlar) p.dugum?.remove();
  if (bagliStickerlar.length) stickerlar = stickerlar.filter((p) => p.assetId !== oge.id);
  if (arkaPlanOzelId === oge.id) {
    arkaPlanOzelId = null;
    arkaPlanOzel = null;
    katmanGuncelle("arkaplanlar", true);
  }
  if (bagliStickerlar.length || arkaPlanOzelId === null) durumDegisti();
  urunleriGoster("eslerim");
  SES.efekt("cikar");
  bildir("Fotoğraf cihazdan silindi");
}

function eslerimiGoster(kap) {
  const ekle = document.createElement("div");
  ekle.className = "ekle-btn";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "arac-btn vurgu";
  btn.style.width = "100%";
  btn.appendChild(ikon("kamera", "arac-ikon"));
  btn.appendChild(document.createTextNode("Fotoğraf Ekle"));
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
    bas.textContent = EKLE_KATEGORI[katId].ad;
    kap.appendChild(bas);

    for (const oge of liste) {
      const d = document.createElement("div");
      d.className = "urun";
      d.dataset.ad = oge.ad;

      const img = document.createElement("img");
      img.src = oge.url;
      img.alt = oge.ad;
      d.appendChild(img);

      kartErisilebilir(d, oge.ad, arkaPlanOzelId === oge.id, () => {
        if (katId === "arkaplanlar") {
          arkaPlanOzel = oge.url;
          arkaPlanOzelId = oge.id;
          katmanGuncelle("arkaplanlar", true);
          kombinOzetGuncelle();
          durumDegisti();
          SES.efekt("tak");
          bildir("🌅 Arka plan değişti");
        } else {
          stickerEkle(oge.url, oge.id);
          SES.efekt("tak");
        }
      });

      if (oge.yerel) {
        const sil = document.createElement("button");
        sil.type = "button";
        sil.className = "urun-sil";
        sil.textContent = "×";
        sil.setAttribute("aria-label", `${oge.ad} fotoğrafını sil`);
        sil.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          yerelVarlikKaldir(oge);
        };
        d.appendChild(sil);
      }
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
function stickerlariTemizle() {
  for (const p of stickerlar) p.dugum?.remove();
  stickerlar = [];
  seciliSticker = null;
}

function stickerlariDurumdanKur(kayitlar) {
  stickerlariTemizle();
  for (const kayit of kayitlar || []) {
    const varlik = customVarlikBul(kayit.assetId);
    if (!varlik) continue;
    const p = {
      id: stickerSayac++,
      assetId: varlik.id,
      src: varlik.url,
      xRel: kayit.xRel,
      yRel: kayit.yRel,
      wRel: kayit.wRel,
      rot: kayit.rot,
      oran: kayit.oran,
      dugum: null,
    };
    stickerlar.push(p);
    stickerDugumu(p);
  }
}

function resimYukle(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function stickerEkle(src, assetId = null) {
  let img;
  try {
    img = await resimYukle(src);
  } catch (e) {
    bildir("Fotoğraf yüklenemedi 😕");
    return;
  }

  const oran = img.naturalHeight / img.naturalWidth || 1;
  const p = { id: stickerSayac++, assetId, src, xRel: 0.5, yRel: 0.45, wRel: 0.34, rot: 0, oran, dugum: null };
  stickerlar.push(p);
  stickerDugumu(p);
  stickerSec(p.id, false);
  durumDegisti();
  pirilti();
}

function stickerDugumu(p) {
  const d = document.createElement("div");
  d.className = "parca";
  d.dataset.id = p.id;
  d.tabIndex = 0;
  d.setAttribute("role", "group");
  d.setAttribute("aria-label", "Fotoğraf çıkartması. Oklarla taşı, artı ve eksiyle boyutlandır, köşeli parantezlerle döndür, Delete ile sil.");

  const img = document.createElement("img");
  img.src = p.src;
  img.alt = "Sticker";
  d.appendChild(img);

  const kontrol = document.createElement("div");
  kontrol.className = "kontrol";

  const cerceve = document.createElement("div");
  cerceve.className = "secim-cercevesi";
  kontrol.appendChild(cerceve);

  const btnDondur = document.createElement("button");
  btnDondur.type = "button";
  btnDondur.className = "tutamac t-dondur";
  btnDondur.textContent = "⟳";
  btnDondur.setAttribute("aria-label", "Çıkartmayı döndür");
  kontrol.appendChild(btnDondur);

  const btnSil = document.createElement("button");
  btnSil.type = "button";
  btnSil.className = "tutamac t-sil";
  btnSil.textContent = "✕";
  btnSil.setAttribute("aria-label", "Çıkartmayı sil");
  kontrol.appendChild(btnSil);

  const btnBoyut = document.createElement("button");
  btnBoyut.type = "button";
  btnBoyut.className = "tutamac t-boyut";
  btnBoyut.textContent = "⤡";
  btnBoyut.setAttribute("aria-label", "Çıkartmayı boyutlandır");
  kontrol.appendChild(btnBoyut);

  d.appendChild(kontrol);
  p.dugum = d;

  $("#stickerKat").appendChild(d);
  stickerStil(p);

  d.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".tutamac")) return;
    e.preventDefault();
    stickerSec(p.id, false);
    stickerTasi(e, p);
  });

  // Klavyeyle yalnızca odaklanmak kompozisyonun katman sırasını değiştirmesin.
  d.addEventListener("focus", () => stickerSec(p.id, false, false));
  d.addEventListener("keydown", (e) => {
    const adim = e.shiftKey ? 0.08 : 0.02;
    if (e.key === "ArrowLeft") p.xRel = clamp(p.xRel - adim, 0, 1);
    else if (e.key === "ArrowRight") p.xRel = clamp(p.xRel + adim, 0, 1);
    else if (e.key === "ArrowUp") p.yRel = clamp(p.yRel - adim, 0, 1);
    else if (e.key === "ArrowDown") p.yRel = clamp(p.yRel + adim, 0, 1);
    else if (e.key === "+" || e.key === "=") p.wRel = clamp(p.wRel + adim, 0.06, 2.4);
    else if (e.key === "-" || e.key === "_") p.wRel = clamp(p.wRel - adim, 0.06, 2.4);
    else if (e.key === "[") p.rot -= e.shiftKey ? 15 : 5;
    else if (e.key === "]") p.rot += e.shiftKey ? 15 : 5;
    else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      stickerSil(p);
      return;
    } else return;
    e.preventDefault();
    stickerStil(p);
    durumDegisti();
  });

  btnSil.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); stickerSil(p); });
  btnBoyut.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); stickerBoyut(e, p); });
  btnDondur.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); stickerDondur(e, p); });
  btnBoyut.addEventListener("click", (e) => {
    if (e.detail !== 0) return;
    e.preventDefault();
    p.wRel = clamp(p.wRel + 0.08, 0.06, 2.4);
    stickerStil(p);
    durumDegisti();
  });
  btnDondur.addEventListener("click", (e) => {
    if (e.detail !== 0) return;
    e.preventDefault();
    p.rot += 15;
    stickerStil(p);
    durumDegisti();
  });
}

function stickerStil(p) {
  const d = p.dugum;
  d.style.left = p.xRel * 100 + "%";
  d.style.top = p.yRel * 100 + "%";
  d.style.width = p.wRel * 100 + "%";
  d.style.transform = `translate(-50%, -50%) rotate(${p.rot}deg)`;
}

function stickerSec(id, kaydet = true, oneGetir = true) {
  seciliSticker = id;
  for (const p of stickerlar) {
    p.dugum.classList.toggle("secili", p.id === id);
  }
  const p = stickerlar.find((x) => x.id === id);
  if (p && oneGetir) {
    const i = stickerlar.indexOf(p);
    stickerlar.splice(i, 1);
    stickerlar.push(p);
    $("#stickerKat").appendChild(p.dugum);
  }
  if (kaydet) durumDegisti();
}

function stickerSil(p) {
  p.dugum.remove();
  stickerlar = stickerlar.filter((x) => x !== p);
  if (seciliSticker === p.id) seciliSticker = null;
  durumDegisti();
  SES.efekt("cikar");
}

function sahneKutu() {
  return sahne.getBoundingClientRect();
}

function stickerTasi(e, p) {
  const r = sahneKutu();
  const bas = { x: e.clientX, y: e.clientY, xRel: p.xRel, yRel: p.yRel };
  surukle(e, p, (ev) => {
    p.xRel = clamp(bas.xRel + (ev.clientX - bas.x) / r.width, 0, 1);
    p.yRel = clamp(bas.yRel + (ev.clientY - bas.y) / r.height, 0, 1);
    stickerStil(p);
  }, durumDegisti);
}

function stickerBoyut(e, p) {
  const r = sahneKutu();
  surukle(e, p, (ev) => {
    const cx = r.left + p.xRel * r.width, cy = r.top + p.yRel * r.height;
    const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy);
    const wPx = (2 * dist) / Math.sqrt(1 + p.oran * p.oran);
    p.wRel = clamp(wPx / r.width, 0.06, 2.4);
    stickerStil(p);
  }, durumDegisti);
}

function stickerDondur(e, p) {
  const r = sahneKutu();
  surukle(e, p, (ev) => {
    const cx = r.left + p.xRel * r.width, cy = r.top + p.yRel * r.height;
    p.rot = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90;
    stickerStil(p);
  }, durumDegisti);
}

function surukle(baslangic, parca, hareket, bitti) {
  const pointerId = baslangic.pointerId;
  const yakalayan = baslangic.currentTarget;

  // Aynı çıkartmayı iki parmağın eşzamanlı ve çelişkili değiştirmesini engelle.
  if (parca.aktifPointerId !== undefined && parca.aktifPointerId !== null) return;
  parca.aktifPointerId = pointerId;

  try { yakalayan?.setPointerCapture(pointerId); } catch (e) {}

  function move(ev) {
    if (ev.pointerId !== pointerId) return;
    hareket(ev);
  }

  function up(ev) {
    if (ev.pointerId !== pointerId) return;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
    try {
      if (yakalayan?.hasPointerCapture(pointerId)) yakalayan.releasePointerCapture(pointerId);
    } catch (e) {}
    parca.aktifPointerId = null;
    if (bitti) bitti();
  }
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
}

sahne.addEventListener("pointerdown", (e) => {
  if (e.target === sahne || e.target.closest(".katmanlar")) {
    seciliSticker = null;
    for (const p of stickerlar) {
      p.dugum.classList.remove("secili");
    }
    if (altSayfaMi()) panelMiniAyarla(true);
  }
});

/* =============================== TUVAL SNAPSHOT KOMBİN KAYDETME =============================== */
async function kombinResmi() {
  const W = 1024, H = 1365;
  // Kullanıcı export sürerken seçim değiştirse bile görsel ve düzenlenebilir
  // albüm durumu aynı ana ait kalsın.
  const durum = durumKopyala(durumAnlik());
  const katmanlar = DOLAP.cizimSirasi.map((id) => ({ id, src: katmanKaynak(id) }));
  const stickerKatmanlari = stickerlar.map((p) => ({
    src: p.src,
    xRel: p.xRel,
    yRel: p.yRel,
    wRel: p.wRel,
    rot: p.rot,
    oran: p.oran,
  }));
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#fde9f3";
  ctx.fillRect(0, 0, W, H);

  for (const { id, src } of katmanlar) {
    if (!src) continue;
    try {
      const img = await resimYukle(src);
      ctx.drawImage(img, 0, 0, W, H);
    } catch (e) {
      throw new Error(`Sahne katmanı yüklenemedi: ${id}`);
    }
  }

  for (const p of stickerKatmanlari) {
    try {
      const img = await resimYukle(p.src);
      const wPx = p.wRel * W;
      const hPx = wPx * p.oran;
      ctx.save();
      ctx.translate(p.xRel * W, p.yRel * H);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.drawImage(img, -wPx / 2, -hPx / 2, wPx, hPx);
      ctx.restore();
    } catch (e) {
      throw new Error("Fotoğraf çıkartması yüklenemedi");
    }
  }
  return { url: c.toDataURL("image/jpeg", 0.92), durum };
}

/* =============================== ALBÜM KUTUSU =============================== */
let albumGocTamam = false;

function legacyAlbumId(kayit, sira) {
  return kayit?.id || `eski-${kayit?.tarih || 0}-${sira}`;
}

async function albumOku() {
  let dbKayitlari = await dbTum("album");
  const eskiHam = depodanJSON("lara_album", []);
  let eskiKayitlar = Array.isArray(eskiHam)
    ? eskiHam
      .filter((x) => x && typeof x.url === "string")
      .map((x, i) => ({ ...x, id: legacyAlbumId(x, i) }))
    : [];

  if (dbKayitlari === null) return eskiKayitlar.sort((a, b) => Number(b.tarih || 0) - Number(a.tarih || 0));

  // Kaynak localStorage ancak her kayıt yazılıp DB'den geri okunarak doğrulanırsa silinir.
  if (eskiKayitlar.length && !albumGocTamam) {
    let tumuYazildi = true;
    for (const oge of eskiKayitlar) {
      if (!await dbYaz("album", oge)) {
        tumuYazildi = false;
        break;
      }
    }
    const dogrulama = tumuYazildi ? await dbTum("album") : null;
    const dogrulananIdler = new Set((dogrulama || []).map((x) => x.id));
    if (tumuYazildi && eskiKayitlar.every((x) => dogrulananIdler.has(x.id))) {
      try { localStorage.removeItem("lara_album"); } catch (e) {}
      albumGocTamam = true;
      eskiKayitlar = [];
      dbKayitlari = dogrulama;
    }
  }

  // Kısmi migrasyonda iki kaynağı id üzerinden birleştir; hiçbir kayıt görünmez olmaz.
  const birlesik = new Map();
  for (const oge of [...dbKayitlari, ...eskiKayitlar]) birlesik.set(oge.id, oge);
  return [...birlesik.values()].sort((a, b) => Number(b.tarih || 0) - Number(a.tarih || 0));
}

async function albumeEkle(url, durum = null) {
  const kayit = {
    id: window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `kombin-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    url,
    tarih: Date.now(),
    durum: durumKopyala(durum || durumAnlik()),
  };
  if (await dbYaz("album", kayit)) {
    const tum = await albumOku();
    for (const eski of tum.slice(30)) await dbSil("album", eski.id);
    return kayit;
  }

  // Çok eski/özel tarayıcılarda küçük bir localStorage fallback'i koru; başarısızlığı gizleme.
  const eski = depodanJSON("lara_album", []);
  const liste = Array.isArray(eski) ? eski : [];
  liste.unshift(kayit);
  liste.splice(6);
  if (!depoyaJSON("lara_album", liste)) return null;
  albumGocTamam = false;
  return kayit;
}

function sonKayitGoster(url) {
  const kutu = $("#sonKayit");
  const img = $("#sonKayitImg");
  const indir = $("#sonKayitIndir");
  if (!kutu || !img || !indir) return;
  img.src = url;
  indir.href = url;
  indir.download = "leyla-kombin-" + new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-") + ".jpg";
  kutu.classList.remove("gizli");
  clearTimeout(sonKayitZaman);
  sonKayitZaman = setTimeout(() => kutu.classList.add("gizli"), 9000);
}

async function kombinKaydet() {
  const btn = $("#btnKaydet");
  if (btn && btn.disabled) return;
  if (btn) btn.disabled = true;
  bildir("Fotoğraf albüme kaydediliyor… ✨");
  try {
    const kare = await kombinResmi();
    const kayit = await albumeEkle(kare.url, kare.durum);
    if (!kayit) {
      bildir("Albüm kaydedilemedi; tarayıcı depolama alanını kontrol et");
      return;
    }
    sonKayitGoster(kare.url);
    SES.efekt("parla");
    konfetiPatlat();
    bildir("📸 Kombin albüme güvenle kaydedildi!");
  } catch (e) {
    bildir("Kombin oluşturulamadı; sahne görsellerini yenileyip tekrar dene");
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function albumAc() {
  const grid = $("#albumGrid");
  grid.replaceChildren(); // Güvenli temizleme
  const modal = $("#albumModal");
  modal.classList.remove("gizli");
  modal.setAttribute("aria-busy", "true");
  const yukleniyor = document.createElement("div");
  yukleniyor.className = "bos-not";
  yukleniyor.textContent = "Albüm açılıyor…";
  grid.appendChild(yukleniyor);

  const a = await albumOku();
  grid.replaceChildren();
  modal.removeAttribute("aria-busy");
  if (!a.length) {
    const notice = document.createElement("div");
    notice.className = "bos-not bos-durum";
    const bosIkon = document.createElement("span");
    bosIkon.className = "bos-ikon";
    bosIkon.appendChild(ikon("album"));
    notice.appendChild(bosIkon);
    const bosBaslik = document.createElement("strong");
    bosBaslik.textContent = "Albüm henüz boş";
    notice.appendChild(bosBaslik);
    const bosAlt = document.createElement("span");
    bosAlt.textContent = "Beğendiğin kombini Kaydet ile buraya ekle.";
    notice.appendChild(bosAlt);
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
      aIndir.setAttribute("aria-label", `Kombin ${i + 1} görselini indir`);
      aIndir.appendChild(ikon("indir"));
      d.appendChild(aIndir);

      if (oge.durum) {
        const duzenle = document.createElement("button");
        duzenle.type = "button";
        duzenle.className = "mini duzenle";
        duzenle.title = "Düzenlemeye devam et";
        duzenle.setAttribute("aria-label", `Kombin ${i + 1} üzerinde düzenlemeye devam et`);
        duzenle.appendChild(ikon("kalem"));
        duzenle.onclick = () => {
          durumYeniAdimUygula(oge.durum);
          modal.classList.add("gizli");
          bildir("Kombin yeniden düzenlemeye açıldı");
        };
        d.appendChild(duzenle);
      }

      const aSil = document.createElement("button");
      aSil.type = "button";
      aSil.className = "mini sil";
      aSil.title = "Sil";
      aSil.setAttribute("aria-label", `Kombin ${i + 1} kaydını sil`);
      aSil.appendChild(ikon("sil"));
      aSil.onclick = (e) => {
        e.preventDefault();
        albumSil(oge.id);
      };
      d.appendChild(aSil);

      grid.appendChild(d);
    });
  }
}

async function albumSil(id) {
  // Kısmi migration/fallback durumunda kayıt iki kaynakta da bulunabilir.
  // Her iki silme idempotent yapılır; bir kaynağın başarısı diğerini maskelemez.
  const dbHazir = Boolean(await yerelDbAc());
  const dbSilindi = !dbHazir || await dbSil("album", id);
  const a = depodanJSON("lara_album", []);
  const eskiListe = Array.isArray(a) ? a : [];
  const yeni = eskiListe.filter((x, i) => legacyAlbumId(x, i) !== id);
  const yereldeVardi = yeni.length !== eskiListe.length;
  const yerelSilindi = !yereldeVardi || depoyaJSON("lara_album", yeni);

  if (!dbSilindi || !yerelSilindi) {
    bildir("Kayıt silinemedi");
    return;
  }
  SES.efekt("cikar");
  await albumAc();
  const hedef = $("#albumGrid")?.querySelector("button, a[href]") || $("#albumModal [data-kapat]");
  hedef?.focus({ preventScroll: true });
}

/* =============================== DEFİLE & JÜRİ =============================== */
const PUANLANAN_SLOTLAR = ["elbiseler", "ozel", "ayakkabilar", "takilar", "taclar", "kanatlar"];
const DEFILE_GECMIS_ANAHTAR = "lara_defile_gecmis";

function kombinImzasi() {
  return [giyim.mankenler, ...DOLAP.slotlar.map((sl) => giyim[sl.id] || "-")].join("|");
}

/* Jüri puanı: tamlık + tema tutarlılığı + sahne uyumu. Aynı kombin tekrar
   puanlandığında yıldız verilmez, böylece düğmeye basarak yıldız biriktirilemez. */
function juriDegerlendir() {
  const sayac = new Map();
  const secililer = [];
  for (const slot of PUANLANAN_SLOTLAR) {
    const it = bul(slot, giyim[slot]);
    if (!ogeKullanilabilir(slot, it)) continue;
    secililer.push(slot);
    for (const e of etiketler(meta(slot, it.id), it.etiketler || [])) sayac.set(e, (sayac.get(e) || 0) + 1);
  }
  const sahne = bul("arkaplanlar", giyim.arkaplanlar);
  const sahneEtiketleri = ogeKullanilabilir("arkaplanlar", sahne)
    ? etiketler(meta("arkaplanlar", sahne.id), sahne.etiketler || [])
    : [];

  const sirali = [...sayac.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"));
  const [baskin, tekrar] = sirali[0] || [null, 0];
  const sahneUyumu = sahneEtiketleri.some((e) => sayac.has(e));

  let puan = 28;
  puan += Math.min(secililer.length, 5) * 9;
  puan += Math.max(0, Math.min(tekrar - 1, 3)) * 6;
  if (sahneUyumu) puan += 11;
  if (giyim.elbiseler && giyim.ayakkabilar) puan += 8;
  puan = clamp(Math.round(puan), 0, 100);

  const notlar = [];
  if (!giyim.elbiseler) notlar.push("Kombinin merkezinde bir kıyafet eksik.");
  else if (!giyim.ayakkabilar) notlar.push("Ayakkabı seçimi görünümü tamamlardı.");
  if (tekrar > 2) notlar.push(`“${baskin}” teması ${tekrar} parçada tekrar ediyor — güçlü bir çizgi.`);
  else if (secililer.length >= 3) notlar.push("Parçalar arasında daha net bir tema aranıyor.");
  if (sahneUyumu) notlar.push("Sahne seçimi kombinle aynı dili konuşuyor.");
  else if (sahneEtiketleri.length) notlar.push("Sahne kombinle bağ kurmuyor; başka bir fon dene.");
  if (!giyim.taclar && !giyim.takilar) notlar.push("Bir aksesuar dokunuşu puanı yükseltir.");

  const baslik = puan >= 92 ? "Kusursuz. Podyum senin."
    : puan >= 80 ? "Jüri ayakta alkışlıyor."
    : puan >= 68 ? "Çok güçlü bir görünüm."
    : puan >= 52 ? "İyi bir başlangıç."
    : "Kombin henüz tamamlanmamış.";

  const yildiz = puan >= 92 ? 3 : puan >= 80 ? 2 : puan >= 66 ? 1 : 0;
  return { puan, yildiz, baslik, notlar: notlar.slice(0, 3), imza: kombinImzasi() };
}

function defileOdulVer(sonuc) {
  if (!sonuc.yildiz) return 0;
  const ham = depodanJSON(DEFILE_GECMIS_ANAHTAR, []);
  const gecmis = Array.isArray(ham) ? ham.filter((x) => typeof x === "string") : [];
  if (gecmis.includes(sonuc.imza)) return 0;
  gecmis.unshift(sonuc.imza);
  depoyaJSON(DEFILE_GECMIS_ANAHTAR, gecmis.slice(0, 80));
  yildizEkle(sonuc.yildiz);
  return sonuc.yildiz;
}

function defileSonucGoster(sonuc, kazanilan) {
  const sayi = $("#defileSkorSayi");
  const yildizKap = $("#defileYildizlar");
  const yazi = $("#defileYazi");
  const notKap = $("#defileNotlar");
  if (yildizKap) yildizKap.textContent = "★".repeat(sonuc.yildiz) + "☆".repeat(3 - sonuc.yildiz);
  if (yazi) yazi.textContent = sonuc.baslik;
  const odulEl = $("#defileOdul");
  if (odulEl) {
    if (kazanilan) {
      odulEl.textContent = `+${kazanilan}★ kazandın`;
      odulEl.classList.remove("gizli", "solgun");
    } else if (sonuc.yildiz) {
      odulEl.textContent = "Bu kombin daha önce ödüllendirildi";
      odulEl.classList.remove("gizli");
      odulEl.classList.add("solgun");
    } else {
      odulEl.textContent = "66 puanın üstü yıldız kazandırır";
      odulEl.classList.remove("gizli");
      odulEl.classList.add("solgun");
    }
  }
  if (notKap) {
    notKap.replaceChildren();
    for (const n of sonuc.notlar) {
      const el = document.createElement("span");
      el.textContent = n;
      notKap.appendChild(el);
    }
  }
  if (!sayi) return;
  if (AZ_HAREKET) { sayi.textContent = String(sonuc.puan); return; }
  // Puanı saydırarak göster
  let simdi = 0;
  const adim = Math.max(1, Math.round(sonuc.puan / 26));
  sayi.textContent = "0";
  const zaman = setInterval(() => {
    simdi = Math.min(sonuc.puan, simdi + adim);
    sayi.textContent = String(simdi);
    if (simdi >= sonuc.puan) clearInterval(zaman);
  }, 28);
}

let defileHazirlaniyor = false;
let aktifDefileKaresi = null;

async function defileAc() {
  if (defileHazirlaniyor) return;
  defileHazirlaniyor = true;
  const btn = $("#btnDefile");
  if (btn) btn.disabled = true;
  aktifDefileKaresi = null;
  SES.efekt("parla");
  bildir("Defile hazırlanıyor… 🌟");
  try {
    const kare = await kombinResmi();
    aktifDefileKaresi = kare;
    const defileGorsel = $("#defileGorsel");
    defileGorsel.replaceChildren(); // Güvenli temizleme

    const img = document.createElement("img");
    img.src = kare.url;
    img.alt = "Defile Kombin";
    defileGorsel.appendChild(img);

    const modal = $("#defileModal");
    modal.dataset.kaydedildi = "0";
    modal.classList.remove("gizli");
    const kaydet = $("#defileKaydet");
    if (kaydet) {
      kaydet.disabled = false;
      btnYaziAyarla(kaydet, "Albüme Kaydet");
    }

    const sonuc = juriDegerlendir();
    const kazanilan = defileOdulVer(sonuc);
    defileSonucGoster(sonuc, kazanilan);

    SES.muzikDegistir("ap_podyum");
    SES.efekt(sonuc.yildiz ? "fanfar" : "parla");
    if (sonuc.yildiz) {
      konfetiPatlat();
      if (!AZ_HAREKET) {
        setTimeout(konfetiPatlat, 600);
        if (sonuc.yildiz > 1) setTimeout(konfetiPatlat, 1200);
      }
    }
  } catch (e) {
    bildir("Defile hazırlanamadı; sahne görsellerini yenileyip tekrar dene");
  } finally {
    defileHazirlaniyor = false;
    if (btn) btn.disabled = false;
  }
}

function defileKapat() {
  $("#defileModal").classList.add("gizli");
  aktifDefileKaresi = null;
  SES.muzikDegistir(giyim.arkaplanlar); // normal sahne müziği
}

/* =============================== DOLABI SIFIRLAMA =============================== */
async function sifirla() {
  if (!await onayAl("Kombini sıfırla", "Tüm seçimler varsayılana döner. Albümdeki kayıtlar silinmez.", "Sıfırla")) return;
  if (surprizZamanlayici) clearInterval(surprizZamanlayici);
  surprizZamanlayici = null;
  surprizCalisiyor = false;
  const surprizBtn = $("#btnSurpriz");
  if (surprizBtn) surprizBtn.disabled = false;
  Object.assign(giyim, VARSAYILAN_GIYIM);

  Object.assign(renkler, VARSAYILAN_RENKLER);

  arkaPlanOzel = null;
  arkaPlanOzelId = null;
  dolgunlukDurum[giyim.mankenler] = 0;
  SES.muzikDegistir("ap_balo");

  for (const p of stickerlar) {
    p.dugum.remove();
  }
  stickerlar = [];
  seciliSticker = null;

  for (const id of DOLAP.cizimSirasi) {
    katmanGuncelle(id, true);
  }
  sliderGuncelle();
  durumDegisti();
  gorevleriDenetle();
  kombinOzetGuncelle();

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
  if (dosya.size > 20 * 1024 * 1024) {
    bekleyenKategori = null;
    bildir("Fotoğraf en fazla 20 MB olabilir");
    return;
  }

  const kat = bekleyenKategori;
  bekleyenKategori = null;
  bildir("Fotoğraf cihazda hazırlanıyor… ⏳");

  try {
    const dataUrl = await kucult(dosya, 1200);
    const ad = dosya.name.replace(/\.[^.]+$/, "").trim().slice(0, 80) || "Fotoğraf";
    const oge = await yerelVarlikKaydet(kat, ad, dataUrl);
    (customVarliklar[kat] = customVarliklar[kat] || []).push(oge);
    if (kat === "arkaplanlar") {
      arkaPlanOzel = oge.url;
      arkaPlanOzelId = oge.id;
      katmanGuncelle("arkaplanlar", true);
      kombinOzetGuncelle();
      durumDegisti();
    } else {
      stickerEkle(oge.url, oge.id);
    }
    if (aktifSekme === "eslerim") urunleriGoster("eslerim");
    SES.efekt("tak");
    bildir(oge.kalici
      ? "🔒 Fotoğraf yalnızca bu cihazda saklandı"
      : "Fotoğraf bu oturum için eklendi; tarayıcı kalıcı depolamayı engelledi");
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
  if (AZ_HAREKET) return;
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
  if (AZ_HAREKET) return;
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

/* =============================== ONAY DİYALOĞU =============================== */
let onayCozucu = null;

function onayAl(baslik, metin, evetYazi = "Evet") {
  const modal = $("#onayModal");
  if (!modal) return Promise.resolve(window.confirm(metin || baslik));
  $("#onayBaslik").textContent = baslik;
  $("#onayMetin").textContent = metin || "";
  $("#onayEvet").textContent = evetYazi;
  modal.classList.remove("gizli");
  return new Promise((cozumle) => {
    onayCozucu = cozumle;
  });
}

function onayKapat(sonuc) {
  const modal = $("#onayModal");
  if (modal) modal.classList.add("gizli");
  const cozucu = onayCozucu;
  onayCozucu = null;
  if (cozucu) cozucu(sonuc);
}

function onayKur() {
  const modal = $("#onayModal");
  if (!modal) return;
  $("#onayEvet").onclick = () => onayKapat(true);
  $("#onayHayir").onclick = () => onayKapat(false);
  // Escape ile kapatıldığında da bekleyen söz çözülmelidir.
  new MutationObserver(() => {
    if (modal.classList.contains("gizli") && onayCozucu) onayKapat(false);
  }).observe(modal, { attributes: true, attributeFilter: ["class"] });
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

  // Durum ikon + rozet ile gösterilir; düğme içeriği hiç değiştirilmez ki
  // SVG ikon dili bozulmasın.
  const durumYaz = (btn, acik, acikYazi, kapaliYazi) => {
    btn.classList.toggle("kapali", !acik);
    btn.setAttribute("aria-checked", acik ? "true" : "false");
    btn.title = acik ? kapaliYazi : acikYazi;
    const rozet = btn.querySelector("[data-durum]");
    if (rozet) rozet.textContent = acik ? "Açık" : "Kapalı";
  };

  const muzikDurum = () => durumYaz(m, SES.muzikAcik, "Müziği aç", "Müziği kapat");
  const sesDurum = () => durumYaz(s, !SES.sessizMi, "Sesi aç", "Sesi kapat");

  m.onclick = () => {
    if (SES.muzikAcik) SES.muzikKapat();
    else SES.muzikAc();
    muzikDurum();
  };

  s.onclick = () => {
    SES.sessiz(!SES.sessizMi);
    sesDurum();
    muzikDurum();
  };

  muzikDurum();
  sesDurum();
}

/* Üst bardaki ikincil kontroller tek bir menüde toplanır: mobilde de
   masaüstünde de aynı yapı, aynı dokunma hedefi. */
function ustMenuKur() {
  const btn = $("#btnMenu"), menu = $("#ustMenu");
  if (!btn || !menu) return;

  const kapat = () => {
    if (menu.classList.contains("gizli")) return;
    menu.classList.add("gizli");
    btn.setAttribute("aria-expanded", "false");
  };

  const ac = () => {
    menu.classList.remove("gizli");
    btn.setAttribute("aria-expanded", "true");
    menu.querySelector("button")?.focus();
  };

  btn.onclick = (e) => {
    e.stopPropagation();
    if (menu.classList.contains("gizli")) ac(); else kapat();
    SES.efekt("dokun");
  };

  document.addEventListener("pointerdown", (e) => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) kapat();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || menu.classList.contains("gizli")) return;
    kapat();
    btn.focus();
  });

  // Menüden bir işlem seçilince menü kapanmalı; ses/müzik anahtarları açık kalır.
  menu.addEventListener("click", (e) => {
    const oge = e.target.closest(".menu-oge");
    if (oge && oge.getAttribute("role") !== "menuitemcheckbox") kapat();
  });

  // Klavyeyle menüden çıkıldığında açık kalmasın.
  menu.addEventListener("focusout", (e) => {
    const yeni = e.relatedTarget;
    if (yeni && (menu.contains(yeni) || btn.contains(yeni))) return;
    kapat();
  });

  menu.addEventListener("keydown", (e) => {
    if (!["ArrowDown", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const ogeler = [...menu.querySelectorAll(".menu-oge")];
    const i = ogeler.indexOf(document.activeElement);
    const yon = e.key === "ArrowDown" ? 1 : -1;
    ogeler[(Math.max(i, 0) + yon + ogeler.length) % ogeler.length]?.focus();
  });
}

/* =============================== ETKİLEŞİM VE BAĞLANTILAR =============================== */
const modalOdaklari = new WeakMap();

function acikModalBul() {
  const liste = [...document.querySelectorAll(".modal:not(.gizli), .defile:not(.gizli)")];
  return liste[liste.length - 1] || null;
}

function modalArkaPlanGuncelle() {
  const acik = Boolean(acikModalBul());
  for (const el of [$(".ust-bar"), $(".alan"), $("#sonKayit")]) {
    if (el && "inert" in el) el.inert = acik;
  }
}

function modalDegisti(modal) {
  const acik = !modal.classList.contains("gizli");
  modal.setAttribute("aria-hidden", acik ? "false" : "true");
  if (acik) {
    modalOdaklari.set(modal, document.activeElement);
    requestAnimationFrame(() => {
      const hedef = modal.querySelector("input:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])");
      (hedef || modal).focus({ preventScroll: true });
    });
  } else if (!acikModalBul()) {
    const onceki = modalOdaklari.get(modal);
    if (onceki && document.contains(onceki)) requestAnimationFrame(() => onceki.focus({ preventScroll: true }));
  }
  modalArkaPlanGuncelle();
}

function modalErisilebilirlikKur() {
  const modallar = document.querySelectorAll(".modal, .defile");
  const gozlemci = new MutationObserver((kayitlar) => {
    for (const kayit of kayitlar) modalDegisti(kayit.target);
  });
  modallar.forEach((modal) => {
    modal.setAttribute("aria-hidden", modal.classList.contains("gizli") ? "true" : "false");
    gozlemci.observe(modal, { attributes: true, attributeFilter: ["class"] });
  });

  document.addEventListener("keydown", (e) => {
    const modal = acikModalBul();
    if (!modal) return;
    if (e.key === "Escape") {
      e.preventDefault();
      if (modal.id === "defileModal") defileKapat();
      else modal.classList.add("gizli");
      return;
    }
    if (e.key !== "Tab") return;
    const odaklanabilir = [...modal.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])")]
      .filter((el) => el.getClientRects().length > 0);
    if (!odaklanabilir.length) {
      e.preventDefault();
      modal.focus();
      return;
    }
    const ilk = odaklanabilir[0], son = odaklanabilir[odaklanabilir.length - 1];
    if (e.shiftKey && document.activeElement === ilk) {
      e.preventDefault();
      son.focus();
    } else if (!e.shiftKey && document.activeElement === son) {
      e.preventDefault();
      ilk.focus();
    }
  });
}

function klavyeKisayollariKur() {
  document.addEventListener("keydown", (e) => {
    if (acikModalBul()) return;
    const formAlani = e.target.closest && e.target.closest("input, textarea, select, [contenteditable='true']");
    if (!formAlani && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) ileriAl(); else geriAl();
      return;
    }
    if (!formAlani && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
      e.preventDefault();
      ileriAl();
      return;
    }
    if (formAlani) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "/") {
      e.preventDefault();
      $("#urunArama")?.focus();
      return;
    }
    const kisayollar = {
      r: () => $("#btnSurpriz")?.click(),
      d: () => $("#btnDefile")?.click(),
      s: () => $("#btnKaydet")?.click(),
      a: () => $("#btnAlbum")?.click(),
      "?": () => $("#btnYardim")?.click(),
    };
    const is = kisayollar[e.key.toLocaleLowerCase("tr")] || kisayollar[e.key];
    if (is) {
      e.preventDefault();
      is();
    }
  });

  $("#sekmeler")?.addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    const sekmeler = [...document.querySelectorAll(".sekme")];
    const i = sekmeler.indexOf(document.activeElement);
    if (i < 0 || !sekmeler.length) return;
    e.preventDefault();
    let hedef = e.key === "Home" ? 0 : (e.key === "End" ? sekmeler.length - 1 : i + (e.key === "ArrowRight" ? 1 : -1));
    hedef = (hedef + sekmeler.length) % sekmeler.length;
    sekmeler[hedef].focus();
    sekmeler[hedef].click();
  });
}

function araclariBagla() {
  $("#btnSurpriz").onclick = surpriz;
  $("#btnDefile").onclick = defileAc;
  $("#btnKaydet").onclick = kombinKaydet;
  $("#btnAlbum").onclick = albumAc;
  $("#btnTemizle").onclick = sifirla;
  $("#btnGeri").onclick = geriAl;
  $("#btnIleri").onclick = ileriAl;
  $("#btnAktifGorev").onclick = () => sekmeyeGec("gorevler", { filtreSifirla: true });
  $("#defileKapat").onclick = defileKapat;

  const arama = $("#urunArama");
  if (arama) {
    arama.addEventListener("input", () => {
      panelArama = arama.value;
      urunleriGoster(aktifSekme);
    });
  }
  const filtreTemizle = $("#filtreTemizle");
  if (filtreTemizle) {
    filtreTemizle.onclick = () => {
      filtreyiSifirla();
      urunleriGoster(aktifSekme);
      SES.efekt("dokun");
    };
  }
  const sonraki = $("#btnSonraki");
  if (sonraki) sonraki.onclick = sonrakiSekme;
  const sonAlbum = $("#sonKayitAlbum");
  if (sonAlbum) sonAlbum.onclick = albumAc;

  const yardim = $("#btnYardim");
  if (yardim) {
    yardim.onclick = () => {
      $("#yardimModal")?.classList.remove("gizli");
      SES.efekt("dokun");
    };
  }
  onayKur();

  panelKulpKur();
  ustMenuKur();

  $("#defileKaydet").onclick = async () => {
    const modal = $("#defileModal");
    const kare = aktifDefileKaresi;
    const btn = $("#defileKaydet");
    if (modal.dataset.kaydedildi === "1" || btn.disabled) {
      bildir("Bu defile karesi zaten albümde");
      return;
    }
    if (kare) {
      btn.disabled = true;
      const kayit = await albumeEkle(kare.url, kare.durum);
      if (!kayit) {
        btn.disabled = false;
        bildir("Albüm kaydedilemedi; tarayıcı depolama alanını kontrol et");
        return;
      }
      modal.dataset.kaydedildi = "1";
      btnYaziAyarla(btn, "✓ Albümde");
      sonKayitGoster(kare.url);
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
  modalErisilebilirlikKur();
  klavyeKisayollariKur();
}

/* =============================== BAŞLAT =============================== */
async function basla() {
  await Promise.all([varliklariYukle(), gorselleriYukle(), metadataYukle()]);
  manifestiBirlestir(); // manifestteki yeni (PNG'li) parçaları dolaba ekle
  katmanlariKur();
  sekmeleriKur();
  const kayitliDurum = depodanJSON(DURUM_ANAHTAR, null);
  if (kayitliDurum) durumUygula(kayitliDurum, { kaydet: false });
  if (kombiniNormalize()) sekmeleriKur();
  for (const id of DOLAP.cizimSirasi) katmanGuncelle(id, false);
  sonDurum = durumKopyala(durumAnlik());
  dolgunlukUygula(); // seçili modelin dolgunluk değerini uygula
  urunleriGoster(aktifSekme);
  yildizGoster(false);
  sesButonlari();
  araclariBagla();
  sliderKur();
  kombinOzetGuncelle();
  stilAnaliziGuncelle();
  durumKaliciYaz();
  durumDugmeleriniGuncelle();
  SES.muzikDegistir(giyim.arkaplanlar);
  gorevleriDenetle();

  // İlk açılışta oyunun nasıl oynandığını bir kez göster.
  if (depodanMetin("lara_yardim_gorundu", null) !== "1") {
    try { localStorage.setItem("lara_yardim_gorundu", "1"); } catch (e) {}
    $("#yardimModal")?.classList.remove("gizli");
  }
}

// Yönetim paneli (admin.js) bir görsel ekleyince/silince gardırobu tazelemek için
window.dolabiYenile = async function () {
  await gorselleriYukle();
  await metadataYukle();
  manifestiBirlestir();
  sekmeleriKur();
  durumUygula(durumAnlik());
};

basla();
