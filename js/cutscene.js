// ============================================================
// Cinématiques pixel-art — overlay plein écran : panneaux
// { art, lines }, machine à écrire, tap = finir la ligne /
// ligne suivante / panneau suivant / fin.
// Extrait de main.js : les dépendances à l'application sont
// injectées par initCutscene() — aucun import de main.js.
// ============================================================

import * as PIX from './pixel.js';
import * as CUT from './pixelcut.js';
import * as AU from './audio.js';
import * as UI from './ui.js';
import { pickCutscene } from './data/cutscenes.js';

const $ = UI.$;

// Délai avant la suite (débrief, cinématique auto) : laisse la
// machine à écrire du transcript finir. Utilisé aussi par main.js.
export const TYPEWRITER_DELAY = 2400;

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');

// api injecté par main.js :
//   illusOn()     → réglage « Illustrations »
//   getGame()     → état moteur courant (ou null)
//   saveEnabled() → false en mode ?debug (aucune persistance)
//   persistGame() → sauvegarde la partie en cours
//   pumpVig()     → reprend la file de vignettes
//   vigActive()   → vrai si une vignette est affichée ou en file
let api = null;

let cutPanels = null, cutPi = 0, cutLi = 0;
let cutTyping = false, cutTypeTimer = null;
let cutAnimTimer = null, cutFrame = 0, cutDoneCb = null;

export function initCutscene(a) {
  api = a;
  $('#cut-overlay').addEventListener('click', () => cutAdvance());
  $('#btn-cut-skip').addEventListener('click', (e) => { e.stopPropagation(); closeCutscene(); });
}

export function cutOpen() { return cutPanels !== null; }

function screenMusic() {
  if ($('#scr-game').classList.contains('active')) return 'game';
  if ($('#scr-brief').classList.contains('active')) return 'cinematique';
  return 'menu';
}

function drawCutFrame() {
  if (!cutPanels) return;
  PIX.renderSprite($('#cut-canvas'), CUT.cutSprite(cutPanels[cutPi].art, cutFrame));
}

function cutShowLine(instant = false) {
  const line = cutPanels[cutPi].lines[cutLi];
  const txt = $('#cut-text');
  if (instant || REDUCED.matches) { txt.textContent = line; cutTyping = false; return; }
  txt.textContent = '';
  cutTyping = true;
  let i = 0;
  cutTypeTimer = setInterval(() => {
    i++;
    txt.textContent = line.slice(0, i);
    if (i >= line.length) { clearInterval(cutTypeTimer); cutTypeTimer = null; cutTyping = false; }
  }, 22);
}

export function cutAdvance() {
  if (!cutPanels) return;
  if (cutTyping) { // 1er tap : termine la ligne en cours
    clearInterval(cutTypeTimer); cutTypeTimer = null; cutTyping = false;
    $('#cut-text').textContent = cutPanels[cutPi].lines[cutLi];
    return;
  }
  cutLi++;
  if (cutLi >= cutPanels[cutPi].lines.length) {
    cutPi++; cutLi = 0;
    if (cutPi >= cutPanels.length) { closeCutscene(); return; }
    cutFrame = 0;
    AU.swell();
    drawCutFrame();
  }
  cutShowLine();
}

export function showCutscene(panels, onDone = null, startPanel = 0, instant = false) {
  if (!panels || !panels.length) { onDone && onDone(); return; }
  cutPanels = panels; cutPi = startPanel; cutLi = 0; cutDoneCb = onDone;
  cutFrame = 0;
  $('#cut-overlay').classList.remove('hidden');
  drawCutFrame();
  cutShowLine(instant);
  if (cutAnimTimer) { clearInterval(cutAnimTimer); cutAnimTimer = null; }
  if (!REDUCED.matches) cutAnimTimer = setInterval(() => { cutFrame++; drawCutFrame(); }, 125);
  AU.setAmbience('cinematique');
  AU.setTension({ cut: true });
}

export function closeCutscene() {
  if (cutTypeTimer) { clearInterval(cutTypeTimer); cutTypeTimer = null; }
  if (cutAnimTimer) { clearInterval(cutAnimTimer); cutAnimTimer = null; }
  cutPanels = null; cutTyping = false;
  $('#cut-overlay').classList.add('hidden');
  const cb = cutDoneCb; cutDoneCb = null;
  AU.setTension({ cut: false });
  AU.setAmbience(screenMusic());
  api.pumpVig();                   // la file de vignettes reprend
  if (cb) cb();
}

// cinématiques de milieu de partie : déclencheurs, une fois chacune.
// Jamais pendant une vignette, jamais en mode auto, après le délai de frappe.
export function maybeCutscene() {
  const game = api.getGame();
  if (!api.saveEnabled() || !api.illusOn() || !game) return;
  if (game.result || game.phase === 'choice') return;
  if (cutOpen() || api.vigActive()) return;
  if (!game.cutsSeen) game.cutsSeen = [];
  const c = pickCutscene(game, game.cutsSeen);
  if (!c) return;
  setTimeout(() => {
    const g = api.getGame();
    if (cutOpen() || !g || g.result || g.phase === 'choice') return;
    if (api.vigActive()) return;
    g.cutsSeen.push(c.key);
    api.persistGame();
    showCutscene(c.panels, null);
  }, TYPEWRITER_DELAY);
}
