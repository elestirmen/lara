"use strict";
/*
  Lara'nın Sihirli Dolabı — Premium Yetişkin Mankenler & Vektör Gardırop Kütüphanesi (Genişletilmiş)
  ---------------------------------------------------------------------------------
  Mankenlerin vücut yapıları gerçekçi yetişkin oranlarına göre tasarlanmıştır. 
  Tüm gardırop sekmeleri iki katına çıkarılarak geniş bir koleksiyon oluşturulmuştur.
*/

const S = (govde) =>
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">' +
  govde +
  "</svg>";

/* ============================ RENK & MAKYAJ SEÇENEKLERİ ============================ */
const TEN_RENKLERI = [
  { id: "ten1", ad: "Porselen", renk: "#ffe2d2" },
  { id: "ten2", ad: "Doğal Bej", renk: "#f9d0a6" },
  { id: "ten3", ad: "Bronz Kahve", renk: "#dc9e6e" },
  { id: "ten4", ad: "Çikolata", renk: "#7c4a2a" },
];

const SAC_RENKLERI = [
  { id: "s_sari", ad: "Altın Sarısı", renk: "#f2c641" },
  { id: "s_sari_platen", ad: "Platin Sarısı", renk: "#fcf6bd" },
  { id: "s_kahve", ad: "Kestane Kahve", renk: "#5c3d24" },
  { id: "s_koyu", ad: "Koyu Çikolata", renk: "#2c1c14" },
  { id: "s_siyah", ad: "Gece Siyahı", renk: "#111115" },
  { id: "s_turuncu", ad: "Bakır Kızılı", renk: "#e76f51" },
  { id: "s_pembe", ad: "Pamuk Şekeri", renk: "#ff9ebb" },
  { id: "s_mavi", ad: "Buz Mavisi", renk: "#a8dadc" },
  { id: "s_mor", ad: "Lavanta Moru", renk: "#bdb2ff" },
];

const GOZ_RENKLERI = [
  { id: "g_kahve", ad: "Kestane", renk: "#5c3d24" },
  { id: "g_elmas", ad: "Okyanus Mavi", renk: "#2a9d8f" },
  { id: "g_emerald", ad: "Zümrüt Yeşil", renk: "#38b000" },
  { id: "g_safir", ad: "Safir Mavi", renk: "#0077b6" },
  { id: "g_pembe", ad: "Sihirli Pembe", renk: "#ff70a6" },
];

const RUJ_RENKLERI = [
  { id: "r_naturel", ad: "Doğal Pembe", renk: "#ff9ebb" },
  { id: "r_seftali", ad: "Şeftali Büyüsü", renk: "#ffb5a7" },
  { id: "r_kirmizi", ad: "Kraliyet Kırmızısı", renk: "#e63946" },
  { id: "r_parlak_gul", ad: "Glitter Gül", renk: "#ff5470" },
  { id: "r_cilek", ad: "Çilek Şerbeti", renk: "#d90429" },
];

const ALLIK_RENKLERI = [
  { id: "a_seftali", ad: "Şeftali", renk: "#ffb5a7" },
  { id: "a_rose", ad: "Gül Kurusu", renk: "#ffccd5" },
  { id: "a_altin", ad: "Bronz Parıltı", renk: "#ffd166" },
];

/* ============================ ÇİZGİ BEBEK GÖVDESİ (VEKTÖREL) ============================ */
function vucutGovde() {
  return `
  <defs>
    <radialGradient id="yanak" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="%ALLIK%" stop-opacity="0.7"/>
      <stop offset="1" stop-color="%ALLIK%" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="camasir" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a3340"/>
      <stop offset="1" stop-color="#22202b"/>
    </linearGradient>
    <clipPath id="eyeL"><path d="M261 157 Q276 147 293 156 Q278 167 261 157 Z"/></clipPath>
    <clipPath id="eyeR"><path d="M307 156 Q324 147 339 157 Q322 167 307 156 Z"/></clipPath>
  </defs>

  <!-- Bacaklar -->
  <path d="M272 404 C264 468 266 538 273 580 C277 616 281 650 283 684 C285 706 288 720 293 730 C296 736 300 732 300 720 C300 732 304 736 307 730 C312 720 315 706 317 684 C319 650 323 616 327 580 C334 538 336 468 328 404 Z" fill="%TEN%"/>
  <path d="M300 468 C300 560 300 640 300 700" stroke="#000" stroke-width="2" fill="none" opacity="0.16"/>
  <path d="M284 462 C281 540 282 620 289 688" stroke="#fff" stroke-width="5" fill="none" opacity="0.22" stroke-linecap="round"/>
  <path d="M316 462 C319 540 318 620 311 688" stroke="#fff" stroke-width="5" fill="none" opacity="0.22" stroke-linecap="round"/>
  <path d="M280 576 Q288 582 292 576 M308 576 Q312 582 320 576" stroke="#000" stroke-width="1.6" fill="none" opacity="0.18"/>
  <path d="M285 724 C282 736 286 744 296 744 C300 744 300 732 299 724 Z" fill="%TEN%"/>
  <path d="M315 724 C318 736 314 744 304 744 C300 744 300 732 301 724 Z" fill="%TEN%"/>

  <!-- Kollar -->
  <path d="M260 256 C242 272 230 322 228 374 C227 412 231 448 238 454 C246 458 252 448 250 432 C247 392 252 348 266 308 C271 286 275 270 277 260 Z" fill="%TEN%"/>
  <path d="M238 452 C232 463 233 478 241 482 C249 484 253 472 250 458 Z" fill="%TEN%"/>
  <path d="M340 256 C358 272 370 322 372 374 C373 412 369 448 362 454 C354 458 348 448 350 432 C353 392 348 348 334 308 C329 286 325 270 323 260 Z" fill="%TEN%"/>
  <path d="M362 452 C368 463 367 478 359 482 C351 484 347 472 350 458 Z" fill="%TEN%"/>

  <!-- Gövde -->
  <path d="M258 248 C250 256 250 272 254 288 C261 322 268 344 274 362 C268 382 262 398 268 414 C285 428 315 428 332 414 C338 398 332 382 326 362 C332 344 339 322 346 288 C350 272 350 256 342 248 C318 240 282 240 258 248 Z" fill="%TEN%"/>
  <path d="M276 360 Q300 372 324 360" stroke="#000" stroke-width="2" fill="none" opacity="0.2"/>
  <ellipse cx="300" cy="372" rx="2.6" ry="3.4" fill="#000" opacity="0.35"/>

  <!-- İç çamaşırı -->
  <g>
    <path d="M256 300 C272 292 286 296 300 308 C314 296 328 292 344 300 C348 316 344 332 300 338 C256 332 252 316 256 300 Z" fill="url(#camasir)"/>
    <path d="M300 308 L300 336" stroke="#15131b" stroke-width="1.5" opacity="0.6"/>
    <path d="M256 300 C272 294 286 298 300 309" fill="none" stroke="#ffffff" stroke-width="1.4" opacity="0.35"/>
    <path d="M344 300 C328 294 314 298 300 309" fill="none" stroke="#ffffff" stroke-width="1.4" opacity="0.35"/>
    <path d="M266 300 L272 268 M334 300 L328 268" stroke="#3a3340" stroke-width="4" stroke-linecap="round"/>
    <path d="M264 392 C282 402 318 402 336 392 C342 420 332 452 300 460 C268 452 258 420 264 392 Z" fill="url(#camasir)"/>
    <path d="M272 398 C285 406 315 406 328 398" fill="none" stroke="#ffffff" stroke-width="1.4" opacity="0.3"/>
  </g>

  <!-- Boyun -->
  <path d="M290 200 C288 218 289 232 295 244 L305 244 C311 232 312 218 310 200 Z" fill="%TEN%"/>
  <path d="M289 208 C295 216 305 216 311 208" stroke="#000" stroke-width="2.5" fill="none" opacity="0.25"/>

  <!-- Kulaklar + Kafa -->
  <ellipse cx="247" cy="150" rx="8" ry="12" fill="%TEN%"/>
  <ellipse cx="353" cy="150" rx="8" ry="12" fill="%TEN%"/>
  <path d="M300 84 C266 84 245 110 245 146 C245 180 263 208 300 218 C337 208 355 180 355 146 C355 110 334 84 300 84 Z" fill="%TEN%"/>
  <path d="M262 168 Q270 184 284 188" stroke="#000" stroke-width="2" fill="none" opacity="0.15"/>
  <path d="M338 168 Q330 184 316 188" stroke="#000" stroke-width="2" fill="none" opacity="0.15"/>

  <!-- Yanaklar -->
  <ellipse cx="271" cy="170" rx="14" ry="9" fill="url(#yanak)"/>
  <ellipse cx="329" cy="170" rx="14" ry="9" fill="url(#yanak)"/>

  <!-- Kaşlar -->
  <path d="M258 134 Q277 124 295 132" stroke="#7a5236" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M305 132 Q323 124 342 134" stroke="#7a5236" stroke-width="2.6" fill="none" stroke-linecap="round"/>

  <!-- Gözler -->
  <path d="M260 150 Q277 142 294 150 Q278 154 260 150 Z" fill="%RUJ%" opacity="0.18"/>
  <path d="M306 150 Q323 142 340 150 Q322 154 306 150 Z" fill="%RUJ%" opacity="0.18"/>
  <g clip-path="url(#eyeL)">
    <rect x="258" y="146" width="40" height="24" fill="#ffffff"/>
    <circle cx="278" cy="156" r="10" fill="%GOZ%"/>
    <circle cx="278" cy="156" r="4.6" fill="#1c130c"/>
    <circle cx="281" cy="152" r="3" fill="#ffffff"/>
  </g>
  <g clip-path="url(#eyeR)">
    <rect x="302" y="146" width="40" height="24" fill="#ffffff"/>
    <circle cx="322" cy="156" r="10" fill="%GOZ%"/>
    <circle cx="322" cy="156" r="4.6" fill="#1c130c"/>
    <circle cx="325" cy="152" r="3" fill="#ffffff"/>
  </g>
  <path d="M260 155 Q277 145 294 154 L299 150" stroke="#241712" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M306 154 Q323 145 340 155 L301 150" stroke="#241712" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M294 154 l6 -4 M289 150 l3 -5 M306 154 l-6 -4 M311 150 l-3 -5" stroke="#241712" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M264 165 Q278 170 292 165" stroke="#7a5236" stroke-width="1.4" fill="none" opacity="0.5"/>
  <path d="M308 165 Q322 170 336 165" stroke="#7a5236" stroke-width="1.4" fill="none" opacity="0.5"/>

  <!-- Burun -->
  <path d="M298 166 Q295 178 300 183 Q305 178 302 166" stroke="#000" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.25"/>

  <!-- Dudaklar -->
  <path d="M283 191 Q292 185 300 189 Q308 185 317 191 Q309 202 300 202 Q291 202 283 191 Z" fill="%RUJ%"/>
  <path d="M283 191 Q300 195 317 191" stroke="#c33b54" stroke-width="1.4" fill="none" opacity="0.7"/>
  <path d="M293 197 Q300 199 307 197" stroke="#ffffff" stroke-width="1.6" fill="none" opacity="0.35" stroke-linecap="round"/>
  `;
}

const VUCUT_SVG = S(vucutGovde());

/* ============================ KARAKTER SEÇENEKLERİ (8 MODEL) ============================ */
const MANKENLER = [
  { id: "m_lara", ad: "Lara", emoji: "🧡",
    ten: "#f9d0a6", goz: "#5c3d24", ruj: "#ff758f", allik: "#ffb3c1",
    sac: "sac_dalgali", sacRenk: "#e76f51", svg: VUCUT_SVG },
  { id: "m_mia", ad: "Mia", emoji: "👑",
    ten: "#ffe2d2", goz: "#0077b6", ruj: "#ff5470", allik: "#ffccd5",
    sac: "sac_topuz", sacRenk: "#f2c641", svg: VUCUT_SVG },
  { id: "m_zoe", ad: "Zoe", emoji: "🌸",
    ten: "#7c4a2a", goz: "#52b788", ruj: "#d90429", allik: "#ffd166",
    sac: "sac_orgu", sacRenk: "#2c1c14", svg: VUCUT_SVG },
  { id: "m_elisa", ad: "Elisa", emoji: "💜",
    ten: "#dc9e6e", goz: "#5c3d24", ruj: "#c77dff", allik: "#ffccd5",
    sac: "sac_at", sacRenk: "#bdb2ff", svg: VUCUT_SVG },
  
  // Yeni 4 model
  { id: "m_ayla", ad: "Ayla", emoji: "🌙",
    ten: "#f9d0a6", goz: "#2a9d8f", ruj: "#ffb5a7", allik: "#ffb3c1",
    sac: "sac_bob", sacRenk: "#5c3d24", svg: VUCUT_SVG },
  { id: "m_selin", ad: "Selin", emoji: "☀️",
    ten: "#ffe2d2", goz: "#0077b6", ruj: "#e63946", allik: "#ffccd5",
    sac: "sac_dalgali", sacRenk: "#f2c641", svg: VUCUT_SVG },
  { id: "m_derya", ad: "Derya", emoji: "🌊",
    ten: "#dc9e6e", goz: "#38b000", ruj: "#ff5470", allik: "#ffb5a7",
    sac: "sac_at", sacRenk: "#ff9ebb", svg: VUCUT_SVG },
  { id: "m_yasemin", ad: "Yasemin", emoji: "🌹",
    ten: "#7c4a2a", goz: "#ff70a6", ruj: "#d90429", allik: "#ffd166",
    sac: "sac_orgu", sacRenk: "#111115", svg: VUCUT_SVG }
];

function sacGovde(yol, detay = "") {
  return `
    <defs>
      <mask id="hairFaceMask">
        <rect width="600" height="800" fill="#ffffff"/>
        <ellipse cx="300" cy="148" rx="62" ry="72" fill="#000000"/>
        <rect x="274" y="180" width="52" height="100" fill="#000000"/>
      </mask>
    </defs>
    <g mask="url(#hairFaceMask)">
      <path d="${yol}" fill="%SAC%"/>
      ${detay}
    </g>
  `;
}

/* ================================ SAÇLAR (10 SAÇ STİLİ) =================================== */
const SAC_ISILTISI = `
  <path d="M230 140 C206 195 208 280 224 348 C232 278 227 195 250 148 Z" fill="#ffffff" opacity="0.15"/>
  <path d="M370 140 C394 195 392 280 376 348 C368 278 373 195 350 148 Z" fill="#ffffff" opacity="0.12"/>
`;

const SACLAR = [
  {
    id: "sac_dalgali", ad: "Uzun Dalgalı Prenses", emoji: "🌊",
    svg: S(sacGovde("M300 55 C220 55 186 120 200 200 C182 300 186 420 220 480 C260 460 268 400 300 395 C332 400 340 460 380 480 C414 420 418 300 400 200 C414 120 380 55 300 55 Z", SAC_ISILTISI))
  },
  {
    id: "sac_at", ad: "Fiyonklu At Kuyruğu", emoji: "🎀",
    svg: S(sacGovde("M300 60 C202 60 172 130 196 230 C206 270 230 290 250 290 C236 230 240 180 268 160 C300 180 332 180 360 160 C388 180 392 220 378 280 C396 275 412 255 398 220 C420 130 390 60 300 60 Z") +
      `<path d="M380 148 C455 138 480 200 460 270 Q480 330 408 400" fill="%SAC%"/>` +
      `<g transform="translate(372 152) rotate(-15)"><path d="M-18 -8 C-36 -26 -36 8 -18 0 L0 0 C18 8 18 -26 0 -8 Z" fill="#ff4d6d" stroke="#c9184a" stroke-width="2"/><circle cx="-9" cy="-4" r="6" fill="#ffccd5"/></g>`)
  },
  {
    id: "sac_orgu", ad: "Kurdeleli İki Örgü", emoji: "👧",
    svg: S(sacGovde("M300 60 C210 60 180 130 202 220 C220 190 250 180 300 180 C350 180 380 190 398 220 C420 130 390 60 300 60 Z") +
      `<circle cx="198" cy="230" r="14" fill="%SAC%"/><circle cx="198" cy="260" r="15" fill="%SAC%"/><circle cx="198" cy="292" r="14" fill="%SAC%"/><path d="M198 220 C182 220 182 245 198 235" fill="#4ea8de"/>` +
      `<circle cx="402" cy="230" r="14" fill="%SAC%"/><circle cx="402" cy="260" r="15" fill="%SAC%"/><circle cx="402" cy="292" r="14" fill="%SAC%"/><path d="M402 220 C418 220 418 245 402 235" fill="#4ea8de"/>`)
  },
  {
    id: "sac_topuz", ad: "Kraliyet Topuzu", emoji: "👸",
    svg: S(`<ellipse cx="300" cy="62" rx="44" ry="38" fill="%SAC%"/>` +
      sacGovde("M300 70 C210 70 180 130 202 220 C220 190 250 180 300 180 C350 180 380 190 398 220 C420 130 390 70 300 70 Z"))
  },
  {
    id: "sac_bob", ad: "Modern Bob Kesim", emoji: "💇",
    svg: S(sacGovde("M300 58 C210 58 178 125 198 220 C204 260 220 290 238 295 C230 260 232 220 242 195 C300 215 358 215 358 195 C368 220 370 260 362 295 C380 290 396 260 402 220 C422 125 390 58 300 58 Z", SAC_ISILTISI))
  },
  
  // Yeni 5 saç stili
  {
    id: "sac_kisa", ad: "Modern Kısa Pixie", emoji: "💇‍♀️",
    svg: S(sacGovde("M300 60 C230 60 200 110 210 170 C220 200 240 210 260 210 C250 180 255 150 270 140 C300 160 330 160 340 140 C355 150 360 180 350 210 C370 210 390 200 400 170 C410 110 380 60 300 60 Z"))
  },
  {
    id: "sac_bukle", ad: "Kıvırcık Bukleler", emoji: "🌀",
    svg: S(sacGovde("M300 55 C200 55 170 110 180 200 C170 280 180 380 200 440 C220 420 230 380 250 375 C270 380 280 420 300 440 C320 420 330 380 350 375 C370 380 380 420 400 440 C420 380 430 280 420 200 C430 110 400 55 300 55 Z", SAC_ISILTISI))
  },
  {
    id: "sac_orgulu_topuz", ad: "Örgülü Topuz Stili", emoji: "👱‍♀️",
    svg: S(`<ellipse cx="300" cy="55" rx="30" ry="30" fill="%SAC%"/>` +
      sacGovde("M300 70 C210 70 180 130 202 220 Q250 210 300 210 Q350 210 398 220 C420 130 390 70 300 70 Z"))
  },
  {
    id: "sac_duz", ad: "Uzun Düz Saç", emoji: "👩‍🦰",
    svg: S(sacGovde("M300 55 C220 55 190 120 195 220 L195 500 Q250 480 300 480 Q350 480 405 500 L405 220 C410 120 380 55 300 55 Z"))
  },
  {
    id: "sac_percem", ad: "Kahküllü Dalgalı", emoji: "💇",
    svg: S(sacGovde("M300 55 C220 55 186 120 200 200 C182 300 186 420 220 480 C260 460 268 400 300 395 C332 400 340 460 380 480 C414 420 418 300 400 200 C414 120 380 55 300 55 Z", 
      `<path d="M245 130 Q300 150 355 130 Q300 100 245 130 Z" fill="%SAC%" opacity="0.95"/>`))
  }
];

/* ============================ ELBİSE JENERATÖRÜ (28 ELBİSE) ============================ */
function elbiseSVG({ id, ust, alt, kemer = "#ffffff", boy = "uzun", motif = "" }) {
  const gid = "g_" + id;
  const etek =
    boy === "uzun"
      ? `M244 415 L356 415 C420 500 460 600 452 715 C372 745 300 735 300 735 C300 735 228 745 148 715 C140 600 180 500 256 415 Z`
      : boy === "kisa"
      ? `M246 415 L354 415 C400 470 420 520 416 575 C360 600 300 592 300 592 C300 592 240 600 184 575 C180 520 200 470 254 415 Z`
      : /* tutu */ `M246 415 L354 415 C404 465 418 505 416 535 C360 560 300 554 300 554 C300 554 240 560 184 535 C182 505 196 465 254 415 Z`;
  
  const tutuRuffle =
    boy === "tutu"
      ? `<path d="M178 528 q22 28 44 8 q22 28 44 4 q24 28 48 4 q24 26 48 2 q22 26 44 0
                 q-4 24 -30 32 q-92 22 -182 0 q-22 -10 -16 -50 Z" fill="${ust}" opacity="0.95"/>`
      : "";

  return S(`
    <defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${ust}"/>
        <stop offset="1" stop-color="${alt}"/>
      </linearGradient>
    </defs>
    <path d="M256 244 L268 272 M344 244 L332 272" stroke="${ust}" stroke-width="12" stroke-linecap="round"/>
    <path d="M250 248 Q300 232 350 248 L356 415 Q300 430 244 415 Z" fill="url(#${gid})"/>
    <path d="${etek}" fill="url(#${gid})"/>
    <g>
      <path d="M241 410 Q300 425 359 410 L361 424 Q300 439 239 424 Z" fill="${kemer}"/>
      <circle cx="300" cy="417" r="6" fill="${kemer}"/>
    </g>
    ${tutuRuffle}
    ${motif}
  `);
}

function pantolonSVG({ id, ust, alt, kemer = "#ffffff", motif = "" }) {
  const gid = "p_" + id;
  return S(`
    <defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${ust}"/><stop offset="1" stop-color="${alt}"/>
      </linearGradient>
    </defs>
    <path d="M252 248 Q300 234 348 248 L344 402 Q300 416 256 402 Z" fill="url(#${gid})"/>
    <path d="M254 398 Q300 412 346 398 L348 414 Q300 428 252 414 Z" fill="${kemer}"/>
    <path d="M256 410 L302 410 L300 470 C300 560 297 650 294 726 L268 728 C262 650 258 560 258 470 Z" fill="url(#${gid})"/>
    <path d="M298 410 L344 410 L342 470 C340 560 336 650 332 728 L306 726 C302 650 300 560 300 470 Z" fill="url(#${gid})"/>
    ${motif}
  `);
}

const ELBISELER = [
  // 14 Klasik Elbise
  { id: "elb_turuncu", ad: "Gün Işığı Balo Elbisesi", emoji: "🧡", svg: elbiseSVG({ id: "elb_turuncu", ust: "#ffb703", alt: "#fb8500" }), etiketler: ["turuncu", "balo", "saray"] },
  { id: "elb_pembe", ad: "Gül Kurusu Balo Elbisesi", emoji: "🌸", svg: elbiseSVG({ id: "elb_pembe", ust: "#ffb3c1", alt: "#ff4d6d" }), etiketler: ["pembe", "balo", "saray", "dogumgunu"] },
  { id: "elb_mor", ad: "Ametist Gece Yıldızı", emoji: "🌙", svg: elbiseSVG({ id: "elb_mor", ust: "#bdb2ff", alt: "#743ad5" }), etiketler: ["mor", "gece", "balo"] },
  { id: "elb_buz", ad: "Kristal Buz Kraliçesi", emoji: "❄️", svg: elbiseSVG({ id: "elb_buz", ust: "#e0f2fe", alt: "#38bdf8" }), etiketler: ["mavi", "buz", "kar", "kis"] },
  { id: "elb_altin", ad: "Altın Varaklı Işıltı", emoji: "✨", svg: elbiseSVG({ id: "elb_altin", ust: "#ffe9a8", alt: "#d4af37" }), etiketler: ["altin", "sari", "balo", "dogumgunu"] },
  { id: "elb_kirmizi", ad: "Kırmızı Kadife Balo", emoji: "🌹", svg: elbiseSVG({ id: "elb_kirmizi", ust: "#ff4d6d", alt: "#a4161a" }), etiketler: ["kirmizi", "gece", "balo"] },
  { id: "elb_yesil", ad: "Zümrüt Yeşili Yaprak", emoji: "🍃", svg: elbiseSVG({ id: "elb_yesil", ust: "#d8f3dc", alt: "#40916c", boy: "kisa" }), etiketler: ["yesil", "peri", "bahce"] },
  { id: "elb_tutu", ad: "Gökkuşağı Tütü Etek", emoji: "🌈", svg: elbiseSVG({ id: "elb_tutu", ust: "#fec5bb", alt: "#f8ad9d", boy: "tutu" }), etiketler: ["gokkusagi", "dans", "bale", "dogumgunu"] },
  { id: "elb_siyah", ad: "Siyah Bodikon Mini", emoji: "🖤", svg: elbiseSVG({ id: "elb_siyah", ust: "#3a3a46", alt: "#16161d", boy: "kisa" }), etiketler: ["modern", "gece", "siyah", "gunluk"] },
  { id: "elb_kirmizi_gece", ad: "Kırmızı Halı Gecesi", emoji: "💋", svg: elbiseSVG({ id: "elb_kirmizi_gece", ust: "#ff5d73", alt: "#9d0208" }), etiketler: ["gece", "kirmizi", "modern", "balo"] },
  { id: "elb_zumrut", ad: "Zümrüt Saten Gece", emoji: "💚", svg: elbiseSVG({ id: "elb_zumrut", ust: "#34d399", alt: "#065f46" }), etiketler: ["gece", "yesil", "modern", "balo"] },
  { id: "elb_yazlik", ad: "Çiçekli Yazlık Elbise", emoji: "🌼", svg: elbiseSVG({ id: "elb_yazlik", ust: "#fff0f3", alt: "#ffb3c1", boy: "kisa" }), etiketler: ["gunluk", "yaz", "bahce", "modern"] },
  { id: "elb_tulum", ad: "Şık Gece Tulumu", emoji: "🌃", svg: pantolonSVG({ id: "elb_tulum", ust: "#5a3e85", alt: "#2d1b4e" }), etiketler: ["gece", "modern", "mor"] },
  { id: "elb_kot_tulum", ad: "Kot Tulum", emoji: "👖", svg: pantolonSVG({ id: "elb_kot_tulum", ust: "#6699cc", alt: "#3a5e85" }), etiketler: ["gunluk", "modern", "spor"] },

  // Batch 2 Eklenen 8 Elbise
  { id: "elb_gelinlik", ad: "Zarif Beyaz Gelinlik", emoji: "👰", svg: elbiseSVG({ id: "elb_gelinlik", ust: "#ffffff", alt: "#f8fafc" }), etiketler: ["saray", "balo", "beyaz"] },
  { id: "elb_balo_mavi", ad: "Kraliyet Mavisi Balo", emoji: "💙", svg: elbiseSVG({ id: "elb_balo_mavi", ust: "#1d4ed8", alt: "#1e3a8a" }), etiketler: ["mavi", "balo", "saray"] },
  { id: "elb_kimono", ad: "Çiçekli Kimono Rob", emoji: "👘", svg: elbiseSVG({ id: "elb_kimono", ust: "#312e81", alt: "#4338ca", boy: "uzun" }), etiketler: ["gunluk", "yaz", "mor"] },
  { id: "elb_kot_ceket", ad: "Kot Ceket & Jean Pantolon", emoji: "🧥", svg: pantolonSVG({ id: "elb_kot_ceket", ust: "#2563eb", alt: "#1d4ed8" }), etiketler: ["gunluk", "spor", "mavi"] },
  { id: "elb_esofman", ad: "Spor Eşofman Takımı", emoji: "🏃‍♀️", svg: pantolonSVG({ id: "elb_esofman", ust: "#059669", alt: "#047857" }), etiketler: ["gunluk", "spor", "yesil"] },
  { id: "elb_kazak", ad: "Örgü Kazak Elbise", emoji: "🧶", svg: elbiseSVG({ id: "elb_kazak", ust: "#d97706", alt: "#b45309", boy: "kisa" }), etiketler: ["gunluk", "kis", "turuncu"] },
  { id: "elb_okul", ad: "Okul Üniforması", emoji: "🎒", svg: elbiseSVG({ id: "elb_okul", ust: "#1e293b", alt: "#334155", boy: "kisa" }), etiketler: ["gunluk", "modern"] },
  { id: "elb_mayo", ad: "Tasarım Mayo & Sarong", emoji: "🩱", svg: elbiseSVG({ id: "elb_mayo", ust: "#0891b2", alt: "#0e7490", boy: "kisa" }), etiketler: ["yaz", "sahil", "mavi"] },

  // Yeni Eklenen 6 Elbise (Toplam 28)
  { id: "elb_deri", ad: "Deri Ceket & Siyah Tayt", emoji: "🎸", svg: pantolonSVG({ id: "elb_deri", ust: "#1e1b4b", alt: "#0f172a" }), etiketler: ["modern", "siyah"] },
  { id: "elb_vintage", ad: "Vintage Retro Elbise", emoji: "👗", svg: elbiseSVG({ id: "elb_vintage", ust: "#ec4899", alt: "#db2777", boy: "kisa" }), etiketler: ["dogumgunu", "pembe"] },
  { id: "elb_gotik", ad: "Gotik Gece Elbisesi", emoji: "🖤", svg: elbiseSVG({ id: "elb_gotik", ust: "#111827", alt: "#030712", boy: "uzun" }), etiketler: ["gece", "siyah"] },
  { id: "elb_prenses_lila", ad: "Lila Prenses Elbisesi", emoji: "🦄", svg: elbiseSVG({ id: "elb_prenses_lila", ust: "#c084fc", alt: "#a855f7", boy: "uzun" }), etiketler: ["balo", "saray", "mor"] },
  { id: "elb_cicek_desen", ad: "Papatya Yazlık Elbise", emoji: "🌼", svg: elbiseSVG({ id: "elb_cicek_desen", ust: "#a7f3d0", alt: "#059669", boy: "kisa" }), etiketler: ["gunluk", "yaz", "yesil"] },
  { id: "elb_safari", ad: "Safari Tulumu", emoji: "🏕️", svg: pantolonSVG({ id: "elb_safari", ust: "#78350f", alt: "#451a03" }), etiketler: ["gunluk", "spor"] }
];

/* ============================== TAÇ & ŞAPKA (10 ADET) =============================== */
const TACLAR = [
  { id: "tac_klasik", ad: "Altın Kraliyet Tacı", emoji: "👑",
    svg: S(`<g transform="translate(300 95)"><path d="M-66 26 L-52 -28 L-26 8 L0 -44 L26 8 L52 -28 L66 26 Z" fill="#ffb703" stroke="#d4af37" stroke-width="3.5"/><circle cx="0" cy="-44" r="8" fill="#e63946"/><circle cx="-52" cy="-28" r="6.5" fill="#457b9d"/><circle cx="52" cy="-28" r="6.5" fill="#457b9d"/></g>`), etiketler: ["tac", "balo", "saray"] },
  { id: "tac_tiara", ad: "Kuğu Pırlanta Tiara", emoji: "💎",
    svg: S(`<g transform="translate(300 100)"><path d="M-60 18 Q0 -34 60 18" fill="none" stroke="#ffffff" stroke-width="9"/><circle cx="-30" cy="2" r="6.5" fill="#c0fdff"/><circle cx="30" cy="2" r="6.5" fill="#c0fdff"/></g>`), etiketler: ["tac", "balo", "gece"] },
  { id: "tac_cicek", ad: "Kır Çiçekleri Tacı", emoji: "🌺",
    svg: S(`<g transform="translate(300 95)"><path d="M-66 22 Q0 -16 66 22" fill="none" stroke="#52b788" stroke-width="8"/></g>`), etiketler: ["cicek", "bahce", "peri", "yaz"] },
  { id: "tac_kar", ad: "Buz Kristali Tacı", emoji: "❄️",
    svg: S(`<g transform="translate(300 96)"><path d="M-60 26 Q0 -18 60 26 Z" fill="#e0f2fe" stroke="#0ea5e9" stroke-width="2.5"/><circle cx="0" cy="-34" r="5" fill="#ffffff"/></g>`), etiketler: ["kar", "buz", "kis", "mavi"] },
  { id: "tac_sapka", ad: "Sihirbaz Silindir Şapkası", emoji: "🎩",
    svg: S(`<g transform="translate(300 80)"><path d="M-24 64 L-8 -54 Q0 -64 8 -54 L24 64 Z" fill="#3d348b"/><ellipse cx="0" cy="64" rx="54" ry="14" fill="#241e4e"/></g>`), etiketler: ["sihir", "mor", "gece"] },
  
  // Batch 2 Eklenen 4 Taç
  { id: "tac_gunes", ad: "Güneş Şapkası", emoji: "👒",
    svg: S(`<g transform="translate(300 95)"><ellipse cx="0" cy="10" rx="60" ry="16" fill="#fef08a" stroke="#ca8a04"/><path d="M-25 10 C-25 -20 25 -20 25 10 Z" fill="#fef08a" stroke="#ca8a04"/></g>`), etiketler: ["yaz", "sahil"] },
  { id: "tac_bere", ad: "Kışlık Örgü Bere", emoji: "🧣",
    svg: S(`<g transform="translate(300 90)"><path d="M-35 25 C-35 -15 35 -15 35 25 Z" fill="#94a3b8"/><circle cx="0" cy="-15" r="8" fill="#f8fafc"/></g>`), etiketler: ["kis", "kar"] },
  { id: "tac_kovboy", ad: "Kovboy Şapkası", emoji: "🤠",
    svg: S(`<g transform="translate(300 95)"><path d="M-55 15 C-55 5 55 5 55 15 Z" fill="#b45309"/><path d="M-25 10 Q0 -25 25 10 Z" fill="#78350f"/></g>`), etiketler: ["modern", "spor"] },
  { id: "tac_kelebek_toka", ad: "Kelebek Toka", emoji: "🦋",
    svg: S(`<g transform="translate(325 100)"><path d="M0 0 Q-10 -15 -20 -5 Q-15 10 0 0 Z" fill="#ff758f"/><path d="M0 0 Q10 -15 20 -5 Q15 10 0 0 Z" fill="#ffccd5"/></g>`), etiketler: ["modern", "peri"] },

  // Yeni Eklenen 1 Taç
  { id: "tac_cadi", ad: "Cadı Şapkası", emoji: "🧙‍♀️",
    svg: S(`<g transform="translate(300 80)"><path d="M-45 40 L0 -50 L45 40 Z" fill="#0f172a"/><ellipse cx="0" cy="40" rx="55" ry="12" fill="#1e293b"/></g>`), etiketler: ["sihir", "siyah"] }
];

/* ================================ KANATLAR (6 ADET) ================================ */
const KANATLAR = [
  { id: "kanat_kelebek", ad: "Sihirli Kelebek Kanatları", emoji: "🦋",
    svg: S(`<g opacity="0.9" stroke="#ffffff" stroke-width="4.5"><path d="M300 416 C160 310 50 330 50 422 C50 510 180 520 300 470 Z" fill="#ffb3c1"/><path d="M300 416 C440 310 550 330 550 422 C550 510 420 520 300 470 Z" fill="#ffb3c1"/></g>`), etiketler: ["kelebek", "peri", "bahce"] },
  { id: "kanat_peri", ad: "Orman Perisi Kanatları", emoji: "🧚",
    svg: S(`<g opacity="0.88" stroke="#40916c" stroke-width="3"><path d="M300 424 C160 340 70 390 90 470 C110 535 230 520 300 472 Z" fill="#b7e4c7"/><path d="M300 424 C440 340 530 390 510 470 C490 535 370 520 300 472 Z" fill="#b7e4c7"/></g>`), etiketler: ["peri", "yesil", "bahce"] },
  { id: "kanat_melek", ad: "Altın Yaldızlı Melek Kanatları", emoji: "🪽",
    svg: S(`<g fill="#ffffff" stroke="#ffe5ec" stroke-width="3" opacity="0.97"><path d="M300 420 C210 380 90 390 60 470 Z"/><path d="M300 420 C390 380 510 390 540 470 Z"/></g>`), etiketler: ["melek", "beyaz", "gece"] },
  
  // Yeni 3 Kanat
  { id: "kanat_ejderha", ad: "Ejderha Kanatları", emoji: "🐉",
    svg: S(`<g fill="#311042" stroke="#5a189a" stroke-width="3" opacity="0.95"><path d="M300 420 C180 320 80 340 40 440 L120 480 Z"/><path d="M300 420 C420 320 520 340 560 440 L480 480 Z"/></g>`), etiketler: ["sihir", "mor"] },
  { id: "kanat_karanlik", ad: "Karanlık Gece Kanatları", emoji: "🦇",
    svg: S(`<g fill="#1e293b" stroke="#0f172a" stroke-width="3"><path d="M300 420 C150 350 70 400 50 490 L130 470 Z"/><path d="M300 420 C450 350 530 400 550 490 L470 470 Z"/></g>`), etiketler: ["siyah", "gece"] },
  { id: "kanat_ates", ad: "Phoenix Ateş Kanatları", emoji: "🔥",
    svg: S(`<g fill="#f97316" stroke="#ef4444" stroke-width="3"><path d="M300 420 Q120 300 60 460 Q180 480 300 450 Z"/><path d="M300 420 Q480 300 540 460 Q420 480 300 450 Z"/></g>`), etiketler: ["turuncu", "sihir"] }
];

/* ================================ AYAKKABI (8 ADET) ================================ */
const AYAKKABILAR = [
  { id: "ayk_cam", ad: "Cam Külkedisi Topuklusu", emoji: "👠",
    svg: S(`<path d="M280 726 q18 14 38 0 l4 12 Z" fill="#e0f2fe" stroke="#bae6fd"/><path d="M306 734 q16 14 34 0 l4 12 Z" fill="#e0f2fe" stroke="#bae6fd"/>`), etiketler: ["balo", "saray", "mavi"] },
  { id: "ayk_balerin", ad: "Saten Balerin Babeti", emoji: "🩰",
    svg: S(`<g fill="#ff8fc0"><path d="M278 726 q18 16 38 2 l4 12 Z"/><path d="M304 732 q16 16 36 2 l4 12 Z"/></g>`), etiketler: ["bale", "pembe", "dans"] },
  { id: "ayk_cizme", ad: "Uzun Süet Çizmeler", emoji: "👢",
    svg: S(`<g fill="#7209b7"><path d="M282 674 q18 6 34 0 l4 58 Z"/><path d="M308 682 q16 6 32 0 l4 54 Z"/></g>`), etiketler: ["mor", "kis", "gece"] },
  { id: "ayk_spor", ad: "Tasarım Kalın Taban Spor", emoji: "👟",
    svg: S(`<g fill="#ff4d6d"><path d="M276 724 q20 12 44 2 l6 14 Z"/><path d="M302 730 q20 12 42 2 l6 14 Z"/></g>`), etiketler: ["spor", "bahce", "kirmizi"] },
  
  // Batch 2 Eklenen 3 Ayakkabı
  { id: "ayk_topuk", ad: "Klasik Siyah Stiletto", emoji: "👠",
    svg: S(`<path d="M280 726 q18 14 38 0 l4 12 Z" fill="#1e293b"/><path d="M306 734 q16 14 34 0 l4 12 Z" fill="#1e293b"/>`), etiketler: ["gece", "modern", "siyah"] },
  { id: "ayk_sandalet", ad: "Yazlık İpli Sandalet", emoji: "👡",
    svg: S(`<path d="M280 726 q18 14 38 0 L320 740 Z" fill="#d97706"/><path d="M306 734 q16 14 34 0 L342 745 Z" fill="#d97706"/>`), etiketler: ["yaz", "sahil"] },
  { id: "ayk_bot", ad: "Deri Kahve Ankle Bot", emoji: "🥾",
    svg: S(`<g fill="#78350f"><path d="M278 700 q18 14 38 0 l4 34 Z"/><path d="M304 705 q16 14 34 0 l4 34 Z"/></g>`), etiketler: ["kis", "modern"] },

  // Yeni Eklenen 1 Ayakkabı
  { id: "ayk_kar_cizme", ad: "Kürklü Kar Çizmesi", emoji: "👢",
    svg: S(`<g fill="#e2e8f0" stroke="#cbd5e1"><path d="M276 680 q20 14 40 0 l4 56 Z"/><path d="M302 685 q18 14 38 0 l4 56 Z"/></g>`), etiketler: ["kis", "kar"] }
];

/* ================================== TAKI (6 ADET) =================================== */
const TAKILAR = [
  { id: "kly_kalp", ad: "Zarif Kalp Yakut Kolye", emoji: "💗",
    svg: S(`<path d="M270 250 Q300 268 330 250" stroke="#ffd166" stroke-width="4.5" fill="none"/><circle cx="300" cy="270" r="8" fill="#e63946"/>`), etiketler: ["pembe", "balo", "dogumgunu"] },
  { id: "kly_inci", ad: "Asil İnci Kolye", emoji: "🦪",
    svg: S(`<path d="M270 250 Q300 272 330 250" stroke="#e2e8f0" stroke-width="6" fill="none"/>`), etiketler: ["balo", "gece", "altin"] },
  { id: "kly_kelebek", ad: "Sihirli Ametist Kolye", emoji: "🦋",
    svg: S(`<path d="M276 250 Q300 266 324 250" stroke="#bdb2ff" stroke-width="3" fill="none"/><circle cx="300" cy="268" r="6" fill="#7209b7"/>`), etiketler: ["mor", "peri", "bahce"] },
  
  // Batch 2 Eklenen 2 Kolye
  { id: "kly_altin", ad: "Zincir Altın Kolye", emoji: "🪙",
    svg: S(`<path d="M270 250 Q300 268 330 250" stroke="#fbbf24" stroke-width="4" fill="none"/>`), etiketler: ["modern", "altin"] },
  { id: "kly_choker", ad: "Siyah Kadife Choker", emoji: "🖤",
    svg: S(`<path d="M285 244 Q300 248 315 244" stroke="#0f172a" stroke-width="6" fill="none"/>`), etiketler: ["modern", "siyah"] },

  // Yeni Eklenen 1 Kolye
  { id: "kly_zumrut", ad: "Asil Zümrüt Kolye", emoji: "💚",
    svg: S(`<path d="M270 250 Q300 268 330 250" stroke="#fbbf24" stroke-width="3.5" fill="none"/><rect x="294" y="264" width="12" height="12" fill="#059669" transform="rotate(45 300 270)"/>`), etiketler: ["yesil", "saray"] }
];

/* ================================== SİHİRLİ ASALAR (6 ADET) ==================================== */
const ASALAR = [
  { id: "asa_yildiz", ad: "Kozmik Yıldız Asası", emoji: "🌟",
    svg: S(`<rect x="368" y="506" width="8" height="144" rx="4" fill="#ffd166"/><path d="M372 480 L382 498 L402 498 L386 510 L392 528 L372 516 L352 528 L358 510 L342 498 L362 498 Z" fill="#ffb703"/>`), etiketler: ["yildiz", "sihir", "turuncu"] },
  { id: "asa_kalp", ad: "Sihirli Kalp Asası", emoji: "💖",
    svg: S(`<rect x="368" y="506" width="8" height="144" rx="4" fill="#ffccd5"/><circle cx="364" cy="485" r="14" fill="#ff4d6d"/><circle cx="380" cy="485" r="14" fill="#ff4d6d"/><path d="M350 490 L372 514 L394 490 Z" fill="#ff4d6d"/>`), etiketler: ["kalp", "pembe", "sihir"] },
  { id: "asa_cicek", ad: "Doğa Çiçek Asası", emoji: "🌼",
    svg: S(`<rect x="368" y="506" width="8" height="144" rx="4" fill="#74c69d"/><circle cx="372" cy="485" r="16" fill="#ffd166"/><circle cx="372" cy="485" r="8" fill="#e76f51"/>`), etiketler: ["cicek", "bahce", "yaz"] },
  
  // Yeni 3 Asa
  { id: "asa_unicorn", ad: "Unicorn Sihir Asası", emoji: "🦄",
    svg: S(`<rect x="368" y="506" width="8" height="144" rx="4" fill="#fbcfe8"/><path d="M362 495 L372 455 L382 495 Z" fill="#c084fc"/>`), etiketler: ["sihir", "pembe"] },
  { id: "asa_ay", ad: "Hilal Ay Asası", emoji: "🌙",
    svg: S(`<rect x="368" y="506" width="8" height="144" rx="4" fill="#fbbf24"/><path d="M360 470 A 18 18 0 1 0 388 495 A 15 15 0 1 1 360 470 Z" fill="#f59e0b"/>`), etiketler: ["sihir", "gece"] },
  { id: "asa_kristal", ad: "Buz Kristali Asası", emoji: "❄️",
    svg: S(`<rect x="368" y="506" width="8" height="144" rx="4" fill="#bae6fd"/><path d="M356 485 L372 465 L388 485 L372 505 Z" fill="#38bdf8"/>`), etiketler: ["sihir", "buz"] }
];

/* ================================ ARKA PLANLAR (12 ADET) =============================== */
const ARKAPLANLAR = [
  { id: "ap_balo", ad: "Kraliyet Balo Salonu", emoji: "🏰",
    svg: S(`<rect width="600" height="800" fill="#d4a373"/><rect y="580" width="600" height="220" fill="#bc6c25"/><rect x="30" y="0" width="50" height="580" rx="5" fill="#fff1e0"/><rect x="520" y="0" width="50" height="580" rx="5" fill="#fff1e0"/>`), etiketler: ["saray", "balo"] },
  { id: "ap_bahce", ad: "Büyülü Çiçek Ormanı", emoji: "🌷",
    svg: S(`<rect width="600" height="800" fill="#bde0fe"/><circle cx="480" cy="150" r="60" fill="#fefae0" opacity="0.7"/><path d="M0 540 Q250 480 600 540 V800 H0 Z" fill="#52b788"/><path d="M0 600 Q300 560 600 600 V800 H0 Z" fill="#40916c"/>`), etiketler: ["bahce", "yaz", "peri"] },
  { id: "ap_buz", ad: "Işıltılı Kar Kalesi", emoji: "🏔️",
    svg: S(`<rect width="600" height="800" fill="#bae6fd"/><path d="M0 500 L180 250 L320 500 Z" fill="#38bdf8" opacity="0.8"/><rect y="580" width="600" height="220" fill="#f0f9ff"/>`), etiketler: ["buz", "kar", "kis", "mavi"] },
  { id: "ap_sahil", ad: "Altın Kum Gün Batımı", emoji: "🌅",
    svg: S(`<rect width="600" height="800" fill="#ffb703"/><circle cx="300" cy="340" r="70" fill="#ffd166"/><path d="M0 500 Q300 460 600 500 V800 H0 Z" fill="#0077b6"/><rect y="640" width="600" height="160" fill="#fcd0a1"/>`), etiketler: ["sahil", "yaz", "deniz"] },
  { id: "ap_gece", ad: "Yıldızlı Gece Gökyüzü", emoji: "🌙",
    svg: S(`<rect width="600" height="800" fill="#10002b"/><circle cx="460" cy="140" r="30" fill="#fefae0"/><path d="M0 640 Q300 600 600 640 V800 H0 Z" fill="#240046"/>`), etiketler: ["gece", "yildiz", "mor"] },
  { id: "ap_defile", ad: "Podyum Işıkları", emoji: "🎀",
    svg: S(`<rect width="600" height="800" fill="#ff758f"/><path d="M300 0 L100 600 H500 Z" fill="#ffffff" opacity="0.15"/><path d="M160 600 L440 600 L540 800 L60 800 Z" fill="#ff007f"/>`), etiketler: ["defile", "sahne", "pembe"] },
  
  // Yeni 6 Arka Plan (Toplam 12)
  { id: "ap_sehir", ad: "Şehir Sokakları", emoji: "🌆",
    svg: S(`<rect width="600" height="800" fill="#312e81"/><rect y="500" width="600" height="300" fill="#1e1b4b"/><rect x="80" y="200" width="120" height="300" fill="#475569"/><rect x="380" y="150" width="140" height="350" fill="#334155"/>`), etiketler: ["modern", "gece"] },
  { id: "ap_kafe", ad: "Sıcak Kafe", emoji: "☕",
    svg: S(`<rect width="600" height="800" fill="#78350f"/><rect y="550" width="600" height="250" fill="#451a03"/><rect x="100" y="300" width="150" height="120" rx="10" fill="#d97706"/><rect x="350" y="280" width="180" height="150" rx="10" fill="#b45309"/>`), etiketler: ["modern", "gunluk"] },
  { id: "ap_havuz", ad: "Yazlık Havuz", emoji: "🏊‍♀️",
    svg: S(`<rect width="600" height="800" fill="#38bdf8"/><path d="M0 450 Q300 400 600 450 V800 H0 Z" fill="#0284c7"/><rect y="680" width="600" height="120" fill="#e2e8f0"/>`), etiketler: ["yaz", "sahil"] },
  { id: "ap_uzay", ad: "Kozmik Uzay Rüyası", emoji: "🌌",
    svg: S(`<rect width="600" height="800" fill="#0f172a"/><circle cx="150" cy="200" r="80" fill="#ec4899" opacity="0.15"/><circle cx="450" cy="500" r="100" fill="#3b82f6" opacity="0.15"/>`), etiketler: ["sihir", "gece"] },
  { id: "ap_sinif", ad: "Okul Sınıfı", emoji: "🏫",
    svg: S(`<rect width="600" height="800" fill="#cbd5e1"/><rect y="550" width="600" height="250" fill="#64748b"/><rect x="100" y="200" width="400" height="250" fill="#475569"/><rect x="120" y="220" width="360" height="210" fill="#0f172a"/>`), etiketler: ["modern"] },
  { id: "ap_kutuphane", ad: "Antik Kütüphane", emoji: "📚",
    svg: S(`<rect width="600" height="800" fill="#451a03"/><rect x="50" y="50" width="150" height="700" fill="#78350f"/><rect x="400" y="50" width="150" height="700" fill="#78350f"/><rect y="600" width="600" height="200" fill="#3a1300"/>`), etiketler: ["gece", "saray"] }
];

/* ================================ GÖREVLER ================================= */
const GOREVLER = [
  { id: "g_dogumgunu", ad: "Doğum Günü Partisi Rüyası", emoji: "🎂",
    aciklama: "Göz alıcı pembe veya altın elbise ile partinin en şık mankeni ol!", gerek: ["dogumgunu"], yildiz: 2 },
  { id: "g_kar", ad: "Kar Kraliçesi Masalı", emoji: "❄️",
    aciklama: "Buz mavisi elbise + buz kristali tacı ile kış büyücüsünü tamamla!", gerek: ["buz", "kar"], yildiz: 3 },
  { id: "g_bahce", ad: "Bahçe Defilesi Şıklığı", emoji: "🌷",
    aciklama: "Çiçek tacı veya çiçekli desenler içeren taze bir kır stili yarat.", gerek: ["bahce"], yildiz: 2 },
  { id: "g_peri", ad: "Büyülü Orman Perisi", emoji: "🧚",
    aciklama: "Peri kanadı takıp eline de sihirli asayı alarak ormanı aydınlat!", gerek: ["peri"], yildiz: 3 },
  { id: "g_balo", ad: "Kraliyet Dans Gecesi", emoji: "👑",
    aciklama: "Kemerli balo elbisesi giy, başına altın bir taç tak ve podyuma çık!", gerek: ["balo", "tac"], yildiz: 3 },
  { id: "g_gece", ad: "Gece Büyüsü Asaleti", emoji: "🌙",
    aciklama: "Gece temalı şık ve asil bir kombini tamamlayarak gökyüzünü izle.", gerek: ["gece"], yildiz: 2 },
];

/* ============================= DIŞA AKTAR ================================== */
// Figürü sahneye oturtan yumuşak zemin gölgesi (ayak hizasında, bulanık elips)
const GOLGE_SVG = S(
  '<defs><filter id="golgeBulanik" x="-60%" y="-60%" width="220%" height="220%">' +
  '<feGaussianBlur stdDeviation="10"/></filter></defs>' +
  '<ellipse cx="300" cy="746" rx="128" ry="19" fill="#160d12" opacity="0.32" filter="url(#golgeBulanik)"/>'
);

const DOLAP = {
  mankenler: MANKENLER,
  vucut: VUCUT_SVG,
  golge: GOLGE_SVG,
  tenRenkleri: TEN_RENKLERI,
  sacRenkleri: SAC_RENKLERI,
  gozRenkleri: GOZ_RENKLERI,
  rujRenkleri: RUJ_RENKLERI,
  allikRenkleri: ALLIK_RENKLERI,
  
  slotlar: [
    { id: "arkaplanlar", ad: "Sahne Seç", emoji: "🏰", liste: ARKAPLANLAR, zorunlu: true },
    { id: "kanatlar", ad: "Kanatlar", emoji: "🦋", liste: KANATLAR },
    { id: "elbiseler", ad: "Elbise", emoji: "👗", liste: ELBISELER },
    { id: "ayakkabilar", ad: "Ayakkabı", emoji: "👠", liste: AYAKKABILAR },
    { id: "takilar", ad: "Kolyeler", emoji: "💎", liste: TAKILAR },
    { id: "saclar", ad: "Saç Stili", emoji: "💇", liste: SACLAR, zorunlu: true },
    { id: "taclar", ad: "Taç & Şapka", emoji: "👑", liste: TACLAR },
    { id: "asalar", ad: "Sihirli Asa", emoji: "✨", liste: ASALAR },
  ],
  gorevler: GOREVLER,
};

// Ayakkabı elbisenin ALTINDA: uzun elbise ayakkabıyı örter, kısa elbisede ayak görünür (doğru sıralama)
DOLAP.cizimSirasi = ["arkaplanlar", "_golge", "kanatlar", "_vucut", "ayakkabilar", "elbiseler", "takilar", "saclar", "taclar", "asalar"];

window.DOLAP = DOLAP;
