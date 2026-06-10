"use strict";
/*
  Yönetim (admin) paneli — gardıroba kolayca gerçekçi PNG ekleme/silme.
  Şifre ile korunur (sunucudaki LARA_ADMIN, varsayılan "lara2018").
  Yükleme Node sunucusu gerektirir; production lara-web konteyneri de aynı API'yi sunar.
*/
(function () {
  const $ = (s) => document.querySelector(s);
  const ON = {
    modeller: "m_", elbiseler: "elb_", ayakkabilar: "ayk_", taclar: "tac_",
    takilar: "kly_", kanatlar: "kanat_", asalar: "asa_", arkaplanlar: "ap_",
    ozel: "oz_",
  };
  const ETIKET = {
    modeller: "🧍 Model", elbiseler: "👗 Elbise", ayakkabilar: "👠 Ayakkabı",
    taclar: "👑 Taç/Şapka", takilar: "💎 Kolye", kanatlar: "🦋 Kanat",
    asalar: "✨ Asa", arkaplanlar: "🌅 Arka plan", ozel: "🖤 Özel",
  };

  let parola = null;       // başarılı girişten sonra saklanır
  let seciliDosya = null;  // doğrulanmış dataURL + bilgiler

  /* ---------- yardımcılar ---------- */
  function dosyaOku(file) {
    return new Promise((ok, hata) => {
      const r = new FileReader();
      r.onload = () => ok(r.result);
      r.onerror = hata;
      r.readAsDataURL(file);
    });
  }
  function resimYap(src) {
    return new Promise((ok, hata) => {
      const im = new Image();
      im.onload = () => ok(im);
      im.onerror = hata;
      im.src = src;
    });
  }
  function saydamlikVar(img) {
    try {
      const c = document.createElement("canvas");
      c.width = 60; c.height = 80;
      const x = c.getContext("2d");
      x.drawImage(img, 0, 0, 60, 80);
      const d = x.getImageData(0, 0, 60, 80).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] < 200) return true;
      return false;
    } catch (e) { return true; } // kontrol edilemezse engelleme
  }
  function koselerSaydam(img) {
    try {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const x = c.getContext("2d");
      x.drawImage(img, 0, 0);
      const pts = [[0, 0], [c.width - 1, 0], [0, c.height - 1], [c.width - 1, c.height - 1]];
      return pts.every(([px, py]) => x.getImageData(px, py, 1, 1).data[3] < 8);
    } catch (e) { return false; }
  }
  function koselerOpak(img) {
    try {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const x = c.getContext("2d");
      x.drawImage(img, 0, 0);
      const pts = [[0, 0], [c.width - 1, 0], [0, c.height - 1], [c.width - 1, c.height - 1]];
      return pts.every(([px, py]) => x.getImageData(px, py, 1, 1).data[3] > 247);
    } catch (e) { return false; }
  }

  async function api(yol, govde) {
    const r = await fetch(yol, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(govde),
    });
    if (!r.ok && r.status !== 401 && r.status !== 400) {
      throw new Error("yok"); // 404 vb → backend yok/eski konteyner
    }
    return r.json();
  }

  /* ---------- modal aç/kapat ---------- */
  function ac() {
    $("#yonetimModal").classList.remove("gizli");
    if (parola) yenileListe();
  }
  $("#btnYonetim").addEventListener("click", ac);

  /* ---------- giriş ---------- */
  $("#yonGirisBtn").addEventListener("click", giris);
  $("#yonParola").addEventListener("keydown", (e) => { if (e.key === "Enter") giris(); });

  async function giris() {
    const p = $("#yonParola").value.trim();
    const hata = $("#yonGirisHata");
    hata.classList.add("gizli");
    if (!p) return;
    try {
      const sonuc = await api("/api/admin/giris", { parola: p });
      if (sonuc.ok) {
        parola = p;
        $("#yonGiris").classList.add("gizli");
        $("#yonPanel").classList.remove("gizli");
        slotDegisti();
        yenileListe();
      } else {
        hata.textContent = "Şifre yanlış.";
        hata.classList.remove("gizli");
      }
    } catch (e) {
      hata.textContent = "Yükleme için Node sunucusu gerekir. Yerelde http://<bilgisayar-ip>:8080, yayında lara-web konteyneri kullanılmalıdır.";
      hata.classList.remove("gizli");
    }
  }

  /* ---------- form ---------- */
  $("#yonSlot").addEventListener("change", slotDegisti);
  $("#yonId").addEventListener("input", promptTemizle);
  $("#yonPromptDesc").addEventListener("input", promptTemizle);
  function slotDegisti() {
    const slot = $("#yonSlot").value;
    const id = $("#yonId");
    // id boş ya da bir önekse, yeni öneki koy
    if (!id.value || /^[a-z]+_$/.test(id.value)) id.value = ON[slot] || "";
    promptTemizle();
    yenileListe();
    dosyaKontrol(); // arka plan/şeffaflık beklentisi değişebilir
  }

  function promptTemizle() {
    const out = $("#yonPromptCikti");
    const copy = $("#yonPromptKopyalaBtn");
    if (!out || !copy) return;
    out.value = "";
    out.classList.add("gizli");
    copy.disabled = true;
  }

  $("#yonPromptBtn").addEventListener("click", promptUret);
  $("#yonPromptKopyalaBtn").addEventListener("click", promptKopyala);

  async function promptUret() {
    const sonuc = $("#yonSonuc");
    const slot = $("#yonSlot").value;
    const id = ($("#yonId").value || "").toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const description = ($("#yonPromptDesc").value || "").trim();
    if (!id || /_$/.test(id) && id.length <= (ON[slot] || "").length) {
      sonuc.textContent = "Prompt için geçerli bir id gir.";
      sonuc.className = "yon-sonuc kotu";
      return;
    }
    sonuc.textContent = "Prompt üretiliyor…";
    sonuc.className = "yon-sonuc";
    try {
      const r = await api("/api/admin/prompt", { parola, slot, id, description });
      if (!r.ok) {
        sonuc.textContent = "Prompt hatası: " + (r.hata || "bilinmiyor");
        sonuc.className = "yon-sonuc kotu";
        return;
      }
      $("#yonPromptCikti").value = r.prompt || "";
      $("#yonPromptCikti").classList.remove("gizli");
      $("#yonPromptKopyalaBtn").disabled = !r.prompt;
      sonuc.textContent = "Prompt hazır.";
      sonuc.className = "yon-sonuc iyi";
    } catch (e) {
      sonuc.textContent = "Prompt endpointine ulaşılamadı.";
      sonuc.className = "yon-sonuc kotu";
    }
  }

  async function promptKopyala() {
    const out = $("#yonPromptCikti");
    if (!out || !out.value) return;
    try {
      await navigator.clipboard.writeText(out.value);
      $("#yonSonuc").textContent = "Prompt kopyalandı.";
      $("#yonSonuc").className = "yon-sonuc iyi";
    } catch (e) {
      out.select();
      $("#yonSonuc").textContent = "Kopyalama engellendi; metin seçildi.";
      $("#yonSonuc").className = "yon-sonuc";
    }
  }

  $("#yonDosya").addEventListener("change", dosyaKontrol);
  async function dosyaKontrol() {
    seciliDosya = null;
    const kutu = $("#yonKontrol");
    const onz = $("#yonOnizleme");
    const btn = $("#yonYukleBtn");
    btn.disabled = true;
    onz.classList.add("gizli");
    kutu.innerHTML = "";
    const f = $("#yonDosya").files[0];
    if (!f) return;

    const tip = f.type === "image/png" ? "png" : null;
    const satir = [];
    const ekle = (ok, txt) => satir.push(`<div class="${ok ? 'iyi' : 'kotu'}">${ok ? '✓' : '✗'} ${txt}</div>`);

    if (!tip) { ekle(false, "Dosya PNG olmalı"); kutu.innerHTML = satir.join(""); return; }
    ekle(true, "Tür: " + tip.toUpperCase());

    const dataUrl = await dosyaOku(f);
    let img;
    try { img = await resimYap(dataUrl); } catch (e) { ekle(false, "Görsel okunamadı"); kutu.innerHTML = satir.join(""); return; }

    const w = img.naturalWidth, h = img.naturalHeight;
    const boyutTamam = w === 1024 && h === 1365;
    ekle(boyutTamam, `Boyut: ${w}×${h} ${boyutTamam ? "(1024×1365 ✔)" : "→ tam 1024×1365 olmalı"}`);

    const slot = $("#yonSlot").value;
    let alphaTamam = true;
    if (slot === "arkaplanlar") {
      alphaTamam = koselerOpak(img);
      ekle(alphaTamam, alphaTamam ? "Arka plan köşeleri opak" : "Arka plan tam ekran/opak olmalı");
    } else {
      const saydam = saydamlikVar(img);
      const kose = koselerSaydam(img);
      alphaTamam = saydam && kose;
      ekle(saydam, saydam ? "Alpha/şeffaflık var" : "Alpha/şeffaflık yok gibi");
      ekle(kose, kose ? "Dört köşe tamamen şeffaf" : "Parça dışı şeffaf değil; dört köşe boş olmalı");
    }

    kutu.innerHTML = satir.join("");
    $("#yonOnizlemeImg").src = dataUrl;
    onz.classList.remove("gizli");

    // Yükleme için zorunlu: PNG + tam boyut + slot alpha kuralı
    if (tip && boyutTamam && alphaTamam) { seciliDosya = { dataUrl, tip }; btn.disabled = false; }
  }

  /* ---------- yükle ---------- */
  $("#yonYukleBtn").addEventListener("click", yukle);
  async function yukle() {
    const sonuc = $("#yonSonuc");
    const slot = $("#yonSlot").value;
    let id = ($("#yonId").value || "").toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!id || /_$/.test(id) && id.length <= (ON[slot] || "").length) {
      sonuc.textContent = "Geçerli bir dosya adı (id) gir."; sonuc.className = "yon-sonuc kotu"; return;
    }
    if (!seciliDosya) return;
    sonuc.textContent = "Yükleniyor…"; sonuc.className = "yon-sonuc";
    try {
      const r = await api("/api/admin/yukle", { parola, slot, id, dataUrl: seciliDosya.dataUrl });
      if (r.ok) {
        sonuc.textContent = "✅ Eklendi: " + slot + "/" + r.id;
        sonuc.className = "yon-sonuc iyi";
        $("#yonDosya").value = ""; seciliDosya = null;
        $("#yonKontrol").innerHTML = ""; $("#yonOnizleme").classList.add("gizli");
        $("#yonYukleBtn").disabled = true;
        await yenileListe();
        if (window.dolabiYenile) await window.dolabiYenile();
      } else {
        sonuc.textContent = "Hata: " + (r.hata || "bilinmiyor"); sonuc.className = "yon-sonuc kotu";
      }
    } catch (e) {
      sonuc.textContent = "Sunucuya ulaşılamadı (yerel sunucu çalışıyor mu?)."; sonuc.className = "yon-sonuc kotu";
    }
  }

  /* ---------- mevcut görseller + sil ---------- */
  async function yenileListe() {
    const kap = $("#yonListe");
    if (!kap) return;
    kap.innerHTML = "Yükleniyor…";
    let harita = {};
    try {
      const r = await fetch("/api/gorseller", { cache: "no-store" });
      if (r.ok) harita = await r.json();
      else { const r2 = await fetch("/assets/gorseller.json", { cache: "no-store" }); if (r2.ok) harita = await r2.json(); }
    } catch (e) {}
    const slot = $("#yonSlot").value;
    const oge = harita[slot] || {};
    const idler = Object.keys(oge).sort();
    kap.innerHTML = "";
    if (!idler.length) { kap.innerHTML = `<div class="yon-bos">Bu kategoride henüz görsel yok.</div>`; return; }
    for (const id of idler) {
      const d = document.createElement("div");
      d.className = "yon-oge";
      const im = document.createElement("img");
      im.src = oge[id]; im.alt = id; im.loading = "lazy";
      const ad = document.createElement("div"); ad.className = "yon-oge-ad"; ad.textContent = id;
      const sil = document.createElement("button"); sil.className = "yon-sil"; sil.textContent = "🗑️"; sil.title = "Sil";
      sil.onclick = () => silOge(slot, id);
      d.appendChild(im); d.appendChild(ad); d.appendChild(sil);
      kap.appendChild(d);
    }
  }

  async function silOge(slot, id) {
    if (!confirm(`"${slot}/${id}" silinsin mi?`)) return;
    try {
      const r = await api("/api/admin/sil", { parola, slot, id });
      if (r.ok) {
        await yenileListe();
        if (window.dolabiYenile) await window.dolabiYenile();
      } else {
        alert("Silinemedi: " + (r.hata || ""));
      }
    } catch (e) { alert("Sunucuya ulaşılamadı."); }
  }
})();
