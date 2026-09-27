// ============================================================
// NÉGOCIATEUR — Cellule de crise
// Moteur de jeu : pur, sans DOM, RNG injectable (mulberry32).
// L'état est sérialisable en JSON (rngState persisté).
// ============================================================

import { BASE_CARDS, MARKET_CARDS, ALL_CARDS, getCard } from './data/cards.js';
import { TERROR_GENERIC, TERROR_COMPLICE } from './data/terror.js';
import { getMission } from './data/missions/index.js';
import { SKILLS } from './data/skills.js';
import { adviceFor } from './advice.js';

export const PHASES = ['conversation', 'market', 'team'];
export const PHASE_LABELS = {
  conversation: 'Conversation',
  market: 'Préparation — Marché',
  team: 'Action d\'équipe',
  over: 'Terminé',
};

// ---------------- RNG ----------------
// mulberry32 dont l'état interne est reflété dans state.rngState
// (permet la sérialisation/reprise exacte d'une partie).
export function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function nextRandom(state) {
  state.rngState = (state.rngState + 0x6D2B79F5) | 0;
  let t = state.rngState;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function rollDice(state, n) {
  const dice = [];
  for (let i = 0; i < n; i++) dice.push(1 + Math.floor(nextRandom(state) * 6));
  return dice;
}

export function countSuccesses(dice) {
  return dice.filter(d => d >= 5).length;
}

function shuffle(state, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(state) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(state, arr) {
  if (!arr.length) return null;
  return arr[Math.floor(nextRandom(state) * arr.length)];
}

// ---------------- Création ----------------
export function createGame({ missionId, seed = 1, skills = [], options = {}, agentName = 'Négociateur', stress = 0, rep = null, story = null }) {
  const mission = getMission(missionId);
  if (!mission) throw new Error(`Mission inconnue : ${missionId}`);

  const state = {
    version: 1,
    missionId,
    rngState: seed | 0,
    seed,
    agentName,
    skills: skills.slice(),
    options: { ...options },
    stress,

    phase: 'conversation',
    turn: 1,
    threat: mission.startThreat,
    hostages: { total: mission.hostages, remaining: mission.hostages, freed: 0, killed: 0 },
    hostageList: buildHostageList(mission),
    pc: 0,
    hand: Object.keys(BASE_CARDS),
    usedThisTurn: [],
    market: [null, null, null],
    marketDeck: [],
    terrorDeck: [],
    terrorDiscard: [],
    pressure: 0,
    prep: 0,
    clues: mission.clues.map(c => ({ id: c.id, revealed: false })),
    demands: mission.demands.map(d => ({ id: d.id, status: 'pending' })),
    teamActionsLeft: 1,
    flags: {
      pcNext: 0,
      nextTerrorFree: false,
      promise: false,
      promiseTurn: null,      // tour où la promesse a été faite (contrôle à +3)
      chronoBase: skills.includes('nerfs_acier') ? SKILLS.nerfs_acier.effect.chrono : 60,
      compliceRevealed: false,
      forcedAssault: false,
      pressureWarned: false,
      wounded: !!options.blesse,
      woundedDeadline: 5,
      woundedSaved: false,
      riggedRolls: mission.tutorial ? 2 : 0,
      rerollsLeft: skills.includes('sang_froid') && !options.hardcore ? SKILLS.sang_froid.effect.rerolls : 0,
      reseauLeft: skills.includes('reseau') ? SKILLS.reseau.effect.extraTeamAction : 0,
      majorConcessions: 0,
      assault: null,
      escape: false,
    },
    result: null,
    log: [],
    lastRoll: null,
    tutorialStep: mission.tutorial ? 0 : -1,
    stats: { cardsPlayed: 0, teamActions: 0, conceded: 0 },
    // --- multi-actes / choix / compteurs ---
    deaths: [],          // [{turn, cause, n}]
    act: mission.acts ? 0 : null,
    pendingChoice: null, // {choiceId, resume, act}
    counters: {},
    history: [],          // [{turn, threat, pressure, held}] — graphe du débrief
    actStartTurn: mission.acts ? 1 : null, // tour de début de l'acte courant
    assaultAt: 10,        // pression de l'assaut forcé (9 si le préfet s'impatiente)
    threatMax: 1,         // pic de menace de la partie (trophée « sang-froid »)
  };
  for (const c of mission.counters || []) {
    state.counters[c.id] = { id: c.id, label: c.label, icon: c.icon || '◆', value: c.start || 0, max: c.max, resetTo: c.resetTo ?? 0, onMax: c.onMax, cause: c.cause || c.label };
  }

  // Decks
  const act0 = mission.acts ? mission.acts[0] : null;
  const marketPool = (act0 && act0.market) || (mission.market && mission.market.length ? mission.market : Object.keys(MARKET_CARDS));
  state.marketDeck = shuffle(state, marketPool);
  fillMarket(state);

  const terrorIds = act0 ? act0.terrorDeck : mission.terrorDeck;
  let terror = terrorIds.slice();
  if (options.complice) terror.push(TERROR_COMPLICE.id);
  if (!mission.terrorOrdered) terror = shuffle(state, terror);
  state.terrorDeck = terror;

  // Contenus de l'acte 0 (demandes/indices/marché additionnels, menace de départ)
  if (act0) {
    applyActAdds(state, act0);
    if (act0.startThreat != null) state.threat = act0.startThreat;
    if (act0.onEnter) resolveEffect(state, act0.onEnter, { source: 'act' });
  }

  // Compétences de départ
  if (skills.includes('coord_tactique')) state.prep = Math.min(3, SKILLS.coord_tactique.effect.prepStart);
  if (skills.includes('profileur')) revealClues(state, SKILLS.profileur.effect.revealAtStart, true);

  // Réputation de campagne (rep) : modificateurs de départ, moteur pur.
  rep = rep || {};
  // compétence « relations » : les modificateurs voient les jauges plancher à 6
  if (skills.includes('relations')) {
    rep = { ...rep, presse: Math.max(6, rep.presse || 0), hierarchie: Math.max(6, rep.hierarchie || 0) };
  }
  if (rep.presse >= 8) state.flags.mediaGrace = 2;      // les 2 premiers ticks de presse sautés
  if (rep.hierarchie >= 8) state.prep = Math.min(3, state.prep + 1);
  if (rep.hierarchie <= 2) state.assaultAt = 9;
  if (rep.presse <= 2) changePressure(state, 2);        // la presse vous attend au tournant

  // fil narratif : l'homme du Crédit Rhodanien parmi les mutins de Saint-Aubin
  if (missionId === 'prison' && story && story.complice) {
    state.flags.storyComplice = true;
    log(state, 'radio', 'ℹ Renseignement : parmi les mutins, une vieille connaissance — l\'homme du Crédit Rhodanien. Il vous connaît.');
  }

  state.threatMax = Math.max(state.threatMax, state.threat);
  pushHistory(state);
  state.pc = computePC(state);

  log(state, 'radio', `— Cellule de crise, ${mission.subtitle}. Ligne ouverte avec ${getTaker(state).name}. —`);
  if (state.flags.wounded) {
    const w = woundedHostage(state);
    log(state, 'sys', `⚠ ${w.name} (${w.role}) est blessé${w.f ? 'e' : ''} : ${w.f ? 'elle' : 'il'} doit être libéré${w.f ? 'e' : ''} avant le début du tour ${state.flags.woundedDeadline}.`);
  }
  return state;
}

// ---------------- Otages nommés ----------------
function buildHostageList(mission) {
  const src = mission.hostageList || [];
  const list = [];
  for (let i = 0; i < mission.hostages; i++) {
    const h = src[i];
    list.push({
      id: h ? h.id : `otage-${i + 1}`,
      name: h ? h.name : `Otage ${i + 1}`,
      role: h ? h.role : 'otage',
      trait: h ? (h.trait || null) : null,
      f: !!(h && h.f),
      status: 'held', turn: null, cause: null,
    });
  }
  return list;
}

// Anciennes sauvegardes sans hostageList : reconstruction à partir des
// compteurs (les freed premiers dans la liste, puis les killed).
export function ensureHostageList(state) {
  const mission = getMissionDef(state);
  if (!Array.isArray(state.hostageList) || state.hostageList.length !== mission.hostages) {
    state.hostageList = buildHostageList(mission);
    let freed = state.hostages.freed, killed = state.hostages.killed;
    for (const h of state.hostageList) {
      if (freed > 0) { h.status = 'freed'; freed--; }
      else if (killed > 0) { h.status = 'dead'; killed--; }
    }
  }
  return state.hostageList;
}

export function heldHostages(state) {
  return ensureHostageList(state).filter(h => h.status === 'held');
}

function woundedHostage(state) {
  const list = ensureHostageList(state);
  if (state.flags.woundedId) {
    const h = list.find(x => x.id === state.flags.woundedId);
    if (h) return h;
  }
  const held = list.filter(h => h.status === 'held');
  const h = held.find(x => x.trait === 'vulnerable') || held[0] || null;
  if (h) state.flags.woundedId = h.id;
  return h;
}

// Libérés : vulnérables d'abord, sinon ordre de liste. Aucun RNG consommé.
function pickFreed(state, n, forceIds = null) {
  const out = [];
  const take = (h) => { h.status = 'freed'; h.turn = state.turn; out.push(h); };
  for (const id of forceIds || []) {
    const h = heldHostages(state).find(x => x.id === id);
    if (h && out.length < n) take(h);
  }
  while (out.length < n) {
    const held = heldHostages(state);
    if (!held.length) break;
    take(held.find(h => h.trait === 'vulnerable') || held[0]);
  }
  return out;
}

// Tués : héros d'abord, sinon index déterministe. Aucun RNG consommé.
function pickDeaths(state, n, forceIds = null) {
  const out = [];
  const take = (h, cause) => { h.status = 'dead'; h.turn = state.turn; if (cause) h.cause = cause; out.push(h); };
  for (const id of forceIds || []) {
    const h = heldHostages(state).find(x => x.id === id);
    if (h && out.length < n) take(h);
  }
  while (out.length < n) {
    const held = heldHostages(state);
    if (!held.length) break;
    const heros = held.find(h => h.trait === 'heros');
    take(heros || held[(state.turn * 7 + (state.hostages.killed + out.length) * 3) % held.length]);
  }
  return out;
}

function deadNames(picked) {
  const names = picked.map(h => `${h.name} (${h.role})`).join(', ');
  if (picked.length === 1) return `${names} est ${picked[0].f ? 'tuée' : 'tué'}`;
  return `${names} sont ${picked.every(h => h.f) ? 'tuées' : 'tués'}`;
}

// ---------------- Helpers état ----------------
export function getMissionDef(state) { return getMission(state.missionId); }

export function getDemand(state, id) {
  return state.demands.find(d => d.id === id) || null;
}

export function getDemandDef(state, id) {
  const m = getMissionDef(state);
  let d = m.demands.find(d => d.id === id);
  if (!d && m.acts) {
    for (const a of m.acts) { d = (a.addDemands || []).find(x => x.id === id); if (d) break; }
  }
  return d || null;
}

export function getClue(state, id) {
  return state.clues.find(c => c.id === id) || null;
}

export function getClueDef(state, id) {
  const m = getMissionDef(state);
  let d = m.clues.find(d => d.id === id);
  if (!d && m.acts) {
    for (const a of m.acts) { d = (a.addClues || []).find(x => x.id === id); if (d) break; }
  }
  return d || null;
}

// Interlocuteur courant (peut changer selon l'acte et les flags)
export function getTaker(state) {
  const m = getMissionDef(state);
  let t = m.taker;
  if (m.acts && state.act != null && state.act < m.acts.length) {
    let at = m.acts[state.act].taker;
    if (at && at.ifFlag) at = state.flags[at.ifFlag] ? at.then : at.else;
    if (at) t = at;
  }
  return t || m.taker;
}

export function pendingDemands(state) {
  return state.demands.filter(d => d.status === 'pending');
}

export function majorDemandResolved(state) {
  return state.demands.some(d => {
    const def = getDemandDef(state, d.id);
    return def && def.major && (d.status === 'conceded' || d.status === 'neutralized');
  });
}

function hiddenClues(state) {
  return state.clues.filter(c => !c.revealed);
}

// ---------------- Journal ----------------
function log(state, k, text, data = null) {
  state.log.push({ k, text, data, turn: state.turn });
}

// Historique par tour (graphe « DÉROULÉ » du débrief).
function pushHistory(state) {
  state.history = state.history || [];
  state.history.push({ turn: state.turn, threat: state.threat, pressure: state.pressure, held: state.hostages.remaining });
}

export function describeEffects(eff) {
  const parts = [];
  if (eff.threat) parts.push(`menace ${eff.threat > 0 ? '+' : ''}${eff.threat}`);
  if (eff.pressure) parts.push(`pression ${eff.pressure > 0 ? '+' : ''}${eff.pressure}`);
  if (eff.pc) parts.push(`+${eff.pc} PC`);
  if (eff.pcNext) parts.push(`${eff.pcNext > 0 ? '+' : ''}${eff.pcNext} PC (prochain tour)`);
  if (eff.free) parts.push(`${eff.free} otage${eff.free > 1 ? 's' : ''} libéré${eff.free > 1 ? 's' : ''}`);
  if (eff.pickFree) parts.push(`${eff.pickFree} otage libéré (au choix)`);
  if (eff.kill) parts.push(`${eff.kill} otage${eff.kill > 1 ? 's' : ''} tué${eff.kill > 1 ? 's' : ''}`);
  if (eff.reveal) parts.push(`${eff.reveal} indice${eff.reveal > 1 ? 's' : ''} révélé${eff.reveal > 1 ? 's' : ''}`);
  if (eff.prep) parts.push(`préparation ${eff.prep > 0 ? '+' : ''}${eff.prep}`);
  if (eff.discardNextTerror) parts.push('prochaine Terreur neutralisée');
  if (eff.win === 'surrender') parts.push('REDDITION');
  if (eff.neutralizeDemand) parts.push('demande abandonnée');
  if (eff.mark === 'promesse') parts.push('promesse non tenue (marqueur)');
  if (eff.counter) for (const [cid, d] of Object.entries(eff.counter)) parts.push(`${cid} ${d > 0 ? '+' : ''}${d}`);
  if (eff.concedeDemand) parts.push('demande concédée');
  if (eff.choice) parts.push('décision à prendre');
  if (eff.assault) parts.push('ASSAUT');
  return parts.join(' · ') || '—';
}

// ---------------- Menace / otages / pression ----------------
export function threatDiceMod(threat) {
  if (threat <= 2) return 1;
  if (threat <= 4) return 0;
  if (threat <= 6) return -1;
  return -2;
}

function changeThreat(state, delta) {
  if (!delta || state.result) return;
  const before = state.threat;
  state.threat = Math.max(1, Math.min(7, state.threat + delta));
  if (state.threat > (state.threatMax || 0)) state.threatMax = state.threat;
  if (state.threat !== before) {
    log(state, 'sys', `Menace : ${before} → ${state.threat}${delta > 0 ? ' ▲' : ' ▼'}`);
  }
  if (state.threat >= 7) breakpoint(state);
}

function breakpoint(state) {
  log(state, 'terror', '☠ POINT DE RUPTURE — il craque.');
  killHostages(state, 1, 'Point de rupture');
  if (!state.result) {
    state.threat = 6;
    log(state, 'sys', 'Menace retombée à 6.');
  }
}

function changePressure(state, delta) {
  if (!delta || state.result) return;
  if (delta > 0 && state.options.media) delta *= 2;
  const cap = state.assaultAt || 10;
  const before = state.pressure;
  state.pressure = Math.max(0, Math.min(10, state.pressure + delta));
  if (state.pressure !== before) {
    log(state, 'sys', `Pression médiatique : ${before} → ${state.pressure}`);
  }
  if (state.pressure >= cap - 1 && !state.flags.pressureWarned && state.pressure < cap) {
    state.flags.pressureWarned = true;
    log(state, 'radio', `⚠ Le cabinet du préfet s'impatiente. À pression ${cap}, l'assaut sera ordonné.`);
  }
  if (state.pressure >= cap && !state.flags.forcedAssault) {
    state.flags.forcedAssault = true;
    log(state, 'radio', '⛔ ORDRE DU PRÉFET : l\'assaut est décidé. Il aura lieu à la fin de ce tour.');
  }
}

export function recordDeaths(state, n, cause = 'Événement', opts = {}) {
  const k = Math.min(n, state.hostages.remaining);
  if (k <= 0) return 0;
  const picked = pickDeaths(state, k, opts.ids);
  for (const h of picked) h.cause = cause;
  state.deaths = state.deaths || [];
  state.deaths.push({ turn: state.turn, cause, n: picked.length });
  state.hostages.remaining -= picked.length;
  state.hostages.killed += picked.length;
  log(state, 'death', `✝ ${deadNames(picked)}. (${state.hostages.remaining} restant${state.hostages.remaining > 1 ? 's' : ''})`, { cause });
  const takerLines = getTaker(state).lines || getMissionDef(state).taker.lines;
  if (takerLines && takerLines.kill) {
    log(state, 'taker', pickRandom(state, takerLines.kill));
  }
  return k;
}

function killHostages(state, n, cause = 'Événement', opts = {}) {
  if (state.result || n <= 0) return;
  recordDeaths(state, n, cause, opts);
  checkHostageEnd(state, 'kill');
}

function freeHostages(state, n, opts = {}) {
  if (state.result || n <= 0) return;
  const f = Math.min(n, state.hostages.remaining);
  if (f <= 0) return;
  const picked = pickFreed(state, f, opts.ids);
  state.hostages.remaining -= picked.length;
  state.hostages.freed += picked.length;
  if (state.flags.wounded && !state.flags.woundedSaved) {
    const w = woundedHostage(state);
    if (w && w.status === 'freed') {
      state.flags.woundedSaved = true;
      log(state, 'sys', `🚑 ${w.name} est parmi les libéré${w.f ? 'e' : ''}s. ${w.f ? 'Elle' : 'Il'} survivra.`);
    }
  }
  const names = picked.map(h => `${h.name} (${h.role})`).join(', ');
  const verb = picked.length === 1
    ? `est ${picked[0].f ? 'libérée' : 'libéré'}`
    : `sont ${picked.every(h => h.f) ? 'libérées' : 'libérés'}`;
  log(state, 'sys', `🚪 ${names} ${verb}. (${state.hostages.remaining} restant${state.hostages.remaining > 1 ? 's' : ''})`);
  const takerLines = getTaker(state).lines || getMissionDef(state).taker.lines;
  if (takerLines && takerLines.freed) {
    log(state, 'taker', pickRandom(state, takerLines.freed));
  }
  checkHostageEnd(state, 'free');
}

function checkHostageEnd(state, via = null) {
  if (state.result) return;
  const h = state.hostages;
  if (h.remaining <= 0) {
    // Missions multi-actes : la mort du dernier otage est un échec,
    // même si des otages ont été libérés avant (règle plus dure).
    // Missions classiques : reddition si au moins la moitié a été sauvée
    // (libérés ≥ tués) ; une hécatombe est une défaite.
    const advanced = !!getMissionDef(state).acts;
    if (via === 'kill') {
      endGame(state, advanced || h.freed < h.killed ? 'defeat' : 'liberation');
    } else {
      endGame(state, h.freed > 0 ? 'liberation' : 'defeat');
    }
  }
}

function revealClues(state, n, silent = false) {
  const hidden = hiddenClues(state);
  let count = 0;
  for (let i = 0; i < n && hidden.length; i++) {
    const idx = Math.floor(nextRandom(state) * hidden.length);
    const clue = hidden.splice(idx, 1)[0];
    clue.revealed = true;
    count++;
    const def = getClueDef(state, clue.id);
    if (def && !silent) log(state, 'clue', `📁 Indice révélé : « ${def.name} »`);
  }
  return count;
}

// ---------------- Conditions de cartes ----------------
export function cardCondition(state, card) {
  if (!card.cond) return { ok: true };
  if (typeof card.cond === 'object' && card.cond.clue) {
    const c = getClue(state, card.cond.clue);
    return c && c.revealed ? { ok: true } : { ok: false, reason: card.condText || 'Indice requis non révélé' };
  }
  switch (card.cond) {
    case 'threat_lte_5':
      return state.threat <= 5 ? { ok: true } : { ok: false, reason: 'Menace trop élevée (≤ 5 requis)' };
    case 'surrender_ready': {
      if (state.threat > 2) return { ok: false, reason: 'Menace ≤ 2 requise' };
      if (!majorDemandResolved(state)) return { ok: false, reason: 'Demande majeure concédée ou neutralisée requise' };
      // missions multi-actes : seul le décideur final peut se rendre
      const mission = getMissionDef(state);
      if (mission.acts && state.act < mission.acts.length - 1) {
        return { ok: false, reason: 'Votre interlocuteur n\'a pas le pouvoir de se rendre' };
      }
      return { ok: true };
    }
    case 'pending_demand':
      return pendingDemands(state).length ? { ok: true } : { ok: false, reason: 'Aucune demande en attente' };
    case 'clue_proche': {
      const mission = getMissionDef(state);
      const found = state.clues.some(c => c.revealed && mission.clues.find(d => d.id === c.id && d.proche));
      return found ? { ok: true } : { ok: false, reason: 'Un indice « proche » révélé est requis' };
    }
    default:
      return { ok: true };
  }
}

// ---------------- Dés ----------------
export function diceModifier(state, card) {
  let mod = threatDiceMod(state.threat);
  const mission = getMissionDef(state);
  // traits révélés
  for (const c of state.clues) {
    if (!c.revealed) continue;
    const def = mission.clues.find(d => d.id === c.id);
    if (def && def.trait && def.trait.tagMods && def.trait.tagMods[card.tag]) {
      mod += def.trait.tagMods[card.tag];
    }
  }
  // compétences
  for (const sid of state.skills) {
    const s = SKILLS[sid];
    if (s && s.effect.diceTag && s.effect.diceTag[card.tag]) mod += s.effect.diceTag[card.tag];
  }
  // option complice révélé : autorité -1
  if (state.flags.compliceRevealed && card.tag === 'autorite') mod -= 1;
  // modificateur propre à la carte
  if (card.diceModKey === 'famille') {
    const hasFamille = state.clues.some(c => c.revealed && mission.clues.find(d => d.id === c.id && d.famille));
    if (!hasFamille) mod -= 2;
  }
  return mod;
}

export function cardDicePool(state, card) {
  if (card.auto) return 0;
  return Math.max(1, (card.dice || 0) + diceModifier(state, card));
}

// ---------------- Probabilités de paliers ----------------
// Chaque dé réussit sur 5-6 → p = 1/3. Distribution binomiale exacte.
const P_SUCCESS = 1 / 3;
function binomP(n, k) {
  if (k < 0 || k > n) return 0;
  let c = 1;
  for (let i = 0; i < k; i++) c = c * (n - i) / (i + 1);
  return c * Math.pow(P_SUCCESS, k) * Math.pow(1 - P_SUCCESS, n - k);
}

// Probabilité par palier : keys = seuils d'effets triés. Chaque palier
// couvre les succès de sa clé jusqu'à la clé suivante (la plus grande
// = « k+ »), exactement comme effectRow. Retour : { [seuil]: proba }.
export function tierOdds(pool, keys) {
  const ks = [...keys].map(Number).filter(k => !isNaN(k)).sort((a, b) => a - b);
  const res = {};
  ks.forEach((k, i) => {
    const hi = i === ks.length - 1 ? pool : ks[i + 1] - 1;
    let p = 0;
    for (let s = Math.max(k, 0); s <= hi && s <= pool; s++) p += binomP(pool, s);
    res[k] = p;
  });
  return res;
}

// Probabilités des paliers d'une carte dans l'état courant (pool réel).
// Carte auto → null. Jets « sûrs » du tutoriel (riggedRolls) → le palier
// le plus haut est garanti à 100 %.
export function cardOdds(state, card) {
  if (!card || card.auto) return null;
  const keys = Object.keys(card.effects).map(Number).filter(k => !isNaN(k));
  if (!keys.length) return null;
  const odds = tierOdds(cardDicePool(state, card), keys);
  if (state.flags.riggedRolls > 0) {
    const top = Math.max(...keys);
    for (const k of keys) odds[k] = k === top ? 1 : 0;
  }
  return odds;
}

// Alerte rouge sur une carte : le palier d'échec (seuil le plus bas)
// ferait passer la menace à 7 (rupture → mort d'un otage) ou la
// pression à 10 (assaut forcé).
export function failRisk(state, card) {
  if (!card || card.auto) return null;
  const k0 = Math.min(...Object.keys(card.effects).map(Number).filter(n => !isNaN(n)));
  const eff = card.effects[k0];
  if (!eff) return null;
  if (eff.threat > 0 && state.threat + eff.threat >= 7) return 'kill';
  if (eff.pressure > 0 && state.pressure + eff.pressure >= (state.assaultAt || 10)) return 'assault';
  return null;
}

// ---------------- Conseil de la psychologue ----------------
// advice.js est pur ; l'entrée passe par le journal moteur, donc elle
// est persistée par la sauvegarde et ré-affichée à la reprise.
export function addAdvice(state) {
  if (!state || state.result) return null;
  const adv = adviceFor(state, state.adviceSeen || {});
  if (!adv) return null;
  if (!state.adviceSeen) state.adviceSeen = {};
  state.adviceSeen[adv.key] = state.turn;
  log(state, 'psy', adv.text);
  return adv;
}

// ---------------- Résolution d'effets ----------------
function effectRow(effects, successes) {
  if (effects.auto) return effects.auto;
  const keys = Object.keys(effects).map(Number).filter(k => !isNaN(k)).sort((a, b) => b - a);
  for (const k of keys) if (successes >= k) return effects[k];
  return {};
}

function resolveEffect(state, eff, ctx = {}) {
  if (!eff || state.result) return;
  // structures conditionnelles
  if (eff.ifThreatGte) {
    return resolveEffect(state, state.threat >= eff.ifThreatGte.v ? eff.ifThreatGte.then : eff.ifThreatGte.else, ctx);
  }
  if (eff.ifFlag) {
    return resolveEffect(state, state.flags[eff.ifFlag.f] ? eff.ifFlag.then : eff.ifFlag.else, ctx);
  }
  if (eff.ifCounterGte) {
    const c = state.counters[eff.ifCounterGte.id];
    return resolveEffect(state, c && c.value >= eff.ifCounterGte.v ? eff.ifCounterGte.then : eff.ifCounterGte.else, ctx);
  }
  if (eff.ifClue) {
    const c = getClue(state, eff.ifClue.id);
    return resolveEffect(state, c && c.revealed ? eff.ifClue.then : eff.ifClue.else, ctx);
  }
  if (eff.roll) {
    const dice = rollDice(state, eff.roll.dice);
    const s = countSuccesses(dice);
    log(state, 'dice', `Jet Terreur : [${dice.join(', ')}] — ${s} succès`, { dice, successes: s });
    return resolveEffect(state, effectRow(eff.roll.table, s), ctx);
  }
  if (eff.demandMajorPending) {
    const hasMajor = state.demands.some(d => getDemandDef(state, d.id).major && d.status === 'pending');
    return resolveEffect(state, hasMajor ? eff.demandMajorPending.then : eff.demandMajorPending.else, ctx);
  }
  if (eff.promise) {
    const had = state.flags.promise;
    state.flags.promise = false;
    return resolveEffect(state, had ? eff.promise.then : eff.promise.else, ctx);
  }
  if (eff.flag) {
    if (eff.flag === 'complice') {
      if (!state.flags.compliceRevealed) {
        state.flags.compliceRevealed = true;
        log(state, 'terror', '⚠ Un SECOND PRENEUR est révélé : autorité −1 dé jusqu\'à la fin.');
      }
    } else {
      state.flags[eff.flag] = true;
    }
  }
  if (eff.log) log(state, 'radio', eff.log);
  // effets simples
  const src = ctx.source || 'card';
  if (eff.threat) changeThreat(state, eff.threat);
  if (state.result || state.pendingChoice) return;
  if (eff.kill) {
    let n = eff.kill;
    // tuto : aucune mort par Terreur avant le tour N
    const mission = getMissionDef(state);
    if (src === 'terror' && mission.noKillBeforeTurn && state.turn < mission.noKillBeforeTurn) {
      log(state, 'sys', '(La nuit le retient — pour l\'instant.)');
      changeThreat(state, 1);
    } else {
      killHostages(state, n, ctx.cause || (ctx.card ? `Carte : ${ctx.card.name}` : 'Événement'));
    }
  }
  if (state.result) return;
  if (eff.counter) {
    for (const [cid, delta] of Object.entries(eff.counter)) changeCounter(state, cid, delta, ctx);
  }
  if (state.result || state.pendingChoice) return;
  if (eff.concedeDemand) concedeDemandById(state, eff.concedeDemand);
  if (state.result || state.pendingChoice) return;
  if (eff.choice) { triggerChoice(state, eff.choice, ctx.resume || 'endTerror'); return; }
  if (eff.assault) return resolveAssault(state, 'décision');
  if (state.result) return;
  if (eff.free) freeHostages(state, eff.free);
  if (state.result) return;
  if (eff.pressure) changePressure(state, eff.pressure);
  if (eff.pc) state.pc = Math.max(0, state.pc + eff.pc);
  if (eff.pcNext) state.flags.pcNext += eff.pcNext;
  if (eff.reveal) revealClues(state, eff.reveal);
  if (eff.prep) state.prep = Math.max(0, Math.min(3, state.prep + eff.prep));
  if (eff.discardNextTerror) state.flags.nextTerrorFree = true;
  if (eff.mark === 'promesse') {
    state.flags.promise = true;
    state.flags.promiseTurn = state.turn;
  }
  if (eff.neutralizeDemand && ctx.target) {
    const d = getDemand(state, ctx.target);
    const def = getDemandDef(state, ctx.target);
    if (d && d.status === 'pending') {
      d.status = 'neutralized';
      log(state, 'sys', `✔ Demande abandonnée : « ${def.label} »`);
    }
  }
  if (eff.win === 'surrender') endGame(state, 'surrender');
  if (eff.lose) endGame(state, 'defeat');
  // exfiltration ciblée : le joueur choisit l'otage libéré
  if (eff.pickFree && !state.result && !state.pendingChoice && heldHostages(state).length) {
    state.phase = 'choice';
    state.pendingChoice = { hostagePick: eff.pickFree, resume: ctx.resume || 'conversation' };
  }
}

// ---------------- Jouer une carte ----------------
export function canPlayCard(state, cardId) {
  const card = getCard(cardId);
  if (!card) return { ok: false, reason: 'Carte inconnue' };
  if (state.result) return { ok: false, reason: 'Partie terminée' };
  if (state.phase !== 'conversation') return { ok: false, reason: 'Pas en phase de conversation' };
  if (!state.hand.includes(cardId)) return { ok: false, reason: 'Pas en main' };
  if (state.pc < card.cost) return { ok: false, reason: `PC insuffisants (${card.cost} requis)` };
  if (card.reusable && state.usedThisTurn.includes(cardId)) return { ok: false, reason: 'Déjà jouée ce tour' };
  const cond = cardCondition(state, card);
  if (!cond.ok) return cond;
  if (card.needsTarget === 'demande') {
    // ok — la cible sera choisie à la résolution
  }
  return { ok: true };
}

export function playCard(state, cardId, targetId = null, { useReroll = false } = {}) {
  const check = canPlayCard(state, cardId);
  if (!check.ok) return { ok: false, reason: check.reason };
  const card = getCard(cardId);
  const mission = getMissionDef(state);

  state.pc -= card.cost;
  state.stats.cardsPlayed++;
  if (card.reusable) {
    state.usedThisTurn.push(cardId);
  } else {
    state.hand = state.hand.filter(id => id !== cardId);
    state.usedThisTurn.push(cardId);
  }

  // Réplique du joueur
  log(state, 'player', card.line || card.name);

  let successes = 0;
  let dice = [];
  let auto = !!card.auto;
  let rerolled = false;

  if (auto) {
    log(state, 'sys', `(effet automatique)`);
  } else {
    const pool = cardDicePool(state, card);
    const doRoll = () => {
      if (state.flags.riggedRolls > 0) {
        state.flags.riggedRolls--;
        return Array.from({ length: pool }, () => 5 + Math.floor(nextRandom(state) * 2));
      }
      return rollDice(state, pool);
    };
    dice = doRoll();
    successes = countSuccesses(dice);
    if (useReroll && state.flags.rerollsLeft > 0 && !state.options.hardcore) {
      state.flags.rerollsLeft--;
      const dice2 = doRoll();
      const s2 = countSuccesses(dice2);
      rerolled = true;
      if (s2 > successes) { dice = dice2; successes = s2; }
    }
    const mod = cardDicePool(state, card) - (card.dice || 0);
    log(state, 'dice', `Dés : [${dice.join(', ')}] — ${successes} succès` +
      (mod ? ` (base ${card.dice}${mod > 0 ? '+' : ''}${mod})` : '') +
      (rerolled ? ' — relance utilisée' : ''), { dice, successes, cardId });
  }

  // Résolution
  const row = card.auto ? card.effects.auto : effectRow(card.effects, successes);
  resolveEffect(state, row, { target: targetId, source: 'card', card });

  // Réponse du preneur
  const band = successes === 0 ? 'fail' : successes <= 1 ? 'partial' : 'success';
  const resp = takerResponse(state, card, band);
  if (resp && !state.result) log(state, 'taker', resp);

  return { ok: true, card, dice, successes, auto, rerolled };
}

function pickResponseVariant(state, variant) {
  if (!variant) return null;
  if (typeof variant === 'string') return variant;
  if (Array.isArray(variant)) return pickRandom(state, variant);
  // {high:[], low:[], any:[]}
  if (state.threat >= 5 && variant.high) return pickRandom(state, variant.high);
  if (state.threat <= 2 && variant.low) return pickRandom(state, variant.low);
  if (variant.any) return pickRandom(state, variant.any);
  if (variant.high) return pickRandom(state, variant.high);
  if (variant.low) return pickRandom(state, variant.low);
  return null;
}

function takerResponse(state, card, band) {
  const r = (getTaker(state).responses || getMissionDef(state).taker.responses) || {};
  const byCard = r.byCard && r.byCard[card.id];
  let v = byCard && pickResponseVariant(state, byCard[band]);
  if (v) return v;
  const byTag = r.byTag && r.byTag[card.tag];
  v = byTag && pickResponseVariant(state, byTag[band]);
  if (v) return v;
  v = r.default && pickResponseVariant(state, r.default[band]);
  return v;
}

// ---------------- Marché ----------------
function fillMarket(state) {
  for (let i = 0; i < 3; i++) {
    if (!state.market[i]) {
      state.market[i] = state.marketDeck.length ? state.marketDeck.shift() : null;
    }
  }
}

export function canBuy(state, slotIndex) {
  const cardId = state.market[slotIndex];
  if (!cardId) return { ok: false, reason: 'Emplacement vide' };
  const card = getCard(cardId);
  if (state.phase !== 'market') return { ok: false, reason: 'Marché ouvert pendant la préparation' };
  if (state.pc < card.buy) return { ok: false, reason: `PC insuffisants (${card.buy} requis)` };
  return { ok: true };
}

export function buyCard(state, slotIndex) {
  const check = canBuy(state, slotIndex);
  if (!check.ok) return { ok: false, reason: check.reason };
  const card = getCard(state.market[slotIndex]);
  state.pc -= card.buy;
  state.market[slotIndex] = null;
  state.hand.push(card.id);
  log(state, 'sys', `🃏 « ${card.name} » rejoint votre main (disponible au prochain tour).`);
  return { ok: true, card };
}

// Jet d'équipe 1d6 (RNG seedé). Compétence « discipline » : un 1 est relancé
// une fois — le second jet fait foi, même s'il retombe sur 1.
export function teamRoll(state, label) {
  const d0 = rollDice(state, 1)[0];
  let d = d0, note = '';
  // épreuve du feu : les deux premiers faux pas de la nuit sont couverts par la
  // cellule (adoucissement d'équilibrage du lot 5) — les suivants mordent
  if (d0 === 1 && (state.flags.teamSlip || 0) < 2) {
    state.flags.teamSlip = (state.flags.teamSlip || 0) + 1;
    d = 3;
    note = ' → couvert par la cellule';
  } else if (d0 === 1 && state.skills && state.skills.includes('discipline')) {
    d = rollDice(state, 1)[0];
    note = ` → rattrapé [${d}]`;
  }
  log(state, 'dice', `⚙ ÉQUIPE — ${label} : [${d0}]${note}`, { dice: [d0] });
  return d;
}

// ---------------- Actions d'équipe ----------------
export const TEAM_ACTIONS = [
  { id: 'intel', name: 'Renseignement', desc: 'Révèle un indice caché. Pression +1.' },
  { id: 'sniper', name: 'Positionner le tireur', desc: 'Préparation +1 (max 3). Si menace ≥ 5, il vous repère : menace +1.' },
  { id: 'supply', name: 'Ravitaillement', desc: 'Nourriture, eau, couvertures. Menace −1, pression +1.' },
  { id: 'concede', name: 'Concéder une demande', desc: 'Satisfaire une demande en attente (choix).', needsTarget: true },
  { id: 'assault', name: 'Donner l\'assaut', desc: 'Fin de mission : résolution tactique selon la préparation.', danger: true },
];

export function teamActionsAvailable(state) {
  if (state.phase !== 'team' || state.result) return [];
  return TEAM_ACTIONS;
}

export function teamActionsLeft(state) {
  return state.teamActionsLeft + (state.flags.reseauLeft > 0 ? 1 : 0);
}

export function doTeamAction(state, actionId, targetId = null) {
  if (state.phase !== 'team') return { ok: false, reason: 'Pas la phase d\'action d\'équipe' };
  if (state.result) return { ok: false, reason: 'Partie terminée' };
  if (teamActionsLeft(state) <= 0) return { ok: false, reason: 'Action d\'équipe déjà utilisée' };
  if (actionId === 'concede') {
    const d = getDemand(state, targetId);
    if (!d || d.status !== 'pending') return { ok: false, reason: 'Demande invalide' };
  }
  const mission = getMissionDef(state);
  const extra = (mission.extraTeamActions || []).find(a => a.id === actionId);
  if (!extra && !TEAM_ACTIONS.some(a => a.id === actionId)) return { ok: false, reason: 'Action inconnue' };

  if (state.teamActionsLeft > 0) state.teamActionsLeft--;
  else state.flags.reseauLeft--;

  state.stats.teamActions++;

  if (extra) {
    log(state, 'radio', extra.log || `Équipe : ${extra.name}.`);
    resolveEffect(state, extra.effects, { source: 'team', cause: `Équipe : ${extra.name}` });
    return { ok: true };
  }

  let failed = false;
  switch (actionId) {
    case 'intel': {
      // 1 sur 6 : le plan travaille dans le vide — pression payée quand même
      const d = teamRoll(state, 'Renseignement');
      changePressure(state, 1);
      if (d === 1) {
        failed = true;
        log(state, 'radio', 'Renseignement : à côté. Pression +1.');
      } else {
        const n = revealClues(state, 1);
        log(state, 'radio', n ? 'Renseignement : un élément du dossier prend sens.' : 'Renseignement : dossier déjà complet.');
      }
      break;
    }
    case 'sniper': {
      if (state.threat >= 5) {
        // repéré à coup sûr : menace +1, pas de préparation
        failed = true;
        log(state, 'radio', '⚠ Il a repéré le laser. Il sait.');
        changeThreat(state, 1);
      } else {
        const d = teamRoll(state, 'Tireur en position');
        if (d === 1) {
          failed = true;
          log(state, 'radio', 'Le tireur est repéré — menace +1.');
          changeThreat(state, 1);
        } else {
          state.prep = Math.min(3, state.prep + 1);
          log(state, 'radio', `Tireur en position. Préparation : ${state.prep}/3.`);
        }
      }
      break;
    }
    case 'supply': {
      // 1 sur 6 : le largage est repéré ou refusé — pression payée quand même
      const d = teamRoll(state, 'Ravitaillement');
      changePressure(state, 1);
      if (d === 1) {
        failed = true;
        log(state, 'radio', 'Le ravitaillement est compromis.');
      } else {
        changeThreat(state, -1);
        log(state, 'radio', 'Ravitaillement déposé. Il respire. Les caméras aussi.');
      }
      break;
    }
    case 'concede': {
      concedeDemandById(state, targetId);
      break;
    }
    case 'assault': {
      return resolveAssault(state, 'volontaire');
    }
    default:
      return { ok: false, reason: 'Action inconnue' };
  }
  // overrides de mission (effets additionnels déclarés en données) —
  // pas d'effet bonus quand l'action a échoué
  const ov = mission.teamOverrides && mission.teamOverrides[actionId];
  if (ov && ov.extraEffects && !failed && !state.result) {
    resolveEffect(state, ov.extraEffects, { source: 'team', cause: `Équipe : ${actionId}` });
  }
  return { ok: true };
}

// ---------------- Fin de phase / tour ----------------
function computePC(state) {
  let pc = 3 + state.flags.pcNext;
  state.flags.pcNext = 0;
  if (state.turn === 1) {
    if (state.skills.includes('voix_posee')) pc += SKILLS.voix_posee.effect.pcTurn1;
    if (state.stress >= 3) pc -= 1;
  }
  if (state.options.epuise && state.turn >= 5) pc -= 1;
  return Math.max(0, pc);
}

export function endPhase(state) {
  if (state.result || state.phase === 'choice' || state.phase === 'over') return { ok: false };
  if (state.phase === 'conversation') {
    state.phase = 'market';
    fillMarket(state);
    log(state, 'sys', '— Phase de préparation : dépensez vos PC restants au marché. —');
  } else if (state.phase === 'market') {
    state.phase = 'team';
    log(state, 'sys', '— Action d\'équipe (une par tour, facultative). —');
  } else if (state.phase === 'team') {
    resolveTerrorPhase(state);
  }
  return { ok: true, phase: state.phase };
}

export function applyChronoTimeout(state) {
  if (state.phase !== 'conversation' || state.result) return { ok: false };
  log(state, 'sys', '⏱ Temps écoulé. La ligne chauffe.');
  changeThreat(state, 1);
  if (!state.result) endPhase(state);
  return { ok: true };
}

function resolveTerrorPhase(state) {
  // assaut forcé (pression 10)
  if (state.flags.forcedAssault) {
    log(state, 'radio', '⛔ L\'assaut ordonné par le préfet est lancé. La négociation est terminée.');
    return resolveAssault(state, 'forcé');
  }
  const mission = getMissionDef(state);
  const lastAct = !mission.acts || state.act >= mission.acts.length - 1;
  // Pioche vide : transition d'acte ou Heure H (dernier acte seulement)
  if (state.terrorDeck.length === 0) {
    if (!lastAct) {
      transitionAct(state, state.act + 1);
      if (state.pendingChoice || state.result) return;
      return postTerror(state, true);
    }
    return resolveHeureH(state);
  }
  const cardId = state.terrorDeck.shift();
  const card = getTerrorDef(state, cardId);
  state.terrorDiscard.push(cardId);
  if (state.flags.nextTerrorFree) {
    state.flags.nextTerrorFree = false;
    log(state, 'terror', `Carte Terreur « ${card ? card.name : cardId} » — neutralisée, défaussée sans effet.`);
  } else if (card) {
    log(state, 'terror', `◆ TERREUR — ${card.name}`);
    log(state, 'terror', card.text);
    if (card.taker) log(state, 'taker', card.taker);
    resolveEffect(state, card.effect, { source: 'terror', cause: `Terreur : ${card.name}`, resume: 'endTerror' });
  }
  if (state.result || state.pendingChoice) return;
  postTerror(state, false);
}

// Suite de la phase Terreur : pression, objectif d'acte, tour suivant
function postTerror(state, justTransitioned) {
  if (state.result) return;
  // pression médiatique +1 (cadence réduite sur les missions multi-actes,
  // ou un tour sur deux avec Relations presse)
  const mission = getMissionDef(state);
  const every = mission.pressureEvery || 1;
  const skip = (state.skills.includes('presse') && (state.turn % 2 === 1))
    || (every > 1 && state.turn % every !== 0);
  if (!skip) {
    if (state.flags.mediaGrace > 0) {
      state.flags.mediaGrace--;
      log(state, 'radio', 'La presse vous ménage — pour l\'instant.');
    } else changePressure(state, 1);
  }
  if (state.flags.forcedAssault && !state.result) {
    log(state, 'radio', '⛔ L\'assaut aura lieu dès la fin de la prochaine phase d\'équipe.');
  }
  if (state.result) return;
  // objectif d'acte (fin de tour)
  const act = mission.acts ? mission.acts[state.act] : null;
  if (act && !justTransitioned && actGoalMet(state, act)) {
    const last = state.act >= mission.acts.length - 1;
    if (!last) {
      transitionAct(state, state.act + 1);
      if (state.pendingChoice || state.result) return;
      return startTurn(state, true);
    }
    return resolveHeureH(state);
  }
  startTurn(state, justTransitioned);
}

function getTerrorDef(state, id) {
  const mission = getMissionDef(state);
  if (mission.terrorExtra && mission.terrorExtra[id]) return mission.terrorExtra[id];
  if (id === 'complice_cache') return TERROR_COMPLICE;
  return TERROR_GENERIC[id] || null;
}

function startTurn(state, freshAct = false) {
  state.turn++;
  pushHistory(state);
  state.phase = 'conversation';
  state.usedThisTurn = [];
  state.teamActionsLeft = 1;
  // otage blessé
  if (state.flags.wounded && !state.flags.woundedSaved && !state.result) {
    const w = woundedHostage(state);
    if (!w || w.status !== 'held') {
      state.flags.wounded = false;
    } else if (state.turn >= state.flags.woundedDeadline) {
      log(state, 'death', `✝ ${w.name} n'a pas tenu. ${w.f ? 'Elle' : 'Il'} est mort${w.f ? 'e' : ''} de ses blessures.`);
      state.flags.wounded = false;
      killHostages(state, 1, `Blessures (${w.name})`, { ids: [w.id] });
      if (state.result) return;
    }
  }
  // promesse non tenue : au-delà de 3 tours, il vérifie une fois —
  // sur 1-2 il comprend le mensonge, sinon la marque expire silencieusement.
  if (state.flags.promise && !state.result) {
    const age = state.turn - (state.flags.promiseTurn || state.turn);
    if (age >= 3) {
      const d = rollDice(state, 1)[0];
      log(state, 'dice', `Il se demande si vous avez menti : [${d}]`, { dice: [d] });
      state.flags.promise = false;
      if (d <= 2) {
        log(state, 'taker', pickRandom(state, [
          'Vous m\'avez menti. Depuis le début. JE LE SAIS.',
          'Le camion, la promesse, les délais… Il n\'y avait rien. RIEN.',
          'Votre parole ne vaut plus rien. On va voir ce que valent vos excuses.',
        ]));
        log(state, 'sys', '⚠ Il a compris le mensonge. Menace +1.');
        changeThreat(state, 1);
        if (state.result) return;
      } else {
        log(state, 'sys', 'La promesse tient encore… pour l\'instant.');
      }
    }
  }
  // héros improvisé : une fois par partie, menace ≥ 5, à partir du tour 3
  if (!state.flags.herosDone && state.turn >= 3 && state.threat >= 5 && !state.result) {
    const heros = heldHostages(state).find(h => h.trait === 'heros');
    if (heros) {
      state.flags.herosDone = true;
      log(state, 'terror', `⚠ ${heros.name} tente quelque chose…`);
      const d = rollDice(state, 1)[0];
      log(state, 'dice', `Tentative de ${heros.name} : [${d}]`, { dice: [d] });
      if (d === 1) {
        killHostages(state, 1, `Tentative de ${heros.name}`, { ids: [heros.id] });
        if (state.result) return;
      } else if (d <= 4) {
        log(state, 'radio', 'Il se fait maîtriser. Le preneur est hors de lui.');
        changeThreat(state, 1);
        if (state.result) return;
      } else {
        log(state, 'radio', 'Il profite d\'un moment d\'inattention et franchit la sortie en courant.');
        freeHostages(state, 1, { ids: [heros.id] });
      }
    }
  }
  state.pc = computePC(state);
  log(state, 'sys', `═══ TOUR ${state.turn} — ${state.pc} PC ═══`);
  // effet récurrent de l'acte
  const mission = getMissionDef(state);
  const act = mission.acts ? mission.acts[state.act] : null;
  if (act && act.eachTurn && !state.result) {
    resolveEffect(state, act.eachTurn, { source: 'actTurn' });
  }
  // question du preneur : une fois chacune, ≥ 2 tours d'écart,
  // jamais le tour qui suit une transition d'acte ni après une fin
  if (!freshAct) maybeQuestion(state);
}

// ---------------- Questions du preneur ----------------
// Posées en début de tour (fin de startTurn), réponses via le mécanisme
// de choix. Déterministe, dans l'ordre des données, sans RNG.

function questionCoherent(state, reply) {
  const c = reply && reply.effects && reply.effects.ifClue;
  if (!c || !c.then) return false;
  const clue = getClue(state, c.id);
  // compétence « lecture_froide » : à la première question posée, les
  // réponses cohérentes sont marquées même sans indice révélé
  const lectureFroide = state.skills && state.skills.includes('lecture_froide')
    && (state.questionsAsked || []).length <= 1;
  if (!clue || (!clue.revealed && !lectureFroide)) return false;
  const t = c.then;
  return (t.threat || 0) < 0 || (t.pc || 0) > 0 || (t.pcNext || 0) > 0 || (t.free || 0) > 0;
}

// Affiché dans la modale de choix : badge « cohérent avec son profil ».
export function replyCoherent(state, reply) { return questionCoherent(state, reply); }

// Réponses à la question : applique le même filtrage conditionnel pour la
// modale de résolution (la branche affichée doit être celle jouée).
function questionEffects(state, reply) {
  const eff = reply.effects || {};
  if (!eff.ifClue) return eff;
  const out = { ...eff };
  delete out.ifClue;
  const c = eff.ifClue;
  const clue = getClue(state, c.id);
  const branch = (clue && clue.revealed) ? c.then : c.else;
  if (branch) Object.assign(out, branch);
  return out;
}

export function maybeQuestion(state) {
  if (state.result || state.pendingChoice || state.phase !== 'conversation') return;
  const mission = getMissionDef(state);
  const qs = mission.questions || [];
  if (!qs.length) return;
  if (!state.questionsAsked) state.questionsAsked = [];
  if (state.lastQuestionTurn === undefined) state.lastQuestionTurn = null;
  if (state.lastQuestionTurn !== null && state.turn - state.lastQuestionTurn < 2) return;
  const q = qs.find(q => !state.questionsAsked.includes(q.id)
    && state.turn >= (q.minTurn || 1)
    && (q.act === undefined || q.act === state.act)
    && (q.flag === undefined || state.flags[q.flag]));
  if (!q) return;
  state.questionsAsked.push(q.id);
  state.lastQuestionTurn = state.turn;
  state.phase = 'choice';
  state.pendingChoice = { questionId: q.id };
}

// ---------------- Actes / Choix / Compteurs ----------------
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
export function roman(n) { return ROMAN[n - 1] || String(n); }

function applyActAdds(state, act) {
  if (act.addDemands) for (const d of act.addDemands) state.demands.push({ id: d.id, status: 'pending' });
  if (act.addClues) for (const c of act.addClues) state.clues.push({ id: c.id, revealed: false });
  if (act.addMarket) state.marketDeck = shuffle(state, state.marketDeck.concat(act.addMarket));
}

function transitionAct(state, next) {
  const mission = getMissionDef(state);
  const act = mission.acts[next];
  state.act = next;
  state.actStartTurn = state.turn + 1; // premier tour de l'acte = tour suivant
  log(state, 'act', `═══ ACTE ${roman(next + 1)} — ${act.title} ═══`);
  for (const p of act.intro || []) log(state, 'act', p);
  applyActAdds(state, act);
  state.terrorDeck = act.terrorOrdered ? act.terrorDeck.slice() : shuffle(state, act.terrorDeck.slice());
  if (act.startThreat != null && act.startThreat !== state.threat) {
    log(state, 'sys', `Menace : ${state.threat} → ${act.startThreat}`);
    state.threat = act.startThreat;
  }
  if (act.choice) { triggerChoice(state, act.choice, 'enterAct'); return; }
  finishEnterAct(state, act);
}

function finishEnterAct(state, act) {
  if (act.onEnter) resolveEffect(state, act.onEnter, { source: 'act' });
}

export function actGoalMet(state, act) {
  const goals = Array.isArray(act.goal) ? act.goal : act.goal ? [act.goal] : [];
  for (const g of goals) {
    switch (g.type) {
      case 'freed': if (state.hostages.freed >= g.n) return true; break;
      case 'demand': {
        const d = getDemand(state, g.id);
        if (d && d.status !== 'pending') return true;
        break;
      }
      case 'clue': {
        const c = getClue(state, g.id);
        if (c && c.revealed) return true;
        break;
      }
      case 'counterLte': {
        const c = state.counters[g.id];
        if (c && c.value <= g.v) return true;
        break;
      }
    }
  }
  return false;
}

function changeCounter(state, id, delta, ctx = {}) {
  const c = state.counters[id];
  if (!c || state.result) return;
  c.value = Math.max(0, Math.min(c.max, c.value + delta));
  log(state, 'sys', `${c.icon} ${c.label} : ${c.value}/${c.max}`);
  if (c.value >= c.max) {
    log(state, 'terror', `⚠ ${c.label} — seuil critique atteint !`);
    resolveEffect(state, c.onMax, { source: 'counter', cause: c.cause });
    if (!state.result) c.value = c.resetTo;
  }
}

function concedeDemandById(state, demandId) {
  const d = getDemand(state, demandId);
  const def = getDemandDef(state, demandId);
  if (!d || !def || d.status !== 'pending') return;
  d.status = 'conceded';
  state.stats.conceded++;
  if (def.major) state.flags.majorConcessions++;
  log(state, 'radio', `Concession : « ${def.label} ». ${def.concede.text}`);
  const takerLines = getTaker(state).lines || getMissionDef(state).taker.lines;
  if (takerLines && takerLines.concede) {
    log(state, 'taker', pickRandom(state, takerLines.concede));
  }
  resolveEffect(state, def.concede.effects, { source: 'concede', cause: `Concession : ${def.label}` });
}

// ---------------- Choix ----------------
export function getChoice(state) {
  if (!state.pendingChoice) return null;
  const mission = getMissionDef(state);
  if (state.pendingChoice.hostagePick) {
    // libération ciblée : choisir quel otage retenu sort
    return {
      hostagePick: true,
      prompt: 'Qui sort ?',
      options: heldHostages(state).map(h => ({
        label: `${h.name} — ${h.role}`,
        desc: h.trait === 'vulnerable' ? 'fragile' : h.trait === 'heros' ? 'imprévisible' : '',
        hid: h.id,
      })),
    };
  }
  if (state.pendingChoice.questionId) {
    const q = (mission.questions || []).find(q => q.id === state.pendingChoice.questionId);
    if (!q) return null;
    // adapté au format des choix : prompt + options (label)
    return { question: q, prompt: q.text, speaker: q.speaker, options: q.replies };
  }
  return (mission.choices || {})[state.pendingChoice.choiceId] || null;
}

export function triggerChoice(state, choiceId, resume = 'endTerror') {
  const mission = getMissionDef(state);
  const ch = mission.choices && mission.choices[choiceId];
  if (!ch) return;
  state.phase = 'choice';
  state.pendingChoice = { choiceId, resume };
  log(state, 'act', `◆ DÉCISION — ${ch.prompt}`);
}

export function chooseOption(state, idx) {
  const pc = state.pendingChoice;
  if (!pc) return { ok: false, reason: 'Aucun choix en cours' };
  const mission = getMissionDef(state);
  if (pc.hostagePick) {
    const held = heldHostages(state);
    const h = held[idx];
    if (!h) return { ok: false, reason: 'Otage invalide' };
    state.pendingChoice = null;
    log(state, 'player', `Faites sortir ${h.name}. ${h.f ? 'Elle' : 'Lui'} d\'abord — c\'est mon prix.`);
    freeHostages(state, 1, { ids: [h.id] });
    if (state.result) return { ok: true };
    // plusieurs exfiltrations : on rouvre le choix tant qu'il en reste
    if (pc.hostagePick > 1 && heldHostages(state).length) {
      state.pendingChoice = { hostagePick: pc.hostagePick - 1, resume: pc.resume };
      return { ok: true };
    }
    if (pc.resume === 'endTerror') postTerror(state, false);
    else state.phase = 'conversation';
    return { ok: true };
  }
  if (pc.questionId) {
    const q = (mission.questions || []).find(q => q.id === pc.questionId);
    const r = q && q.replies[idx];
    if (!r) return { ok: false, reason: 'Réponse invalide' };
    log(state, 'player', r.line || r.label, { q: q.id });
    state.pendingChoice = null;
    if (r.answer) log(state, 'taker', r.answer);
    const eff = questionEffects(state, r);
    const summary = describeEffects(eff);
    if (summary !== '—') log(state, 'sys', `Effet : ${summary}`);
    if (eff && Object.keys(eff).length) resolveEffect(state, eff, { source: 'choice', cause: `Question : ${q.id}` });
    if (!state.result && !state.pendingChoice) state.phase = 'conversation';
    return { ok: true };
  }
  const ch = mission.choices[pc.choiceId];
  const opt = ch && ch.options[idx];
  if (!opt) return { ok: false, reason: 'Option invalide' };
  log(state, 'radio', `Décision : ${opt.label}`);
  state.pendingChoice = null;
  if (opt.flag) state.flags[opt.flag] = true;
  if (opt.effects) resolveEffect(state, opt.effects, { source: 'choice', cause: `Choix : ${opt.label}` });
  if (state.result) return { ok: true };
  // reprise selon le contexte
  if (pc.resume === 'enterAct') {
    const mission2 = getMissionDef(state);
    const act = mission2.acts[state.act];
    finishEnterAct(state, act);
    if (state.result || state.pendingChoice) return { ok: true };
    postTerror(state, true);
  } else if (pc.resume === 'endTerror') {
    postTerror(state, false);
  } else {
    startTurn(state);
  }
  return { ok: true };
}

// ---------------- Fins ----------------
function resolveHeureH(state) {
  log(state, 'terror', '◆ HEURE H — la nuit touche à sa fin. Le sort se joue maintenant.');
  const h = state.hostages.remaining;
  if (state.threat <= 3) {
    log(state, 'sys', 'Épuisé, vidé, il laisse tomber l\'arme. Il se rend.');
    return endGame(state, 'surrender');
  }
  const killOn = state.threat >= 6 ? [1, 2] : [1];
  const dice = rollDice(state, h);
  let killed = 0;
  for (const d of dice) if (killOn.includes(d)) killed++;
  log(state, 'dice', `Heure H — jet de sauvetage : [${dice.join(', ')}]`, { dice });
  if (killed > 0) {
    recordDeaths(state, killed, 'Heure H');
    if (state.hostages.remaining <= 0) return endGame(state, 'defeat');
  }
  if (state.threat >= 6) {
    log(state, 'radio', 'Trop tard pour la reddition. Le préfet ordonne l\'assaut.');
    return resolveAssault(state, 'heureH');
  }
  log(state, 'sys', 'Il rend les armes. La nuit se termine.');
  return endGame(state, 'surrender');
}

export function assaultRisk(state) {
  let risk = Math.max(1, 3 - state.prep) + (state.threat >= 6 ? 1 : 0);
  const flags = getMissionDef(state).assaultRiskFlags || {};
  for (const f of Object.keys(flags)) if (state.flags[f]) risk += flags[f];
  return risk;
}

export function resolveAssault(state, kind = 'volontaire') {
  state.flags.assaultKind = kind;
  const risk = assaultRisk(state);
  const h = state.hostages.remaining;
  log(state, 'radio', `◆ ASSAUT — risque ${risk}/6 par otage (préparation ${state.prep}).`);
  const dice = rollDice(state, h);
  let killed = 0;
  for (const d of dice) if (d <= risk) killed++;
  log(state, 'dice', `Assaut : [${dice.join(', ')}] — chaque dé ≤ ${risk} est un otage perdu`, { dice, risk });
  if (killed) {
    recordDeaths(state, killed, 'Assaut');
    log(state, 'death', `✝ ${killed} otage${killed > 1 ? 's ont' : ' a'} été perdu${killed > 1 ? 's' : ''} dans l\'assaut.`);
  }
  if (state.hostages.freed === 0 && state.hostages.remaining <= 0) {
    return endGame(state, 'defeat');
  }
  // issue sombre si préparation 0
  if (state.prep === 0) {
    const d = rollDice(state, 1)[0];
    if (d === 1) {
      state.flags.escape = true;
      return endGame(state, 'escape');
    }
  }
  return endGame(state, 'assault');
}

function endGame(state, outcome) {
  if (state.result) return;
  state.phase = 'over';
  pushHistory(state);
  state.result = {
    outcome, // 'surrender' | 'liberation' | 'assault' | 'escape' | 'defeat'
    turn: state.turn,
    hostages: { ...state.hostages },
  };
  const mission = getMissionDef(state);
  const epi = (mission.epilogues || {})[outcome] || '';
  log(state, 'epilogue', epi);
  return { ok: true, outcome };
}

// ---------------- Score ----------------
export function computeScore(state, mult = 1) {
  const h = state.hostages;
  const saved = h.total - h.killed;
  const allClues = state.clues.every(c => c.revealed);
  const breakdown = [];
  let score = 0;
  const add = (label, pts) => { score += pts; breakdown.push({ label, pts }); };

  add(`${saved} otage${saved > 1 ? 's' : ''} sauvé${saved > 1 ? 's' : ''} ×100`, saved * 100);
  if (h.killed > 0) breakdown.push({ label: `✝ ${h.killed} otage(s) tué(s)`, pts: null });
  const defeat = !!state.result && state.result.outcome === 'defeat';
  if (!defeat && state.act && state.act > 0) {
    for (let i = 1; i <= state.act; i++) add(`Acte ${roman(i + 1)} franchi`, 100);
  }
  if (state.result) {
    if (state.result.outcome === 'surrender' || state.result.outcome === 'liberation') add('Reddition du preneur', 300);
    else if (state.result.outcome === 'assault') add('Assaut mené', 100);
    else if (state.result.outcome === 'escape') add('Preneur en fuite', 0);
  }
  if (h.killed === 0 && state.result && state.result.outcome !== 'defeat') add('Aucune mort', 200);
  if (allClues) add('Dossier complet', 50);
  if (state.flags.majorConcessions === 0) { if (!defeat) add('Aucune concession majeure', 100); }
  else add(`${state.flags.majorConcessions} concession${state.flags.majorConcessions > 1 ? 's' : ''} majeure${state.flags.majorConcessions > 1 ? 's' : ''}`, -100 * state.flags.majorConcessions);

  score = Math.max(0, Math.round(score * mult));
  const acts = (getMissionDef(state).acts || [null]).length;
  const maxScore = h.total * 100 + 300 + 200 + 50 + 100 + (acts - 1) * 100;
  const ratio = score / (maxScore * mult || 1);
  const grade = defeat ? 'D' : ratio >= 0.9 ? 'S' : ratio >= 0.75 ? 'A' : ratio >= 0.55 ? 'B' : ratio >= 0.35 ? 'C' : 'D';
  return { score, grade, breakdown, saved, allClues, xp: Math.floor(score / 10) };
}

// ---------------- Sérialisation ----------------
export function serialize(state) {
  return JSON.parse(JSON.stringify(state));
}

export function deserialize(json) {
  const s = typeof json === 'string' ? JSON.parse(json) : json;
  if (!s || s.version !== 1) return null;
  return s;
}

// ---------------- Utilitaires UI ----------------
export function threatLabel(threat) {
  if (threat <= 2) return 'calme';
  if (threat <= 4) return 'tendu';
  if (threat <= 6) return 'critique';
  return 'rupture';
}

export function threatLabelFr(threat) {
  if (threat <= 1) return 'détendu';
  if (threat <= 2) return 'contenu';
  if (threat <= 3) return 'fragile';
  if (threat <= 4) return 'tendu';
  if (threat <= 5) return 'volatil';
  if (threat <= 6) return 'critique';
  return 'rupture';
}
