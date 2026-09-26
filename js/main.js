// ============================================================
// NÉGOCIATEUR — Cellule de crise — bootstrap & navigation
// ============================================================

import * as E from './engine.js';
import * as UI from './ui.js';
import * as CAM from './campaign.js';
import * as AU from './audio.js';
import * as PIX from './pixel.js';
import { MISSION_LIST, getMission } from './data/missions/index.js';
import { optionsMultiplier } from './data/options.js';

const $ = UI.$, $$ = UI.$$;

let campaign = null;
let saveEnabled = true;     // false en mode ?debug#auto:… (aucune écriture localStorage)
let game = null;            // état moteur courant
let logCursor = 0;          // nb d'entrées de log déjà rendues
let optsSel = {};           // options cochées au briefing
let pendingMission = null;
let chronoTimer = null, chronoLeft = 60;
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
  const vol = $('#set-volume'), rain = $('#set-rain'), flash = $('#set-flash'), illus = $('#set-illus');
  if (vol) vol.value = Math.round((s.volume ?? 0.7) * 100);
  if (rain) rain.checked = s.rain !== false;
  if (flash) flash.checked = s.flash !== false;
  if (illus) illus.checked = s.illus !== false;
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
}

function sfxFor(entry) {
  moodFromEntry(entry);
  vigForEntry(entry);
  switch (entry.k) {
    case 'taker': case 'radio': AU.playSquelch(); break;
    case 'dice': AU.playDice(); break;
    case 'death': AU.playGunshot(); break;
    case 'terror': AU.playTerrorStinger(); break;
    case 'epilogue': break;
  }
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
  AU.setThreat(game.threat);
  const entries = newLogEntries();
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
}

const TYPEWRITER_DELAY = 2400;

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

function afterAction() {
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
function startChrono() {
  stopChrono();
  if (!game.options.chrono || game.phase !== 'conversation' || game.result) return;
  chronoLeft = 60;
  chronoTimer = setInterval(() => {
    if (!game || game.result || game.phase !== 'conversation') { stopChrono(); return; }
    chronoLeft--;
    UI.renderPhaseBanner(game, chronoLeft);
    if (chronoLeft <= 0) {
      stopChrono();
      E.applyChronoTimeout(game);
      afterAction();
      if (game.phase === 'market') openTab('marche');
    }
  }, 1000);
}
function stopChrono() { if (chronoTimer) { clearInterval(chronoTimer); chronoTimer = null; } chronoLeft = 60; }

// ---------------- tutoriel ----------------
const TUTO_STEPS = [
  { sel: '#game-hud', text: 'Bienvenue à la cellule de crise. En haut : la MENACE (1-7, gardez-la basse), les otages, la pression médiatique, l\'horloge Terreur et vos PC.' },
  { sel: '#transcript', text: 'Ici, la transcription de la négociation, et au-dessus la caméra de surveillance : l\'interlocuteur et son humeur. Touchez le transcript pour accélérer le texte.' },
  { sel: '#hand', text: 'Votre main de cartes de conversation — les effets de chaque palier sont écrits dessus, en vert. Touchez « Rassurer » puis « Jouer cette carte ».', advanceOn: 'card' },
  { sel: '#dice-zone', text: 'Les dés se jouent sur 5-6. La menace modifie le nombre de dés : sous la tension, tout se complique.' },
  { sel: '#game-tabs', text: 'Ouvrez l\'onglet Marché : vous y achèterez des cartes à usage unique pendant la préparation.', advanceOn: 'tab' },
  { sel: '#game-tabs', text: 'Les autres onglets : Équipe (actions), Dossier (indices psychologiques), Demandes (ce qu\'il réclame). Les ⓘ ouvrent les règles au bon endroit.' },
  { sel: '#btn-endphase', text: 'Quand vos PC sont dépensés, terminez la phase : la carte Terreur tombera en fin de tour. Surveillez l\'horloge. Terminez cette phase.', advanceOn: 'phase' },
  { sel: '#game-tabs', text: 'Objectif : faites baisser la menace, réglez sa demande majeure, puis proposez la reddition quand la menace est ≤ 2. Le bouton « ? » ouvre les règles à tout moment. Bonne chance, négociateur.' },
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
  return ['#card-modal', '#tab-panel', '#choice-modal', '#rules-modal', '#vig-overlay']
    .some(sel => { const e = $(sel); return e && !e.classList.contains('hidden'); });
}

function syncTutoVisibility() {
  const ov = $('#tuto-overlay');
  const active = tutoIndex >= 0 && tutoIndex < TUTO_STEPS.length;
  ov.classList.toggle('hidden', !active || tutoSuspended());
}

// La boîte ne doit JAMAIS recouvrir sa cible : en haut si la cible est
// dans la moitié basse, en bas sinon ; ni l'un ni l'autre → côté le plus large.
function positionTutoBox(target) {
  const box = $('#tuto-overlay .tuto-box');
  if (!box) return;
  box.style.top = 'auto'; box.style.bottom = 'auto';
  const bh = box.offsetHeight || 140;
  const vh = window.innerHeight;
  const gap = 10, edge = 12;
  const r = target ? target.getBoundingClientRect() : { top: vh / 2, bottom: vh / 2 };
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
  tutoTarget = $(step.sel);
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
['#card-modal', '#tab-panel', '#choice-modal', '#rules-modal', '#vig-overlay'].forEach(sel => {
  const e = $(sel);
  if (e) tutoObserver.observe(e, { attributes: true, attributeFilter: ['class'] });
});

// ---------------- lancement d'une mission ----------------
function openBriefing(missionId) {
  pendingMission = missionId;
  optsSel = {};
  refreshBriefing();
  UI.showScreen('scr-brief');
}

function refreshBriefing() {
  const mission = getMission(pendingMission);
  UI.renderBriefing(mission, optsSel, (id) => {
    optsSel[id] = !optsSel[id];
    refreshBriefing();
  });
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
  });
  logCursor = 0;
  moodEvent = null; moodHold = 0; resultVigShown = false;
  missionStartMs = Date.now(); animFrame = 0;
  vigQueue.length = 0; vigBusy = false;
  UI.resetTranscript();
  UI.clearDice();
  $('#tab-panel').classList.add('hidden');
  applyIllusSettings();
  UI.showScreen('scr-game');
  AU.playRing();
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
  const { rankUps } = CAM.recordResult(campaign, game.missionId, outcome, scoreInfo, game.hostages, game.options);
  if (saveEnabled) { CAM.saveCampaign(campaign); CAM.clearGame(); }
  const rank = CAM.getRank(campaign.xp);
  UI.renderDebrief(game, mission, scoreInfo, scoreInfo.xp, rank.rank.name, rankUps, illusOn());
  UI.showScreen('scr-debrief');
  AU.playJingle(outcome !== 'defeat');
}

// ---------------- QG ----------------
function showHQ() {
  stopChrono();
  stopAnim();
  dismissVig();
  game = null;
  UI.renderHQ(campaign, MISSION_LIST, {
    openMission: openBriefing,
    learn: (skillId) => { CAM.learnSkill(campaign, skillId); if (saveEnabled) CAM.saveCampaign(campaign); showHQ(); },
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
}

function resumeGame() {
  const save = CAM.loadGame();
  if (!save) return;
  game = E.deserialize(save);
  if (!game) return;
  logCursor = 0;
  missionStartMs = Date.now();
  UI.resetTranscript();
  UI.clearDice();
  applyIllusSettings();
  UI.showScreen('scr-game');
  syncGameUI(true);
  startChrono();
  startAnim();
}

// ---------------- navigation ----------------
$('#btn-start').addEventListener('click', () => {
  AU.initAudio();
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

$('#set-volume').addEventListener('input', e => {
  AU.initAudio();
  const v = e.target.value / 100;
  persistSettings({ volume: v });
  AU.setVolume(v);
});
$('#set-rain').addEventListener('change', e => {
  persistSettings({ rain: e.target.checked });
  UI.startRain(e.target.checked);
});
$('#set-flash').addEventListener('change', e => {
  persistSettings({ flash: e.target.checked });
});
$('#set-illus').addEventListener('change', e => {
  persistSettings({ illus: e.target.checked });
  applyIllusSettings();
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

$('#btn-debrief-ok').addEventListener('click', showHQ);

// ---------------- service worker ----------------
if ('serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { });
  });
}

// ---------------- init ----------------
(function init() {
  const s = CAM.loadSettings();
  UI.startRain(s.rain !== false);
  UI.updateGyro(3);
  // Accès direct aux écrans (tests manuels / captures) : #hq, #brief:<id>, #game:<id>, #debrief:<id>
  const h = location.hash.slice(1);
  if (h.startsWith('auto:') && location.search.includes('debug')) {
    saveEnabled = false;
    const mode = h.slice(5);
    campaign = CAM.defaultCampaign();
    campaign.agentName = 'Doc';
    if (mode === 'hq' || mode === 'hq:unlocked') {
      if (mode === 'hq:unlocked') {
        // campagne mémoire pré-remplie : classiques gagnées → avancés débloqués (rien n'est sauvegardé)
        campaign.missions['tutoriel'] = { finished: true, wins: 1, plays: 1, bestScore: 620, bestGrade: 'B', bestOutcome: 'surrender' };
        campaign.missions['braquage'] = { finished: true, wins: 1, plays: 2, bestScore: 740, bestGrade: 'A', bestOutcome: 'liberation' };
        campaign.missions['hopital'] = { finished: true, wins: 1, plays: 1, bestScore: 590, bestGrade: 'B', bestOutcome: 'surrender' };
      }
      showHQ(); return;
    }
    if (mode === 'gallery') { UI.renderGallery(); UI.showScreen('scr-gallery'); return; }
    if (mode === 'tutocheck') { runTutoCheck(); return; }
    if (mode.startsWith('vig:')) {
      // vignette persistante pour capture (pas d'auto-dismiss)
      pendingMission = 'braquage'; launchMission();
      const kind = mode.slice(4);
      const ov = $('#vig-overlay');
      ov.innerHTML = '';
      const box = UI.el('div', 'vig-box');
      box.append(PIX.spriteCanvas(PIX.vignetteSprite(kind)), UI.el('div', 'vig-title', kind.toUpperCase()), UI.el('div', 'vig-hint', 'Touchez pour passer'));
      ov.append(box);
      ov.classList.remove('hidden');
      return;
    }
    if (mode.startsWith('tuto:')) {
      pendingMission = 'tutoriel'; launchMission();
      tutoIndex = Math.min(parseInt(mode.slice(5), 10) || 0, TUTO_STEPS.length - 1);
      showTutoStep();
      return;
    }
    if (mode.startsWith('rules')) {
      showHQ();
      UI.openRules(mode.includes(':') ? mode.slice(6) : null);
      return;
    }
    if (mode.startsWith('brief:')) { openBriefing(mode.slice(6)); return; }
    if (mode.startsWith('choice:')) {
      // joue jusqu'au premier choix et affiche la modale DÉCISION
      pendingMission = mode.slice(7);
      launchMission();
      let guard = 0;
      while (game.phase !== 'choice' && !game.result && guard++ < 500) {
        if (game.phase === 'conversation') {
          const cid = game.hand.find(id => E.canPlayCard(game, id).ok);
          if (cid) E.playCard(game, cid, null); else E.endPhase(game);
        } else E.endPhase(game);
      }
      logCursor = 0; UI.resetTranscript(); syncGameUI(true);
      return;
    }
    if (mode.startsWith('game:')) {
      const parts = mode.slice(5).split(':');
      pendingMission = parts[0];
      launchMission();
      const steps = parseInt(parts[1] || '0', 10);
      for (let i = 0; i < steps && !game.result; i++) {
        if (game.phase === 'choice') { E.chooseOption(game, 0); continue; }
        if (game.phase === 'conversation') {
          const cid = game.hand.find(id => E.canPlayCard(game, id).ok);
          if (cid) E.playCard(game, cid, null); else E.endPhase(game);
        } else E.endPhase(game);
      }
      logCursor = 0; UI.resetTranscript(); syncGameUI(true);
      return;
    }
    if (mode.startsWith('layout:')) {
      // mesure le défilement : body ne doit pas défiler, onglets dans l'écran
      const parts = mode.slice(7).split(':');
      pendingMission = parts[0];
      launchMission();
      const steps = parseInt(parts[1] || '0', 10);
      for (let i = 0; i < steps && !game.result; i++) {
        if (game.phase === 'choice') { E.chooseOption(game, 0); continue; }
        if (game.phase === 'conversation') {
          const cid = game.hand.find(id => E.canPlayCard(game, id).ok);
          if (cid) E.playCard(game, cid, null); else E.endPhase(game);
        } else E.endPhase(game);
      }
      logCursor = 0; UI.resetTranscript(); syncGameUI(true);
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
      return;
    }
    if (mode.startsWith('debrief:')) {
      pendingMission = mode.slice(8); launchMission();
      // force une fin pour la capture : tous otages sauf 1 libérés, reddition
      game.hostages.freed = game.hostages.total - 1;
      game.hostages.remaining = 1;
      game.result = { outcome: 'surrender', turn: game.turn, hostages: { ...game.hostages } };
      game.log.push({ k: 'epilogue', text: getMission(game.missionId).epilogues.surrender });
      showDebrief();
      return;
    }
  }
  UI.showScreen('scr-home');
})();

// ---------------- vérification automatisée du tutoriel ----------------
// ?debug#auto:tutocheck : parcourt chaque étape, vérifie via elementFromPoint
// que la cible est atteignable (et pas masquée par la boîte tuto), puis joue
// l'action attendue par de vrais click() DOM. Rapport JSON → <pre id="tutocheck">.
async function runTutoCheck() {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const report = { ok: true, viewport: `${innerWidth}x${innerHeight}`, steps: [] };

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

  pendingMission = 'tutoriel';
  launchMission();
  await sleep(50);

  for (let i = 0; i < TUTO_STEPS.length; i++) {
    const step = TUTO_STEPS[i];
    // purge : vignette éventuelle + panneau d'onglets resté ouvert
    dismissVig();
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
    entry.advancedTo = tutoIndex;
    entry.advanced = tutoIndex > i;
    if (!entry.advanced) report.ok = false;
    report.steps.push(entry);
  }
  report.tutoIndexFinal = tutoIndex;
  report.finished = tutoIndex >= TUTO_STEPS.length;
  const pre = document.createElement('pre');
  pre.id = 'tutocheck';
  pre.textContent = JSON.stringify(report, null, 1);
  document.body.appendChild(pre);
}
