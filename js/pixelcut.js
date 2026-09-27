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

  // ---------- SECTE : ferme du Vercors ----------

  // plateau enneigé de nuit, ferme éclairée à la bougie
  vercors_neige(g, f) {
    rect(g, 0, 0, W, 62, 'N');
    rect(g, 0, 50, 56, 12, 'n'); rect(g, 96, 46, 64, 16, 'n');  // crêtes
    rect(g, 0, 62, W, 58, 'c'); rect(g, 0, 62, W, 3, 'w');      // neige
    // ferme
    rect(g, 58, 34, 52, 28, 'n'); rect(g, 58, 34, 52, 2, 'k');
    rect(g, 54, 26, 60, 8, 'k'); rect(g, 54, 26, 60, 3, 'w');   // toit neigeux
    // fenêtres aux bougies (scintillement)
    const fl = f % 2;
    fenetre(g, 64, 44, 8, 10, fl ? 'a' : 'y');
    fenetre(g, 80, 44, 8, 10, fl ? 'y' : 'a');
    fenetre(g, 96, 44, 8, 10, fl ? 'a' : 'y');
    rect(g, 72, 58, 24, 4, 'k');                                 // soubassement
    // sapins lourds de neige
    for (const [tx, ty] of [[24, 52], [132, 50]]) {
      rect(g, tx, ty, 12, 4, 'w'); rect(g, tx + 2, ty + 4, 8, 4, 'V');
      rect(g, tx + 4, ty + 8, 4, 4, 'V'); vl(g, tx + 5, ty + 12, 10, 'O');
    }
    // neige qui tombe
    for (let i = 0; i < 42; i++) px(g, (i * 37 + f * 5) % W, (i * 23 + f * 9) % 58, 'w');
  },

  // le gourou parle devant un cercle d'adeptes à la bougie
  guru_foule(g, f) {
    rect(g, 0, 0, W, H, 'N');
    // estrade
    rect(g, 66, 56, 28, 6, 'O');
    // la silhouette du gourou, bras levés
    rect(g, 76, 30, 8, 8, 's');
    rect(g, 72, 38, 16, 20, 'o');                                // robe
    vl(g, 70, 34, 10 + (f % 2), 's'); vl(g, 88, 34, 10 + (f % 2), 's'); // bras qui se lèvent
    // cercle d'adeptes — têtes penchées en arc
    for (let i = 0; i < 7; i++) {
      const x = 26 + i * 18, y = 78 + Math.abs(i - 3) * 4;
      rect(g, x, y, 7, 6, 's'); rect(g, x - 1, y + 6, 9, 12, 'U');
    }
    // bougies en premier plan, flammes animées
    for (let i = 0; i < 6; i++) {
      const x = 14 + i * 26;
      vl(g, x, 100, 10, 'w');
      px(g, x, 98 + (i + f) % 2, 'y'); px(g, x, 99, 'a');
    }
    // halo de bougies
    for (let i = 0; i < 6; i++) px(g, 14 + i * 26, 96, 'a');
  },

  // dessin d'enfant au mur du dortoir
  dortoir_enfants(g, f) {
    rect(g, 0, 0, W, H, 'n');
    rect(g, 0, 96, W, 24, 'U'); hl(g, 0, 96, W, 'k');
    // fenêtre grillagée, dehors la nuit et la neige
    rect(g, 12, 14, 40, 44, 'N'); rect(g, 12, 14, 40, 44, 'g');
    rect(g, 14, 16, 36, 40, 'N');
    for (let i = 1; i < 4; i++) vl(g, 14 + i * 9, 16, 40, 'k');
    hl(g, 14, 36, 36, 'k');
    for (let i = 0; i < 10; i++) px(g, 16 + (i * 13 + f * 3) % 34, 18 + (i * 7 + f * 5) % 36, 'w'); // neige dehors
    // dessin d'enfant : soleil, maison, phrase au crayon
    rect(g, 78, 20, 60, 56, 'w'); rect(g, 78, 20, 60, 3, 'c'); rect(g, 78, 20, 3, 56, 'c');
    px(g, 108, 34, 'y'); hl(g, 106, 32, 5, 'y'); px(g, 106, 34, 'y'); px(g, 110, 34, 'y'); // soleil
    vl(g, 104, 28, 3, f % 2 ? 'y' : '.'); vl(g, 112, 28, 3, 'y');                          // rayons
    rect(g, 88, 52, 16, 14, 'o'); rect(g, 88, 48, 16, 5, 'r'); rect(g, 93, 58, 5, 8, 'k'); // maison
    hl(g, 90, 70, 40, 'k'); hl(g, 90, 72, 30, 'k');                                        // phrase griffonnée
    // petit lit de camp en bas
    rect(g, 60, 88, 56, 8, 'u'); rect(g, 60, 84, 12, 5, 'w'); vl(g, 62, 96, 8, 'k'); vl(g, 112, 96, 8, 'k');
  },

  // rituel : coupes remplies sous les bougies
  rituel_coupes(g, f) {
    rect(g, 0, 0, W, H, 'N');
    // grande table
    rect(g, 20, 62, 120, 8, 'O'); rect(g, 20, 70, 120, 50, 'n');
    // coupes — la dernière se remplit (niveau animé)
    for (let i = 0; i < 5; i++) {
      const x = 32 + i * 24, lvl = i < 4 ? 4 : (f % 4);
      rect(g, x, 56, 10, 6, 'k');
      if (lvl) rect(g, x + 2, 56 + 4 - lvl, 6, lvl, 'a');
    }
    // chandeliers, flammes
    for (const [cx, cy] of [[26, 40], [134, 40], [80, 30]]) {
      vl(g, cx, cy, 20, 'w'); rect(g, cx - 2, cy + 20, 5, 3, 'g');
      px(g, cx, cy - 2 - (f % 2), 'y'); px(g, cx, cy - 1, 'a');
    }
    // cercle de silhouettes derrière la table
    for (let i = 0; i < 6; i++) {
      const x = 30 + i * 20;
      rect(g, x, 12 + (i % 2) * 3, 6, 6, 's'); rect(g, x - 1, 18 + (i % 2) * 3, 8, 20, 'U');
    }
  },

  // aube qui se lève sur la ferme (Élie décroche)
  aube_elie(g, f) {
    // ciel d'aube qui s'éclaircit avec le frame
    const band = f % 4;
    rect(g, 0, 0, W, 14 + band * 2, 'N');
    rect(g, 0, 14 + band * 2, W, 30, 'n');
    rect(g, 0, 44 + band * 2, W, 20, 't');                        // lueur basse
    // disque de soleil qui pointe
    rect(g, 118, 52 - band * 3, 16, 10, 'a'); rect(g, 121, 50 - band * 3, 10, 4, 'y');
    rect(g, 0, 66, W, 54, 'c');                                    // neige grise d'aube
    // ferme en contre-jour
    rect(g, 40, 44, 46, 24, 'N'); rect(g, 36, 38, 54, 7, 'k');
    rect(g, 66, 50, 10, 18, 'k');                                  // porte
    // silhouette au téléphone dans l'encadrement
    rect(g, 68, 52, 6, 6, 's'); rect(g, 67, 58, 8, 10, 'U');
    px(g, 75, 54 + (f % 2), 'k');                                  // combiné à l'oreille
    // poteau téléphonique + fil vers l'extérieur
    vl(g, 130, 60, 34, 'k'); hl(g, 86, 62, 44, 'k'); px(g, 130, 60, 'r');
  },

  // dernier matin : plein soleil, ombres longues
  dernier_matin(g, f) {
    rect(g, 0, 0, W, 30, 'b');
    rect(g, 0, 30, W, 34, 'e');                                    // ciel qui pâlit vers l'horizon
    // grand soleil bas
    rect(g, 68, 34 - (f % 2) * 2, 24, 18, 'y'); rect(g, 72, 32 - (f % 2) * 2, 16, 6, 'w');
    rect(g, 0, 64, W, 56, 'w');                                    // neige éblouie
    // ombres longues de la ferme et des hommes
    rect(g, 44, 52, 40, 20, 'n'); rect(g, 40, 46, 48, 7, 'k');
    for (let i = 0; i < 8; i++) hl(g, 84 + i * 4, 72 + i * 3, 26, 'e'); // ombre portée
    // corbeaux / étourneaux au-dessus
    for (let i = 0; i < 5; i++) {
      const x = (i * 31 + f * 9) % W, y = 12 + (i * 11) % 18;
      px(g, x, y, 'k'); px(g, x + 2, y, 'k');
    }
  },

  // portail ouvert, enfant dans la neige
  portail_neige(g, f) {
    rect(g, 0, 0, W, 54, 'N');
    rect(g, 0, 54, W, 66, 'c'); rect(g, 0, 54, W, 2, 'w');
    // clôture et portail entrouvert
    for (let x = 0; x < W; x += 12) vl(g, x, 40, 18, 'k');
    hl(g, 0, 44, W, 'k'); hl(g, 0, 52, W, 'k');
    rect(g, 70, 38, 8, 22, 'k');                                    // montant du portail
    hl(g, 78, 42, 30, 'k'); hl(g, 78, 50, 26, 'k');                 // battant ouvert
    // enfant qui avance, bras levés — pas animé
    const x = 66 + (f % 2) * 2;
    rect(g, x + 2, 70, 5, 5, 's'); rect(g, x, 75, 9, 12, 'r');      // doudoune rouge
    vl(g, x - 1, 72, 6, 's'); vl(g, x + 9, 72, 6, 's');
    // traces de pas derrière lui
    for (let i = 0; i < 5; i++) px(g, x + 14 + i * 9, 86 + i * 2, 'g');
    // gendarmes à couvert au loin (casques)
    rect(g, 126, 62, 7, 5, 'k'); rect(g, 124, 67, 11, 10, 'u');
    rect(g, 142, 64, 7, 5, 'k'); rect(g, 140, 69, 11, 9, 'u');
  },

  // ---------- PRISON : maison centrale ----------

  // mur d'enceinte + mirador, projecteur qui balaie
  centrale_mur(g, f) {
    rect(g, 0, 0, W, 70, 'N');
    // mirador
    rect(g, 118, 16, 24, 18, 'n'); rect(g, 118, 16, 24, 3, 'k');
    rect(g, 122, 34, 16, 40, 'k'); hl(g, 124, 40, 12, 'g'); hl(g, 124, 50, 12, 'g'); hl(g, 124, 60, 12, 'g');
    // projecteur + faisceau balayant
    px(g, 129, 24, 'y');
    const sweep = 30 + (f % 4) * 18;                                // angle du faisceau
    for (let i = 0; i < 6; i++) hl(g, 130 - (sweep - 30) - i * 2, 26 + i * 7, 4 + i * 4, f % 2 ? 'a' : 'y');
    rect(g, sweep - 20, 68, 40, 6, 'a');                            // tache de lumière au sol
    // grand mur
    rect(g, 0, 70, W, 50, 'n'); rect(g, 0, 70, W, 4, 'k');
    for (let x = 0; x < W; x += 16) vl(g, x, 74, 46, 'U');          // rainures
    // barbelés au sommet
    for (let x = 0; x < W; x += 6) { px(g, x, 70, 'g'); px(g, x + 3, 72, 'g'); }
    // fenêtres grillées du bâtiment au loin
    rect(g, 14, 30, 60, 34, 'n'); rect(g, 14, 30, 60, 3, 'k');
    for (let i = 0; i < 4; i++) { rect(g, 20 + i * 14, 36, 8, 20, 'N'); vl(g, 23 + i * 14, 36, 20, 'k'); }
  },

  // couloir incendié, matelas qui brûlent
  couloir_feu(g, f) {
    rect(g, 0, 0, W, H, 'N');
    // barreaux au premier plan
    for (let x = 8; x < W; x += 18) rect(g, x, 0, 4, H, 'k');
    hl(g, 0, 30, W, 'k'); hl(g, 0, 60, W, 'k'); hl(g, 0, 90, W, 'k');
    // matelas empilés en feu
    rect(g, 54, 78, 60, 18, 'U'); rect(g, 58, 66, 50, 12, 'u');
    // flammes animées
    for (let i = 0; i < 9; i++) {
      const x = 56 + i * 6, h = 10 + ((i + f) % 3) * 6;
      vl(g, x, 66 - h, h, 'f'); px(g, x, 66 - h - 2, 'y');
      if ((i + f) % 2 === 0) px(g, x + 1, 66 - h - 5, 'y');         // étincelles
    }
    // fumée qui monte
    for (let i = 0; i < 14; i++) px(g, 40 + ((i * 17 + f * 4) % 80), 8 + (i * 9 + f * 3) % 30, 'g');
    // lueur sur les murs
    rect(g, 30, 84, 14, 30, 'J'); rect(g, 122, 84, 14, 30, 'J');
  },

  // gardien tenu contre une porte de cellule
  gardien_porte(g, f) {
    rect(g, 0, 0, W, H, 'n');
    rect(g, 0, 100, W, 20, 'U'); hl(g, 0, 100, W, 'k');
    // portes de cellules
    for (let i = 0; i < 4; i++) {
      const x = 8 + i * 40;
      rect(g, x, 16, 30, 84, 'N'); rect(g, x, 16, 30, 3, 'k');
      for (let bx = 4; bx < 28; bx += 8) vl(g, x + bx, 19, 81, 'k');
      rect(g, x + 22, 58, 6, 4, 'g');                               // guichet
    }
    // détenu en orange tenant le gardien par l'épaule
    rect(g, 88, 40, 8, 8, 's'); rect(g, 86, 48, 12, 40, 'j');
    hl(g, 74, 50, 14, 'j');                                         // bras sur l'épaule
    // gardien en uniforme, raide, mains levées à moitié
    const sh = f % 2;                                               // tremblement
    rect(g, 62, 38, 8, 8, 's'); rect(g, 60, 46, 12, 42, 'u');
    vl(g, 56 + sh, 48, 12, 's'); vl(g, 76 - sh, 48, 12, 's');
    px(g, 60, 46, 'k');                                             // insigne
    // néon du couloir qui grésille
    rect(g, 50, 4, 60, 3, f % 3 === 0 ? 'U' : 'w');
  },

  // l'émeute atteint la toiture
  emeute_toit(g, f) {
    rect(g, 0, 0, W, 44, 'N');
    rect(g, 0, 70, W, 50, 'n'); rect(g, 0, 70, W, 4, 'k');          // mur
    // bâtiment et toiture
    rect(g, 16, 44, 128, 28, 'U'); rect(g, 16, 40, 128, 6, 'k');
    for (let i = 0; i < 6; i++) rect(g, 24 + i * 20, 52, 8, 12, 'N');
    // flammes sortant du toit et des fenêtres
    for (let i = 0; i < 12; i++) {
      const x = 20 + i * 11, h = 12 + ((i * 2 + f) % 4) * 6;
      vl(g, x, 40 - h, h, 'f'); px(g, x, 40 - h - 2, 'y');
      if ((i + f) % 3 === 0) vl(g, 24 + (i % 6) * 20, 44, 8, 'f');  // lueur fenêtres
    }
    // grosse colonne de fumée
    for (let i = 0; i < 24; i++) px(g, 60 + ((i * 13 + f * 5) % 70), 4 + (i * 7 + f * 4) % 34, 'g');
    // reflets rouges sur le mur
    for (let x = 10; x < W; x += 22) rect(g, x + (f % 2), 76, 8, 4, 'J');
  },

  // Sorel arrache le combiné (acte II)
  sorel_combine(g, f) {
    rect(g, 0, 0, W, H, 'N');
    // mur de cellule, affiche réglementaire
    rect(g, 0, 0, W, 88, 'n'); rect(g, 0, 88, W, 32, 'U'); hl(g, 0, 88, W, 'k');
    rect(g, 108, 12, 30, 40, 'c'); hl(g, 112, 18, 22, 'k'); hl(g, 112, 24, 22, 'k'); hl(g, 112, 30, 14, 'k');
    // main en orange qui serre le combiné
    rect(g, 58, 44, 10, 8, 's');                                    // poing
    rect(g, 44, 40, 18, 14, 'j');                                   // avant-bras détenu
    rect(g, 64, 42, 26, 10, 'k');                                   // combiné
    px(g, 66, 44, 'g'); px(g, 86, 44, 'g');
    // fil qui pend et oscille vers le combiné mural arraché
    const sw = f % 2;
    rect(g, 90, 46 + sw, 4, 4, 'k');
    for (let i = 0; i < 7; i++) px(g, 92 + sw + (i % 3), 50 + i * 5, 'k');
    // débris au sol
    px(g, 96, 96, 'g'); px(g, 104, 98, 'g'); rect(g, 100, 100, 6, 3, 'k');
    // barreaux d'ombre au premier plan
    for (let x = 10; x < W; x += 36) rect(g, x, 0, 5, H, 'k');
  },

  // fumée dans la coursive (acte III)
  fumee_coursive(g, f) {
    rect(g, 0, 0, W, H, 'N');
    // coursive : portes des deux côtés, grille du jour au fond
    rect(g, 0, 0, W, 96, 'n'); rect(g, 0, 96, W, 24, 'U');
    for (let i = 0; i < 3; i++) {
      const x = 10 + i * 52;
      rect(g, x, 20, 34, 76, 'N'); rect(g, x, 20, 34, 3, 'k');
      for (let bx = 5; bx < 32; bx += 9) vl(g, x + bx, 23, 73, 'k');
    }
    rect(g, 132, 10, 20, 60, 'N');
    for (let i = 0; i < 3; i++) vl(g, 136 + i * 6, 10, 60, 'k');
    // jour sale au fond, obscurci par la fumée
    rect(g, 66, 30, 26, 50, f % 2 ? 'a' : 'J');
    // nappes de fumée qui rampent au plafond
    for (let i = 0; i < 30; i++) {
      const x = (i * 23 + f * 6) % W, y = 4 + (i * 5) % 22;
      px(g, x, y, 'g'); if (i % 3) px(g, x + 1, y, 'g');
    }
    // gouttes de sueur/condensation sur les barreaux
    for (let i = 0; i < 6; i++) px(g, 10 + i * 52 + 5, 40 + (f * 3 + i * 9) % 40, 'e');
  },

  // cellule sombre après une mort
  cellule_sombre(g, f) {
    rect(g, 0, 0, W, H, 'N');
    // porte de cellule entrouverte, tranche de lumière froide
    rect(g, 58, 10, 44, 100, 'k');
    rect(g, 62, 14, 36, 96, 'e'); rect(g, 64, 14, 8, 96, 'v');      // lumière du couloir
    rect(g, 60, 10, 4, 100, 'g');
    // couverture au sol, forme immobile
    rect(g, 74, 92, 50, 14, 'u'); rect(g, 74, 92, 50, 3, 'n'); px(g, 78, 90, 's');
    // goutte d'eau qui tombe du plafond (animée)
    px(g, 40, 20 + (f * 9) % 60, 'e');
    // barreaux d'ombre
    for (let x = 8; x < W; x += 44) rect(g, x, 0, 5, H, 'k');
  },

  // ---------- FERRY : quai de la Joliette ----------

  // ferry à quai la nuit, grues portuaires
  ferry_quai(g, f) {
    rect(g, 0, 0, W, 66, 'N');
    rect(g, 0, 88, W, 32, 't');                                      // rade
    for (let i = 0; i < 18; i++) px(g, (i * 19 + f * 4) % W, 90 + (i * 7 + f * 3) % 26, 'e'); // reflets
    // grues portuaires à contre-jour
    rect(g, 8, 18, 5, 50, 'k'); hl(g, 8, 18, 34, 'k'); vl(g, 40, 18, 10, 'k');
    rect(g, 134, 24, 5, 44, 'k'); hl(g, 104, 24, 34, 'k');
    // coque et superstructures du Méridional
    rect(g, 22, 56, 118, 20, 'n'); rect(g, 22, 54, 118, 4, 'w');     // liseré
    rect(g, 34, 36, 90, 20, 'n'); rect(g, 34, 36, 90, 3, 'g');
    rect(g, 46, 24, 60, 12, 'n'); rect(g, 60, 18, 26, 6, 'k');       // passerelle + cheminée
    // rangées de hublots allumés, un qui clignote
    for (let i = 0; i < 12; i++) px(g, 38 + i * 9, 42, i === 5 ? (f % 2 ? 'a' : 'N') : 'a');
    for (let i = 0; i < 14; i++) px(g, 26 + i * 8, 64, 'a');
    // quai, containers, gyros qui tournent
    rect(g, 0, 76, W, 12, 'U'); hl(g, 0, 76, W, 'k');
    rect(g, 30, 66, 16, 10, 'o'); rect(g, 50, 68, 16, 8, 'u');
    px(g, 148, 74, f % 2 ? 'r' : 'b'); px(g, 152, 74, f % 2 ? 'b' : 'r'); // gyrophares
  },

  // pont garage : silhouettes armées entre les voitures
  pont_voitures(g, f) {
    rect(g, 0, 0, W, H, 'N');
    rect(g, 0, 0, W, 14, 'n');                                       // plafond bas
    for (let i = 0; i < 5; i++) rect(g, 8 + i * 34, 6, 16, 3, f % 3 === 1 && i === 2 ? 'U' : 'a'); // néons
    // rangées de voitures
    for (let i = 0; i < 3; i++) voiture(g, 8 + i * 50, 78, ['u', 'o', 'n'][i], f, false);
    for (let i = 0; i < 2; i++) voiture(g, 30 + i * 50, 96, ['n', 'u'][i], f, false);
    // deux silhouettes cagoulées, lampe qui balaie
    rect(g, 40, 46, 7, 7, 's'); rect(g, 38, 53, 11, 26, 'U'); px(g, 39, 48, 'k');
    hl(g, 48, 58, 14, 'k'); px(g, 62, 57, 'y');                      // lampe torche
    const beam = f % 2;
    for (let i = 0; i < 5; i++) hl(g, 63 + i * 8, 55 - beam * 2 + i, 8, 'a'); // rayon
    rect(g, 96, 44, 7, 7, 's'); rect(g, 94, 51, 11, 28, 'U'); px(g, 95, 46, 'k');
    hl(g, 82, 56, 14, 'k');                                          // fusil pointé bas
    // ligne de marquage au sol
    for (let x = 0; x < W; x += 14) hl(g, x, 114, 8, 'g');
  },

  // Mira à la radio de la passerelle
  mira_radio(g, f) {
    rect(g, 0, 0, W, H, 'n');
    // grandes vitres de la passerelle sur la rade
    rect(g, 10, 8, 140, 46, 'N');
    for (let i = 1; i < 5; i++) vl(g, 10 + i * 28, 8, 46, 'k');
    for (let i = 0; i < 8; i++) px(g, 16 + (i * 17 + f * 3) % 130, 12 + (i * 11 + f * 2) % 40, 'e'); // pluie sur les vitres
    // console : écrans et voyants
    rect(g, 10, 70, 140, 34, 'U'); rect(g, 10, 70, 140, 4, 'k');
    for (let i = 0; i < 4; i++) rect(g, 20 + i * 26, 76, 18, 10, i === 2 && f % 2 ? 'N' : 'b');
    for (let i = 0; i < 10; i++) px(g, 22 + i * 12, 92, [f % 2 ? 'r' : 'G', 'a', 'g'][i % 3]);
    // Mira de profil, combiné à l'oreille
    rect(g, 72, 34, 9, 9, 's'); rect(g, 70, 26, 13, 8, 'H');         // cheveux courts
    rect(g, 68, 43, 16, 30, 'u');
    vl(g, 82, 44, 12, 's'); px(g, 83, 42 + (f % 2), 'k');            // combiné
    // la rade par la fenêtre : un gyrophare lointain
    px(g, 40, 44, f % 2 ? 'r' : 'b');
  },

  // charge explosive et son minuteur
  minuteur(g, f) {
    rect(g, 0, 0, W, H, 'N');
    // fond : tôle de coque rivetée
    rect(g, 0, 0, W, H, 'n');
    for (let y = 10; y < H; y += 24) { hl(g, 0, y, W, 'U'); for (let x = 8; x < W; x += 16) px(g, x, y - 2, 'g'); }
    // bloc de charge sanglé à un longeron
    rect(g, 60, 40, 44, 34, 'J'); rect(g, 60, 40, 44, 4, 'k'); rect(g, 60, 70, 44, 4, 'k');
    vl(g, 58, 36, 42, 'g'); vl(g, 104, 36, 42, 'g');                 // sangles
    // minuteur : chiffres lumineux qui défilent
    rect(g, 66, 46, 32, 16, 'k');
    rect(g, 68, 49, 9, 10, 'N'); rect(g, 85, 49, 9, 10, 'N');
    px(g, 71, 51, 'r'); vl(g, 71, 51, 6, 'r'); px(g, 74, 51, 'r');   // chiffre 2
    px(g, 88, 51, 'r'); px(g, 91, 54, 'r'); px(g, 88, 57, 'r');
    px(g, 81, 51 + (f % 2), 'r'); px(g, 81, 57 - (f % 2), 'r');      // deux-points clignotant
    // fils vers le détonateur
    hl(g, 74, 78, 22, 'y'); vl(g, 96, 74, 5, 'y');
    vl(g, 70, 78, 8, 'r'); px(g, 70, 86, 'k');
    // voyant rouge qui pulse
    px(g, 108, 44, f % 2 ? 'r' : 'k');
  },

  // la houle se lève contre la coque (acte II)
  houle_pont(g, f) {
    rect(g, 0, 0, W, 52, 'N');
    // pluie fine de travers
    for (let i = 0; i < 30; i++) { const x = (i * 29 + f * 7) % W, y = (i * 13 + f * 11) % 60; vl(g, x, y, 3, 'e'); }
    // vagues qui montent/descendent contre la muraille de coque
    const swell = f % 3;
    rect(g, 0, 52 - swell * 2, W, 68, 't');
    for (let i = 0; i < 8; i++) {
      const x = (i * 22 + f * 5) % (W + 20) - 10, y = 52 - swell * 2 - (i % 2) * 3;
      rect(g, x, y, 14, 4, 'e');                                     // crêtes blanches
    }
    // flanc de coque sombre qui tangue
    rect(g, 0, 70 + swell, W, 50, 'n'); hl(g, 0, 70 + swell, W, 'g');
    for (let i = 0; i < 10; i++) px(g, 14 + i * 15, 78 + swell, 'a');
    // amarres tendues vers le quai invisible
    hl(g, 20, 88, 30, 'k'); hl(g, 110, 92, 34, 'k');
    px(g, 20, 88, 'r'); px(g, 144, 92, 'r');                         // feux de position
  },

  // Ansel reprend le combiné (acte III)
  ansel_combine(g, f) {
    rect(g, 0, 0, W, H, 'N');
    // cabine sombre, veilleuse froide
    rect(g, 0, 0, W, 92, 'n'); rect(g, 0, 92, W, 28, 'U'); hl(g, 0, 92, W, 'k');
    rect(g, 118, 18, 24, 16, 'b'); px(g, 128, 24, 'v');              // écran bleuté
    // profil sévère penché sur la console radio
    rect(g, 56, 30, 10, 10, 's'); rect(g, 54, 26, 14, 6, 'H');       // cheveux tirés
    rect(g, 50, 40, 20, 34, 'U');
    vl(g, 70, 46, 14, 's'); rect(g, 71, 44, 20, 9, 'k');             // bras + combiné
    // console : fréquence qui défile
    rect(g, 30, 74, 104, 18, 'k');
    for (let i = 0; i < 8; i++) px(g, 36 + i * 12, 80, i === (f % 8) ? 'r' : 'G');
    hl(g, 36, 86, 92, 'U'); px(g, 40 + (f % 12) * 7, 86, 'a');       // curseur
    // cendrier, fumée de cigarette
    rect(g, 14, 86, 8, 4, 'g');
    for (let i = 0; i < 4; i++) px(g, 18 + (f % 2), 82 - i * 4 - (f % 3), 'g');
  },

  // porte latérale ouverte, passager sur la passerelle
  passerelle(g, f) {
    rect(g, 0, 0, W, 60, 'N');
    rect(g, 0, 88, W, 32, 't');                                      // eau noire
    for (let i = 0; i < 12; i++) px(g, (i * 23 + f * 4) % W, 90 + (i * 7 + f * 3) % 26, 'e');
    // flanc du ferry, porte ouverte pleine de lumière
    rect(g, 0, 30, W, 60, 'n'); hl(g, 0, 30, W, 'g');
    rect(g, 60, 36, 30, 52, 'a'); rect(g, 60, 36, 30, 3, 'y');       // lumière intérieure
    // passerelle inclinée vers le quai
    rect(g, 24, 88, 40, 5, 'g'); hl(g, 24, 87, 40, 'k');             // planche vers la gauche
    vl(g, 28, 88, 12, 'k'); vl(g, 60, 88, 4, 'k');
    // passager qui descend, mains sur la tête (bras remuent)
    const st = f % 2;
    rect(g, 46 - st * 2, 72, 7, 6, 's'); rect(g, 44 - st * 2, 78, 11, 10, 'o');
    vl(g, 42 - st * 2, 74, 4, 's'); vl(g, 55 - st * 2, 74, 4, 's');
    // projecteurs braqués depuis le quai
    for (let i = 0; i < 6; i++) hl(g, 96 + i * 6, 84 - i * 7, 4, 'y');
    px(g, 100, 90, 'r'); px(g, 104, 90, f % 2 ? 'b' : 'r');
  },
};

export const CUT_ARTS = Object.keys(ARTS);

export function cutSprite(artId, frame = 0) {
  const fn = ARTS[artId];
  const g = G(W, H);
  if (fn) fn(g, frame);
  return sprite(g);
}
