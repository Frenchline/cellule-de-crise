// ============================================================
// NÉGOCIATEUR — moteur de sprites pixel-art (100 % généré en code)
// Un sprite = { w, h, rows: [strings], palette: {char: couleur} }
// '.' = transparent. Rendu via ImageData + image-rendering:pixelated.
// ============================================================

export const PAL = {
  '.': null,      // transparent
  k: '#0b0e13',   // contour / noir
  w: '#e8e0cd',   // blanc cassé
  c: '#b3ac98',   // blanc cassé ombré (chemise, neige sale)
  s: '#d9a86c',   // peau claire
  S: '#a5713f',   // peau claire ombrée
  m: '#b0794e',   // peau mate
  M: '#7a4f2e',   // peau mate ombrée
  d: '#8a5a34',   // peau foncée
  D: '#54341d',   // peau foncée ombrée
  h: '#3d2c1c',   // cheveux bruns
  H: '#17130f',   // cheveux noirs
  g: '#8b8fa0',   // gris / métal
  G: '#4fbf67',   // vert (pharmacie, succès)
  V: '#2c6e3e',   // vert sombre
  a: '#ffb454',   // ambre (bougie, enseigne, gilet)
  r: '#e23b3b',   // rouge (danger, gyrophare)
  b: '#3b7de2',   // bleu (gyrophare, froid)
  n: '#1b2635',   // bleu nuit (murs)
  N: '#0e1520',   // nuit profonde
  o: '#c9b18a',   // kaki / lin (robe)
  O: '#8a6a4a',   // kaki ombré / bois
  u: '#46556b',   // uniforme bleu-gris
  U: '#2c3749',   // uniforme ombré / capuche
  j: '#d97b3f',   // orange détenu
  J: '#9c5426',   // orange ombré
  e: '#7a92b8',   // eau / pluie / verre
  t: '#22394f',   // mer
  f: '#ff7043',   // feu
  y: '#ffe08a',   // jaune (flammes, soleil)
  v: '#9fc0e8',   // verre de lunettes
  R: '#a8552f',   // roux
};

// ---------------- primitives ----------------
function G(w, h) { return Array.from({ length: h }, () => new Array(w).fill('.')); }
function px(g, x, y, c) { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; }
function rect(g, x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(g, i, j, c); }
function hl(g, x, y, n, c) { for (let i = 0; i < n; i++) px(g, x + i, y, c); }
function vl(g, x, y, n, c) { for (let i = 0; i < n; i++) px(g, x, y + i, c); }
function rows(g) { return g.map(r => r.join('')); }
function sprite(g) { return { w: g[0].length, h: g.length, rows: rows(g), palette: PAL }; }

// mini-font 3×5 pour « +N » dans les scènes
const FONT = {
  '+': ['010', '111', '010', '000', '000'],
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
};
function glyph(g, ch, x, y, c) {
  const f = FONT[ch];
  if (!f) return;
  f.forEach((r, j) => r.split('').forEach((b, i) => { if (b === '1') px(g, x + i, y + j, c); }));
}
function drawText(g, txt, x, y, c) { txt.split('').forEach((ch, i) => glyph(g, ch, x + i * 4, y, c)); }

// ---------------- rendu canvas ----------------
const rgbCache = {};
function rgbOf(hex) {
  if (!rgbCache[hex]) {
    rgbCache[hex] = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }
  return rgbCache[hex];
}

// Écrit le sprite dans un canvas (ImageData, échelle entière optionnelle)
export function renderSprite(canvas, sprite, scale = 1) {
  canvas.width = sprite.w * scale;
  canvas.height = sprite.h * scale;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(sprite.w, sprite.h);
  for (let y = 0; y < sprite.h; y++) {
    const row = sprite.rows[y];
    for (let x = 0; x < sprite.w; x++) {
      const hex = sprite.palette[row[x]];
      const o = (y * sprite.w + x) * 4;
      if (!hex) { img.data[o + 3] = 0; continue; }
      const [r, gg, b] = rgbOf(hex);
      img.data[o] = r; img.data[o + 1] = gg; img.data[o + 2] = b; img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  if (scale > 1) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, 0, 0, sprite.w, sprite.h, 0, 0, canvas.width, canvas.height);
  }
  return canvas;
}

export function spriteCanvas(sprite, scale = 1) {
  return renderSprite(document.createElement('canvas'), sprite, scale);
}

// ============================================================
// PORTRAITS 32×32 — composition procédurale par calques
// spec : { skin, hair, hairColor, beard, glasses, clothes, accessory, age }
// ============================================================

export const EXPRESSIONS = ['calme', 'tendu', 'furieux', 'abattu', 'parle'];
export const MOOD_LABELS = { calme: 'CALME', tendu: 'TENDU', furieux: 'FURIEUX', abattu: 'ABATTU', parle: '·' };

const SKIN = { clair: ['s', 'S'], mat: ['m', 'M'], fonce: ['d', 'D'] };
const HAIRC = { brun: 'h', noir: 'H', gris: 'g', blanc: 'w', roux: 'R', blond: 'y' };

export const PLAYER_PORTRAIT = {
  skin: 'mat', hair: 'court', hairColor: 'noir', beard: 'aucune',
  clothes: 'nego', accessory: 'radio', age: 'adulte',
};

const CLOTHES = {
  sweat:    { col: 'u', dark: 'U' },
  chemise:  { col: 'w', dark: 'c' },
  blouse:   { col: 'w', dark: 'c' },
  detenu:   { col: 'j', dark: 'J' },
  tactique: { col: 'n', dark: 'U' },
  nego:     { col: 'n', dark: 'U' },
  robe:     { col: 'o', dark: 'O' },
  uniforme: { col: 'u', dark: 'U' },
};

function drawClothes(g, s) {
  const c = CLOTHES[s.clothes] || CLOTHES.sweat;
  const rowW = [14, 17, 20, 22, 24, 26, 27, 28, 28];
  rowW.forEach((w, i) => { const x = 16 - Math.floor(w / 2); hl(g, x, 23 + i, w, c.col); });
  // ombre droite
  for (let i = 0; i < 9; i++) { const y = 23 + i; if (g[y][25] !== '.') { px(g, 24, y, c.dark); px(g, 23, y, i > 3 ? c.dark : c.col); } }
  switch (s.clothes) {
    case 'chemise':
      px(g, 14, 22, 'w'); px(g, 15, 22, 'c'); px(g, 17, 22, 'w'); px(g, 16, 22, 'k');
      for (let y = 25; y <= 30; y += 2) px(g, 16, y, 'k');
      break;
    case 'blouse':
      px(g, 14, 22, 'c'); px(g, 17, 22, 'c');
      vl(g, 11, 24, 3, 'G'); hl(g, 10, 25, 3, 'G');   // croix verte au col
      for (let y = 25; y <= 30; y += 2) px(g, 16, y, 'c');
      break;
    case 'detenu':
      hl(g, 5, 27, 22, 'J');                          // bande poitrine
      break;
    case 'tactique':
      rect(g, 11, 24, 10, 4, 'U');                    // plaque balistique
      px(g, 12, 25, 'g'); px(g, 19, 25, 'g');
      px(g, 12, 27, 'a');                             // voyant radio
      break;
    case 'nego':
      rect(g, 11, 24, 10, 4, 'U');                    // plaque balistique
      px(g, 12, 25, 'g'); px(g, 19, 25, 'g');
      px(g, 12, 27, 'a');                             // voyant radio
      hl(g, 6, 28, 20, 'e');                          // bande réfléchissante
      px(g, 7, 28, 'w'); px(g, 15, 28, 'w'); px(g, 23, 28, 'w');
      hl(g, 6, 24, 4, 'e'); hl(g, 22, 24, 4, 'e');    // bandes épaules
      break;
    case 'robe':
      vl(g, 16, 23, 9, 'O');                          // fermeture centrale
      px(g, 16, 22, 'O');
      break;
    case 'uniforme':
      hl(g, 6, 23, 5, 'g'); hl(g, 21, 23, 5, 'g');    // épaulettes
      px(g, 16, 25, 'k'); px(g, 16, 27, 'k'); px(g, 16, 29, 'k');
      break;
    default: // sweat — capuche visible derrière le cou
      px(g, 10, 22, 'U'); px(g, 11, 22, 'U'); px(g, 20, 22, 'U'); px(g, 21, 22, 'U');
      rect(g, 13, 29, 6, 2, 'U');                     // poche kangourou
  }
}

function drawFace(g, expr, sk, sh, hcol, female = false) {
  const e = expr === 'parle' ? 'calme' : expr;
  // ---- sourcils (y 9-10) — plus fins chez les femmes ----
  const bw = female ? 3 : 4;      // largeur sourcil
  const bl = female ? 13 : 12;    // bord gauche
  const br = female ? 17 : 16;    // bord droit
  if (e === 'furieux') {          // froncés vers le centre
    hl(g, bl, 9, bw - 1, hcol); px(g, bl + bw - 1, 10, hcol);
    hl(g, br + 1, 9, bw - 1, hcol); px(g, br, 10, hcol);
  } else if (e === 'tendu') {     // relevés au centre
    px(g, bl, 10, hcol); hl(g, bl + 1, 9, Math.max(1, bw - 2), hcol); px(g, bl + bw - 1, 9, hcol);
    px(g, br + bw - 1, 10, hcol); hl(g, br, 9, Math.max(1, bw - 2), hcol); px(g, br, 9, hcol);
  } else if (e === 'abattu') {    // tombants vers le centre
    px(g, bl, 9, hcol); hl(g, bl + 1, 10, Math.max(1, bw - 2), hcol); px(g, bl + bw - 1, 10, hcol);
    px(g, br + bw - 1, 9, hcol); hl(g, br, 10, Math.max(1, bw - 2), hcol); px(g, br + 1, 10, hcol);
  } else {                        // calme : droits
    hl(g, bl, 9, bw, hcol); hl(g, br, 9, bw, hcol);
  }
  // ---- yeux (y 10-11) ----
  const eyeL = 12, eyeR = 17;
  if (e === 'tendu') {            // écarquillés
    rect(g, eyeL, 10, 3, 2, 'w'); rect(g, eyeR, 10, 3, 2, 'w');
    px(g, 13, 11, 'k'); px(g, 18, 11, 'k');
  } else if (e === 'furieux') {   // plissés sous paupière
    px(g, eyeL, 10, sh); px(g, eyeL + 1, 10, sh); px(g, eyeL + 2, 10, sh);
    px(g, eyeR, 10, sh); px(g, eyeR + 1, 10, sh); px(g, eyeR + 2, 10, sh);
    px(g, eyeL, 11, 'w'); px(g, eyeL + 1, 11, 'k'); px(g, eyeL + 2, 11, 'w');
    px(g, eyeR, 11, 'w'); px(g, eyeR + 1, 11, 'k'); px(g, eyeR + 2, 11, 'w');
  } else if (e === 'abattu') {    // paupières lourdes
    px(g, eyeL, 11, 'w'); px(g, eyeL + 1, 11, 'k'); px(g, eyeL + 2, 11, sh);
    px(g, eyeR, 11, sh); px(g, eyeR + 1, 11, 'k'); px(g, eyeR + 2, 11, 'w');
    px(g, eyeL + 2, 12, sh); px(g, eyeR, 12, sh);
  } else {                        // calme / parle
    px(g, eyeL, 11, 'w'); px(g, eyeL + 1, 11, 'k'); px(g, eyeL + 2, 11, 'w');
    px(g, eyeR, 11, 'w'); px(g, eyeR + 1, 11, 'k'); px(g, eyeR + 2, 11, 'w');
  }
  if (female) {                   // cils
    px(g, 11, 10, hcol); px(g, 20, 10, hcol);
  }
  // ---- nez ----
  px(g, 15, 13, sh); px(g, 15, 14, sh); px(g, 14, 15, sh); px(g, 16, 15, sh);
  // ---- bouche ----
  const lip = female ? 'R' : 'k';
  if (expr === 'parle') {         // bouche ouverte (animation)
    hl(g, 14, 15, 4, 'w');        // dents
    rect(g, 13, 16, 6, 2, 'r');   // intérieur
    px(g, 13, 15, 'k'); px(g, 18, 15, 'k');
  } else if (e === 'furieux') {   // grimace ouverte
    px(g, 12, 15, 'k'); px(g, 19, 15, 'k');
    hl(g, 13, 16, 6, 'r'); hl(g, 14, 17, 4, 'k');
  } else if (e === 'tendu') {     // mâchoire serrée
    hl(g, 12, 16, 8, lip);
  } else if (e === 'abattu') {    // coins tombants
    px(g, 13, 17, lip); hl(g, 14, 16, 4, lip); px(g, 18, 17, lip);
  } else {                        // calme : fine ligne
    px(g, 12, 16, sh); hl(g, 13, 16, 6, lip); px(g, 19, 16, sh);
  }
}

function drawHair(g, hair, hcol, s) {
  const [sk] = SKIN[s.skin] || SKIN.mat;
  switch (hair) {
    case 'chauve':
      px(g, 10, 8, hcol); px(g, 21, 8, hcol);        // tempes
      px(g, 14, 5, 'w');                              // reflet crâne
      break;
    case 'long':
      rect(g, 10, 3, 12, 4, hcol);
      px(g, 10, 7, hcol); px(g, 21, 7, hcol);
      rect(g, 8, 6, 2, 11, hcol); rect(g, 22, 6, 2, 11, hcol);  // mèches le long du visage
      break;
    case 'queue':                                    // queue de cheval (femme)
      rect(g, 10, 3, 12, 4, hcol);
      px(g, 10, 7, hcol); px(g, 21, 7, hcol);
      px(g, 10, 8, hcol); px(g, 21, 8, hcol);
      px(g, 23, 8, 'g'); px(g, 24, 8, 'g');          // élastique
      rect(g, 23, 9, 2, 10, hcol);                   // queue retombante
      px(g, 24, 9, hcol); px(g, 24, 10, hcol);
      px(g, 23, 19, hcol);                           // pointe
      break;
    case 'chignon':                                  // chignon (femme)
      rect(g, 10, 3, 12, 3, hcol);
      px(g, 10, 6, hcol); px(g, 21, 6, hcol);
      px(g, 10, 7, hcol); px(g, 21, 7, hcol);
      rect(g, 19, 1, 5, 3, hcol);                    // chignon haut-droit
      px(g, 20, 0, hcol); px(g, 21, 0, hcol); px(g, 22, 0, hcol);
      px(g, 24, 2, hcol);
      break;
    case 'voile':                                    // voile simple (communauté)
      rect(g, 9, 2, 14, 5, 'w');                     // dessus du voile
      rect(g, 8, 5, 3, 16, 'w'); rect(g, 21, 5, 3, 16, 'w'); // côtés encadrant le visage
      px(g, 10, 6, 'w'); px(g, 21, 6, 'w');
      rect(g, 9, 20, 14, 2, 'w'); rect(g, 8, 22, 16, 2, 'w'); // tombé sur les épaules
      vl(g, 23, 6, 14, 'c'); hl(g, 9, 21, 13, 'c');  // ombre
      px(g, 9, 3, 'c'); px(g, 22, 3, 'c');
      break;
    case 'capuche':
      rect(g, 7, 1, 18, 5, 'U');
      rect(g, 7, 6, 3, 13, 'U'); rect(g, 22, 6, 3, 13, 'U');
      px(g, 8, 19, 'U'); px(g, 23, 19, 'U');
      break;
    case 'cagoule':
      rect(g, 9, 3, 14, 16, 'U');                     // cagoule intégrale
      rect(g, 11, 10, 10, 3, sk);                     // fente des yeux
      px(g, 12, 11, 'w'); px(g, 13, 11, 'k'); px(g, 14, 11, 'w');
      px(g, 17, 11, 'w'); px(g, 18, 11, 'k'); px(g, 19, 11, 'w');
      px(g, 13, 16, 'k'); px(g, 18, 16, 'k');         // respiration
      px(g, 9, 5, 'g');                               // surpiqûre
      break;
    case 'casquette':
      rect(g, 10, 3, 12, 3, 'u');
      hl(g, 8, 6, 16, 'u');                           // visière
      px(g, 15, 2, 'u'); px(g, 16, 2, 'u');
      break;
    default: // 'court'
      rect(g, 10, 3, 12, 3, hcol);
      px(g, 10, 6, hcol); px(g, 21, 6, hcol);
      px(g, 10, 7, hcol); px(g, 21, 7, hcol);
  }
}

function drawBeard(g, beard, hcol) {
  if (!beard || beard === 'aucune') return;
  rect(g, 10, 15, 2, 4, hcol); rect(g, 20, 15, 2, 4, hcol);  // favoris / joues
  hl(g, 11, 18, 10, hcol); hl(g, 12, 19, 8, hcol);           // mâchoire
  px(g, 13, 17, hcol); px(g, 18, 17, hcol);
  if (beard === 'longue') {
    hl(g, 13, 20, 6, hcol); rect(g, 14, 21, 4, 1, hcol);
  }
}

function drawGlasses(g) {
  // monture sur les yeux (y 10-12)
  hl(g, 11, 10, 4, 'k'); hl(g, 17, 10, 4, 'k');
  vl(g, 11, 10, 3, 'k'); vl(g, 14, 10, 3, 'k');
  vl(g, 17, 10, 3, 'k'); vl(g, 20, 10, 3, 'k');
  px(g, 15, 10, 'k'); px(g, 16, 10, 'k');            // pont
  px(g, 12, 11, 'v'); px(g, 13, 11, 'v'); px(g, 18, 11, 'v'); px(g, 19, 11, 'v');
}

function drawAccessory(g, acc, hcol) {
  switch (acc) {
    case 'scar':
      px(g, 18, 13, 'r'); px(g, 19, 14, 'r');
      break;
    case 'radio':
      rect(g, 11, 1, 10, 2, 'k');                     // arceau
      rect(g, 7, 10, 3, 5, 'k'); rect(g, 22, 10, 3, 5, 'k'); // écouteurs
      px(g, 8, 11, 'g'); px(g, 23, 11, 'g');
      px(g, 9, 15, 'k'); px(g, 10, 16, 'k'); px(g, 11, 16, 'k'); // perche micro
      px(g, 12, 16, 'a');                             // embout du micro
      break;
    case 'bandana':
      hl(g, 10, 7, 12, 'r'); px(g, 21, 6, 'r'); px(g, 22, 7, 'r'); px(g, 22, 8, 'r');
      break;
    case 'pendentif':
      px(g, 15, 24, 'a'); px(g, 16, 24, 'a');
      px(g, 15, 25, 'a'); px(g, 16, 25, 'a');
      hl(g, 14, 25, 4, 'a');
      px(g, 15, 26, 'a'); px(g, 16, 26, 'a');
      break;
  }
}

export function portraitSprite(spec = {}, expr = 'calme') {
  if (!EXPRESSIONS.includes(expr)) expr = 'calme';
  const g = G(32, 32);
  const [sk, sh] = SKIN[spec.skin] || SKIN.mat;
  const hcol = HAIRC[spec.hairColor] || (spec.age === 'âgé' ? 'g' : 'h');
  const female = spec.sex === 'f';

  drawClothes(g, spec);
  rect(g, 13, 19, 6, 4, sk);                          // cou
  px(g, 13, 19, sh); px(g, 18, 19, sh);
  rect(g, 10, 5, 12, 12, sk);                         // visage y5..16
  if (female) {
    rect(g, 12, 17, 8, 1, sk);                        // mâchoire plus fine
    rect(g, 13, 18, 6, 1, sk);                        // menton
  } else {
    rect(g, 11, 17, 10, 1, sk);                       // mâchoire
    rect(g, 12, 18, 8, 1, sk);                        // menton
  }
  px(g, 9, 11, sk); px(g, 9, 12, sk);                 // oreilles
  px(g, 22, 11, sk); px(g, 22, 12, sk);
  for (let y = 8; y <= 16; y++) px(g, 21, y, sh);     // ombre droite
  px(g, 20, 17, sh);
  if (spec.age === 'âgé') {                           // rides
    px(g, 13, 6, sh); px(g, 14, 6, sh); px(g, 17, 6, sh); px(g, 18, 6, sh);
    px(g, 12, 7, sh); px(g, 19, 7, sh);
    px(g, 11, 12, sh); px(g, 20, 12, sh);             // pattes d'oie
    px(g, 13, 14, sh); px(g, 18, 14, sh);             // sillons
  }

  const covered = spec.hair === 'cagoule';
  if (!covered) {
    drawFace(g, expr, sk, sh, hcol, female);
    if (!female) drawBeard(g, spec.beard, hcol);
  }
  drawHair(g, spec.hair || 'court', hcol, spec);
  if (spec.glasses && !covered) drawGlasses(g);
  drawAccessory(g, spec.accessory, hcol);
  return sprite(g);
}

// ============================================================
// SCÈNES 224×64 — fonds de « caméra de surveillance » plein cadre
// sceneSprite(nom, frame) ; frame anime pluie/neige/ECG/vagues/flamme
// ============================================================

function drawHostages(g, n, x0, y0) {
  const shown = Math.min(n, 8);
  for (let i = 0; i < shown; i++) {
    const x = x0 + i * 6;
    px(g, x, y0, 'k'); px(g, x + 1, y0, 'k');              // tête
    rect(g, x - 1, y0 + 1, 4, 4, 'k');                     // buste
    px(g, x, y0 + 5, 'k'); px(g, x + 1, y0 + 5, 'k');
  }
  if (n > 8) {
    drawText(g, `+${Math.min(n - 8, 99)}`, x0 + shown * 6 + 2, y0 + 1, 'w');
  }
}

function scenePharmacie(g, f, hostageN) {
  const W = g[0].length;
  rect(g, 0, 0, W, 64, 'n');
  rect(g, 0, 56, W, 8, 'U');                              // sol
  // fenêtre de nuit + pluie (à droite)
  rect(g, W - 44, 8, 40, 32, 'N');
  for (let x = W - 42; x < W - 8; x += 5) {
    const y = 9 + ((x * 7 + f * 5) % 28);
    vl(g, x, y, 4, 'e');
  }
  hl(g, W - 46, 40, 44, 'g');                             // appui de fenêtre
  // rayonnages
  for (let r = 0; r < 3; r++) {
    const y = 18 + r * 12;
    hl(g, 6, y + 6, 92, 'O');
    for (let i = 0; i < 15; i++) {
      const c = ['w', 'G', 'b', 'w', 'g'][(i + r) % 5];
      rect(g, 8 + i * 6, y + 2 + (i % 2), 4, 4 - (i % 2), c);
    }
  }
  // croix de pharmacie clignotante
  const cc = f % 2 ? 'G' : 'V';
  rect(g, W - 60, 2, 12, 12, 'N');
  vl(g, W - 55, 4, 8, cc); hl(g, W - 58, 7, 8, cc);
  // comptoir
  rect(g, 4, 46, 74, 10, 'O'); hl(g, 4, 46, 74, 'o');
  drawHostages(g, hostageN, 112, 48);
}

function sceneBanque(g, f, hostageN) {
  const W = g[0].length, cx = Math.floor(W / 2);
  rect(g, 0, 0, W, 64, 'N');
  rect(g, 0, 6, W, 50, 'n');                              // façade
  rect(g, 0, 58, W, 6, 'U');                              // trottoir
  // enseigne éclairée (centrée)
  rect(g, cx - 28, 8, 56, 10, 'k'); rect(g, cx - 26, 10, 52, 6, 'a');
  // fenêtres
  for (let i = 0; i < 4; i++) {
    rect(g, 14 + i * 12, 22, 8, 14, 'N');
    if ((i + f) % 3 === 0) px(g, 16 + i * 12, 26, 'a');
  }
  for (let i = 0; i < 3; i++) rect(g, W - 38 + i * 12, 22, 8, 14, 'N');
  // rideau de fer à moitié baissé (centré)
  for (let y = 26; y < 48; y += 3) hl(g, cx - 28, y, 56, 'g');
  hl(g, cx - 28, 48, 56, 'k');
  rect(g, cx - 30, 22, 4, 36, 'U'); rect(g, cx + 28, 22, 4, 36, 'U');
  drawHostages(g, hostageN, cx - 14, 50);
  // lueur gyrophare alternée sur les bords
  const gc = f % 2 ? 'r' : 'b';
  vl(g, 0, 40, 16, gc); vl(g, 1, 44, 8, gc);
  vl(g, W - 1, 40, 16, f % 2 ? 'b' : 'r'); vl(g, W - 2, 44, 8, f % 2 ? 'b' : 'r');
}

function sceneHopital(g, f, hostageN) {
  const W = g[0].length;
  rect(g, 0, 0, W, 64, 'n');
  rect(g, 0, 56, W, 8, 'U');
  rect(g, 0, 0, W, 6, 'U');                               // plafond
  for (const x of [20, 70, 120, 170]) {
    if ((x + f * 10) % 90 < 80) { hl(g, x, 4, 16, 'w'); hl(g, x, 5, 16, 'c'); }
  }
  // portes du couloir
  for (const x of [26, 76, 136]) {
    rect(g, x, 18, 18, 38, 'N'); rect(g, x - 1, 16, 20, 2, 'g');
    px(g, x + 14, 36, 'g');
  }
  // lit / brancard à gauche
  rect(g, 2, 44, 18, 8, 'w'); px(g, 4, 42, 'w'); px(g, 16, 42, 'w');
  // moniteur ECG animé (à droite)
  rect(g, W - 34, 12, 30, 22, 'k'); rect(g, W - 32, 14, 26, 16, 'N');
  const ecg = [0, 0, -2, 1, -1, 4, -6, 4, -1, 0, 0, 0, -1, 1, 0, 0];
  for (let i = 0; i < 24; i++) {
    const idx = (i + f * 2) % ecg.length;
    px(g, W - 31 + i, 22 - Math.round(ecg[idx]), 'G');
  }
  px(g, W - 32, 32, 'g'); px(g, W - 32, 33, 'g');
  drawHostages(g, hostageN, 100, 48);
}

function sceneFerme(g, f, hostageN, variant) {
  const W = g[0].length, cx = Math.floor(W / 2);
  if (variant === 'aube') {
    rect(g, 0, 0, W, 24, 'N');
    rect(g, 0, 24, W, 12, 't');
    rect(g, 0, 36, W, 10, 'a');                            // horizon levant
    rect(g, 134, 38, 10, 6, 'y');                          // soleil
  } else {
    rect(g, 0, 0, W, 46, 'N');
    for (const [x, y] of [[14, 8], [40, 14], [70, 6], [120, 12], [148, 20], [30, 24], [175, 6], [200, 14]]) {
      px(g, x, y, 'w');
    }
    // neige qui tombe
    for (let i = 0; i < 30; i++) {
      const x = (i * 37 + f * 3) % W;
      const y = (i * 23 + f * 2) % 46;
      px(g, x, y, 'w');
    }
  }
  // sapins
  for (const tx of [8, 22, W - 84, W - 68, W - 32, W - 16]) {
    for (let r = 0; r < 4; r++) hl(g, tx - r - 1, 30 + r * 5, r * 2 + 4, 'N');
    px(g, tx, 48, 'k'); px(g, tx, 49, 'k');
  }
  // grange (centrée)
  rect(g, cx - 26, 30, 52, 26, 'h');
  for (let i = 0; i < 12; i++) hl(g, cx - i - 1, 30 - i, 2 + i * 2, 'k'); // toit
  hl(g, cx - 28, 19, 56, 'k');
  rect(g, cx - 8, 44, 16, 12, 'k');                        // porte
  const win = f % 2 ? 'a' : 'y';                           // bougies qui vacillent
  rect(g, cx - 20, 36, 6, 6, win); rect(g, cx + 14, 36, 6, 6, win);
  // sol enneigé
  rect(g, 0, 56, W, 8, 'w');
  for (let i = 0; i < 13; i++) px(g, i * 17, 57 + (i % 2), 'c');
  drawHostages(g, hostageN, cx + 38, 48);
}

function scenePrison(g, f, hostageN, variant) {
  const W = g[0].length;
  rect(g, 0, 0, W, 64, 'n');
  rect(g, 0, 56, W, 8, 'U');
  // cellules / barreaux
  for (let x = 8; x < W - 12; x += 14) {
    rect(g, x, 10, 10, 44, 'N');
    for (let b = 0; b < 4; b++) vl(g, x + 1 + b * 3, 10, 44, 'g');
    hl(g, x, 10, 10, 'g'); hl(g, x, 53, 10, 'g');
  }
  // néon qui grésille
  const nx = Math.floor(W / 2) - 14;
  if (f % 4 !== 3) { hl(g, nx, 4, 28, 'w'); hl(g, nx, 5, 28, 'c'); }
  else hl(g, nx, 4, 28, 'g');
  if (variant === 'feu') {
    // fumée en haut à droite
    for (const [x, y, w] of [[W - 50, 6, 30], [W - 38, 12, 26], [W - 28, 18, 20]]) {
      hl(g, x + (f % 3), y, w, 'g');
    }
    // lueur incendie bas droite
    for (let i = 0; i < 8; i++) {
      const x = W - 30 + i * 3;
      const h = 4 + ((i + f) % 3) * 3;
      vl(g, x, 56 - h, h, i % 2 ? 'f' : 'y');
    }
    px(g, W - 18, 50, 'y'); px(g, W - 24, 52, 'y');
    drawHostages(g, hostageN, 90, 46);
  } else {
    drawHostages(g, hostageN, 90, 46);
  }
}

function sceneFerry(g, f, hostageN, variant) {
  const W = g[0].length;
  rect(g, 0, 0, W, 40, 'N');
  px(g, W - 30, 6, 'w'); px(g, W - 29, 6, 'w'); px(g, W - 30, 7, 'w'); px(g, W - 29, 7, 'w'); // lune
  for (const [x, y] of [[20, 10], [55, 6], [90, 14], [130, 8], [170, 12]]) px(g, x, y, 'w');
  // mer
  rect(g, 0, 38, W, 26, 't');
  for (const [wy, amp] of [[42, 6], [50, 8], [58, 10]]) {
    for (let x = 0; x < W; x += amp * 2) {
      const off = (f % 4) * 2;
      hl(g, x + ((x / amp + f) % 2 ? off : -off), wy + ((x + f) % 3 ? 0 : 1), amp, 'e');
    }
  }
  // superstructure du navire
  rect(g, 4, 18, 40, 20, 'U');
  for (let i = 0; i < 5; i++) px(g, 8 + i * 7, 22, 'a');
  hl(g, 4, 18, 40, 'g');
  // pont : rambardes
  hl(g, 0, 44, W, 'g'); hl(g, 0, 50, W, 'g');
  for (let x = 2; x < W; x += 10) vl(g, x, 44, 14, 'g');
  rect(g, 0, 58, W, 6, 'N');                               // plat-bord
  if (variant === 'mer') {
    // pleine mer : pas de port, vagues plus hautes
    for (let i = 0; i < 8; i++) px(g, 60 + i * 16, 40 - (i % 3), 'e');
  } else {
    // lumières du port à droite
    for (let i = 0; i < 7; i++) px(g, W - 54 + i * 6, 33 + (i % 3), i % 3 ? 'a' : 'w');
    // grue
    vl(g, W - 16, 14, 22, 'k'); hl(g, W - 22, 14, 16, 'k'); vl(g, W - 8, 14, 8, 'k');
    px(g, W - 8, 22, 'r');
    // lueur gyrophare
    const gc = f % 2 ? 'r' : 'b';
    vl(g, 0, 36, 12, gc);
  }
  drawHostages(g, hostageN, 100, 46);
}

const SCENES = {
  pharmacie: (g, f, n) => scenePharmacie(g, f, n),
  banque: (g, f, n) => sceneBanque(g, f, n),
  hopital: (g, f, n) => sceneHopital(g, f, n),
  ferme: (g, f, n) => sceneFerme(g, f, n, null),
  ferme_aube: (g, f, n) => sceneFerme(g, f, n, 'aube'),
  prison: (g, f, n) => scenePrison(g, f, n, null),
  prison_feu: (g, f, n) => scenePrison(g, f, n, 'feu'),
  ferry: (g, f, n) => sceneFerry(g, f, n, null),
  ferry_mer: (g, f, n) => sceneFerry(g, f, n, 'mer'),
};

export const SCENE_NAMES = Object.keys(SCENES);

export function sceneSprite(name, frame = 0, hostages = 0) {
  const g = G(224, 64);
  const fn = SCENES[name] || SCENES.pharmacie;
  fn(g, frame | 0, hostages || 0);
  return sprite(g);
}

// ============================================================
// VIGNETTES 128×72 — illustrations d'événements
// ============================================================

function vigBase(c1, c2) {
  const g = G(128, 72);
  rect(g, 0, 0, 128, 36, c1); rect(g, 0, 36, 128, 36, c2);
  return g;
}

function vigFigure(g, x, y, c) {
  // silhouette debout ~7×16
  rect(g, x + 2, y, 4, 4, c);          // tête
  rect(g, x, y + 4, 8, 8, c);          // buste
  vl(g, x + 1, y + 12, 6, c); vl(g, x + 6, y + 12, 6, c); // jambes
}

const VIGNETTES = {
  terror(g, f) {
    rect(g, 0, 0, 128, 46, 'N');
    for (let i = 0; i < 12; i++) px(g, (i * 31 + f * 4) % 128, (i * 17) % 40, 'w'); // pluie
    rect(g, 0, 46, 128, 26, 'k');
    for (let i = 0; i < 6; i++) rect(g, i * 24 + 6, 34 - (i % 3) * 6, 16, 12 + (i % 3) * 6, 'N');
    // grand « ! » rouge
    rect(g, 60, 12, 8, 26, 'r'); rect(g, 60, 42, 8, 8, 'r');
    px(g, 59, 11, 'w'); px(g, 68, 11, 'w');
    // teinte rouge sur les bords
    vl(g, 0, 0, 72, 'r'); vl(g, 127, 0, 72, 'r'); vl(g, 1, 0, 20, 'r'); vl(g, 126, 0, 20, 'r');
  },
  freed(g, f) {
    rect(g, 0, 0, 128, 72, 'N');
    rect(g, 0, 60, 128, 12, 'U');
    // porte ouverte = lumière
    rect(g, 50, 12, 28, 48, 'k');
    rect(g, 52, 14, 24, 46, f % 2 ? 'a' : 'y');
    // silhouette qui sort
    vigFigure(g, 58, 26, 'k');
    // cône de lumière au sol
    for (let i = 0; i < 5; i++) hl(g, 46 - i * 2, 62 + i, 36 + i * 4, i < 2 ? 'a' : 'O');
    vigFigure(g, 96, 34, 'k'); vigFigure(g, 108, 38, 'k');   // autres otages
  },
  death(g, f) {
    rect(g, 0, 0, 128, 72, 'N');
    // fenêtre
    rect(g, 40, 10, 36, 30, 'U'); rect(g, 42, 12, 32, 26, 'n');
    hl(g, 42, 24, 32, 'U'); vl(g, 58, 12, 26, 'U');
    // éclair de tir (pas de sang)
    if (f % 2 === 0) {
      px(g, 66, 20, 'y'); px(g, 67, 20, 'y'); px(g, 68, 19, 'y'); px(g, 68, 21, 'y');
      px(g, 69, 18, 'w'); px(g, 69, 22, 'w');
    }
    // silhouette qui tombe (de côté)
    rect(g, 84, 44, 12, 4, 'k'); px(g, 82, 42, 'k'); px(g, 83, 43, 'k');
    rect(g, 90, 48, 8, 3, 'k');
    // bords rouges (flash de l'écran)
    rect(g, 0, 0, 128, 3, 'r'); rect(g, 0, 69, 128, 3, 'r');
    vl(g, 0, 0, 72, 'r'); vl(g, 127, 0, 72, 'r');
  },
  assault(g, f) {
    rect(g, 0, 0, 128, 46, 'N');
    rect(g, 0, 46, 128, 26, 'k');
    // trois silhouettes tactiques qui avancent
    for (const [x, y] of [[24, 30], [56, 34], [88, 30]]) {
      vigFigure(g, x, y, 'k');
      px(g, x + 3, y + 4, 'U'); px(g, x + 4, y + 4, 'U');   // gilets
      hl(g, x - 4, y + 8, 12, 'k');                          // armes
    }
    // flashs d'angles alternés
    const c = f % 2 ? 'w' : 'y';
    px(g, 2, 2, c); px(g, 3, 2, c); px(g, 2, 3, c);
    px(g, 125, 2, c); px(g, 124, 2, c); px(g, 125, 3, c);
  },
  surrender(g, f) {
    rect(g, 0, 0, 128, 46, 'n');
    rect(g, 0, 46, 128, 26, 'U');
    // figure mains levées
    const x = 60, y = 24;
    rect(g, x + 2, y, 4, 4, 'k');
    rect(g, x, y + 4, 8, 8, 'k');
    vl(g, x - 2, y - 4, 10, 'k'); vl(g, x + 9, y - 4, 10, 'k');  // bras levés
    vl(g, x + 1, y + 12, 6, 'k'); vl(g, x + 6, y + 12, 6, 'k');
    // gyrophares alternés
    rect(g, 8, 54, 30, 6, f % 2 ? 'r' : 'b');
    rect(g, 90, 54, 30, 6, f % 2 ? 'b' : 'r');
    px(g, 64, 66, 'w'); px(g, 63, 66, 'w');
  },
  heureh(g, f) {
    rect(g, 0, 0, 128, 72, 'N');
    // horloge
    const cx = 64, cy = 34;
    for (let a = 0; a < 32; a++) {
      const t = a / 32 * Math.PI * 2;
      px(g, Math.round(cx + Math.cos(t) * 20), Math.round(cy + Math.sin(t) * 20), 'g');
    }
    for (let a = 0; a < 28; a++) {
      const t = a / 28 * Math.PI * 2;
      px(g, Math.round(cx + Math.cos(t) * 17), Math.round(cy + Math.sin(t) * 17), 'N');
    }
    // aiguilles : presque minuit
    vl(g, cx, cy - 14, 14, 'w'); px(g, cx - 1, cy - 13, 'w');
    px(g, cx + 1, cy - 12, 'w'); px(g, cx + 2, cy - 11, 'w'); px(g, cx + 3, cy - 10, 'w');
    px(g, cx, cy, 'r');
    // tic tac rouge clignotant
    if (f % 2) { px(g, cx, cy - 18, 'r'); }
  },
  acte(g, f) {
    rect(g, 0, 0, 128, 40, 'N');
    rect(g, 0, 40, 128, 12, 't');
    rect(g, 0, 52, 128, 20, 'a');
    rect(g, 56, 44, 16, 10, 'y');                             // soleil levant
    // silhouettes de bâtiments / grille
    for (let i = 0; i < 5; i++) rect(g, 8 + i * 26, 46, 14, 8, 'k');
  },
  clue(g, f) {
    rect(g, 0, 0, 128, 72, 'N');
    // feuille de dossier penchée (approx droite)
    rect(g, 40, 14, 48, 46, 'w');
    rect(g, 40, 14, 48, 6, 'c');
    for (let i = 0; i < 5; i++) hl(g, 46, 26 + i * 6, 30 - (i % 3) * 6, 'c');
    // tampon
    rect(g, 60, 40, 20, 10, 'r');
    px(g, 61, 41, 'w'); px(g, 78, 48, 'w');
    hl(g, 60, 40, 20, 'r'); hl(g, 60, 49, 20, 'r');
  },
};

export const VIGNETTE_NAMES = Object.keys(VIGNETTES);

export function vignetteSprite(kind, frame = 0) {
  const g = G(128, 72);
  const fn = VIGNETTES[kind] || VIGNETTES.terror;
  fn(g, frame | 0);
  return sprite(g);
}

// ---------------- validation (tests) ----------------
export function validateSprite(spr) {
  const errs = [];
  if (!spr || typeof spr !== 'object') return ['sprite invalide'];
  if (spr.rows.length !== spr.h) errs.push(`h=${spr.h} mais ${spr.rows.length} lignes`);
  spr.rows.forEach((r, i) => {
    if (r.length !== spr.w) errs.push(`ligne ${i} : ${r.length} ≠ w=${spr.w}`);
    for (const ch of r) if (!(ch in spr.palette)) errs.push(`caractère inconnu '${ch}' ligne ${i}`);
  });
  return errs;
}
