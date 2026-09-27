// ============================================================
// NÉGOCIATEUR — Cellule de crise — bootstrap & navigation
// ============================================================

import * as E from './engine.js';
import * as UI from './ui.js';
import * as CAM from './campaign.js';
import * as AU from './audio.js';
import * as PIX from './pixel.js';
import { MISSION_LIST, getMission } from './data/missions/index.js';
import { getIntro } from './data/cutscenes.js';
import { repEffective } from './reputation.js';
import { storyContexts } from './data/story.js';
import { optionsMultiplier } from './data/options.js';
import { VERSION } from './version.js';
import { initCutscene, cutOpen, showCutscene, maybeCutscene, TYPEWRITER_DELAY } from './cutscene.js';

const $ = UI.$, $$ = UI.$$;

let campaign = null;
let saveEnabled = true;     // false en mode ?debug#auto:… (aucune écriture localStorage)
let game = null;            // état moteur courant
let logCursor = 0;          // nb d'entrées de log déjà rendues
let optsSel = {};           // options cochées au briefing
let pendingMission = null;
let chronoTimer = null, chronoLeft = 60, chronoTurn = -1;
let tutoIndex = -1;

// Hauteur réelle du viewport (dvh incertain sur mobile) → variable CSS --app-h
function setAppH() {
  document.documentElement.style.setProperty('--app-h', `${window.innerHeight}px`);
}
setAppH();
addEventListener('resize', setAppH);
addEventListener('orientationchange', setAppH);
if (window.visualViewport) visualViewport.addEventListener('resize', setAppH);

// ---------------- utilitaires ----------------
function settings() { return campaign ? campaign.settings : CAM.loadSettings(); }

function persistSettings(patch) {
  const s = { ...settings(), ...patch };
  if (campaign) { campaign.settings = s; CAM.saveCampaign(campaign); }
  CAM.saveSettings(s);
  return s;
}

function updateMuteBtn() {
  $('#btn-mute').textContent = settings().mute ? '🔇' : '🔊';
}

function syncSettingsUI() {
  const s = settings();
  const vol = $('#set-volume'), flash = $('#set-flash'), illus = $('#set-illus'), mus = $('#set-music'), adv = $('#set-advice');
  if (vol) vol.value = Math.round((s.volume ?? 0.7) * 100);
  if (flash) flash.checked = s.flash !== false;
  if (illus) illus.checked = s.illus !== false;
  if (mus) mus.checked = s.music !== false;
  if (adv) adv.checked = s.advice !== false;
}

function illusOn() { return settings().illus !== false; }

function applyIllusSettings() {
  const bar = $('#scene-bar');
  if (bar) {
    bar.classList.toggle('hidden', !illusOn());
    // écrans ≤ 620 px : scène repliée par défaut (le tap du joueur reste prioritaire)
    const collapsed = settings().sceneCollapsed ?? window.innerHeight <= 620;
    UI.setSceneCollapsed(collapsed);
  }
}

function seedNow() { return (Date.now() ^ (Math.random() * 0xffffffff)) | 0; }

// ---------------- synchronisation UI partie ----------------
function newLogEntries() {
  const e = game.log.slice(logCursor);
  logCursor = game.log.length;
  return e;
}

// ---------------- humeur du preneur ----------------
// Menace → humeur de base ; événements récents → humeur ponctuelle
// (mort d'otage → abattu pendant la réplique suivante, échec → furieux).
let moodEvent = null, moodHold = 0;
let prevThreat = null;

function computeMood() {
  if (moodEvent) return moodEvent;
  const t = game ? game.threat : 3;
  return t >= 5 ? 'furieux' : t >= 3 ? 'tendu' : 'calme';
}

function moodFromEntry(e) {
  if (e.k === 'death') { moodEvent = 'abattu'; moodHold = 2; }
  else if (e.k === 'dice' && e.data && typeof e.data.successes === 'number') {
    if (e.data.successes === 0) { moodEvent = 'furieux'; moodHold = 1; }
    else if (e.data.successes >= 2) { moodEvent = 'calme'; moodHold = 1; }
  } else if (e.k === 'taker' && moodHold > 0) {
    if (--moodHold <= 0) moodEvent = null;
  }
}

// ---------------- vignettes d'événements ----------------
const vigQueue = [];
let vigBusy = false;
let vigTimer = null;
let resultVigShown = false;

function queueVig(kind, title) {
  if (!illusOn()) return;
  vigQueue.push({ kind, title });
  pumpVig();
}

function dismissVig() {
  vigQueue.length = 0;
  if (vigTimer) { clearTimeout(vigTimer); vigTimer = null; }
  const ov = $('#vig-overlay');
  ov.classList.add('hidden');
  vigBusy = false;
}

function pumpVig() {
  if (vigBusy || !vigQueue.length) return;
  if (cutOpen()) return;           // les cinématiques passent d'abord
  if (document.hidden) { vigQueue.length = 0; return; }
  vigBusy = true;
  const { kind, title } = vigQueue.shift();
  const ov = $('#vig-overlay');
  ov.innerHTML = '';
  const box = UI.el('div', 'vig-box');
  const cv = PIX.spriteCanvas(PIX.vignetteSprite(kind));
  box.append(cv, UI.el('div', 'vig-title', title), UI.el('div', 'vig-hint', 'Touchez pour passer'));
  ov.append(box);
  ov.classList.remove('hidden');
  const done = () => {
    if (vigTimer) { clearTimeout(vigTimer); vigTimer = null; }
    if (!vigBusy) return;
    ov.classList.add('hidden');
    vigBusy = false;
    pumpVig();
  };
  ov.onclick = done;
  vigTimer = setTimeout(done, 1300);
}

function vigForEntry(e) {
  const t = e.text || '';
  if (e.k === 'terror' && t.startsWith('◆ TERREUR')) return queueVig('terror', t.replace(/^◆ TERREUR —\s*/, ''));
  if (e.k === 'terror' && t.includes('HEURE H')) return queueVig('heureh', 'HEURE H');
  if (e.k === 'death') return queueVig('death', 'PERTE');
  if (e.k === 'sys' && t.startsWith('🚪')) return queueVig('freed', 'LIBÉRATION');
  if (e.k === 'act' && /ACTE [IVX]+/.test(t)) return queueVig('acte', t.replace(/═/g, '').trim());
  if (e.k === 'clue') return queueVig('clue', 'INDICE RÉVÉLÉ');
  if (e.k === 'radio' && t.startsWith('◆ ASSAUT')) return queueVig('assault', 'ASSAUT');
  if (e.k === 'sys' && t.includes('compris le mensonge')) return queueVig('terror', 'MENSONGE DÉCOUVERT');
}

function sfxFor(entry) {
  moodFromEntry(entry);
  vigForEntry(entry);
  switch (entry.k) {
    case 'taker': case 'radio': AU.playSquelch(); break;
    case 'dice': AU.playDice(); break;
    case 'death': AU.playGunshot(); AU.playDeathTone(); break;
    case 'terror': AU.playTerrorStinger(); break;
    case 'epilogue': break;
  }
}

// ---------------- cinématiques pixel-art ----------------
// Joueur d'overlay (panneaux { art, lines }, machine à écrire,
// tap = finir ligne → ligne → panneau → fin) : js/cutscene.js.
initCutscene({
  illusOn,
  getGame: () => game,
  saveEnabled: () => saveEnabled,
  persistGame,
  pumpVig,
  vigActive: () => vigBusy || vigQueue.length > 0,
});

// ---------------- teinte de menace ----------------
let lastTintThreat = null;

function flashTint() {
  const el = $('#threat-tint');
  el.classList.remove('tt-flash');
  void el.offsetWidth;             // relance l'animation
  el.classList.add('tt-flash');
  setTimeout(() => el.classList.remove('tt-flash'), 500);
}

function syncThreatTint() {
  const fog = !!(game && game.options && game.options.brouillard);
  const lvl = (!game || fog) ? 0 : game.threat;
  if (lastTintThreat != null && lvl > lastTintThreat && !fog && settings().flash) flashTint();
  lastTintThreat = lvl;
  if (lvl >= 1) document.body.dataset.tt = String(lvl);
  else document.body.removeAttribute('data-tt');
}

// ---------------- boucle d'animation pixel (8 fps) ----------------
let animTimer = null, animFrame = 0, missionStartMs = 0;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');

function pad2(n) { return String(n).padStart(2, '0'); }

function animTick() {
  if (!game || !$('#scr-game').classList.contains('active')) return;
  animFrame++;
  if (!illusOn()) return;
  UI.drawSceneFrame(game, animFrame);
  const el_ = Math.floor((Date.now() - missionStartMs) / 1000);
  const clock = $('#sb-clock');
  if (clock) clock.textContent = `${pad2(Math.floor(el_ / 3600))}:${pad2(Math.floor(el_ / 60) % 60)}:${pad2(el_ % 60)}`;
  // bouche qui parle : réplique LUI → médaillon ; VOUS → avatar de la ligne
  const sp = UI.activeSpeech();
  const talkingTaker = !!(sp && sp.who === 'taker');
  UI.renderSceneBanner(game, computeMood(), talkingTaker && animFrame % 2 === 0);
  if (sp && sp.canvas) {
    PIX.renderSprite(sp.canvas, PIX.portraitSprite(sp.spec, animFrame % 2 === 0 ? 'parle' : sp.expr));
  }
}

function startAnim() {
  stopAnim();
  if (REDUCED.matches) return;      // images fixes, pas de boucle
  animTimer = setInterval(animTick, 125);
}
function stopAnim() { if (animTimer) { clearInterval(animTimer); animTimer = null; } }

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopAnim();
  else if (game && $('#scr-game').classList.contains('active')) startAnim();
});

function syncGameUI(instantLog = false) {
  UI.renderHUD(game);
  UI.renderCounters(game);
  UI.renderPhaseBanner(game, chronoLeft);
  UI.renderHand(game, onCardTap);
  UI.updateGyro(game.threat);
  const entries = newLogEntries();
  // stingers de variation de menace (jamais sous brouillard ; une mort
  // a déjà son propre son — pas de threatUp par-dessus)
  if (prevThreat != null && game.threat !== prevThreat && !(game.options && game.options.brouillard)) {
    if (game.threat > prevThreat) {
      if (!entries.some(e => e.k === 'death')) AU.playThreatUp();
    } else AU.playThreatDown();
  }
  prevThreat = game.threat;
  AU.setThreat(game.threat);
  AU.setTension({
    threat: game.threat,
    deckLeft: game.terrorDeck.length,
    fog: !!(game.options && game.options.brouillard),
    chronoLeft: (game.options.chrono && game.phase === 'conversation' && !game.result) ? chronoLeft : null,
    over: !!game.result,
  });
  syncThreatTint();
  UI.appendLogEntries(entries, {
    onEntry: sfxFor, flash: settings().flash, instant: instantLog,
    portraits: illusOn() ? { player: PIX.PLAYER_PORTRAIT, taker: UI.getTakerPortrait(game) } : null,
    mood: computeMood(),
  });
  if (illusOn()) {
    UI.renderSceneBanner(game, computeMood(), false);
    UI.drawSceneFrame(game, animFrame);
  }
  if (game.result && !resultVigShown) {
    resultVigShown = true;
    const v = { surrender: 'surrender', liberation: 'freed', assault: 'assault', escape: 'terror', defeat: 'death' };
    queueVig(v[game.result.outcome] || 'terror', game.result.outcome.toUpperCase());
  }
  updateEndPhaseBtn();
  if (game.phase === 'choice' && !game.result) {
    UI.renderChoiceModal(game, (i) => {
      UI.closeChoiceModal();
      E.chooseOption(game, i);
      afterAction();
    });
  } else UI.closeChoiceModal();
  if (game.result) setTimeout(showDebrief, TYPEWRITER_DELAY);
  maybeCutscene();
}

function updateEndPhaseBtn() {
  const b = $('#btn-endphase');
  const labels = {
    conversation: 'Fin de la conversation',
    market: 'Fin des achats',
    team: 'Terminer le tour',
  };
  b.textContent = labels[game.phase] || 'Fin de phase';
  b.disabled = !!game.result || game.phase === 'choice';
}

function openTab(tab) {
  const panel = $('#tab-panel');
  const isOpen = !panel.classList.contains('hidden');
  if (isOpen && panel.dataset.tab === tab) {
    panel.classList.add('hidden');
    $$('#game-tabs button[data-tab]').forEach(b => b.classList.remove('on'));
    return;
  }
  panel.dataset.tab = tab;
  $$('#game-tabs button[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  UI.renderTab(game, tab, tabHandlers);
}

function refreshOpenTab() {
  const panel = $('#tab-panel');
  if (!panel.classList.contains('hidden') && panel.dataset.tab) {
    UI.renderTab(game, panel.dataset.tab, tabHandlers);
  }
}

function persistGame() {
  if (!saveEnabled) return;
  if (game && !game.result) CAM.saveGame(game);
  else if (game && game.result) CAM.clearGame();
}

// ---------------- actions joueur ----------------
function onCardTap(cardId) {
  if (!game || game.result) return;
  const box = UI.openCardModal(game, cardId, {
    play: (cid, targetId) => {
      const useReroll = !!(box && box.querySelector('input[type=checkbox]') && box.querySelector('input[type=checkbox]').checked);
      $('#card-modal').classList.add('hidden');
      doPlayCard(cid, targetId, useReroll);
    },
  });
}

function doPlayCard(cardId, targetId, useReroll) {
  const res = E.playCard(game, cardId, targetId, { useReroll });
  if (!res.ok) return;
  if (res.dice && res.dice.length) {
    // on laisse apparaître les dés un instant
    UI.showDice(res.dice, res.successes, null);
  }
  // l'étape « Dés » du tutoriel s'affiche une fois le jet visible
  maybeAdvanceTuto('card', res.dice && res.dice.length ? 650 : 0);
  afterAction();
}

// Conseil de la psy : une entrée « psy » au début de chaque phase de
// conversation (la clé se répète au plus toutes les 3 tours, côté moteur).
let lastPhase = null;
function maybeAdvice() {
  if (!game || game.result || game.phase !== 'conversation') return;
  if (lastPhase === 'conversation') return;
  if (settings().advice === false) return;
  E.addAdvice(game);
}

function afterAction() {
  // nouvelle phase de conversation (tour suivant, après un choix) → relance le chrono.
  // chronoTimer peut survivre <1 s à la sortie de conversation (intervalle pas encore
  // tické) : on vérifie aussi le tour, sinon le chrono repartirait avec le temps restant.
  if (game.phase === 'conversation' && (!chronoTimer || chronoTurn !== game.turn)) startChrono();
  maybeAdvice();
  lastPhase = game.phase;
  syncGameUI();
  refreshOpenTab();
  persistGame();
}

const tabHandlers = {
  buy: (i) => { E.buyCard(game, i); afterAction(); },
  team: (action, target) => {
    if (action === 'assault' && !confirm('Donner l\'assaut met fin à la mission. Confirmer ?')) return;
    const res = E.doTeamAction(game, action, target);
    if (!res.ok) return;
    afterAction();
  },
  rules: (sec) => UI.openRules(sec),
};

// Clic sur le compteur OTAGES → onglet Dossier, section Otages
$('#game-hud').addEventListener('click', (e) => {
  if (!game || !e.target.closest('.hud-otages')) return;
  openTab('dossier');
  const sec = $('#host-sec');
  if (sec) sec.scrollIntoView({ block: 'start' });
});

$('#btn-endphase').addEventListener('click', () => {
  if (!game || game.result) return;
  const prev = game.phase;
  E.endPhase(game);
  afterAction();
  if (game.phase === 'market') openTab('marche');
  else if (game.phase === 'team') openTab('equipe');
  else {
    $('#tab-panel').classList.add('hidden');
    $$('#game-tabs button[data-tab]').forEach(b => b.classList.remove('on'));
  }
  maybeAdvanceTuto('phase');
});

$$('#game-tabs button[data-tab]').forEach(b => {
  b.addEventListener('click', () => { maybeAdvanceTuto('tab'); openTab(b.dataset.tab); });
});

$('#transcript').addEventListener('click', () => UI.skipAllTyping());

// ---------------- chrono (option) ----------------
function chronoBase() { return (game && game.flags && game.flags.chronoBase) || 60; }

function startChrono() {
  stopChrono();
  if (!game.options.chrono || game.phase !== 'conversation' || game.result) return;
  chronoLeft = chronoBase();
  chronoTurn = game.turn;
  chronoTimer = setInterval(() => {
    if (!game || game.result || game.phase !== 'conversation') { stopChrono(); return; }
    if (cutOpen()) return;          // le chrono ne tourne pas pendant une cinématique
    chronoLeft--;
    AU.setTension({ chronoLeft });
    UI.renderPhaseBanner(game, chronoLeft);
    if (chronoLeft <= 0) {
      stopChrono();
      E.applyChronoTimeout(game);
      afterAction();
      if (game.phase === 'market') openTab('marche');
    }
  }, 1000);
}
function stopChrono() { if (chronoTimer) { clearInterval(chronoTimer); chronoTimer = null; } chronoLeft = chronoBase(); AU.setTension({ chronoLeft: null }); }

// ---------------- tutoriel ----------------
// Bloc d'intro ({ center: true }, sans cible ni spot) : le but, les issues,
// les défaites et le tour de jeu — AVANT de présenter l'interface.
const TUTO_STEPS = [
  { center: true, text: 'Cellule de crise. Un homme armé retient des otages — et il a décroché le téléphone. Vous êtes le négociateur au bout du fil : votre mission est de les faire sortir vivants.' },
  { center: true, text: 'Quatre issues : la REDDITION (menace ≤ 2, demande majeure réglée, « Proposer la reddition » réussie) ; la LIBÉRATION de tous les otages ; l\'ASSAUT, rapide mais risqué ; ou tenir jusqu\'à l\'HEURE H — la dernière carte Terreur.' },
  { center: true, text: 'Ce qui vous perd : la menace à 7 — il tue un otage. Plus un seul otage en vie — défaite. La presse à 10 — le préfet ordonne l\'assaut, vous perdez la main. Certains scénarios ajoutent leurs pièges (compteurs, fuite).' },
  { center: true, text: 'Chaque tour : CONVERSATION (vos cartes coûtent des PC) → MARCHÉ → ACTION D\'ÉQUIPE → carte TERREUR. La pioche Terreur est l\'horloge de la nuit : quand elle s\'épuise, tout se joue.' },
  { sel: '#game-hud', text: 'En haut : la MENACE (1-7 — à 7, il tue), les OTAGES (touchez pour le dossier nominatif — certains sont fragiles, d\'autres imprévisibles), la PRESSE, l\'horloge TERREUR et vos PC.' },
  { sel: '#transcript', text: 'La transcription de la négociation ; au-dessus, la caméra de surveillance et son humeur. Les lignes « PSY — DR ANSELME » sont les conseils de la psychologue (désactivables au QG). Touchez le texte pour l\'accélérer.' },
  { sel: '#hand', text: 'Votre main de cartes de conversation : les effets de chaque palier sont en vert, avec leur % de chances exactes — un ⚠ rouge signale un échec dangereux. Touchez « Rassurer » puis « Jouer cette carte ».', advanceOn: 'card' },
  { sel: '#dice-zone', text: 'Les dés se jouent sur 5-6. La menace modifie le nombre de dés : sous la tension, tout se complique.' },
  { sel: '#game-tabs', text: 'Ouvrez l\'onglet Marché : des cartes à usage unique s\'achètent en préparation. « Exfiltration ciblée » vous laisse choisir l\'otage libéré ; « Promesse » vous engage — il vérifiera plus tard.', advanceOn: 'tab' },
  { sel: '#game-tabs', text: 'Onglet Équipe : une action par tour, chacune lance un dé — sur un 1 elle échoue ; les deux premiers faux pas de la nuit sont couverts par la cellule. Dossier : indices et otages. Demandes : ce qu\'il réclame. Les ⓘ ouvrent les règles.' },
  { center: true, text: 'Il vous posera parfois des questions — choisissez un ton : empathie, autorité, pression, ruse. Le badge ✓ vert signale une réponse cohérente avec son profil. Il retient tout.' },
  { sel: '#btn-endphase', text: 'Quand vos PC sont dépensés, terminez la phase : la carte Terreur tombera en fin de tour. Surveillez l\'horloge. Terminez cette phase.', advanceOn: 'phase' },
  { sel: '#game-tabs', text: 'Ce soir : trois otages et une demande majeure (★) — concédez-la ou faites-la abandonner, descendez la menace à 2, puis « Proposer la reddition ». Le bouton « ? » rouvre les règles. Bonne chance, négociateur.' },
];

let tutoTarget = null;

function startTutorial() {
  const mission = E.getMissionDef(game);
  if (!mission.tutorial) { tutoIndex = -1; return; }
  tutoIndex = 0;
  showTutoStep();
}

function tutoSuspended() {
  // masque l'overlay tant qu'une surface modale est ouverte
  return ['#card-modal', '#tab-panel', '#choice-modal', '#rules-modal', '#vig-overlay', '#cut-overlay']
    .some(sel => { const e = $(sel); return e && !e.classList.contains('hidden'); });
}

function syncTutoVisibility() {
  const ov = $('#tuto-overlay');
  const active = tutoIndex >= 0 && tutoIndex < TUTO_STEPS.length;
  const suspended = active && tutoSuspended();
  ov.classList.toggle('hidden', !active || suspended);
  // le spot (z-index 56) passerait au-dessus d'une modale ouverte (z 50)
  // et bloquerait ses boutons — on le retire tant qu'elle est affichée.
  if (suspended) $$('.tuto-spot').forEach(e => e.classList.remove('tuto-spot'));
  else if (tutoTarget) tutoTarget.classList.add('tuto-spot');
}

// La boîte ne doit JAMAIS recouvrir sa cible : en haut si la cible est
// dans la moitié basse, en bas sinon ; ni l'un ni l'autre → côté le plus large.
function positionTutoBox(target) {
  const box = $('#tuto-overlay .tuto-box');
  if (!box) return;
  box.style.top = 'auto'; box.style.bottom = 'auto'; box.style.transform = '';
  if (!target) {
    // étape centrée ({ center: true } ou cible absente) : bulle plein écran
    box.style.top = '50%';
    box.style.transform = 'translateY(-50%)';
    return;
  }
  const bh = box.offsetHeight || 140;
  const vh = window.innerHeight;
  const gap = 10, edge = 12;
  const r = target.getBoundingClientRect();
  const fitsTop = r.top >= edge + bh + gap;
  const fitsBottom = (vh - r.bottom) >= edge + bh + gap;
  const preferTop = (r.top + r.bottom) / 2 > vh / 2;
  if (preferTop && fitsTop) { box.style.top = `${edge}px`; return; }
  if (!preferTop && fitsBottom) { box.style.bottom = `${edge + 0}px`; return; }
  if (fitsBottom) { box.style.bottom = `${edge}px`; return; }
  if (fitsTop) { box.style.top = `${edge}px`; return; }
  // cible quasi plein écran : côté le plus large, collé au bord de la cible
  if (r.top >= vh - r.bottom) box.style.top = `${Math.max(edge, r.top - gap - bh)}px`;
  else box.style.bottom = `${Math.max(edge, vh - r.bottom - gap - bh)}px`;
}

function showTutoStep() {
  const ov = $('#tuto-overlay');
  if (tutoIndex < 0 || tutoIndex >= TUTO_STEPS.length) { ov.classList.add('hidden'); clearSpot(); return; }
  const step = TUTO_STEPS[tutoIndex];
  $('#tuto-text').textContent = step.text;
  const next = $('#btn-tuto-next');
  next.textContent = step.advanceOn ? 'À vous de jouer…' : 'Compris';
  next.disabled = !!step.advanceOn;
  clearSpot();
  tutoTarget = (!step.center && step.sel) ? $(step.sel) : null;
  if (tutoTarget) tutoTarget.classList.add('tuto-spot');
  positionTutoBox(tutoTarget);
  syncTutoVisibility();
}

function clearSpot() { $$('.tuto-spot').forEach(e => e.classList.remove('tuto-spot')); }

function endTutorial() {
  tutoIndex = -1;
  tutoTarget = null;
  $('#tuto-overlay').classList.add('hidden');
  clearSpot();
}

$('#btn-tuto-next').addEventListener('click', () => {
  const step = TUTO_STEPS[tutoIndex];
  if (step && step.advanceOn) return; // cette étape attend une action, pas un clic
  tutoIndex++;
  showTutoStep();
});
// « Passer l'étape » reste toujours actif, y compris sur les étapes à action
$('#btn-tuto-step').addEventListener('click', () => { tutoIndex++; showTutoStep(); });
$('#btn-tuto-skip').addEventListener('click', endTutorial);

function maybeAdvanceTuto(kind, delay = 0) {
  if (tutoIndex < 0 || tutoIndex >= TUTO_STEPS.length) return;
  const step = TUTO_STEPS[tutoIndex];
  if (step && step.advanceOn === kind) {
    const go = () => { if (TUTO_STEPS[tutoIndex] === step) { tutoIndex++; showTutoStep(); } };
    if (delay) setTimeout(go, delay); else go();
  }
}

// re-positionnement / ré-affichage quand les surfaces modales bougent
addEventListener('resize', () => { if (tutoIndex >= 0) positionTutoBox(tutoTarget); });
const tutoObserver = new MutationObserver(() => { if (tutoIndex >= 0) syncTutoVisibility(); });
['#card-modal', '#tab-panel', '#choice-modal', '#rules-modal', '#vig-overlay', '#cut-overlay'].forEach(sel => {
  const e = $(sel);
  if (e) tutoObserver.observe(e, { attributes: true, attributeFilter: ['class'] });
});

// ---------------- lancement d'une mission ----------------
// Sélection au QG → cinématique d'intro (si illustrations) → briefing.
function startIntroOrBriefing(missionId) {
  const intro = (saveEnabled && illusOn()) ? getIntro(missionId) : null;
  if (intro) showCutscene(intro, () => openBriefing(missionId));
  else openBriefing(missionId);
}

function openBriefing(missionId) {
  pendingMission = missionId;
  optsSel = {};
  refreshBriefing();
  UI.showScreen('scr-brief');
  AU.setAmbience('cinematique');
}

function refreshBriefing() {
  const mission = getMission(pendingMission);
  UI.renderBriefing(mission, optsSel, (id) => {
    optsSel[id] = !optsSel[id];
    refreshBriefing();
  }, repEffective(campaign.rep, campaign.skills), storyContexts(campaign, pendingMission));
  $('#btn-brief-intro').hidden = !(illusOn() && getIntro(pendingMission));
  $('#btn-brief-reroll').hidden = !(pendingMission && pendingMission.startsWith('gen:'));
}

function launchMission() {
  const seed = seedNow();
  game = E.createGame({
    missionId: pendingMission,
    seed,
    skills: campaign.skills,
    options: optsSel,
    agentName: campaign.agentName,
    stress: campaign.stress,
    rep: campaign.rep,
    story: campaign.story,
  });
  logCursor = 0;
  moodEvent = null; moodHold = 0; resultVigShown = false;
  lastPhase = null; prevThreat = null;
  missionStartMs = Date.now(); animFrame = 0;
  vigQueue.length = 0; vigBusy = false;
  lastTintThreat = null;
  UI.resetTranscript();
  UI.clearDice();
  $('#tab-panel').classList.add('hidden');
  applyIllusSettings();
  UI.showScreen('scr-game');
  AU.setAmbience('game');
  AU.playRing();
  maybeAdvice();
  lastPhase = game.phase;
  syncGameUI();
  startChrono();
  startAnim();
  startTutorial();
  persistGame();
}

// ---------------- débriefing ----------------
function showDebrief() {
  if (!game || !game.result) return;
  stopChrono();
  endTutorial();
  const mission = E.getMissionDef(game);
  const mult = optionsMultiplier(game.options);
  const scoreInfo = E.computeScore(game, mult);
  const outcome = game.result.outcome;
  // recordDaily d'abord : la série de jours (serie7) est à jour pour les trophées
  CAM.recordDaily(campaign, game.missionId, outcome, scoreInfo, game.hostages);
  const { rankUps, newTrophies } = CAM.recordResult(campaign, game.missionId, outcome, scoreInfo, game.hostages, game.options, game);
  const repReport = CAM.applyReputation(campaign, game.missionId, game);
  if (saveEnabled) { CAM.saveCampaign(campaign); CAM.clearGame(); }
  const rank = CAM.getRank(campaign.xp);
  UI.renderDebrief(game, mission, scoreInfo, scoreInfo.xp, rank.rank.name, rankUps, illusOn(), repReport, newTrophies);
  UI.showScreen('scr-debrief');
  AU.setAmbience('menu');
  AU.playJingle(outcome !== 'defeat');
}

// ---------------- QG ----------------
function showHQ() {
  stopChrono();
  stopAnim();
  dismissVig();
  game = null;
  UI.renderHQ(campaign, MISSION_LIST, {
    openMission: startIntroOrBriefing,
    learn: (skillId) => { CAM.learnSkill(campaign, skillId); if (saveEnabled) CAM.saveCampaign(campaign); showHQ(); },
    randomMission: () => {
      const seed = Math.floor(Math.random() * 900000) + 100000;
      pendingMission = `gen:${seed}`;
      openBriefing(pendingMission);
    },
    shareDaily: shareDailyResult,
  });
  const save = CAM.loadGame();
  const btnR = $('#btn-resume');
  if (save && save.version === 1 && !save.result) {
    btnR.hidden = false;
    btnR.onclick = resumeGame;
  } else btnR.hidden = true;
  updateMuteBtn();
  syncSettingsUI();
  UI.showScreen('scr-hq');
  AU.setAmbience('menu');
  AU.setThreat(1);
  syncThreatTint();
}

function resumeGame() {
  const save = CAM.loadGame();
  if (!save) return;
  game = E.deserialize(save);
  if (!game) return;
  logCursor = 0;
  missionStartMs = Date.now();
  lastTintThreat = null;
  lastPhase = null; prevThreat = null;
  UI.resetTranscript();
  UI.clearDice();
  applyIllusSettings();
  UI.showScreen('scr-game');
  AU.setAmbience('game');
  maybeAdvice();
  lastPhase = game.phase;
  syncGameUI(true);
  startChrono();
  startAnim();
}

// ---------------- navigation ----------------
$('#btn-start').addEventListener('click', () => {
  AU.initAudio();
  AU.setAmbience('menu');
  campaign = CAM.loadCampaign();
  if (campaign && campaign.agentName) {
    showHQ();
  } else {
    UI.showScreen('scr-agent');
    $('#agent-name').focus();
  }
});

$('#btn-agent-back').addEventListener('click', () => UI.showScreen('scr-home'));
$('#btn-agent-ok').addEventListener('click', () => {
  const name = $('#agent-name').value.trim() || 'Négociateur';
  campaign = CAM.defaultCampaign();
  campaign.agentName = name;
  campaign.settings = { ...campaign.settings, ...CAM.loadSettings() };
  CAM.saveCampaign(campaign);
  showHQ();
});

$('#btn-mute').addEventListener('click', () => {
  AU.initAudio();
  const s = persistSettings({ mute: !settings().mute });
  AU.setMuted(s.mute);
  updateMuteBtn();
});

$('#btn-brief-back').addEventListener('click', showHQ);
$('#btn-brief-go').addEventListener('click', launchMission);
$('#btn-brief-intro').addEventListener('click', () => {
  const intro = getIntro(pendingMission);
  if (intro) showCutscene(intro, null);
});
$('#btn-brief-reroll').addEventListener('click', () => {
  const seed = Math.floor(Math.random() * 900000) + 100000;
  pendingMission = `gen:${seed}`;
  refreshBriefing();
});

// Mission du jour — partage du premier résultat du jour
function shareDailyResult() {
  const d = campaign.daily;
  if (!d) return;
  const dt = new Date();
  const jj = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const text = `Négociateur — mission du jour ${jj}/${mm} : note ${d.grade}, ${d.saved}/${d.total} otages sauvés. https://frenchline.github.io/cellule-de-crise/`;
  if (navigator.share) {
    navigator.share({ text }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

$('#set-volume').addEventListener('input', e => {
  AU.initAudio();
  const v = e.target.value / 100;
  persistSettings({ volume: v });
  AU.setVolume(v);
});
$('#set-flash').addEventListener('change', e => {
  persistSettings({ flash: e.target.checked });
});
$('#set-illus').addEventListener('change', e => {
  persistSettings({ illus: e.target.checked });
  applyIllusSettings();
});
$('#set-music').addEventListener('change', e => {
  AU.initAudio();
  persistSettings({ music: e.target.checked });
  AU.setAmbienceEnabled(e.target.checked);
});
$('#set-advice').addEventListener('change', e => {
  persistSettings({ advice: e.target.checked });
});

// bandeau scène : tap = replier / déplier (persisté)
$('#scene-bar').addEventListener('click', () => {
  const cur = settings().sceneCollapsed ?? window.innerHeight <= 620;
  const s = persistSettings({ sceneCollapsed: !cur });
  UI.setSceneCollapsed(s.sceneCollapsed);
});

// boutons Règles (accueil / QG / partie)
$('#btn-rules-home').addEventListener('click', () => UI.openRules());
$('#btn-rules-hq').addEventListener('click', () => UI.openRules());
$('#btn-rules-game').addEventListener('click', () => UI.openRules());

$('#btn-rest').addEventListener('click', () => {
  CAM.restDay(campaign);
  CAM.saveCampaign(campaign);
  showHQ();
});

$('#btn-reset').addEventListener('click', () => {
  if (!confirm('Réinitialiser toute la campagne (XP, compétences, scores) ?')) return;
  if (!confirm('Vraiment ? Cette action est définitive.')) return;
  CAM.resetCampaign();
  campaign = CAM.defaultCampaign();
  UI.showScreen('scr-agent');
  $('#agent-name').focus();
});

// ---------------- export / import de la progression ----------------
$('#btn-export').addEventListener('click', () => {
  UI.openIOModal('Exporter la progression', { value: CAM.exportSave(campaign), readonly: true });
});
$('#btn-import').addEventListener('click', () => {
  UI.openIOModal('Importer une progression', {
    okLabel: 'Importer',
    onOk: (txt, errEl) => {
      try {
        campaign = CAM.importSave(txt);
        CAM.saveCampaign(campaign);
        UI.closeIOModal();
        showHQ();
        alert('Progression importée.');
      } catch {
        if (errEl) errEl.textContent = 'Code invalide.';
      }
    },
  });
});

$('#btn-debrief-ok').addEventListener('click', showHQ);

// ---------------- service worker ----------------
if ('serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { });
  });
}

// ---------------- init ----------------
// api injecté dans js/debug.js (chargé dynamiquement uniquement en
// mode ?debug — jamais en production). L'accès à l'état mutable se
// fait par getters/setters : debug.js n'importe pas main.js.
const debugApi = {
  get game() { return game; },
  get campaign() { return campaign; },
  set campaign(c) { campaign = c; },
  get pendingMission() { return pendingMission; },
  set pendingMission(m) { pendingMission = m; },
  set optsSel(o) { optsSel = o; },
  get tutoIndex() { return tutoIndex; },
  set tutoIndex(i) { tutoIndex = i; },
  TUTO_STEPS,
  get chronoLeft() { return chronoLeft; },
  set chronoLeft(v) { chronoLeft = v; },
  get chronoTimer() { return chronoTimer; },
  launchMission, openBriefing, showHQ, showDebrief,
  syncGameUI, afterAction, openTab, dismissVig,
  resetLog: () => { logCursor = 0; },
  showTutoStep,
};

(async function init() {
  UI.updateGyro(3);
  const hv = $('#home-ver'); if (hv) hv.textContent = VERSION;
  // Harnais de test/capture : ?debug#auto:<mode> (cf. js/debug.js).
  // saveEnabled = false AVANT tout mode auto : aucune écriture localStorage.
  const h = location.hash.slice(1);
  if (h.startsWith('auto:') && location.search.includes('debug')) {
    saveEnabled = false;
    const { initDebug } = await import('./debug.js');
    if (initDebug(debugApi)) return;
  }
  UI.showScreen('scr-home');
  AU.setAmbience('menu');
})();
