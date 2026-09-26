// ============================================================
// NÉGOCIATEUR — illustrations de cinématiques (100 % générées)
// Arts 160×120, animés par frame (~8 fps) : pluie, néons,
// gyrophares, ECG, flashs. Reutilise les primitives de pixel.js.
// ============================================================
import { G, px, rect, hl, vl, sprite } from './pixel.js';

const W = 160, H = 120;

// ---------------- petites briques ----------------
function pluie(g, f, n = 26, c = 'e') {
  for (let i = 0; i < n; i++) {
    const x = (i * 29 + f * 3) % W;
    const y = (i * 17 + f * 11) % (H - 10);
    vl(g, x, y, 3, c);
  }
}
function fenetre(g, x, y, w, h, c) { rect(g, x, y, w, h, c); rect(g, x, y, w, 1, 'k'); rect(g, x, y, 1, h, 'k'); }
// personnage debout ~10×24
function personne(g, x, y, c) {
  rect(g, x + 3, y, 4, 5, c);                    // tête
  rect(g, x + 1, y + 5, 8, 10, c);               // buste
  vl(g, x + 2, y + 15, 9, c); vl(g, x + 7, y + 15, 9, c); // jambes
}
// personnage à genoux ~9×13
function agenouille(g, x, y, c) {
  rect(g, x + 3, y, 4, 4, c);                    // tête baissée
  rect(g, x + 1, y + 4, 7, 6, c);                // buste penché
  rect(g, x, y + 10, 9, 3, c);                   // jambes repliées
}
function voiture(g, x, y, c, f, gyro = true) {
  rect(g, x, y + 8, 34, 9, c);                   // caisse
  rect(g, x + 6, y + 2, 22, 7, c);               // pavillon
  rect(g, x + 8, y + 4, 8, 4, 'v'); rect(g, x + 18, y + 4, 8, 4, 'v'); // vitres
  rect(g, x + 2, y + 15, 6, 4, 'k'); rect(g, x + 26, y + 15, 6, 4, 'k'); // roues
  if (gyro) { // rampe de gyrophares animée
    const on = f % 2 === 0;
    rect(g, x + 12, y, 5, 2, on ? 'r' : 'J');
    rect(g, x + 17, y, 5, 2, on ? 'N' : 'b');
  }
}

// ---------------- les arts ----------------
const ARTS = {

  // nuit, rue sous la pluie, pharmacie à la croix verte clignotante
  ville_pluie(g, f) {
    rect(g, 0, 0, W, 78, 'N');
    // immeubles
    rect(g, 0, 18, 88, 62, 'n'); rect(g, 0, 78, 88, 4, 'k');
    for (let i = 0; i < 3; i++) fenetre(g, 8 + i * 26, 26, 14, 16, i === 1 ? 'a' : 'N');
    for (let i = 0; i < 2; i++) fenetre(g, 14 + i * 30, 50, 14, 16, 'N');
    // pharmacie
    rect(g, 90, 34, 70, 48, 'n'); rect(g, 90, 34, 70, 4, 'U');
    rect(g, 94, 70, 62, 12, 'e');                // vitrine
    rect(g, 94, 70, 62, 2, 'k');
    rect(g, 118, 82, 16, 24, 'N');               // porte
    // croix verte clignotante
    const gc = f % 2 === 0 ? 'G' : 'V';
    rect(g, 114, 40, 22, 22, 'k');
    rect(g, 121, 42, 8, 18, gc); rect(g, 116, 47, 18, 8, gc);
    // trottoir + reflets mouillés
    rect(g, 0, 82, W, 38, 'U');
    for (let i = 0; i < 10; i++) hl(g, i * 17 + 4, 90 + (i % 4) * 6, 8, 'n');
    if (f % 2 === 0) { rect(g, 114, 84, 22, 3, 'V'); rect(g, 118, 88, 14, 2, 'V'); }
    // silhouette voûtée devant la porte
    rect(g, 122, 78, 6, 6, 'k'); rect(g, 120, 84, 9, 14, 'k');
    px(g, 124, 77, 'k');
    pluie(g, f, 30);
  },

  // intérieur pharmacie : comptoir, homme armé, pharmacienne mains levées
  pharma_revolver(g, f) {
    rect(g, 0, 0, W, H, 'n');
    // néon plafond qui grésille
    rect(g, 40, 6, 80, 4, f === 1 ? 'c' : 'w');
    // rayonnages
    for (let s = 0; s < 2; s++) {
      const y = 26 + s * 22;
      rect(g, 6, y, 148, 3, 'O');
      for (let i = 0; i < 12; i++) rect(g, 10 + i * 12, y - 8, 9, 8, ['w', 'G', 'b', 'a'][i % 4]);
    }
    // comptoir
    rect(g, 0, 82, W, 38, 'O'); rect(g, 0, 82, W, 4, 'o');
    // homme armé, bras tendu vers la droite
    rect(g, 22, 44, 8, 8, 's');                  // tête
    rect(g, 20, 52, 12, 26, 'U');                // buste
    hl(g, 32, 56, 22, 's');                      // bras tendu
    rect(g, 54, 53, 10, 5, 'k');                 // revolver
    px(g, 60, 52, 'k');
    // pharmacienne derrière le comptoir, mains levées
    rect(g, 110, 46, 8, 8, 's'); rect(g, 106, 54, 16, 28, 'w');
    vl(g, 102, 40, 14 + (f % 2), 's'); vl(g, 122, 40, 14 + (f % 2), 's'); // mains en l'air, tremblent
    px(g, 102, 39, 's'); px(g, 122, 39, 's');
    // flacons sur le comptoir
    rect(g, 74, 74, 5, 8, 'G'); rect(g, 82, 76, 5, 6, 'a');
  },

  // intérieur de voiture de nuit : négociateur de dos, gyros dans le pare-brise
  voiture_nego(g, f) {
    // nuit au-delà du pare-brise + halo gyro balayant (lavis, pas plein cadre)
    rect(g, 10, 10, 140, 66, 'N');
    const on = f % 2 === 0;
    rect(g, 10, 10, 44, 66, on ? 'J' : 'N');          // lavis rouge à gauche
    rect(g, 106, 10, 44, 66, on ? 'N' : 'u');          // lavis bleu à droite
    rect(g, 54, 10, 52, 66, 'N');
    if (on) { hl(g, 40, 12, 22, 'r'); hl(g, 40, 66, 22, 'r'); }
    else { hl(g, 96, 12, 22, 'b'); hl(g, 96, 66, 22, 'b'); }
    // pluie sur la vitre
    for (let i = 0; i < 20; i++) { const x = 14 + (i * 23) % 132; px(g, x, 12 + ((i * 13 + f * 8) % 60), 'e'); }
    // feux/city lointains
    for (let i = 0; i < 7; i++) px(g, 20 + i * 19, 60 + (i % 2) * 4, 'a');
    // structure de l'habitacle
    rect(g, 0, 0, W, 10, 'k'); rect(g, 0, 0, 10, H, 'k'); rect(g, 150, 0, 10, H, 'k');
    rect(g, 0, 76, W, 8, 'k'); rect(g, 0, 84, W, 36, 'U');   // tableau de bord
    rect(g, 62, 2, 18, 8, 'U');                              // rétroviseur
    // négociateur de dos : tête + épaules + casque radio
    rect(g, 64, 30, 30, 20, 'U'); rect(g, 70, 14, 18, 18, 'U');
    rect(g, 68, 12, 22, 5, 'k');                 // arceau du casque
    vl(g, 68, 16, 10, 'k'); vl(g, 90, 16, 10, 'k');
    rect(g, 86, 22, 8, 3, 'k'); px(g, 94, 24, 'a'); // micro
    // main + téléphone à l'oreille
    rect(g, 90, 34, 6, 5, 's'); rect(g, 92, 28, 5, 7, 'k');
    // lueurs gyro dans l'habitacle
    if (on) { rect(g, 16, 84, 26, 30, 'J'); } else { rect(g, 118, 84, 26, 30, 'u'); }
  },

  // photo d'école posée sur le comptoir entre des boîtes d'insuline
  photo_fille(g, f) {
    rect(g, 0, 0, W, 40, 'n');
    rect(g, 0, 40, W, 80, 'O'); rect(g, 0, 40, W, 3, 'o');   // comptoir bois
    // pile de boîtes d'insuline
    for (let i = 0; i < 3; i++) {
      const x = 104 + (i % 2) * 24, y = 64 - i * 14;
      rect(g, x, y, 20, 12, 'w'); rect(g, x, y, 20, 3, 'b'); rect(g, x + 7, y + 5, 6, 4, 'G');
    }
    // main posée qui tient la photo
    rect(g, 8, 78, 30, 12, 's'); vl(g, 36, 66, 14, 's'); vl(g, 42, 64, 16, 's');
    // la photo : cadre blanc, ciel, petite fille souriante
    rect(g, 48, 46, 44, 34, 'w');
    rect(g, 51, 49, 38, 28, 'e');
    rect(g, 66, 54, 12, 11, 's');                // visage
    rect(g, 64, 52, 16, 4, 'h'); vl(g, 63, 54, 8, 'h'); vl(g, 79, 54, 8, 'h'); // couettes
    rect(g, 68, 66, 8, 10, 'r');                 // pull
    px(g, 69, 60, 'k'); px(g, 75, 60, 'k');      // yeux
    px(g, 70, 62, 'k'); px(g, 74, 62, 'k');      // sourire (sillons)
    px(g, 71, 63, 'w'); px(g, 72, 63, 'w'); px(g, 73, 63, 'w'); // dent manquante = trou clair
    // reflet glissant sur le verre (animé)
    const gx = 52 + f * 8;
    vl(g, gx, 50, 26, 'c'); px(g, gx + 1, 50, 'w');
  },

  // gros plan d'yeux en sueur, teinte rouge
  yeux(g, f) {
    rect(g, 0, 0, W, H, 'J');                    // teinte rouge sombre
    rect(g, 0, 0, W, 14, 'k'); rect(g, 0, H - 14, W, 14, 'k');
    // arcade des sourcils
    hl(g, 18, 30, 50, 'k'); hl(g, 92, 30, 50, 'k');
    hl(g, 18, 32, 48, 'H'); hl(g, 94, 32, 48, 'H');
    // yeux écarquillés
    for (const ex of [22, 96]) {
      rect(g, ex, 40, 46, 22, 'c');
      rect(g, ex + 2, 42, 42, 18, 'w');
      const dx = f % 2;                           // pupille qui bouge
      rect(g, ex + 16 + dx, 44, 14, 14, 'h');     // iris
      rect(g, ex + 19 + dx, 46, 8, 9, 'k');       // pupille
      px(g, ex + 21 + dx, 47, 'w');               // reflet
      rect(g, ex, 40, 46, 3, 'k'); rect(g, ex, 59, 46, 3, 'J');
    }
    // pli du nez entre les yeux
    vl(g, 78, 34, 30, 'J'); vl(g, 80, 34, 30, 'J');
    // gouttes de sueur qui glissent
    for (let i = 0; i < 4; i++) {
      const y = 10 + ((i * 19 + f * 6) % 66);
      px(g, 8 + i * 8, y, 'v'); px(g, 150 - i * 7, y + 6, 'v');
    }
    // bords rouges pulsants
    if (f % 2 === 0) { vl(g, 0, 14, 92, 'r'); vl(g, 159, 14, 92, 'r'); }
  },

  // porte qui s'ouvre sur la lumière, silhouette + couverture de survie
  porte_lumiere(g, f) {
    rect(g, 0, 0, W, H, 'N');
    rect(g, 0, 96, W, 24, 'k');
    // battant de porte à gauche
    rect(g, 30, 10, 10, 96, 'U'); rect(g, 36, 50, 3, 5, 'g');
    // rectangle de lumière
    rect(g, 42, 10, 76, 96, 'w'); rect(g, 42, 10, 76, 96 - (f % 2) * 0, 'w');
    rect(g, 118, 10, 8, 96, 'c');                // halo
    // marée de lumière sur le sol
    rect(g, 30, 96, 110, 6, 'c');
    for (let i = 0; i < 5; i++) hl(g, 34 + i * 20, 104 + i, 12, 'U');
    // silhouette qui sort, couverture de survie irisée
    const x = 74, y = 34;
    rect(g, x + 3, y, 5, 6, 'k');
    rect(g, x, y + 6, 12, 20, 'k');
    // couverture argentée scintillante sur les épaules
    const b = f % 2 === 0 ? 'a' : 'y';
    hl(g, x - 1, y + 8, 14, b); vl(g, x - 1, y + 8, 12, b); vl(g, x + 12, y + 8, 12, b);
    vl(g, x + 2, y + 26, 14, 'k'); vl(g, x + 8, y + 26, 14, 'k');
    hl(g, x + 1, y + 40, 5, 'k'); hl(g, x + 7, y + 40, 5, 'k'); // pas
    // rideau de fer qui retombe derrière
    for (let i = 0; i < 4; i++) hl(g, 126, 14 + i * 6 + f * 2, 30, 'g');
  },

  // façade de banque au crépuscule, rideaux à moitié baissés, alarme rouge
  banque_alarme(g, f) {
    rect(g, 0, 0, W, 34, 'J'); rect(g, 0, 18, W, 16, 'R');   // ciel crépusculaire
    rect(g, 20, 34, 120, 62, 'n');                            // façade
    rect(g, 14, 30, 132, 6, 'U');                             // corniche
    // colonnes
    for (const cx of [26, 64, 102, 140]) rect(g, cx - 3, 40, 8, 56, 'U');
    // porte + rideaux de fer à demi baissés sur les fenêtres
    rect(g, 66, 52, 30, 44, 'k');
    for (let i = 0; i < 4 + f; i++) hl(g, 66, 52 + i * 6, 30, 'g'); // le rideau descend
    for (const wx of [30, 106]) {
      fenetre(g, wx, 48, 28, 30, 'N');
      for (let i = 0; i < 3; i++) hl(g, wx, 48 + i * 5, 28, 'g');
    }
    // alarme rouge rotative au-dessus de la porte
    if (f % 2 === 0) {
      rect(g, 76, 38, 8, 8, 'r'); px(g, 72, 40, 'r'); px(g, 88, 40, 'r');
      px(g, 70, 42, 'J'); px(g, 90, 42, 'J');
    } else rect(g, 77, 39, 6, 6, 'J');
    // rue
    rect(g, 0, 96, W, 24, 'U'); rect(g, 0, 96, W, 2, 'k');
  },

  // six otages à genoux, homme cagoulé fusil près du coffre
  banque_otages(g, f) {
    rect(g, 0, 0, W, 66, 'n'); rect(g, 0, 66, W, 54, 'U');   // mur + carrelage
    for (let i = 0; i < 8; i++) hl(g, 0, 70 + i * 6, W, i % 2 ? 'U' : 'u');
    // coffre-fort
    rect(g, 116, 18, 38, 48, 'g'); rect(g, 120, 22, 30, 40, 'U');
    rect(g, 132, 34, 8, 12, 'g'); px(g, 135, 40, 'k');
    // veilleuse rouge d'alarme qui pulse
    rect(g, 76, 8, 8, 5, f % 2 === 0 ? 'r' : 'J');
    // homme cagoulé debout, fusil en bandoulière
    personne(g, 88, 42, 'k');
    rect(g, 91, 42, 4, 2, 'w');                  // fente des yeux (cagoule)
    hl(g, 90, 52, 18, 'g'); px(g, 108, 51, 'g'); // fusil
    // rangée de 6 otages à genoux sur le carrelage
    for (let i = 0; i < 6; i++) {
      const bob = (i + f) % 4 === 0 ? -1 : 0;     // un souffle qui passe dans la rangée
      agenouille(g, 8 + i * 13, 60 + bob, i % 2 ? 'H' : 'k');
    }
  },

  // périmètre : voitures de police, ruban, foule aux téléphones, van TV
  perimetre(g, f) {
    rect(g, 0, 0, W, 60, 'N');
    rect(g, 0, 60, W, 60, 'U');
    // rubalise en travers
    for (let i = 0; i < 16; i++) px(g, i * 10 + (i % 2) * 2, 58 + (i % 2), 'a');
    // deux voitures de police
    voiture(g, 12, 66, 'w', f); voiture(g, 52, 70, 'u', f + 1);
    // van TV + mât
    rect(g, 104, 62, 48, 30, 'w'); rect(g, 104, 62, 48, 6, 'b');
    rect(g, 108, 70, 40, 16, 'v');
    vl(g, 126, 26, 36, 'g'); px(g, 126, 24, 'r'); // mât + diode
    rect(g, 116, 56, 20, 6, 'g');                // parabole
    // foule à gauche, téléphones lumineux
    for (let i = 0; i < 5; i++) {
      const x = 6 + i * 12;
      rect(g, x, 96, 7, 18, 'k');
      rect(g, x + 6, 92 + (i % 2) * 2, 3, 5, i % 3 === 0 ? 'e' : 'w'); // écran levé
    }
    // halos gyro sur le sol
    if (f % 2 === 0) { rect(g, 10, 92, 40, 6, 'r'); rect(g, 60, 92, 30, 6, 'N'); }
    else { rect(g, 10, 92, 30, 6, 'N'); rect(g, 50, 92, 46, 6, 'b'); }
  },

  // hélicoptère + projecteur sur les toits, antennes TV
  helico(g, f) {
    rect(g, 0, 0, W, H, 'N');
    // ligne de toits + antennes
    rect(g, 0, 78, W, 42, 'k');
    for (let i = 0; i < 6; i++) {
      const x = 10 + i * 26;
      vl(g, x, 60 - (i % 3) * 6, 20, 'g');
      px(g, x, 58 - (i % 3) * 6, f % 2 === 0 ? 'r' : 'N'); // diodes de balisage
    }
    // fenêtres éparses
    for (let i = 0; i < 12; i++) px(g, 4 + i * 13, 88 + (i % 4) * 7, 'a');
    // hélicoptère
    const hx = 52 + (f % 2), hy = 20;
    rect(g, hx, hy, 36, 12, 'U'); rect(g, hx + 30, hy + 2, 8, 8, 'v'); // cockpit
    hl(g, hx - 14, hy + 4, 14, 'U'); vl(g, hx - 14, hy - 2, 8, 'U');   // poutre de queue
    hl(g, hx + 2, hy - 3, f % 2 === 0 ? 44 : 30, 'g');                 // rotor animé
    vl(g, hx + 6, hy + 12, 6, 'U'); vl(g, hx + 28, hy + 12, 6, 'U');   // patins
    // faisceau du projecteur qui balaie
    const dir = f % 4;
    for (let i = 0; i < 46; i++) px(g, hx + 18 + dir * 4 + i, hy + 14 + Math.floor(i * 1.1), i % 4 === 0 ? 'y' : 'v');
    rect(g, hx + 18 + dir * 4 + 44, hy + 62, 14, 10, 'y');
  },

  // vue lunette de tir : cercle noir, croix sur fenêtre éclairée
  lunette(g, f) {
    rect(g, 0, 0, W, H, 'k');
    // cercle de visée ~rayon 46
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = x - 80, dy = y - 60;
      if (dx * dx + dy * dy < 46 * 46) g[y][x] = 'N';
    }
    const sway = f % 2;                           // léger flottement
    // façade de la banque + fenêtre éclairée dans le cercle
    for (let y = 24; y < 96; y++) for (let x = 0; x < W; x++) {
      const dx = x - 80, dy = y - 60;
      if (dx * dx + dy * dy < 46 * 46) g[y][x] = 'n';
    }
    rect(g, 66 + sway, 44, 28, 26, 'a');          // fenêtre
    rect(g, 66 + sway, 44, 28, 2, 'y');
    rect(g, 76 + sway, 50, 7, 20, 'k');           // silhouette dans la fenêtre
    rect(g, 78 + sway, 48, 4, 4, 's');
    // réticule
    hl(g, 36, 60, 38, 'g'); hl(g, 86, 60, 38, 'g');
    vl(g, 80, 16, 38, 'g'); vl(g, 80, 66, 38, 'g');
    px(g, 80, 60, 'r');
    for (let i = 0; i < 4; i++) { px(g, 52 + i * 14, 62, 'g'); px(g, 82, 30 + i * 14, 'g'); }
  },

  // rideau de fer la nuit, éclair de tir à travers les lames
  rideau_eclair(g, f) {
    rect(g, 0, 0, W, 20, 'N');
    rect(g, 14, 20, 132, 80, 'n');
    // le rideau : lames horizontales
    for (let y = 26; y < 96; y += 5) hl(g, 20, y, 120, 'g');
    hl(g, 20, 24, 120, 'U'); hl(g, 20, 98, 120, 'U');
    rect(g, 0, 100, W, 20, 'k');
    // éclair du tir qui traverse les interstices (frames impaires)
    if (f % 2 === 1) {
      for (const y of [31, 41, 51, 61]) hl(g, 34, y, 60, 'y');
      rect(g, 40, 30, 44, 34, 'y');
      rect(g, 50, 36, 26, 22, 'w');
      px(g, 30, 28, 'w'); px(g, 96, 34, 'w'); px(g, 26, 60, 'a'); px(g, 100, 56, 'a');
    } else {
      // fumée qui s'infiltre
      for (let i = 0; i < 5; i++) px(g, 42 + i * 9, 34 + (i % 3) * 12, 'u');
    }
  },

  // façade du CHU, aube grise, une fenêtre allumée au 4e, ambulance
  chu_facade(g, f) {
    rect(g, 0, 0, W, 26, 'g');                   // aube grise
    rect(g, 0, 20, W, 8, 'c');
    // bloc hospitalier
    rect(g, 18, 28, 124, 70, 'c'); rect(g, 18, 28, 124, 4, 'g');
    // fenêtres ; une allumée au 4e étage (2e rangée du haut)
    for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) {
      const lit = (r === 1 && i === 6);
      rect(g, 24 + i * 13, 36 + r * 16, 9, 11, lit ? 'y' : 'N');
      if (lit) { px(g, 24 + i * 13 + 4, 36 + r * 16 + 5, 'k'); } // silhouette dans la fenêtre
    }
    // entrée + auvent
    rect(g, 66, 92, 30, 8, 'U'); rect(g, 72, 96, 18, 24, 'N');
    // ambulance en bas à droite, gyrophare animé
    rect(g, 96, 96, 50, 22, 'w'); rect(g, 96, 100, 50, 5, 'r');
    rect(g, 100, 102, 12, 8, 'v');
    rect(g, 98, 114, 10, 6, 'k'); rect(g, 134, 114, 10, 6, 'k');
    rect(g, 116, 92, 10, 4, f % 2 === 0 ? 'r' : 'b');
    rect(g, 0, 118, W, 2, 'U');
  },

  // couloir de réa : lit contre les portes, sortie verte, silhouette armée
  couloir_lit(g, f) {
    rect(g, 0, 0, W, H, 'n');
    // perspective du couloir
    rect(g, 0, 90, W, 30, 'U'); hl(g, 0, 90, W, 'k');
    vl(g, 24, 10, 80, 'U'); vl(g, 136, 10, 80, 'U');
    // portes doubles au fond
    rect(g, 56, 18, 48, 72, 'U'); vl(g, 79, 18, 72, 'k');
    rect(g, 62, 30, 14, 24, 'v'); rect(g, 84, 30, 14, 24, 'v'); // hublots
    // silhouette + arme derrière le hublot gauche
    rect(g, 65, 40, 8, 14, 'k'); rect(g, 66, 42, 3, 3, 's'); hl(g, 70, 44, 8, 'g');
    // sortie de secours verte qui grésille
    if (f !== 2) { rect(g, 66, 8, 28, 8, 'G'); hl(g, 70, 11, 20, 'k'); }
    else rect(g, 66, 8, 28, 8, 'V');
    // lit poussé contre les portes, de biais
    rect(g, 40, 66, 60, 10, 'g');                 // sommier
    rect(g, 42, 62, 56, 6, 'c');                  // matelas
    vl(g, 44, 76, 12, 'g'); vl(g, 94, 76, 12, 'g'); // pieds
    rect(g, 40, 56, 4, 12, 'g');                  // dosseret
    // néon du plafond
    rect(g, 30, 2, 60, 3, f % 2 ? 'w' : 'c');
  },

  // chambre de réa : patient, soufflet du respirateur, ECG animé
  respirateurs(g, f) {
    rect(g, 0, 0, W, H, 'n');
    rect(g, 0, 84, W, 36, 'U');
    // moniteur ECG au mur
    rect(g, 104, 14, 44, 30, 'k'); rect(g, 107, 17, 38, 24, 'N');
    for (let i = 0; i < 12; i++) {
      const x = 108 + i * 3 + (f % 2);
      const y = 29 + (i % 4 === 2 ? -5 : i % 4 === 3 ? 3 : 0); // trace QRS animée
      px(g, x, y, 'G'); px(g, x, y + 1, 'G');
    }
    px(g, 110, 19, 'r');                          // led
    // lit + patient
    rect(g, 20, 62, 74, 10, 'g'); rect(g, 22, 56, 70, 7, 'c');
    rect(g, 26, 50, 12, 8, 's');                  // tête du patient
    rect(g, 20, 60, 66, 4, 'b');                  // drap
    vl(g, 24, 72, 16, 'g'); vl(g, 88, 72, 16, 'g');
    // respirateur : caisson + soufflet animé
    rect(g, 4, 40, 18, 30, 'g'); rect(g, 6, 42, 14, 8, 'N');
    const bl = 4 + f;                              // soufflet qui se gonfle
    rect(g, 8, 52, 10, bl + 4, 'u'); hl(g, 8, 52 + bl + 4, 10, 'k');
    // tubulure vers le patient
    for (let i = 0; i < 14; i++) px(g, 14 + i, 44 + Math.floor(i * 0.8), 'w');
    // perfusion
    vl(g, 120, 56, 30, 'g'); rect(g, 116, 56, 10, 10, 'v'); vl(g, 121, 66, 12, 'v');
  },

  // gros plan moniteur : trace quasi plate, alarme rouge
  ecg_alarme(g, f) {
    rect(g, 0, 0, W, H, 'k');
    rect(g, 10, 12, 140, 96, 'U'); rect(g, 10, 12, 140, 4, 'g');
    rect(g, 18, 22, 124, 72, 'N');                // écran
    // trace presque plate avec un rare soubresaut
    for (let x = 20; x < 140; x++) {
      const y = 58;
      const phase = (x + f * 10) % 120;
      let dy = 0;
      if (phase === 30) dy = -8; else if (phase === 31) dy = 4; else if (phase === 32) dy = -2;
      px(g, x, y + dy, 'r'); if (dy !== 0) px(g, x, y + dy + 1, 'r');
    }
    // alarme qui clignote
    if (f % 2 === 0) {
      rect(g, 126, 26, 12, 10, 'r'); px(g, 131, 28, 'w'); px(g, 131, 31, 'w'); px(g, 131, 33, 'w');
      rect(g, 18, 22, 124, 2, 'r');
    } else rect(g, 126, 26, 12, 10, 'J');
    // boutons
    for (let i = 0; i < 4; i++) rect(g, 24 + i * 14, 98, 9, 6, 'g');
    px(g, 140, 98, 'r');
  },

  // chaise : étui de hautbois + photo de mariage
  hautbois(g, f) {
    rect(g, 0, 0, W, H, 'n');
    rect(g, 0, 92, W, 28, 'U'); hl(g, 0, 92, W, 'k');
    // halo du plafonnier qui vacille
    if (f % 2 === 0) { rect(g, 60, 0, 40, 4, 'c'); px(g, 79, 4, 'a'); }
    else { rect(g, 64, 0, 32, 4, 'U'); px(g, 79, 4, 'a'); }
    // la chaise
    rect(g, 46, 40, 6, 52, 'O');                  // dossier
    rect(g, 46, 66, 44, 8, 'o');                  // assise
    vl(g, 50, 74, 20, 'O'); vl(g, 84, 74, 20, 'O');
    // étui de hautbois posé sur l'assise
    rect(g, 52, 56, 36, 10, 'k'); hl(g, 54, 58, 32, 'U');
    rect(g, 66, 54, 8, 3, 'g');                   // poignée
    px(g, 56, 60, 'a'); px(g, 84, 60, 'a');       // clés brillantes
    // photo de mariage, cadre posé contre le dossier
    rect(g, 96, 30, 26, 34, 'g'); rect(g, 98, 32, 22, 30, 'w');
    rect(g, 103, 40, 5, 8, 'w'); px(g, 104, 37, 's'); px(g, 104, 39, 's'); // mariée
    rect(g, 110, 42, 5, 6, 'k'); px(g, 111, 39, 's');                      // marié
    px(g, 105, 52, 'r'); px(g, 112, 52, 'r');     // fleurs
    // reflet sur le verre (animé)
    px(g, 100 + (f % 3) * 6, 34, 'v');
    vl(g, 96, 64, 12, 'O');                        // pied du cadre posé au sol
    rect(g, 92, 74, 34, 4, 'O');                   // petit tabouret/sol support
  },
};

export const CUT_ARTS = Object.keys(ARTS);

export function cutSprite(artId, frame = 0) {
  const fn = ARTS[artId];
  const g = G(W, H);
  if (fn) fn(g, frame);
  return sprite(g);
}
