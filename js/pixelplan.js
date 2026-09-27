// ============================================================
// pixelplan.js — plans tactiques vus de dessus, 160×96 procédural.
// planSprite(sceneBase, info, frame) :
//   info = { held, planKnown, sniperPost }
// Murs 'g', intérieur 'n', mobilier 'O'/'U', otages 'w' (ou zone « ? »
// grise tant que le plan n'est pas établi), preneur 'r' clignotant,
// entrées étiquetées A/B/C 'a', postes de tireur 'T' ('y' si actif).
// ============================================================

import { G, px, rect, vl, sprite } from './pixel.js';

const F2 = {
  'A': ['010', '101', '111', '101', '101'],
  'B': ['110', '101', '110', '101', '110'],
  'C': ['011', '100', '100', '100', '011'],
  'T': ['111', '010', '010', '010', '010'],
  '?': ['110', '001', '010', '000', '010'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
};
function txt(g, s, x, y, c) {
  s.split('').forEach((ch, i) => {
    const f = F2[ch];
    if (!f) return;
    f.forEach((r, j) => r.split('').forEach((b, k) => { if (b === '1') px(g, x + i * 4 + k, y + j, c); }));
  });
}

// Cadre bâtiment
function box(g, x, y, w, h, wall = 'g', floor = 'n') {
  rect(g, x, y, w, h, floor);
  for (let i = 0; i < w; i++) { px(g, x + i, y, wall); px(g, x + i, y + h - 1, wall); }
  for (let j = 0; j < h; j++) { px(g, x, y + j, wall); px(g, x + w - 1, y + j, wall); }
}

// Points d'otages répartis en grille dans une zone
function spotsIn(x, y, w, h, n) {
  const out = [];
  const cols = Math.ceil(Math.sqrt(n * w / h));
  for (let i = 0; i < n; i++) {
    const cx = i % cols, cy = Math.floor(i / cols);
    out.push([x + Math.round((cx + 0.5) * w / cols), y + Math.round((cy + 0.5) * h / (Math.ceil(n / cols)))]);
  }
  return out;
}

const LAYOUTS = {
  pharmacie: {
    draw(g) {
      box(g, 14, 16, 118, 62);
      for (let i = 0; i < 3; i++) rect(g, 26 + i * 20, 30, 12, 30, 'O');   // rayonnages
      rect(g, 90, 62, 34, 7, 'U');                                        // comptoir
      box(g, 106, 16, 26, 24, 'g', 'U');                                  // réserve
      rect(g, 44, 77, 10, 1, 'n');                                        // porte vitrée
      for (let i = 0; i < 4; i++) rect(g, 18 + i * 8, 16, 5, 1, 'e');      // vitrine
      rect(g, 22, 66, 20, 8, 'O');                                        // présentoir d'accueil
    },
    taker: [96, 54], zone: [26, 30, 74, 30],
    entries: [[46, 80, 'A'], [131, 30, 'B'], [120, 80, 'C']],
    posts: [[4, 24], [148, 44]],
  },
  banque: {
    draw(g) {
      box(g, 14, 16, 122, 62);
      // façade vitrée (haut)
      for (let i = 0; i < 5; i++) rect(g, 20 + i * 24, 16, 10, 1, 'e');
      // entrée : passage + rideau de fer entrouvert (bas centre)
      rect(g, 52, 77, 12, 1, 'n');
      for (let i = 0; i < 12; i += 2) px(g, 52 + i, 78, 'g');
      // comptoir des guichets : 3 fenêtres vitrées
      rect(g, 22, 50, 76, 3, 'U');
      for (let i = 0; i < 3; i++) {
        rect(g, 26 + i * 24, 44, 16, 6, 'n');
        rect(g, 26 + i * 24, 50, 16, 1, 'e');
      }
      // bureaux de l'open space
      for (let i = 0; i < 2; i++) rect(g, 24 + i * 34, 58, 13, 9, 'O');
      // couloir vers la chambre forte
      rect(g, 98, 30, 6, 20, 'n'); vl(g, 98, 30, 20, 'g'); vl(g, 103, 30, 20, 'g');
      // chambre forte : murs épais + casiers
      box(g, 108, 24, 26, 32, 'g', 'N');
      for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) rect(g, 111 + i * 7, 28 + j * 6, 5, 4, 'U');
    },
    taker: [100, 44], zone: [24, 56, 70, 16],
    entries: [[56, 80, 'A'], [108, 14, 'B'], [136, 46, 'C']],
    posts: [[4, 24], [150, 22]],
  },
  hopital: {
    draw(g) {
      box(g, 14, 16, 122, 62);
      rect(g, 14, 46, 122, 12, 'n');                                      // couloir
      for (let i = 0; i < 4; i++) {
        box(g, 18 + i * 30, 18, 26, 26, 'g', 'n');                        // chambres
        rect(g, 22 + i * 30, 22, 6, 14, 'e');                             // lits
        rect(g, 28 + i * 30, 43, 6, 1, 'n');                              // portes sur le couloir
      }
      box(g, 96, 60, 36, 16, 'g', 'U');                                   // sas barricadé
      rect(g, 100, 62, 10, 5, 'O');                                       // lit en travers
      rect(g, 50, 48, 8, 3, 'O');                                         // chariot de soins
    },
    taker: [110, 68], zone: [22, 50, 66, 6],
    entries: [[36, 80, 'A'], [146, 68, 'B'], [130, 14, 'C']],
    posts: [[4, 24], [150, 30]],
  },
  ferme: {
    draw(g) {
      box(g, 12, 24, 74, 54);                                             // maison
      rect(g, 20, 30, 26, 20, 'U');
      box(g, 102, 30, 46, 44, 'g', 'O');                                  // grange
      for (let i = 0; i < 3; i++) rect(g, 108 + i * 12, 38, 8, 30, 'h');   // foin
      rect(g, 88, 50, 12, 4, 'O');                                        // cour
      for (let i = 0; i < 6; i++) px(g, 88 + i * 12, 82, 'O');             // clôture
      px(g, 30, 20, 'V'); px(g, 31, 19, 'V'); px(g, 32, 20, 'V');          // arbre
    },
    taker: [50, 40], zone: [20, 54, 56, 20],
    entries: [[48, 80, 'A'], [24, 76, 'B'], [150, 54, 'C']],
    posts: [[4, 30], [152, 24]],
  },
  prison: {
    draw(g) {
      box(g, 14, 16, 122, 62);
      for (let i = 0; i < 6; i++) {
        box(g, 18 + i * 20, 18, 16, 20, 'g', 'N');                        // cellules haut
        box(g, 18 + i * 20, 58, 16, 20, 'g', 'N');                        // cellules bas
      }
      rect(g, 14, 42, 122, 12, 'n');                                      // coursive
    },
    taker: [70, 46], zone: [22, 44, 90, 8],
    entries: [[50, 80, 'A'], [140, 46, 'B'], [136, 14, 'C']],
    posts: [[4, 24], [150, 60]],
  },
  ferry: {
    draw(g) {
      // coque (proue à droite)
      rect(g, 14, 26, 118, 46, 'n');
      for (let i = 0; i < 14; i++) { px(g, 132 + i, 26 + i, 'g'); px(g, 132 + i, 71 - i, 'g'); }
      for (let i = 0; i < 122; i++) { px(g, 14 + i, 26, 'g'); px(g, 14 + i, 71, 'g'); }
      for (let j = 0; j < 46; j++) px(g, 14, 26 + j, 'g');
      box(g, 22, 30, 60, 22, 'g', 'N');                                   // cabine pont sup.
      rect(g, 90, 32, 40, 14, 't');                                       // pont voitures
      for (let i = 0; i < 4; i++) rect(g, 92 + i * 10, 34, 7, 5, 'O');     // voitures
      rect(g, 90, 56, 42, 10, 'U');                                       // salon passagers
    },
    taker: [50, 38], zone: [92, 57, 38, 8],
    entries: [[16, 74, 'A'], [60, 24, 'B'], [140, 58, 'C']],
    posts: [[4, 14], [150, 14]],
  },
};

export const PLAN_BASES = Object.keys(LAYOUTS);

export function planSprite(sceneBaseName, info = {}, frame = 0) {
  const L = LAYOUTS[sceneBaseName] || LAYOUTS.banque;
  const { held = 0, planKnown = false, sniperPost = null } = info;
  const g = G(160, 96);
  // fond tactique quadrillé léger
  for (let y = 4; y < 96; y += 8) for (let x = 4; x < 160; x += 8) px(g, x, y, 'N');
  L.draw(g);

  // otages : points blancs si le plan est établi, zone « ? » sinon
  const [zx, zy, zw, zh] = L.zone;
  if (planKnown) {
    const spots = spotsIn(zx, zy, zw, zh, Math.max(1, Math.min(held, 20)));
    for (let i = 0; i < held && i < spots.length; i++) px(g, spots[i][0], spots[i][1], 'w');
  } else {
    for (let y = zy; y < zy + zh; y++) for (let x = zx; x < zx + zw; x++) {
      if ((x + y) % 2 === 0) px(g, x, y, 'g');
    }
    txt(g, '?', zx + Math.floor(zw / 2) - 1, zy + Math.floor(zh / 2) - 2, 'w');
  }

  // preneur : point rouge clignotant
  if (frame % 2 === 0) px(g, L.taker[0], L.taker[1], 'r');
  else px(g, L.taker[0], L.taker[1], 'f');

  // entrées A/B/C
  L.entries.forEach(([x, y, l]) => {
    txt(g, l, x, y - 8, 'a');
    px(g, x + 1, y - 2, 'a'); px(g, x, y - 1, 'a'); px(g, x + 2, y - 1, 'a');
  });

  // postes de tireur T1/T2 (actif surligné)
  L.posts.forEach(([x, y], i) => {
    const active = sniperPost === postIdFor(sceneBaseName, i);
    const c = active ? 'y' : 'g';
    txt(g, 'T', x, y, c);
    txt(g, String(i + 1), x + 4, y, c);
  });

  return sprite(g);
}

// ids réels des postes du plan de données (index → post de js/data/plans.js)
const POST_IDX = {
  pharmacie: ['toit', 'reserve'], banque: ['toit', 'lucarne'], hopital: ['toit', 'office'],
  ferme: ['grange', 'pignon'], prison: ['tour', 'rambarde'], ferry: ['passerelle', 'dunette'],
};
function postIdFor(base, i) { return (POST_IDX[base] || POST_IDX.banque)[i]; }
