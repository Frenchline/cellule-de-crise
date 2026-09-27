// ============================================================
// debug.js — harnais de test/capture : tous les modes
// « ?debug#auto:… ». Chargé dynamiquement par main.js quand
// l'URL est en mode debug — jamais importé en production.
// La sauvegarde localStorage est désactivée par main.js AVANT
// l'appel (saveEnabled = false) : rien ici ne doit persister.
// Tout accès à l'état mutable de l'app passe par l'objet `api`
// injecté (getters/setters) — jamais d'import de main.js.
// ============================================================

import * as E from './engine.js';
import * as UI from './ui.js';
import * as CAM from './campaign.js';
import * as PIX from './pixel.js';
import * as CUT from './pixelcut.js';
import { getMission } from './data/missions/index.js';
import { CUTSCENES, getIntro } from './data/cutscenes.js';
import { showCutscene, closeCutscene } from './cutscene.js';

const $ = UI.$, $$ = UI.$$;

let api = null;

// api attendu (main.js) :
//   game (get) · campaign (get/set) · pendingMission (get/set)
//   optsSel (set) · tutoIndex (get/set) · TUTO_STEPS
//   chronoLeft (get/set) · chronoTimer (get)
//   launchMission() openBriefing(id) showHQ() showDebrief()
//   syncGameUI(instant) afterAction() openTab(name) dismissVig()
//   resetLog() showTutoStep()

// Joue `steps` phases de la partie courante (choix → option 0).
function playSteps(steps) {
  const game = api.game;
  for (let i = 0; i < steps && !game.result; i++) {
    if (game.phase === 'choice') { E.chooseOption(game, 0); continue; }
    if (game.phase === 'conversation') {
      const cid = game.hand.find(id => E.canPlayCard(game, id).ok);
      if (cid) E.playCard(game, cid, null); else E.endPhase(game);
    } else E.endPhase(game);
  }
}

function refreshTranscript() {
  api.resetLog(); UI.resetTranscript(); api.syncGameUI(true);
}

export function initDebug(a) {
  api = a;
  const h = location.hash.slice(1);
  if (!h.startsWith('auto:')) return false;
  let mode = h.slice(5);
  api.campaign = CAM.defaultCampaign();
  api.campaign.agentName = 'Doc';
  // préfixe « rep:<p>:<h>:… » : fixe les jauges de réputation puis enchaîne le mode
  if (mode.startsWith('rep:')) {
    const parts = mode.slice(4).split(':');
    api.campaign.rep = { presse: Math.max(0, Math.min(10, +parts[0] || 5)), hierarchie: Math.max(0, Math.min(10, +parts[1] || 5)) };
    api.campaign.repLast = {
      hierarchie: 'Le rapport est bouclé. Rentrez dormir, demain sera un autre jour.',
      presse: 'J\'ai assez pour un papier de vingt lignes. Ni plus, ni moins.',
    };
    mode = parts.slice(2).join(':');
  }
  // découpe "<missionId>[:p1[:p2]]" en tenant compte des ids « gen:<seed> »
  const splitId = (rest, nParams) => {
    const parts = rest.split(':');
    for (let k = Math.min(nParams, parts.length - 1); k >= 0; k--) {
      const mid = parts.slice(0, parts.length - k).join(':');
      if (getMission(mid)) return [mid, ...parts.slice(parts.length - k)];
    }
    return [rest];
  };
  if (mode === 'hq' || mode === 'hq:unlocked') {
    if (mode === 'hq:unlocked') {
      // campagne mémoire pré-remplie : classiques gagnées → avancés débloqués (rien n'est sauvegardé)
      api.campaign.missions['tutoriel'] = { finished: true, wins: 1, plays: 1, bestScore: 620, bestGrade: 'B', bestOutcome: 'surrender' };
      api.campaign.missions['braquage'] = { finished: true, wins: 1, plays: 2, bestScore: 740, bestGrade: 'A', bestOutcome: 'liberation' };
      api.campaign.missions['hopital'] = { finished: true, wins: 1, plays: 1, bestScore: 590, bestGrade: 'B', bestOutcome: 'surrender' };
    }
    api.showHQ(); return true;
  }
  if (mode === 'gallery') { UI.renderGallery(); UI.showScreen('scr-gallery'); return true; }
  if (mode === 'cutgallery') { renderCutGallery(); return true; }
  if (mode.startsWith('cut:')) {
    // #auto:cut:<missionId>:<intro|cléMid>[:<panneau>] — figé pour capture
    const [, mid, key, pi] = mode.split(':');
    showCutsceneDebug(mid, key, pi);
    return true;
  }
  if (mode.startsWith('flowgo:')) {
    // chaîne complète : intro → « Passer » → briefing → « Ouvrir la ligne »
    api.pendingMission = mode.slice(7);
    showCutscene(getIntro(api.pendingMission), () => api.openBriefing(api.pendingMission), 0, true);
    closeCutscene();
    api.launchMission();
    return true;
  }
  if (mode.startsWith('midcut:')) {
    // force une cinématique de milieu de partie : #auto:midcut:<id>:<clé>:<pas>
    const parts = mode.slice(7).split(':');
    api.pendingMission = parts[0];
    api.launchMission();
    playSteps(parseInt(parts[2] || '0', 10));
    refreshTranscript();
    const m = (CUTSCENES[parts[0]].mid || []).find(c => c.key === parts[1]);
    if (m) showCutscene(m.panels, null, 0, true);
    return true;
  }
  if (mode === 'tutocheck') { runTutoCheck(); return true; }
  if (mode === 'chronocheck') { runChronoCheck(); return true; }
  if (mode.startsWith('vig:')) {
    // vignette persistante pour capture (pas d'auto-dismiss)
    api.pendingMission = 'braquage'; api.launchMission();
    const kind = mode.slice(4);
    const ov = $('#vig-overlay');
    ov.innerHTML = '';
    const box = UI.el('div', 'vig-box');
    box.append(PIX.spriteCanvas(PIX.vignetteSprite(kind)), UI.el('div', 'vig-title', kind.toUpperCase()), UI.el('div', 'vig-hint', 'Touchez pour passer'));
    ov.append(box);
    ov.classList.remove('hidden');
    return true;
  }
  if (mode.startsWith('tuto:')) {
    api.pendingMission = 'tutoriel'; api.launchMission();
    api.tutoIndex = Math.min(parseInt(mode.slice(5), 10) || 0, api.TUTO_STEPS.length - 1);
    api.showTutoStep();
    return true;
  }
  if (mode.startsWith('rules')) {
    api.showHQ();
    UI.openRules(mode.includes(':') ? mode.slice(6) : null);
    return true;
  }
  if (mode.startsWith('brief:')) { api.openBriefing(mode.slice(6)); return true; }
  if (mode.startsWith('choice:')) {
    // joue jusqu'au premier choix et affiche la modale DÉCISION
    api.pendingMission = mode.slice(7);
    api.launchMission();
    let guard = 0;
    const game = api.game;
    while (game.phase !== 'choice' && !game.result && guard++ < 500) {
      if (game.phase === 'conversation') {
        const cid = game.hand.find(id => E.canPlayCard(game, id).ok);
        if (cid) E.playCard(game, cid, null); else E.endPhase(game);
      } else E.endPhase(game);
    }
    refreshTranscript();
    return true;
  }
  if (mode.startsWith('game:')) {
    const parts = splitId(mode.slice(5), 1);
    api.pendingMission = parts[0];
    api.launchMission();
    playSteps(parseInt(parts[1] || '0', 10));
    refreshTranscript();
    return true;
  }
  if (mode.startsWith('question:')) {
    // #auto:question:<missionId>[:<qid>] — avance jusqu'à la question puis
    // la fige pour capture/vérif. Révèle l'indice lié pour le badge ✓.
    const parts = splitId(mode.slice(9), 1);
    api.pendingMission = parts[0];
    api.launchMission();
    const game = api.game;
    const m = getMission(api.pendingMission);
    const q = (m.questions || []).find(x => x.id === parts[1]) || (m.questions || [])[0];
    if (q) {
      // révèle l'indice de la première réponse ifClue → badge « cohérent »
      const withClue = q.replies.find(r => r.effects && r.effects.ifClue);
      if (withClue) {
        const c = E.getClue(game, withClue.effects.ifClue.id);
        if (c) c.revealed = true;
      }
      game.turn = Math.max(game.turn, q.minTurn || 1);
      E.maybeQuestion(game);
    }
    refreshTranscript();
    return true;
  }
  if (mode.startsWith('psy:')) {
    // #auto:psy:<id> — force la situation (menace 6) : entrée « psy »,
    // pourcentages sur les cartes et avertissements ⚠ pour capture.
    api.pendingMission = mode.slice(4);
    api.launchMission();
    const game = api.game;
    game.threat = 6; game.pressure = 4;
    E.addAdvice(game);
    api.syncGameUI(true);
    return true;
  }
  if (mode.startsWith('tabs:')) {
    // #auto:tabs:<id>:<equipe|dossier> — partie en phase d'équipe, onglet ouvert
    const parts = splitId(mode.slice(5), 2);
    api.pendingMission = parts[0];
    api.launchMission();
    api.game.phase = 'team';
    refreshTranscript();
    api.openTab(parts[1] === 'dossier' ? 'dossier' : 'equipe');
    const sec = $('#host-sec');
    if (sec && parts[1] === 'dossier') sec.scrollIntoView({ block: 'start' });
    return true;
  }
  if (mode.startsWith('layout:')) {
    // mesure le défilement : body ne doit pas défiler, onglets dans l'écran
    const parts = splitId(mode.slice(7), 1);
    api.pendingMission = parts[0];
    api.launchMission();
    playSteps(parseInt(parts[1] || '0', 10));
    refreshTranscript();
    const se = document.scrollingElement;
    const tabsR = $('#game-tabs').getBoundingClientRect();
    const trR = $('#transcript').getBoundingClientRect();
    const hudR = $('#game-hud').getBoundingClientRect();
    const pre = document.createElement('pre');
    pre.id = 'layoutcheck';
    pre.textContent = JSON.stringify({
      vw: innerWidth, vh: innerHeight,
      bodyScrollH: se.scrollHeight, bodyNoScroll: se.scrollHeight <= innerHeight,
      hudTop: Math.round(hudR.top), hudVisible: hudR.top >= 0 && hudR.top < innerHeight,
      tabsBottom: Math.round(tabsR.bottom), tabsVisible: tabsR.bottom <= innerHeight,
      transcriptH: Math.round(trR.height), transcriptOK: trR.height >= 80,
      sceneH: $('#scene-bar').offsetParent ? Math.round($('#scene-bar').getBoundingClientRect().height) : 0,
    });
    document.body.append(pre);
    return true;
  }
  if (mode.startsWith('debrief:')) {
    api.pendingMission = splitId(mode.slice(8), 0)[0]; api.launchMission();
    const game = api.game;
    // quelques tours joués pour peupler l'historique et les moments clés
    for (let i = 0; i < 8 && !game.result; i++) {
      if (game.pendingChoice) { E.chooseOption(game, 0); continue; }
      if (game.phase === 'conversation') {
        const cid = game.hand.find(id => E.canPlayCard(game, id).ok);
        if (cid) E.playCard(game, cid, null); else E.endPhase(game);
      } else E.endPhase(game);
    }
    // force une fin pour la capture : quelques libérés, une mort, reddition
    if (!game.result) {
      const hl = E.ensureHostageList(game);
      const held = hl.filter(x => x.status === 'held');
      const nFree = Math.min(3, Math.max(0, game.hostages.remaining - 1));
      const nDead = game.hostages.killed === 0 && game.hostages.remaining - nFree > 1 ? 1 : 0;
      for (let i = 0; i < nFree && i < held.length; i++) { held[i].status = 'freed'; held[i].turn = i + 2; }
      for (let i = 0; i < nDead && nFree + i < held.length; i++) {
        held[nFree + i].status = 'dead'; held[nFree + i].turn = 5; held[nFree + i].cause = 'Point de rupture';
      }
      game.hostages.freed = hl.filter(x => x.status === 'freed').length;
      game.hostages.killed = hl.filter(x => x.status === 'dead').length;
      game.hostages.remaining = hl.filter(x => x.status === 'held').length;
      game.result = { outcome: 'surrender', turn: game.turn, hostages: { ...game.hostages } };
      game.log.push({ k: 'epilogue', text: getMission(game.missionId).epilogues.surrender, turn: game.turn });
    }
    api.showDebrief();
    return true;
  }
  return false;
}

// ---------------- cinématiques : hooks de débogage ----------------
function showCutsceneDebug(mid, key, panelIndex) {
  const def = CUTSCENES[mid];
  if (!def) return;
  const panels = key === 'intro' ? def.intro : (def.mid.find(c => c.key === key) || {}).panels;
  if (!panels) return;
  const p = Math.min(parseInt(panelIndex || '0', 10) || 0, panels.length - 1);
  showCutscene(panels, null, p, true);   // lignes affichées entières, prêt pour capture
}

function renderCutGallery() {
  const host = $('#gallery-body');
  host.innerHTML = '';
  host.append(UI.el('h3', null, 'ARTS DE CINÉMATIQUES — frame 0 / frame 3'));
  const row = UI.el('div', 'gal-row wrap');
  for (const id of CUT.CUT_ARTS) {
    for (const f of [0, 3]) {
      const cell = UI.el('div', 'gal-cell');
      cell.append(PIX.spriteCanvas(CUT.cutSprite(id, f), 2), UI.el('div', 'gal-lbl', `${id} f${f}`));
      row.append(cell);
    }
  }
  host.append(row);
  UI.showScreen('scr-gallery');
}

// ---------------- vérification automatisée du chrono ----------------
// ?debug#auto:chronocheck : relances du chrono à chaque phase conversation,
// timeout (menace +1, phase marché), pause pendant une cinématique,
// et relance après un choix en mission avancée. Rapport JSON → <pre id="chronocheck">.
async function runChronoCheck() {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const R = { ok: true };
  const fail = (k, info) => { R.ok = false; R[k] = info; };
  api.campaign.settings.illus = false;           // pas de cinématique/vignette auto pendant le check
  const launch = (id) => { api.pendingMission = id; api.optsSel = { chrono: true }; api.launchMission(); };
  const endPhase = () => { E.endPhase(api.game); api.afterAction(); };
  // avance jusqu'à la prochaine phase de conversation (sort d'abord si on y est)
  const drain = () => {
    const game = api.game;
    let g = 0;
    if (game.phase === 'conversation') endPhase();
    while (!game.result && game.phase !== 'conversation' && g++ < 20) {
      if (game.phase === 'choice') { E.chooseOption(game, 0); api.afterAction(); }
      else endPhase();
    }
  };

  try {
    // (1) tour 1 : le chrono décompte
    launch('braquage');
    const a0 = api.chronoLeft;
    await sleep(2100);
    if (!(api.chronoLeft < a0)) fail('t1', { a0, a1: api.chronoLeft });

    // (2) tour complet → tour 2 : chrono relancé à 60 et décompte
    drain();
    if (!(api.game.phase === 'conversation' && api.chronoTimer && api.chronoLeft === 60)) {
      fail('t2restart', { phase: api.game.phase, timer: !!api.chronoTimer, left: api.chronoLeft });
    }
    await sleep(2100);
    if (!(api.chronoLeft < 60)) fail('t2count', { left: api.chronoLeft });

    // (3) timeout : menace +1, phase marché, relance au tour suivant
    const th = api.game.threat;
    api.chronoLeft = 2;
    await sleep(3200);
    if (!(api.game.threat === th + 1 && api.game.phase === 'market')) {
      fail('timeout', { was: th, threat: api.game.threat, phase: api.game.phase });
    }
    drain();
    if (!(api.game.phase === 'conversation' && api.chronoTimer)) fail('t3restart', { phase: api.game.phase, timer: !!api.chronoTimer });

    // (4) pause pendant une cinématique, reprise à la fermeture
    const before = api.chronoLeft;
    showCutscene([{ art: 'lunette', lines: ['Test de pause.'] }], null, 0, true);
    await sleep(2100);
    const frozen = api.chronoLeft === before;
    closeCutscene();
    await sleep(2100);
    if (!frozen) fail('cutpause', { before, during: api.chronoLeft });
    if (!(api.chronoLeft < before)) fail('cutresume', { before, after: api.chronoLeft });

    // (5) mission avancée : après un choix, si phase conversation le chrono tourne.
    // La seed est aléatoire → on retente jusqu'à atteindre un choix.
    let tries = 0;
    while (tries++ < 8 && !(api.game && api.game.phase === 'choice')) {
      launch('secte');
      let guard = 0;
      const game = api.game;
      while (game.phase !== 'choice' && !game.result && guard++ < 300) {
        if (game.phase === 'conversation') {
          const cid = game.hand.find(id => E.canPlayCard(game, id).ok);
          if (cid) { E.playCard(game, cid, null); api.afterAction(); } else endPhase();
        } else endPhase();
      }
    }
    if (api.game.phase === 'choice') {
      E.chooseOption(api.game, 0);
      api.afterAction();
      if (api.game.phase === 'conversation' && !api.chronoTimer) {
        fail('choice', { phase: api.game.phase, timer: !!api.chronoTimer });
      }
      R.afterChoice = { phase: api.game.phase, timer: !!api.chronoTimer, left: api.chronoLeft };
    } else R.choiceSkipped = api.game.phase;
  } catch (e) { fail('exception', String(e && e.stack || e)); }
  const pre = document.createElement('pre');
  pre.id = 'chronocheck';
  pre.textContent = JSON.stringify(R);
  document.body.append(pre);
}

// ---------------- vérification automatisée du tutoriel ----------------
// ?debug#auto:tutocheck : parcourt chaque étape, vérifie via elementFromPoint
// que la cible est atteignable (et pas masquée par la boîte tuto), puis joue
// l'action attendue par de vrais click() DOM. Rapport JSON → <pre id="tutocheck">.
async function runTutoCheck() {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const report = { ok: true, viewport: `${innerWidth}x${innerHeight}`, steps: [] };
  const TUTO_STEPS = api.TUTO_STEPS;

  function hitTest(el) {
    const r = el.getBoundingClientRect();
    const x = Math.floor(r.left + r.width / 2), y = Math.floor(r.top + r.height / 2);
    const hit = document.elementFromPoint(x, y);
    const inTarget = !!(hit && (hit === el || el.contains(hit)));
    const inBox = !!(hit && hit.closest && hit.closest('.tuto-box'));
    const inOverlay = !!(hit && hit.closest && (hit.closest('#card-modal') || hit.closest('#tab-panel') || hit.closest('#vig-overlay')));
    return {
      x, y, ok: inTarget && !inBox,
      hit: hit ? (hit.id || hit.className || hit.tagName) : null,
      inTarget, inBox, modalBlocking: inOverlay,
    };
  }

  api.pendingMission = 'tutoriel';
  api.launchMission();
  await sleep(50);

  for (let i = 0; i < TUTO_STEPS.length; i++) {
    const step = TUTO_STEPS[i];
    // purge : vignette éventuelle + panneau d'onglets resté ouvert
    api.dismissVig();
    const panel = $('#tab-panel');
    if (!panel.classList.contains('hidden')) {
      panel.classList.add('hidden');
      $$('#game-tabs button.on').forEach(b => b.classList.remove('on'));
    }
    await sleep(30);
    const entry = { step: i, sel: step.sel, advanceOn: step.advanceOn || 'next', checks: {} };
    const target = $(step.sel);
    entry.checks.target = target ? hitTest(target) : { ok: false, missing: true };
    if (step.sel === '#hand') {
      const c = $('#hand .card');
      entry.checks.firstCard = c ? hitTest(c) : { ok: false, missing: true };
    }
    entry.ok = Object.values(entry.checks).every(c => c.ok !== false);
    if (!entry.ok) report.ok = false;

    // joue l'action attendue par de vrais clicks DOM
    if (step.advanceOn === 'card') {
      const c = $('#hand .card');
      if (c) c.click();
      await sleep(30);
      const play = $('#card-modal .m-card .btn-primary');
      entry.action = play ? 'card→modal→jouer' : 'card→pas-de-bouton-jouer';
      if (play) play.click(); else report.ok = false;
      await sleep(750);  // laisse le jet de dés finir + l'étape avancer (delay 650)
    } else if (step.advanceOn === 'tab') {
      const b = $('#game-tabs button[data-tab="marche"]');
      entry.action = 'tab:marche';
      if (b) b.click(); else report.ok = false;
      await sleep(30);
    } else if (step.advanceOn === 'phase') {
      const b = $('#btn-endphase');
      entry.action = 'endphase';
      if (b) b.click(); else report.ok = false;
      await sleep(30);
    } else {
      const b = $('#btn-tuto-next');
      entry.action = 'compris';
      if (b) b.click(); else report.ok = false;
      await sleep(30);
    }
    entry.advancedTo = api.tutoIndex;
    entry.advanced = api.tutoIndex > i;
    if (!entry.advanced) report.ok = false;
    report.steps.push(entry);
  }
  report.tutoIndexFinal = api.tutoIndex;
  report.finished = api.tutoIndex >= TUTO_STEPS.length;
  const pre = document.createElement('pre');
  pre.id = 'tutocheck';
  pre.textContent = JSON.stringify(report, null, 1);
  document.body.appendChild(pre);
}
