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
    anaKazanc.gain.value = sessizMi ? 0 : 0.7;

    // Tiz köşeleri yumuşatan alçak geçiren süzgeç + kısa gecikme yankısı:
    // aynı notalar çok daha az "oyuncak" duyulur.
    const suzgec = ctx.createBiquadFilter();
    suzgec.type = "lowpass";
    suzgec.frequency.value = 2600;
    suzgec.Q.value = 0.4;

    const gecikme = ctx.createDelay(1.0);
    gecikme.delayTime.value = 0.24;
    const geriBesleme = ctx.createGain();
    geriBesleme.gain.value = 0.22;
    const yankiSeviyesi = ctx.createGain();
    yankiSeviyesi.gain.value = 0.3;

    anaKazanc.connect(suzgec);
    suzgec.connect(ctx.destination);
    suzgec.connect(gecikme);
    gecikme.connect(geriBesleme);
    geriBesleme.connect(gecikme);
    gecikme.connect(yankiSeviyesi);
    yankiSeviyesi.connect(ctx.destination);
  }
  function uyandir() {
    if (!ctx) baslat();
    if (ctx && ctx.state === "suspended") ctx.resume();
  }

  // Tek bir nota çal
  function nota(frek, baslangic, sure, tip = "sine", ses = 0.2) {
    if (!ctx || !anaKazanc || !Number.isFinite(frek) || frek <= 0) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = tip;
    o.frequency.value = frek;
    const t = ctx.currentTime + baslangic;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(ses, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    o.connect(g);
    g.connect(anaKazanc);
    o.start(t);
    o.stop(t + sure + 0.05);
  }

  // Nota adı → frekans
  const NOTA = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392.0, A: 440.0, B: 493.88,
                 A4: 440.0, B4: 493.88,
                 C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
                 C6: 1046.5, D6: 1174.66, E6: 1318.51 };

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
    salon: {
      notalar: ["C5", "E5", "G5", "E5", "F5", "A5", "F5", "D5", "G5", "B5", "G5", "E5"],
      hiz: 470, sure: 0.62, tip: "triangle", ses: 0.07
    },
    bahce: {
      notalar: ["C5", "D5", "E5", "G5", "A5", "G5", "E5", "D5"],
      hiz: 380, sure: 0.44, tip: "sine", ses: 0.08
    },
    gece: {
      notalar: ["E5", "B4", "C5", "A4", "F5", "C5", "D5", "B4"],
      hiz: 580, sure: 0.72, tip: "sine", ses: 0.055
    },
    kar: {
      notalar: ["C6", "G5", "A5", "E5", "F5", "C5", "D5", "G5"],
      hiz: 460, sure: 0.6, tip: "sine", ses: 0.06
    },
    gunbatimi: {
      notalar: ["C5", "E5", "G5", "E5", "F5", "A5", "C6", "A5"],
      hiz: 420, sure: 0.5, tip: "triangle", ses: 0.07
    },
    podyum: {
      notalar: ["A5", "C6", "E6", "C6", "G5", "B5", "D6", "B5"],
      hiz: 260, sure: 0.3, tip: "triangle", ses: 0.07
    },
    varsayilan: {
      notalar: ["E5", "G5", "A5", "G5", "E5", "C5", "D5", "E5", "D5", "C5", "D5", "E5", "G5", "E5", "C5", "D5"],
      hiz: 400, sure: 0.5, tip: "triangle", ses: 0.075
    }
  };

  // Sahne kimliği → melodi. Listede olmayan sahneler varsayılana düşer.
  const SAHNE_MELODI = {
    ap_balo: "salon",
    ap_altin_salon: "salon",
    ap_altin_bokeh: "salon",
    ap_gece_balo: "gece",
    ap_stud_gece: "gece",
    ap_sehir_bokeh: "gece",
    ap_orman_aksam: "gece",
    ap_zumrut_kadife: "gece",
    ap_bahce: "bahce",
    ap_stud_fildisi: "bahce",
    ap_kis_bahce: "kar",
    ap_kar_isilti: "kar",
    ap_gun_batimi: "gunbatimi",
    ap_stud_gul: "gunbatimi",
    ap_pembe_podyum: "podyum",
    ap_podyum: "podyum"
  };

  let aktifMelodi = "varsayilan";
  let mAdim = 0;

  function muzikAdimi() {
    if (!muzikCalisiyor || !ctx) return;
    const mel = MELODILER[aktifMelodi] || MELODILER["varsayilan"];
    const n = mel.notalar[mAdim % mel.notalar.length];
    const frek = NOTA[n];
    if (Number.isFinite(frek) && frek > 0) {
      nota(frek, 0, mel.sure, mel.tip, mel.ses);
      if (mAdim % 4 === 0) {
        // Hafif ritmik bas
        nota(frek / 2, 0, mel.sure * 1.2, "sine", mel.ses * 0.65);
      }
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
    const ad = SAHNE_MELODI[sahneId] || (MELODILER[sahneId] ? sahneId : "varsayilan");
    if (ad === aktifMelodi) return;
    aktifMelodi = ad;
    mAdim = 0;
  }

  function sessiz(deger) {
    sessizMi = !!deger;
    if (anaKazanc) anaKazanc.gain.value = sessizMi ? 0 : 0.7;
    if (sessizMi) muzikKapat();
  }

  return { efekt, muzikAc, muzikKapat, muzikDegistir, sessiz, uyandir,
           get muzikAcik() { return muzikCalisiyor; },
           get sessizMi() { return sessizMi; } };
})();
window.SES = SES;
