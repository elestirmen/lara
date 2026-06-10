"use strict";
/*
  Leyla Stil Stüdyosu — Ses Motoru
  ------------------------------------
  Hiç ses dosyası gerektirmez: tüm efektler WebAudio ile anlık üretilir.
  - SES.efekt("dokun" | "tak" | "cikar" | "parla" | "fanfar" | "hata" | "yildiz")
  - SES.muzikAc() / muzikKapat()  → yumuşak, döngülü tatlı bir melodi
  - SES.sessiz(true/false)        → tüm sesleri aç/kapat
*/
const SES = (() => {
  let ctx = null;
  let anaKazanc = null;
  let sessizMi = false;
  let muzikCalisiyor = false;
  let muzikZaman = null;

  function baslat() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    anaKazanc = ctx.createGain();
    anaKazanc.gain.value = sessizMi ? 0 : 0.9;
    anaKazanc.connect(ctx.destination);
  }
  function uyandir() {
    if (!ctx) baslat();
    if (ctx && ctx.state === "suspended") ctx.resume();
  }

  // Tek bir nota çal
  function nota(frek, baslangic, sure, tip = "sine", ses = 0.2) {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = tip;
    o.frequency.value = frek;
    const t = ctx.currentTime + baslangic;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(ses, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    o.connect(g);
    g.connect(anaKazanc);
    o.start(t);
    o.stop(t + sure + 0.05);
  }

  // Nota adı → frekans
  const NOTA = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392.0, A: 440.0, B: 493.88,
                 C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77, C6: 1046.5 };

  function efekt(ad) {
    uyandir();
    if (!ctx || sessizMi) return;
    switch (ad) {
      case "dokun":
        nota(660, 0, 0.09, "triangle", 0.16); break;
      case "tak": // giysi giydirme — yukarı çıkan tatlı arpej
        nota(NOTA.E5, 0, 0.12, "triangle", 0.18);
        nota(NOTA.G5, 0.06, 0.14, "triangle", 0.18);
        nota(NOTA.C6, 0.12, 0.2, "triangle", 0.18); break;
      case "cikar":
        nota(NOTA.G, 0, 0.1, "triangle", 0.14);
        nota(NOTA.E, 0.06, 0.14, "triangle", 0.14); break;
      case "parla": // pırıltı
        nota(1200, 0, 0.06, "sine", 0.12);
        nota(1700, 0.05, 0.08, "sine", 0.1);
        nota(2300, 0.1, 0.1, "sine", 0.08); break;
      case "yildiz": // görev/ödül
        ["C5", "E5", "G5", "C6"].forEach((n, i) => nota(NOTA[n], i * 0.08, 0.22, "triangle", 0.2)); break;
      case "fanfar": // defile / kutlama
        [["C5",0],["E5",0.12],["G5",0.24],["C6",0.36],["G5",0.5],["C6",0.62]].forEach(([n,t]) => {
          nota(NOTA[n], t, 0.35, "triangle", 0.22);
          nota(NOTA[n] / 2, t, 0.35, "sine", 0.1);
        }); break;
      case "hata":
        nota(220, 0, 0.18, "sawtooth", 0.12);
        nota(165, 0.1, 0.22, "sawtooth", 0.12); break;
      case "makyaj": // şirin makyaj pufu sesi
        nota(880, 0, 0.06, "sine", 0.1);
        nota(1100, 0.04, 0.06, "sine", 0.1);
        nota(1320, 0.08, 0.08, "sine", 0.08); break;
      case "buyu": // sihirli değnek sesi
        for (let i = 0; i < 8; i++) {
          nota(500 + i * 120, i * 0.04, 0.14, "triangle", 0.08);
        }
        break;
    }
  }

  // --- Tematik Arka Plan Melodileri ---
  const MELODILER = {
    ap_balo: {
      notalar: ["C5", "E5", "G5", "C5", "F5", "A5", "D5", "F5", "A5", "G5", "B5", "D6"],
      hiz: 450, sure: 0.50, tip: "triangle", ses: 0.08
    },
    ap_bahce: {
      notalar: ["C5", "D5", "E5", "G5", "A5", "G5", "E5", "D5"],
      hiz: 320, sure: 0.35, tip: "sine", ses: 0.09
    },
    ap_buz: {
      notalar: ["C6", "G5", "A5", "E5", "F5", "C5", "D5", "G5"],
      hiz: 420, sure: 0.50, tip: "sine", ses: 0.07
    },
    ap_sahil: {
      notalar: ["C5", "E5", "G5", "E5", "F5", "A5", "C6", "A5"],
      hiz: 380, sure: 0.40, tip: "triangle", ses: 0.08
    },
    ap_gece: {
      notalar: ["E5", "B4", "C5", "A4", "F5", "C5", "D5", "B4"],
      hiz: 550, sure: 0.60, tip: "sine", ses: 0.06
    },
    ap_defile: {
      notalar: ["A5", "C6", "E6", "C6", "G5", "B5", "D6", "B5"],
      hiz: 220, sure: 0.25, tip: "triangle", ses: 0.08
    },
    varsayilan: {
      notalar: ["E5", "G5", "A5", "G5", "E5", "C5", "D5", "E5", "D5", "C5", "D5", "E5", "G5", "E5", "C5", "D5"],
      hiz: 360, sure: 0.42, tip: "triangle", ses: 0.09
    }
  };

  let aktifMelodi = "varsayilan";
  let mAdim = 0;

  function muzikAdimi() {
    if (!muzikCalisiyor || !ctx) return;
    const mel = MELODILER[aktifMelodi] || MELODILER["varsayilan"];
    const n = mel.notalar[mAdim % mel.notalar.length];
    nota(NOTA[n], 0, mel.sure, mel.tip, mel.ses);
    if (mAdim % 4 === 0) {
      // Hafif ritmik bas
      nota(NOTA[n] / 2, 0, mel.sure * 1.2, "sine", mel.ses * 0.65);
    }
    mAdim++;
    muzikZaman = setTimeout(muzikAdimi, mel.hiz);
  }

  function muzikAc() {
    uyandir();
    if (!ctx || muzikCalisiyor) return;
    muzikCalisiyor = true;
    mAdim = 0;
    muzikAdimi();
  }

  function muzikKapat() {
    muzikCalisiyor = false;
    clearTimeout(muzikZaman);
  }

  function muzikDegistir(sahneId) {
    if (MELODILER[sahneId]) {
      aktifMelodi = sahneId;
    } else {
      aktifMelodi = "varsayilan";
    }
  }

  function sessiz(deger) {
    sessizMi = !!deger;
    if (anaKazanc) anaKazanc.gain.value = sessizMi ? 0 : 0.9;
    if (sessizMi) muzikKapat();
  }

  return { efekt, muzikAc, muzikKapat, muzikDegistir, sessiz, uyandir,
           get muzikAcik() { return muzikCalisiyor; },
           get sessizMi() { return sessizMi; } };
})();
window.SES = SES;
