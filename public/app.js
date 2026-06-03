"use strict";

// ===== Kategori bilgisi =====
const KATEGORI = {
  karakterler: { ad: "Karakter",  emoji: "🧍", boyut: 0.55, tip: "parca" },
  kiyafetler:  { ad: "Kıyafet",   emoji: "👗", boyut: 0.46, tip: "parca" },
  saclar:      { ad: "Saç",       emoji: "💇", boyut: 0.34, tip: "parca" },
  aksesuarlar: { ad: "Aksesuar",  emoji: "👜", boyut: 0.22, tip: "parca" },
  arkaplanlar: { ad: "Arka Plan", emoji: "🏰", boyut: 1.0,  tip: "arkaplan" },
};
const SIRA = ["karakterler", "kiyafetler", "saclar", "aksesuarlar", "arkaplanlar"];

// ===== Durum =====
let varliklar = {};
let aktifKategori = "kiyafetler";
let parcalar = [];          // {id, src, xRel, yRel, wRel, rot, oran, dugum}
let seciliId = null;
let arkaplanSrc = null;
let sayac = 1;
let bekleyenKategori = null;
const resimCache = {};

// ===== Kısayollar =====
const $ = (s) => document.querySelector(s);
const sahne = $("#sahne");
const arkaplanEl = $("#arkaplan");

// ===== Başlangıç =====
async function basla() {
  await varliklariYukle();
  sekmeleriKur();
  kategoriGoster(aktifKategori);
  if (varliklar.karakterler && varliklar.karakterler.length) {
    parcaEkle(varliklar.karakterler[0].url, "karakterler");
  }
  araclariBagla();
}

async function varliklariYukle() {
  try {
    const r = await fetch("/api/assets");
    varliklar = await r.json();
  } catch (e) {
    varliklar = {};
    bildir("Sunucuya bağlanılamadı 😕");
  }
}

// ===== Sekmeler ve ürün ızgarası =====
function sekmeleriKur() {
  const kap = $("#sekmeler");
  kap.innerHTML = "";
  for (const kat of SIRA) {
    const b = document.createElement("button");
    b.className = "sekme" + (kat === aktifKategori ? " aktif" : "");
    b.textContent = KATEGORI[kat].emoji + " " + KATEGORI[kat].ad;
    b.onclick = () => {
      aktifKategori = kat;
      document.querySelectorAll(".sekme").forEach((s) => s.classList.remove("aktif"));
      b.classList.add("aktif");
      kategoriGoster(kat);
    };
    kap.appendChild(b);
  }
}

function kategoriGoster(kat) {
  const kap = $("#urunler");
  kap.innerHTML = "";
  const liste = varliklar[kat] || [];
  if (!liste.length) {
    const bos = document.createElement("div");
    bos.className = "album-bos";
    bos.textContent = "Bu rafta henüz bir şey yok. ➕ Fotoğraf Ekle ile ekleyebilirsin!";
    kap.appendChild(bos);
    return;
  }
  for (const oge of liste) {
    const d = document.createElement("div");
    d.className = "urun";
    const img = document.createElement("img");
    img.src = oge.url;
    img.alt = oge.ad;
    d.appendChild(img);
    d.onclick = () => {
      if (KATEGORI[kat].tip === "arkaplan") arkaplanSec(oge.url);
      else parcaEkle(oge.url, kat);
    };
    kap.appendChild(d);
  }
}

// ===== Arka plan =====
function arkaplanSec(src) {
  arkaplanSrc = src;
  arkaplanEl.style.backgroundImage = `url("${src}")`;
  bildir("Arka plan değişti 🏰");
}

// ===== Sahneye parça ekleme =====
function resimYukle(src) {
  return new Promise((cz, rd) => {
    if (resimCache[src] && resimCache[src].complete) return cz(resimCache[src]);
    const img = new Image();
    img.onload = () => cz(img);
    img.onerror = rd;
    img.src = src;
    resimCache[src] = img;
  });
}

async function parcaEkle(src, kat) {
  const img = await resimYukle(src);
  const oran = img.naturalHeight / img.naturalWidth || 1.3;
  const p = {
    id: sayac++,
    src,
    xRel: 0.5,
    yRel: kat === "karakterler" ? 0.5 : 0.45,
    wRel: KATEGORI[kat] ? KATEGORI[kat].boyut : 0.4,
    rot: 0,
    oran,
    dugum: null,
  };
  parcalar.push(p);
  dugumOlustur(p);
  sec(p.id);
  bildir(KATEGORI[kat] ? KATEGORI[kat].emoji + " eklendi" : "Eklendi");
}

function dugumOlustur(p) {
  const d = document.createElement("div");
  d.className = "parca";
  d.dataset.id = p.id;

  const img = document.createElement("img");
  img.src = p.src;
  d.appendChild(img);

  const k = document.createElement("div");
  k.className = "kontrol";
  k.innerHTML =
    '<div class="secim-cercevesi"></div>' +
    '<div class="tutamac t-dondur">⟳</div>' +
    '<div class="tutamac t-sil">✕</div>' +
    '<div class="tutamac t-boyut">⤡</div>';
  d.appendChild(k);

  p.dugum = d;
  sahne.appendChild(d);
  stilGuncelle(p);

  d.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".tutamac")) return;
    e.preventDefault();
    sec(p.id);
    tasimaBasla(e, p);
  });
  k.querySelector(".t-sil").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    parcaSil(p);
  });
  k.querySelector(".t-boyut").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    boyutBasla(e, p);
  });
  k.querySelector(".t-dondur").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dondurBasla(e, p);
  });
}

function stilGuncelle(p) {
  const d = p.dugum;
  d.style.left = p.xRel * 100 + "%";
  d.style.top = p.yRel * 100 + "%";
  d.style.width = p.wRel * 100 + "%";
  d.style.transform = `translate(-50%, -50%) rotate(${p.rot}deg)`;
}

function sec(id) {
  seciliId = id;
  for (const p of parcalar) p.dugum.classList.toggle("secili", p.id === id);
  const p = parcalar.find((x) => x.id === id);
  if (p) oneGetir(p);
}

function oneGetir(p) {
  const i = parcalar.indexOf(p);
  if (i >= 0) { parcalar.splice(i, 1); parcalar.push(p); }
  sahne.appendChild(p.dugum);
}

function parcaSil(p) {
  p.dugum.remove();
  parcalar = parcalar.filter((x) => x !== p);
  if (seciliId === p.id) seciliId = null;
}

// ===== Hareketler (taşı / boyutlandır / döndür) =====
function sahneKutu() { return sahne.getBoundingClientRect(); }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function tasimaBasla(e, p) {
  const r = sahneKutu();
  const bas = { x: e.clientX, y: e.clientY, xRel: p.xRel, yRel: p.yRel };
  function hareket(ev) {
    p.xRel = clamp(bas.xRel + (ev.clientX - bas.x) / r.width, 0, 1);
    p.yRel = clamp(bas.yRel + (ev.clientY - bas.y) / r.height, 0, 1);
    stilGuncelle(p);
  }
  bitir(hareket);
}

function boyutBasla(e, p) {
  const r = sahneKutu();
  function hareket(ev) {
    const cx = r.left + p.xRel * r.width;
    const cy = r.top + p.yRel * r.height;
    const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy);
    const wPx = (2 * dist) / Math.sqrt(1 + p.oran * p.oran);
    p.wRel = clamp(wPx / r.width, 0.05, 2.2);
    stilGuncelle(p);
  }
  bitir(hareket);
}

function dondurBasla(e, p) {
  const r = sahneKutu();
  function hareket(ev) {
    const cx = r.left + p.xRel * r.width;
    const cy = r.top + p.yRel * r.height;
    p.rot = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90;
    stilGuncelle(p);
  }
  bitir(hareket);
}

function bitir(hareket) {
  function up() {
    window.removeEventListener("pointermove", hareket);
    window.removeEventListener("pointerup", up);
  }
  window.addEventListener("pointermove", hareket);
  window.addEventListener("pointerup", up);
}

// Boş sahneye dokununca seçimi kaldır
sahne.addEventListener("pointerdown", (e) => {
  if (e.target === sahne || e.target === arkaplanEl) {
    seciliId = null;
    for (const p of parcalar) p.dugum.classList.remove("secili");
  }
});

// ===== Araç butonları =====
function araclariBagla() {
  $("#btnTemizle").onclick = temizle;
  $("#btnKaydet").onclick = kombinKaydet;
  $("#btnAlbum").onclick = albumAc;
  $("#btnFoto").onclick = () => $("#fotoModal").classList.remove("gizli");

  document.querySelectorAll("[data-kapat]").forEach((b) => {
    b.onclick = () => b.closest(".modal").classList.add("gizli");
  });
  document.querySelectorAll(".secim").forEach((b) => {
    b.onclick = () => {
      bekleyenKategori = b.dataset.kat;
      $("#fotoModal").classList.add("gizli");
      $("#dosyaGirisi").click();
    };
  });
  $("#dosyaGirisi").addEventListener("change", dosyaSecildi);
}

function temizle() {
  if (!parcalar.length) return;
  if (!confirm("Tüm kıyafetleri çıkaralım mı?")) return;
  for (const p of parcalar) p.dugum.remove();
  parcalar = [];
  seciliId = null;
  bildir("Sahne temizlendi 🧹");
}

// ===== Fotoğraf ekleme (kamera/galeri) =====
async function dosyaSecildi(e) {
  const dosya = e.target.files[0];
  e.target.value = "";
  if (!dosya || !bekleyenKategori) return;
  const kat = bekleyenKategori;
  bekleyenKategori = null;
  bildir("Fotoğraf hazırlanıyor… ⏳");
  try {
    const dataUrl = await kucult(dosya, 1200);
    const r = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: kat, name: dosya.name.replace(/\.[^.]+$/, ""), dataUrl }),
    });
    const sonuc = await r.json();
    if (sonuc.url) {
      (varliklar[kat] = varliklar[kat] || []).push({ ad: sonuc.ad, url: sonuc.url });
      if (aktifKategori === kat) kategoriGoster(kat);
      if (KATEGORI[kat].tip === "arkaplan") arkaplanSec(sonuc.url);
      else parcaEkle(sonuc.url, kat);
      bildir("Fotoğraf eklendi! 🎉");
    } else {
      bildir("Eklenemedi: " + (sonuc.hata || "bilinmeyen hata"));
    }
  } catch (err) {
    bildir("Fotoğraf eklenemedi 😕");
  }
}

// Resmi tarayıcıda küçült (yükleme hızlı olsun, dosya küçük olsun)
function kucult(dosya, maxKenar) {
  return new Promise((cz, rd) => {
    const okuyucu = new FileReader();
    okuyucu.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        const olcek = Math.min(1, maxKenar / Math.max(w, h));
        w = Math.round(w * olcek);
        h = Math.round(h * olcek);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        const png = dosya.type === "image/png";
        cz(c.toDataURL(png ? "image/png" : "image/jpeg", 0.9));
      };
      img.onerror = rd;
      img.src = okuyucu.result;
    };
    okuyucu.onerror = rd;
    okuyucu.readAsDataURL(dosya);
  });
}

// ===== Kombin kaydetme (sahneyi resme çevir) =====
async function kombinKaydet() {
  const W = 900, H = 1200;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");

  // arka plan
  if (arkaplanSrc) {
    const bg = await resimYukle(arkaplanSrc);
    const olcek = Math.max(W / bg.naturalWidth, H / bg.naturalHeight);
    const bw = bg.naturalWidth * olcek, bh = bg.naturalHeight * olcek;
    ctx.drawImage(bg, (W - bw) / 2, (H - bh) / 2, bw, bh);
  } else {
    ctx.fillStyle = "#fde9f3";
    ctx.fillRect(0, 0, W, H);
  }

  // parçalar (arkadan öne)
  for (const p of parcalar) {
    try {
      const img = await resimYukle(p.src);
      const wPx = p.wRel * W;
      const hPx = wPx * p.oran;
      ctx.save();
      ctx.translate(p.xRel * W, p.yRel * H);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.drawImage(img, -wPx / 2, -hPx / 2, wPx, hPx);
      ctx.restore();
    } catch (e) { /* atla */ }
  }

  const url = c.toDataURL("image/jpeg", 0.85);
  albumeEkle(url);
  bildir("Kombin albüme kaydedildi! 💾✨");
}

// ===== Albüm (tarayıcı hafızasında) =====
function albumOku() {
  try { return JSON.parse(localStorage.getItem("lara_album") || "[]"); }
  catch (e) { return []; }
}
function albumeEkle(url) {
  const a = albumOku();
  a.unshift({ url, tarih: Date.now() });
  while (a.length > 30) a.pop();
  try { localStorage.setItem("lara_album", JSON.stringify(a)); }
  catch (e) { bildir("Albüm dolu, eski kombinleri sil 🗑️"); }
}
function albumAc() {
  const grid = $("#albumGrid");
  grid.innerHTML = "";
  const a = albumOku();
  if (!a.length) {
    grid.innerHTML = '<div class="album-bos">Henüz kombin kaydetmedin. 💾 ile kaydet!</div>';
  } else {
    a.forEach((oge, i) => {
      const d = document.createElement("div");
      d.className = "album-oge";
      const img = document.createElement("img");
      img.src = oge.url;
      const indir = document.createElement("a");
      indir.className = "indir";
      indir.textContent = "⬇️";
      indir.href = oge.url;
      indir.download = "lara-kombin-" + (i + 1) + ".jpg";
      const sil = document.createElement("a");
      sil.className = "indir";
      sil.style.left = "6px"; sil.style.right = "auto";
      sil.textContent = "🗑️";
      sil.href = "#";
      sil.onclick = (e) => { e.preventDefault(); albumSil(i); };
      d.appendChild(img); d.appendChild(indir); d.appendChild(sil);
      grid.appendChild(d);
    });
  }
  $("#albumModal").classList.remove("gizli");
}
function albumSil(i) {
  const a = albumOku();
  a.splice(i, 1);
  localStorage.setItem("lara_album", JSON.stringify(a));
  albumAc();
}

// ===== Bildirim =====
let bildirimZaman = null;
function bildir(mesaj) {
  const b = $("#bildirim");
  b.textContent = mesaj;
  b.classList.remove("gizli");
  clearTimeout(bildirimZaman);
  bildirimZaman = setTimeout(() => b.classList.add("gizli"), 2200);
}

// Başlat
basla();
