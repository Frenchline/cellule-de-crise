// ============================================================
// UI — rendu DOM. Ne contient aucune règle (cf. engine.js).
// ============================================================

import { getCard, TAGS, MARKET_CARDS } from './data/cards.js';
import { SKILLS } from './data/skills.js';
import { OPTION_LIST } from './data/options.js';
import {
  PHASE_LABELS, canPlayCard, cardDicePool, diceModifier, describeEffects,
  canBuy, teamActionsLeft, getDemandDef, getClueDef, pendingDemands,
  getMissionDef, threatLabelFr, getTaker, roman, getChoice, replyCoherent,
  cardOdds, failRisk, ensureHostageList, assaultRisk,
} from './engine.js';
import { getRank, RANKS, missionUnlocked, dailyMissionId, dailySeed } from './campaign.js';
import { REP_CHARS, repModifiers } from './reputation.js';
import * as PIX from './pixel.js';
import { MISSION_LIST, getMission } from './data/missions/index.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

export function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  const scr = $('#' + id);
  if (scr) scr.classList.add('active');
  document.body.classList.toggle('in-game', id === 'scr-game');
  if (id !== 'scr-game') document.body.removeAttribute('data-tt'); // teinte de menace = jeu seulement
  scr && scr.scrollTo(0, 0);
}

// ---------------- ambiance ----------------
export function updateGyro(threat) {
  document.getElementById('gyro').style.setProperty('--threat', String(Math.min(1, threat / 7)));
}

export function flashDeath(enabled = true) {
  if (!enabled) return;
  const f = $('#flash');
  f.classList.add('on');
  document.body.classList.add('shake');
  setTimeout(() => {
    f.classList.remove('on');
    document.body.classList.remove('shake');
  }, 450);
}

// ---------------- machine à écrire ----------------
let typeTimer = null;
let typeDone = null;
export function typewrite(elTxt, text, done) {
  if (typeTimer) clearInterval(typeTimer);
  if (typeDone) typeDone();
  typeDone = done;
  let i = 0;
  elTxt.textContent = '';
  typeTimer = setInterval(() => {
    i += 2;
    elTxt.textContent = text.slice(0, i);
    if (i >= text.length) { clearInterval(typeTimer); typeTimer = null; const d = typeDone; typeDone = null; d && d(); }
  }, 22);
}
export function skipTypewrite(fullText, elTxt) {
  if (typeTimer) { clearInterval(typeTimer); typeTimer = null; elTxt.textContent = fullText; const d = typeDone; typeDone = null; d && d(); return true; }
  return false;
}

// ---------------- journal ----------------
const WHO = {
  player: 'VOUS', taker: 'LUI', sys: '·', radio: 'RADIO',
  dice: 'DÉS', terror: 'TERREUR', death: '☠', clue: 'DOSSIER', epilogue: 'RAPPORT',
  act: 'ACTE', psy: 'PSY — DR ANSELME',
};
const TYPEWRITER_KINDS = new Set(['player', 'taker', 'epilogue']);
let typeQueue = [];
let typing = false;
let speechCtx = null;   // {who, canvas, spec, expr} de la réplique en cours de frappe

// Réplique en cours de frappe (pour animer la bouche des portraits)
export function activeSpeech() { return speechCtx; }

export function resetTranscript() {
  $('#transcript').innerHTML = '';
  typeQueue = []; typing = false; speechCtx = null;
  if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
}

export function appendLogEntries(entries, opts = {}) {
  const box = $('#transcript');
  for (const e of entries) {
    const row = el('div', `tl tl-${e.k}`);
    // petit avatar pixel devant VOUS / LUI
    let av = null, avSpec = null, avExpr = 'calme';
    if (e.k === 'psy' && opts.portraits) {
      avSpec = PIX.PSY_PORTRAIT;
      av = PIX.spriteCanvas(PIX.portraitSprite(avSpec, 'calme'));
      av.className = 'tl-av';
      row.append(av);
    } else if ((e.k === 'player' || e.k === 'taker') && opts.portraits) {
      avSpec = e.k === 'player' ? opts.portraits.player : opts.portraits.taker;
      if (avSpec) {
        avExpr = e.k === 'taker' ? (opts.mood || 'calme') : 'calme';
        av = PIX.spriteCanvas(PIX.portraitSprite(avSpec, avExpr));
        av.className = 'tl-av';
        row.append(av);
      }
    }
    const who = el('span', 'who', WHO[e.k] || e.k.toUpperCase());
    const txt = el('span', 'txt');
    row.append(who, txt);
    box.append(row);
    if (TYPEWRITER_KINDS.has(e.k) && !opts.instant) {
      typeQueue.push({ txt, text: e.text, who: e.k, canvas: av, spec: avSpec, expr: avExpr });
    } else {
      txt.textContent = e.text;
    }
    if (e.k === 'death') flashDeath(opts.flash !== false);
    if (opts.onEntry) opts.onEntry(e);
  }
  pumpTypeQueue();
  box.scrollTop = box.scrollHeight;
}

function pumpTypeQueue() {
  if (typing || !typeQueue.length) return;
  typing = true;
  const item = typeQueue.shift();
  const { txt, text } = item;
  speechCtx = item.canvas ? item : null;
  const box = $('#transcript');
  typewrite(txt, text, () => {
    typing = false;
    speechCtx = null;
    box.scrollTop = box.scrollHeight;
    pumpTypeQueue();
  });
}

export function skipAllTyping() {
  // termine le message courant, vide la file en instantané
  const box = $('#transcript');
  if (typeTimer) {
    clearInterval(typeTimer); typeTimer = null;
    const last = box.querySelector('.tl .txt:empty');
    if (last) last.textContent = last.dataset.full || '';
    typing = false;
  }
  while (typeQueue.length) {
    const { txt, text } = typeQueue.shift();
    txt.textContent = text;
  }
  speechCtx = null;
  if (typeDone) { const d = typeDone; typeDone = null; d && d(); }
  box.scrollTop = box.scrollHeight;
}

// ---------------- dés ----------------
export function showDice(dice, successes, cb) {
  const zone = $('#dice-zone');
  zone.innerHTML = '';
  dice.forEach(() => zone.append(el('div', 'die rolling', '?')));
  setTimeout(() => {
    zone.innerHTML = '';
    dice.forEach(d => {
      const die = el('div', `die ${d >= 5 ? 'win' : 'lose'}`, String(d));
      zone.append(die);
    });
    const r = el('span', 'dice-result', `→ ${successes} succès`);
    zone.append(r);
    cb && cb();
  }, 550);
}

export function clearDice() { $('#dice-zone').innerHTML = ''; }

// ---------------- HUD partie ----------------
export function renderHUD(state) {
  const hud = $('#game-hud');
  hud.innerHTML = '';
  const mission = getMissionDef(state);
  const fuzzy = state.options.brouillard;

  // menace
  const c1 = el('div', 'hud-cell');
  c1.append(el('div', 'h-label', 'MENACE'));
  if (fuzzy) {
    c1.append(el('div', 'h-val', threatLabelFr(state.threat)));
  } else {
    const pips = el('div', 'threat-pips');
    for (let i = 1; i <= 7; i++) {
      const p = el('span', 'pip');
      if (i <= state.threat) p.classList.add(i <= 2 ? 'on1' : i <= 4 ? 'on2' : 'on3');
      pips.append(p);
    }
    c1.append(pips);
    c1.append(el('div', 'h-val', `${state.threat}/7`));
  }
  hud.append(c1);

  // otages
  const c2 = el('div', 'hud-cell hud-otages');
  c2.title = 'Liste des otages (Dossier)';
  c2.append(el('div', 'h-label', 'OTAGES'));
  c2.append(el('div', 'h-val h-nowrap', `${state.hostages.remaining}⛓ ${state.hostages.freed}✓ ${state.hostages.killed}†`));
  hud.append(c2);

  // pression
  const c3 = el('div', 'hud-cell');
  c3.append(el('div', 'h-label', 'PRESSE'));
  const bar = el('div', 'pressure-bar');
  bar.append(el('i'));
  bar.firstChild.style.width = `${state.pressure * 10}%`;
  c3.append(bar);
  c3.append(el('div', 'h-val', `${state.pressure}/10`));
  hud.append(c3);

  // horloge terreur
  const c4 = el('div', 'hud-cell');
  c4.append(el('div', 'h-label', 'HORLOGE'));
  c4.append(el('div', 'h-val', `${state.terrorDeck.length}`));
  c4.append(el('div', 'h-label', 'Terreur'));
  hud.append(c4);

  // tour / PC
  const c5 = el('div', 'hud-cell');
  c5.append(el('div', 'h-label', `TOUR ${state.turn}`));
  c5.append(el('div', 'h-val', `${state.pc} PC`));
  c5.append(el('div', 'h-label', `prép. ${state.prep}`));
  hud.append(c5);
}

export function renderPhaseBanner(state, chronoLeft = null) {
  const b = $('#phase-banner');
  const mission = getMissionDef(state);
  const label = PHASE_LABELS[state.phase] || '';
  b.innerHTML = '';
  if (mission.acts) {
    b.append(el('span', 'act-tag', `ACTE ${roman(state.act + 1)}/${roman(mission.acts.length)} · `));
  }
  b.append(el('span', null, `— ${label} —`));
  if (chronoLeft != null && state.phase === 'conversation' && state.options.chrono) {
    b.append(document.createTextNode(' '));
    b.append(el('span', 'chrono', `⏱ ${chronoLeft}s`));
  }
}

export function renderCounters(state) {
  const box = $('#counters');
  const ids = Object.keys(state.counters || {});
  if (!ids.length) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  box.innerHTML = '';
  for (const id of ids) {
    const c = state.counters[id];
    const chip = el('div', `counter-chip${c.value >= c.max - 1 ? ' hot' : ''}`);
    chip.append(el('span', 'cc-icon', c.icon), el('span', 'cc-label', c.label),
                el('span', 'cc-val', `${c.value}/${c.max}`));
    box.append(chip);
  }
}

// ---------------- portraits & scène (pixel-art, cf. pixel.js) ----------------
export function getTakerPortrait(state) {
  const t = getTaker(state);
  return (t && t.portrait) || getMissionDef(state).taker.portrait || null;
}

export function getSceneId(state) {
  const m = getMissionDef(state);
  let s = m.scene || 'pharmacie';
  if (m.acts && state.act != null && state.act < m.acts.length) {
    let a = m.acts[state.act].scene;
    if (a && a.ifFlag) a = state.flags[a.ifFlag] ? a.then : a.else;
    if (a) s = a;
  }
  return s;
}

// Bandeau « caméra de surveillance » au-dessus du transcript.
// mood : 'calme' | 'tendu' | 'furieux' | 'abattu'
export function renderSceneBanner(state, mood = 'calme', talking = false) {
  const bar = $('#scene-bar');
  if (!bar) return;
  const taker = getTaker(state);
  const spec = getTakerPortrait(state);
  const expr = talking ? 'parle' : mood;
  const med = $('#scene-med');
  if (spec) PIX.renderSprite(med, PIX.portraitSprite(spec, expr));
  else med.getContext('2d').clearRect(0, 0, med.width, med.height);
  $('#scene-name').textContent = taker ? taker.name.toUpperCase() : '—';
  const moodEl = $('#scene-mood');
  moodEl.textContent = PIX.MOOD_LABELS[talking ? 'parle' : mood] === '·' ? 'PARLE' : (PIX.MOOD_LABELS[mood] || mood.toUpperCase());
  moodEl.className = `sb-mood m-${talking ? 'tendu' : mood}`;
}

export function drawSceneFrame(state, frame) {
  const cv = $('#scene-canvas');
  if (!cv) return;
  PIX.renderSprite(cv, PIX.sceneSprite(getSceneId(state), frame, state.hostages.remaining));
}

export function setSceneCollapsed(collapsed) {
  const bar = $('#scene-bar');
  if (bar) bar.classList.toggle('collapsed', !!collapsed);
}

// ---------------- effets courts (affichés sur les cartes) ----------------
function counterIcon(state, cid) {
  const c = (getMissionDef(state).counters || []).find(c => c.id === cid);
  return c ? c.icon : '';
}

export function shortEffects(eff, icons = {}) {
  if (!eff) return '—';
  const ic = (id) => icons[id] ? `${icons[id]}` : id;
  const parts = [];
  if (eff.threat) parts.push(`menace ${eff.threat > 0 ? '+' : '−'}${Math.abs(eff.threat)}`);
  if (eff.pressure) parts.push(`presse ${eff.pressure > 0 ? '+' : '−'}${Math.abs(eff.pressure)}`);
  if (eff.pc) parts.push(`${eff.pc > 0 ? '+' : '−'}${Math.abs(eff.pc)} PC`);
  if (eff.pcNext) parts.push(`${eff.pcNext > 0 ? '+' : '−'}${Math.abs(eff.pcNext)} PC⏭`);
  if (eff.free) parts.push(`⛓ libère ${eff.free}`);
  if (eff.kill) parts.push(`✝ ${eff.kill}`);
  if (eff.reveal) parts.push(`indice${eff.reveal > 1 ? ' ×' + eff.reveal : ''}`);
  if (eff.prep) parts.push(`prép. ${eff.prep > 0 ? '+' : '−'}${Math.abs(eff.prep)}`);
  if (eff.discardNextTerror) parts.push('Terreur annulée');
  if (eff.win === 'surrender') parts.push('reddition');
  if (eff.neutralizeDemand) parts.push('demande abandonnée');
  if (eff.concedeDemand) parts.push('demande concédée');
  if (eff.mark === 'promesse') parts.push('promesse');
  if (eff.counter) for (const [cid, d] of Object.entries(eff.counter)) {
    parts.push(`${ic(cid)} ${d > 0 ? '+' : '−'}${Math.abs(d)}`);
  }
  if (eff.flag && eff.flag !== 'complice') parts.push(`flag ${eff.flag}`);
  if (eff.flag === 'complice') parts.push('2e preneur');
  if (eff.choice) parts.push('décision');
  if (eff.assault) parts.push('assaut');
  if (eff.lose) parts.push('défaite');
  // conditionnels → libellés lisibles courts
  const sub = (o) => { const s = shortEffects(o, icons); return s === '—' ? 'rien' : s; };
  if (eff.roll) {
    const max = Math.max(...Object.keys(eff.roll.table).map(Number));
    const tiers = Object.keys(eff.roll.table).sort((a, b) => a - b)
      .map(k => `${Number(k) === max && max > 0 ? k + '+' : k}·${sub(eff.roll.table[k])}`);
    parts.push(`🎲${eff.roll.dice}d ${tiers.join(' / ')}`);
  }
  if (eff.ifThreatGte) parts.push(`menace≥${eff.ifThreatGte.v}→${sub(eff.ifThreatGte.then)} | sinon ${sub(eff.ifThreatGte.else)}`);
  if (eff.ifCounterGte) parts.push(`${ic(eff.ifCounterGte.id)}≥${eff.ifCounterGte.v}→${sub(eff.ifCounterGte.then)} | sinon ${sub(eff.ifCounterGte.else)}`);
  if (eff.ifFlag) parts.push(`si ${eff.ifFlag.f}→${sub(eff.ifFlag.then)} | sinon ${sub(eff.ifFlag.else)}`);
  if (eff.ifClue) parts.push(`si indice→${sub(eff.ifClue.then)} | sinon ${sub(eff.ifClue.else)}`);
  if (eff.demandMajorPending) parts.push(`si demande majeure→${sub(eff.demandMajorPending.then)} | sinon ${sub(eff.demandMajorPending.else)}`);
  if (eff.promise) parts.push(`si promesse→${sub(eff.promise.then)} | sinon ${sub(eff.promise.else)}`);
  return parts.join(' · ') || '—';
}

function counterIconsFor(state) {
  const m = {};
  for (const c of getMissionDef(state).counters || []) m[c.id] = c.icon;
  return m;
}

// lignes « paliers » d'une carte : [['✗','30%','menace +1'],['1','44%','…'],…]
// ou [['✓',null,'…']] pour une carte auto. % = probabilité exacte du palier.
export function cardTierLines(card, state) {
  const icons = counterIconsFor(state);
  if (card.auto) return [['✓', null, shortEffects(card.effects.auto, icons)]];
  const keys = Object.keys(card.effects).map(Number).filter(k => !isNaN(k)).sort((a, b) => a - b);
  const max = Math.max(...keys);
  const odds = cardOdds(state, card);
  return keys.map(k => [
    k === 0 ? '✗' : k === max && max > 0 ? `${k}+` : String(k),
    odds ? `${Math.round(odds[k] * 100)}%` : null,
    shortEffects(card.effects[k], icons),
  ]);
}

// ---------------- main de cartes ----------------
export function renderHand(state, onCard) {
  const hand = $('#hand');
  hand.innerHTML = '';
  for (const cid of state.hand) {
    const card = getCard(cid);
    if (!card) continue;
    const chk = canPlayCard(state, cid);
    const used = card.reusable && state.usedThisTurn.includes(cid);
    const div = el('button', `card${card.reusable ? '' : ' single'}${chk.ok ? '' : ' disabled'}${used ? ' used' : ''}`);
    div.append(el('div', 'c-name', card.name));
    const meta = card.auto ? 'AUTO' : `${cardDicePool(state, card)} dés${diceModifier(state, card) ? ` (${card.dice}${diceModifier(state, card) > 0 ? '+' : ''}${diceModifier(state, card)})` : ''}`;
    const mrow = el('div', 'c-metarow');
    mrow.append(el('span', 'c-meta', meta), el('span', 'c-cost', `${card.cost} PC`));
    div.append(mrow);
    const eff = el('div', 'c-eff');
    for (const [t, pct, s] of cardTierLines(card, state)) {
      const row = el('div', 'c-effline');
      row.append(el('span', 'c-tier', t));
      if (pct) row.append(el('span', 'c-odds', pct));
      row.append(el('span', null, s));
      eff.append(row);
    }
    div.append(eff);
    const risk = failRisk(state, card);
    if (risk) div.append(el('div', 'c-risk', risk === 'kill' ? '⚠ Échec : un otage peut mourir' : '⚠ Échec : assaut forcé'));
    const tagrow = el('div', 'c-tagrow');
    tagrow.append(el('span', 'c-tag', TAGS[card.tag] || ''));
    if (used) tagrow.append(el('span', 'c-block', 'Déjà jouée'));
    else if (!chk.ok) tagrow.append(el('span', 'c-block', chk.reason));
    div.append(tagrow);
    div.addEventListener('click', () => onCard(cid));
    hand.append(div);
  }
}

// ---------------- onglets ----------------
export function renderTab(state, tab, handlers) {
  const p = $('#tab-panel');
  p.innerHTML = '';
  const close = el('button', 'btn btn-small panel-close', 'Fermer');
  close.addEventListener('click', () => { p.classList.add('hidden'); $$('#game-tabs button[data-tab]').forEach(b => b.classList.remove('on')); });

  if (tab === 'marche') {
    p.append(el('h4', null, `MARCHÉ — phase de préparation (${state.pc} PC dispo)`));
    state.market.forEach((cid, i) => {
      const d = el('div', 'shop-card');
      if (!cid) { d.append(el('div', 'c-desc', '— emplacement vide —')); p.append(d); return; }
      const c = getCard(cid);
      const row = el('div', 'row');
      row.append(el('span', 'c-name', c.name));
      row.append(el('span', 'price', `${c.buy} PC`));
      const desc = el('div', 'c-desc', c.desc);
      const eff = el('div', 'c-eff');
      for (const [t, pct, s] of cardTierLines(c, state)) {
        const r = el('div', 'c-effline');
        r.append(el('span', 'c-tier', t));
        if (pct) r.append(el('span', 'c-odds', pct));
        r.append(el('span', null, s));
        eff.append(r);
      }
      const btn = el('button', 'btn btn-small btn-primary', 'Acheter');
      const chk = canBuy(state, i);
      if (!chk.ok) { btn.disabled = true; btn.textContent = chk.reason; }
      btn.addEventListener('click', () => handlers.buy(i));
      d.append(row, desc, eff, btn);
      p.append(d);
    });
  }

  if (tab === 'equipe') {
    p.append(el('h4', null, `ÉQUIPE — ${teamActionsLeft(state)} action(s) restante(s)`));

    const canAct = state.phase === 'team' && teamActionsLeft(state) > 0;
    const acts = [
      { id: 'intel', name: 'Renseignement', desc: 'Révèle un indice caché. Pression +1.' },
      { id: 'sniper', name: 'Positionner le tireur', desc: `Préparation +1 (act. ${state.prep}/3). Si menace ≥ 5 : menace +1.` },
      { id: 'supply', name: 'Ravitaillement', desc: 'Menace −1. Pression +1.' },
      ...(getMissionDef(state).extraTeamActions || []),
      { id: 'assault', name: 'Donner l\'assaut', desc: `Fin de mission. Risque ${assaultRisk(state)}/6 par otage.`, danger: true },
    ];
    for (const a of acts) {
      const d = el('div', 'team-card');
      const row = el('div', 'row');
      const nm = el('span', 't-name');
      nm.append(document.createTextNode(a.name));
      if (handlers.rules) {
        const info = el('button', 'info-dot', 'ⓘ');
        info.title = 'Règles : actions d\'équipe';
        info.addEventListener('click', (e) => { e.stopPropagation(); handlers.rules('sec-actions'); });
        nm.append(info);
      }
      row.append(nm);
      const btn = el('button', `btn btn-small${a.danger ? '' : ' btn-primary'}`, 'Lancer');
      if (!canAct || a.id === 'sniper' && state.prep >= 3) btn.disabled = true;
      btn.addEventListener('click', () => handlers.team(a.id, null));
      row.append(btn);
      d.append(row, el('div', 't-desc', a.desc));
      p.append(d);
    }
    // concessions
    p.append(el('h4', null, 'CONCÉDER UNE DEMANDE'));
    const pd = pendingDemands(state);
    if (!pd.length) p.append(el('div', 'c-desc', 'Aucune demande en attente.'));
    for (const dd of pd) {
      const def = getDemandDef(state, dd.id);
      const d = el('div', 'demand-card');
      const row = el('div', 'row');
      const lbl = el('span', 'd-label');
      lbl.append(document.createTextNode(`${def.major ? '★ ' : ''}${def.label}`));
      if (handlers.rules) {
        const info = el('button', 'info-dot', 'ⓘ');
        info.title = 'Règles : demandes';
        info.addEventListener('click', (e) => { e.stopPropagation(); handlers.rules('sec-demandes'); });
        lbl.append(info);
      }
      row.append(lbl);
      const btn = el('button', 'btn btn-small', 'Concéder');
      if (state.phase !== 'team' || teamActionsLeft(state) <= 0) btn.disabled = true;
      btn.addEventListener('click', () => handlers.team('concede', dd.id));
      row.append(btn);
      d.append(row, el('div', 'd-detail', def.detail));
      p.append(d);
    }
  }

  if (tab === 'dossier') {
    const mission = getMissionDef(state);
    const taker = getTaker(state);
    p.append(el('h4', null, `DOSSIER — ${taker.name}, ${taker.age} ans`));
    for (const line of taker.dossier) {
      const c = el('div', 'clue-card');
      c.append(el('div', 'cl-desc', line));
      p.append(c);
    }
    // otages nommés
    const hsec = el('div', 'host-list');
    hsec.id = 'host-sec';
    hsec.append(el('h4', null, `OTAGES — ${state.hostages.remaining} retenu${state.hostages.remaining > 1 ? 's' : ''}`));
    for (const h of ensureHostageList(state)) {
      const row = el('div', `host-row host-${h.status}`);
      row.append(el('span', 'host-icon', h.status === 'freed' ? '🚪' : h.status === 'dead' ? '✝' : '⛓'));
      const nm = el('span', 'host-name');
      nm.textContent = `${h.name} — ${h.role}`;
      row.append(nm);
      if (h.trait) row.append(el('span', `host-badge ${h.trait}`, h.trait === 'vulnerable' ? 'fragile' : 'imprévisible'));
      if (h.status !== 'held') {
        row.append(el('span', 'host-fate', h.status === 'freed' ? `sorti${h.f ? 'e' : ''} (tour ${h.turn})` : `tué${h.f ? 'e' : ''} (tour ${h.turn})`));
      }
      hsec.append(row);
    }
    p.append(hsec);

    p.append(el('h4', null, 'INDICES PSYCHOLOGIQUES'));
    for (const c of state.clues) {
      const def = getClueDef(state, c.id);
      const cardEl = el('div', `clue-card${c.revealed ? '' : ' hidden-clue'}`);
      if (c.revealed) {
        cardEl.append(el('div', 'cl-name', def.name));
        cardEl.append(el('div', 'cl-desc', def.desc));
      } else {
        cardEl.append(el('div', 'cl-desc', '— indice non révélé —'));
      }
      p.append(cardEl);
    }
  }

  if (tab === 'demandes') {
    p.append(el('h4', null, 'DEMANDES DU PRENEUR'));
    for (const dd of state.demands) {
      const def = getDemandDef(state, dd.id);
      const d = el('div', 'demand-card');
      const row = el('div', 'row');
      const lbl = el('span', 'd-label');
      lbl.append(document.createTextNode(`${def.major ? '★ ' : ''}${def.label}`));
      if (handlers.rules) {
        const info = el('button', 'info-dot', 'ⓘ');
        info.title = 'Règles : demandes';
        info.addEventListener('click', (e) => { e.stopPropagation(); handlers.rules('sec-demandes'); });
        lbl.append(info);
      }
      row.append(lbl);
      const st = { pending: 'EN ATTENTE', conceded: 'CONCÉDÉE', neutralized: 'ABANDONNÉE' }[dd.status];
      row.append(el('span', `d-status ${dd.status}`, st));
      d.append(row, el('div', 'd-detail', def.detail));
      p.append(d);
    }
    if (state.flags.promise) {
      p.append(el('div', 'd-detail', '⚠ Promesse en cours non tenue — elle peut se retourner.'));
    }
  }

  p.append(close);
  p.classList.remove('hidden');
}

// ---------------- QG ----------------
export function renderHQ(c, missionList, handlers) {
  $('#hq-agent-line').textContent = `${c.agentName} · jour ${c.day}`;
  const rank = getRank(c.xp);
  $('#hq-stats').innerHTML = '';
  const stats = [
    ['RANG', rank.rank.name],
    ['XP', `${c.xp}${rank.next ? ' / ' + rank.next.xp : ''}`],
    ['STRESS', `${c.stress}/5`],
    ['COMPÉT.', `${c.skills.length}`],
  ];
  for (const [l, v] of stats) {
    const d = el('div', 'stat');
    d.append(document.createTextNode(l), el('b', null, v));
    $('#hq-stats').append(d);
  }
  const warn = $('#stress-warning');
  if (c.stress >= 3) {
    warn.classList.remove('hidden');
    warn.textContent = c.stress >= 5
      ? '⛔ Arrêt maladie. Le négociateur ne peut plus prendre d\'appel. Prenez du repos.'
      : '⚠ Stress élevé : −1 PC au premier tour de chaque mission.';
  } else warn.classList.add('hidden');

  const box = $('#hq-missions');
  box.innerHTML = '';
  missionList.forEach((m, i) => {
    const rec = c.missions[m.id];
    const adv = m.type === 'advanced';
    const locked = !missionUnlocked(c, m.id, missionList);
    const sickLeave = c.stress >= 5;
    const btn = el('button', `mission-card${locked || sickLeave ? ' locked' : ''}${adv ? ' adv' : ''}`);
    btn.append(el('span', 'm-num', locked ? '🔒' : sickLeave ? '⛔' : String(i + 1)));
    const body = el('span', 'm-body');
    body.append(el('div', 'm-title',
      `${adv ? '▲ AVANCÉ · ' : ''}${m.title}`));
    body.append(el('div', 'm-sub', `${m.subtitle}${m.duration ? ' · ' + m.duration : ''}`));
    const meta = locked
      ? (adv ? 'Terminez les deux missions classiques' : 'Verrouillée — terminez « Premier appel »')
      : sickLeave ? 'Arrêt maladie — prenez du repos'
      : rec ? `meilleur : ${rec.bestScore} (${rec.bestGrade}) · ${rec.plays} partie${rec.plays > 1 ? 's' : ''}` : 'jamais jouée';
    body.append(el('div', 'm-meta', meta));
    btn.append(body);
    if (!locked && !sickLeave) btn.addEventListener('click', () => handlers.openMission(m.id));
    box.append(btn);
  });

  // ---------- Opérations spéciales (missions générées) ----------
  // Visible dès que le tutoriel est gagné.
  const opsTitle = $('#hq-ops-title');
  const ops = $('#hq-ops');
  ops.innerHTML = '';
  const tutoDone = c.missions.tutoriel && c.missions.tutoriel.wins > 0;
  const sickLeaveOps = c.stress >= 5;
  if (tutoDone && handlers.openMission) {
    opsTitle.classList.remove('hidden');

    // Mission du jour — même seed (date) pour tout le monde
    const dailyId = dailyMissionId();
    const daily = getMission(dailyId);
    const db = el('button', `mission-card ops${sickLeaveOps ? ' locked' : ''}`);
    db.append(el('span', 'm-num', '📅'));
    const dbody = el('span', 'm-body');
    dbody.append(el('div', 'm-title', 'MISSION DU JOUR'));
    dbody.append(el('div', 'm-sub', `${daily.title} · ${daily.subtitle}`));
    const todayDone = c.daily && c.daily.date === dailySeed();
    dbody.append(el('div', 'm-meta',
      sickLeaveOps ? 'Arrêt maladie — prenez du repos'
      : todayDone ? `Déjà jouée aujourd'hui : note ${c.daily.grade}` : 'Une mission unique, la même pour tous, renouvelée demain.'));
    db.append(dbody);
    if (!sickLeaveOps) db.addEventListener('click', () => handlers.openMission(dailyId));
    ops.append(db);
    if (todayDone && handlers.shareDaily) {
      const share = el('button', 'btn btn-small ops-share', '📤 Partager');
      share.addEventListener('click', (e) => { e.stopPropagation(); handlers.shareDaily(); });
      ops.append(share);
    }

    // Mission aléatoire
    const rb = el('button', `mission-card ops${sickLeaveOps ? ' locked' : ''}`);
    rb.append(el('span', 'm-num', '🎲'));
    const rbody = el('span', 'm-body');
    rbody.append(el('div', 'm-title', 'MISSION ALÉATOIRE'));
    rbody.append(el('div', 'm-sub', 'Une alerte quelque part en France.'));
    rbody.append(el('div', 'm-meta',
      sickLeaveOps ? 'Arrêt maladie — prenez du repos' : 'Générée à chaque fois. XP et stress comme en mission classique.'));
    rb.append(rbody);
    if (!sickLeaveOps) rb.addEventListener('click', () => handlers.randomMission());
    ops.append(rb);
  } else {
    opsTitle.classList.add('hidden');
  }

  // ---------- Relations (réputation) ----------
  const relBox = $('#hq-relations');
  if (relBox) {
    relBox.innerHTML = '';
    const rep = { presse: 5, hierarchie: 5, ...(c.rep || {}) };
    const ctxs = repModifiers(rep).contexts;
    for (const gauge of ['hierarchie', 'presse']) {
      const ch = REP_CHARS[gauge];
      const row = el('div', 'rel-row');
      const av = PIX.spriteCanvas(PIX.portraitSprite(ch.portrait, 'calme'), 2);
      av.className = 'rel-av';
      row.append(av);
      const body = el('div', 'rel-body');
      const head = el('div', 'rel-head');
      head.append(el('b', null, ch.name), el('span', 'rel-role', ch.role));
      body.append(head);
      // jauge 0–10 en blocs
      const bar = el('div', 'rel-bar');
      for (let i = 1; i <= 10; i++) {
        bar.append(el('i', `rel-cell${i <= rep[gauge] ? ' on' : ''}`));
      }
      bar.append(el('span', 'rel-val', `${rep[gauge]}/10`));
      body.append(bar);
      const note = (c.repLast && c.repLast[gauge])
        ? `« ${c.repLast[gauge]} »`
        : 'aucune remarque récente';
      body.append(el('div', 'rel-note', note));
      const mod = ctxs.find(x => x.who === ch.id);
      if (mod) body.append(el('div', 'rel-mod', `▸ ${mod.label} : ${mod.text}`));
      row.append(body);
      relBox.append(row);
    }
    if (!ctxs.length) relBox.append(el('div', 'rel-note', 'Réputation neutre : aucun modificateur en mission.'));
  }

  const sk = $('#hq-skills');
  sk.innerHTML = '';
  $('#hq-skillpoints').textContent = c.skillPoints ? `(${c.skillPoints} point${c.skillPoints > 1 ? 's' : ''} à dépenser)` : '';
  for (const s of Object.values(SKILLS)) {
    const owned = c.skills.includes(s.id);
    const d = el('div', `skill-card${owned ? ' owned' : ''}`);
    d.append(el('span', 's-name', s.name));
    d.append(el('span', 's-desc', s.desc));
    const btn = el('button', 'btn btn-small', owned ? 'Apprise' : 'Apprendre');
    if (owned || c.skillPoints <= 0) btn.disabled = true;
    btn.addEventListener('click', () => handlers.learn(s.id));
    d.append(btn);
    sk.append(d);
  }
}

// ---------------- briefing ----------------
export function renderBriefing(mission, optsSel, onToggle, rep = null) {
  const paper = $('#brief-paper');
  paper.innerHTML = '';
  if (mission.type === 'advanced') {
    paper.append(el('div', 'adv-tag', `▲ SCÉNARIO AVANCÉ — ${mission.acts ? mission.acts.length + ' actes' : ''} · ${mission.duration || ''}`));
  }
  for (const p of mission.briefing) paper.append(el('p', null, p));

  // Encart « Contexte » : effets actifs de la réputation
  const ctxs = rep ? repModifiers(rep).contexts : [];
  if (ctxs.length) {
    const box = el('div', 'ctx-box');
    box.append(el('div', 'ctx-title', 'CONTEXTE'));
    for (const c of ctxs) {
      const ch = Object.values(REP_CHARS).find(x => x.id === c.who);
      box.append(el('div', 'ctx-line', `▸ ${c.label}${ch ? ` (${ch.name})` : ''} — ${c.text}`));
    }
    paper.append(box);
  }

  const box = $('#brief-options');
  box.innerHTML = '';
  for (const o of OPTION_LIST) {
    const d = el('div', `opt${optsSel[o.id] ? ' on' : ''}`);
    d.append(el('span', 'o-box', optsSel[o.id] ? '✓' : ''));
    const body = el('div');
    const nameRow = el('div');
    nameRow.append(el('span', 'o-name', `${o.name} `), el('span', 'o-mult', `×${o.mult}`));
    body.append(nameRow, el('div', 'o-desc', o.desc));
    d.append(body);
    d.addEventListener('click', () => onToggle(o.id));
    box.append(d);
  }
}

// ---------------- débriefing ----------------
const OUTCOME_VIGNETTE = {
  surrender: 'surrender', liberation: 'freed', assault: 'assault',
  escape: 'terror', defeat: 'death',
};

// Moments clés de la partie, extraits du journal (pur).
// Priorité 1 = morts/libérations/assaut, 2 = actes/concessions, 3 = terreur/indices/questions.
export function keyMoments(log) {
  const found = [];
  (log || []).forEach((e, i) => {
    const t = e.turn ?? 1, x = e.text || '';
    let m = null;
    if (e.k === 'act' && /ACTE [IVX]+/.test(x)) m = { i, turn: t, icon: '§', label: x.replace(/═/g, '').trim(), pr: 2 };
    else if (e.k === 'death') m = { i, turn: t, icon: '✝', label: x.replace(/^✝\s*/, ''), pr: 1 };
    else if (x.startsWith('🚪')) m = { i, turn: t, icon: '🚪', label: x.replace(/^🚪\s*/, ''), pr: 1 };
    else if (x.startsWith('◆ ASSAUT')) m = { i, turn: t, icon: '⚔', label: `Assaut : ${x.replace(/^◆ ASSAUT —\s*/, '')}`, pr: 1 };
    else if (x.startsWith('Concession')) m = { i, turn: t, icon: '⚑', label: x, pr: 2 };
    else if (x.startsWith('◆ TERREUR')) m = { i, turn: t, icon: '◆', label: x.replace(/^◆ TERREUR —\s*/, ''), pr: 3 };
    else if (e.k === 'clue') m = { i, turn: t, icon: '🔍', label: x.replace(/^📁 Indice révélé : «\s*/, '').replace(/\s*»$/, ''), pr: 3 };
    else if (e.k === 'player' && e.data && e.data.q) m = { i, turn: t, icon: '❓', label: `Question : ${x}`, pr: 3 };
    if (m) found.push(m);
  });
  return found
    .sort((a, b) => a.pr - b.pr || a.i - b.i)
    .slice(0, 12)
    .sort((a, b) => a.i - b.i);
}

// Graphe « DÉROULÉ » : menace (rouge, 1–7) et pression (ambre, 0–10)
// par tour, marqueurs d'actes en pointillés, icônes d'événements en bas.
export function drawTimeline(canvas, state) {
  const hist = state.history || [];
  const w = canvas.width = Math.max(220, Math.floor(canvas.clientWidth) || 320);
  const h = canvas.height = 118;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const padL = 20, padR = 6, padT = 10, padB = 20;
  const iw = w - padL - padR, ih = h - padT - padB;
  const tMax = Math.max(2, ...hist.map(p => p.turn));
  const X = t => padL + (iw * (t - 1)) / (tMax - 1 || 1);
  const Yt = v => padT + (ih * (7 - Math.min(7, Math.max(1, v)))) / 6;
  const Yp = v => padT + (ih * (10 - Math.min(10, Math.max(0, v)))) / 10;
  ctx.fillStyle = '#0e1520'; ctx.fillRect(0, 0, w, h);
  // grille horizontale (échelle menace 1–7)
  ctx.strokeStyle = '#1b2635'; ctx.fillStyle = '#8b8fa0'; ctx.font = '8px monospace';
  for (const t of [1, 4, 7]) {
    ctx.beginPath(); ctx.moveTo(padL, Yt(t)); ctx.lineTo(w - padR, Yt(t)); ctx.stroke();
    ctx.fillText(String(t), 4, Yt(t) + 3);
  }
  // marqueurs de changement d'acte (pointillés)
  ctx.strokeStyle = '#8a6a4a'; ctx.setLineDash([2, 3]);
  for (const e of state.log || []) {
    if (e.k === 'act' && /ACTE [IVX]+/.test(e.text || '') && e.turn > 1) {
      ctx.beginPath(); ctx.moveTo(X(e.turn), padT); ctx.lineTo(X(e.turn), padT + ih); ctx.stroke();
    }
  }
  ctx.setLineDash([]);
  const line = (Y, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
    hist.forEach((p, i) => { const x = X(p.turn), y = Y(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke(); ctx.lineWidth = 1;
    for (const p of hist) { ctx.fillStyle = color; ctx.fillRect(X(p.turn) - 1, Y(p) - 1, 3, 3); }
  };
  line(p => Yt(p.threat), '#e23b3b');
  line(p => Yp(p.pressure), '#ffb454');
  // légende
  ctx.fillStyle = '#e23b3b'; ctx.fillRect(padL, h - 16, 8, 2);
  ctx.fillStyle = '#b3ac98'; ctx.fillText('menace', padL + 11, h - 12);
  ctx.fillStyle = '#ffb454'; ctx.fillRect(padL + 52, h - 16, 8, 2);
  ctx.fillStyle = '#b3ac98'; ctx.fillText('presse', padL + 63, h - 12);
  // icônes d'événements le long du bas (une par type par tour)
  ctx.font = '9px monospace';
  const seenTurnIcon = new Set();
  for (const m of keyMoments(state.log)) {
    const k = `${m.turn}:${m.icon}`;
    if (seenTurnIcon.has(k)) continue;
    seenTurnIcon.add(k);
    ctx.fillText(m.icon, X(m.turn) - 4, h - 1);
  }
}

export function renderDebrief(state, mission, scoreInfo, xpGain, rankName, rankUps = 0, illus = true, repReport = null) {
  const paper = $('#debrief-paper');
  paper.innerHTML = '';
  if (illus) {
    const vc = PIX.spriteCanvas(PIX.vignetteSprite(OUTCOME_VIGNETTE[state.result.outcome] || 'terror'));
    vc.className = 'd-vig';
    paper.append(vc);
  }
  paper.append(el('h3', null, `RAPPORT D'INTERVENTION — ${mission.title.toUpperCase()}`));
  const outNames = {
    surrender: 'REDDITION DU PRENEUR', liberation: 'TOUS LES OTAGES LIBÉRÉS',
    assault: 'ASSAUT MENÉ', escape: 'PRENEUR EN FUITE', defeat: 'ÉCHEC — PERTES TOTALES',
  };
  const win = state.result.outcome !== 'defeat' && state.result.outcome !== 'escape';
  paper.append(el('div', `d-outcome ${win ? 'win' : 'lose'}`, outNames[state.result.outcome] || state.result.outcome));
  paper.append(el('div', null, `${state.agentName} — ${rankName}`));
  paper.append(el('div', 'd-grade', scoreInfo.grade));

  // ---- BILAN HUMAIN ----
  const res = state.result;
  const bilan = el('div', 'd-bilan');
  bilan.append(el('h4', null, 'BILAN HUMAIN'));
  const out = el('div', 'd-bilan-grid');
  const lignes = [
    ['Otages pris', res.hostages.total],
    ['Libérés pendant la négociation', res.hostages.freed],
    ['Sortis vivants à l\'issue', res.outcome === 'defeat' ? 0 : res.hostages.remaining],
    ['Tués', res.hostages.killed],
  ];
  for (const [l, v] of lignes) out.append(el('span', 'bl', l), el('b', null, String(v)));
  bilan.append(out);
  if (mission.acts) {
    bilan.append(el('div', 'bl-act',
      `Acte atteint : ${roman(state.act + 1)}/${roman(mission.acts.length)} — ${mission.acts[state.act].title}`));
  }
  // sort individuel des otages
  if (Array.isArray(state.hostageList) && state.hostageList.length) {
    const nl = el('div', 'd-hostages');
    for (const h of state.hostageList) {
      const fate = h.status === 'freed' ? `🚪 libéré${h.f ? 'e' : ''}`
        : h.status === 'dead' ? `✝ tué${h.f ? 'e' : ''} — tour ${h.turn ?? '?'}${h.cause ? ` · ${h.cause}` : ''}`
        : res.outcome !== 'defeat' ? `✔ sorti${h.f ? 'e' : ''} vivant${h.f ? 'e' : ''}`
        : `— non libéré${h.f ? 'e' : ''}`;
      nl.append(el('div', `dh host-${h.status}`, `${fate} — ${h.name} (${h.role})`));
    }
    bilan.append(nl);
  }
  if (state.deaths && state.deaths.length) {
    const dl = el('div', 'd-deaths');
    for (const d of state.deaths) {
      dl.append(el('div', 'dd', `✝ Tour ${d.turn} — ${d.cause}${d.names ? ` : ${d.names.join(', ')}` : ''}`));
    }
    bilan.append(dl);
  }
  paper.append(bilan);

  const t = el('table');
  for (const b of scoreInfo.breakdown) {
    const tr = el('tr');
    tr.append(el('td', null, b.label), el('td', null, b.pts == null ? '—' : `${b.pts > 0 ? '+' : ''}${b.pts}`));
    t.append(tr);
  }
  const tr = el('tr');
  tr.append(el('td', null, 'TOTAL'), el('td', null, `${scoreInfo.score} pts`));
  t.append(tr);
  paper.append(t);
  paper.append(el('div', null, `XP gagnée : +${xpGain}`));
  if (rankUps > 0) {
    paper.append(el('div', 'd-promo',
      `★ PROMOTION : ${rankName} — ${rankUps} point${rankUps > 1 ? 's' : ''} de compétence à dépenser au QG`));
  }

  // ---- DÉROULÉ (graphe + moments clés) ----
  const hist = state.history || [];
  if (hist.length > 1) {
    const der = el('div', 'd-deroule');
    der.append(el('h4', null, 'DÉROULÉ'));
    const cv = el('canvas', 'd-timeline');
    der.append(cv);
    const moms = keyMoments(state.log);
    if (moms.length) {
      const ul = el('div', 'd-moments');
      for (const m of moms) ul.append(el('div', 'dm', `T${m.turn} · ${m.icon} ${m.label}`));
      der.append(ul);
    }
    paper.append(der);
    drawTimeline(cv, state);
  }

  // ---- RÉACTIONS (réputation + psy) ----
  if (repReport) {
    const rr = el('div', 'd-reactions');
    rr.append(el('h4', null, 'RÉACTIONS'));
    for (const g of ['hierarchie', 'presse']) {
      const ch = repReport[g];
      const row = el('div', 'd-react');
      const av = PIX.spriteCanvas(PIX.portraitSprite(ch.portrait, 'calme'), 2);
      av.className = 'rel-av';
      row.append(av);
      const body = el('div', 'rel-body');
      const head = el('div', 'rel-head');
      head.append(el('b', null, ch.name), el('span', 'rel-role', ch.role));
      body.append(head);
      body.append(el('div', 'rel-note', `« ${ch.line} »`));
      const arrow = ch.delta > 0 ? '▲' : ch.delta < 0 ? '▼' : '=';
      const gname = g === 'presse' ? 'PRESSE' : 'HIÉRARCHIE';
      body.append(el('div', `rel-delta ${ch.delta > 0 ? 'up' : ch.delta < 0 ? 'down' : ''}`,
        `${gname} ${ch.before} → ${ch.after} ${arrow}`));
      row.append(body);
      rr.append(row);
    }
    // la psy commente toujours
    const prow = el('div', 'd-react');
    const pav = PIX.spriteCanvas(PIX.portraitSprite(PIX.PSY_PORTRAIT, 'calme'), 2);
    pav.className = 'rel-av';
    prow.append(pav);
    const pb = el('div', 'rel-body');
    const ph = el('div', 'rel-head');
    ph.append(el('b', null, repReport.psy.name), el('span', 'rel-role', repReport.psy.role));
    pb.append(ph, el('div', 'rel-note', `« ${repReport.psy.line} »`));
    prow.append(pb);
    rr.append(prow);
    paper.append(rr);
  }

  const epi = state.log.filter(e => e.k === 'epilogue').map(e => e.text).join(' ');
  if (epi) paper.append(el('p', 'd-epi', epi));
  paper.append(el('div', 'd-stamp', 'BRIGADE DE NÉGOCIATION — ARCHIVE CELLULE'));
}

// ---------------- modale carte ----------------
export function openCardModal(state, cardId, handlers) {
  const card = getCard(cardId);
  const modal = $('#card-modal');
  modal.innerHTML = '';
  const box = el('div', 'm-card');
  box.append(el('div', 'm-name', card.name));
  const meta = card.auto ? 'Effet automatique' : `${cardDicePool(state, card)} dés (base ${card.dice}, succès sur 5-6)`;
  box.append(el('div', 'm-meta', `${meta} · ${TAGS[card.tag]} · coût ${card.cost} PC · ${card.reusable ? 'réutilisable' : 'usage unique'}`));
  box.append(el('div', 'm-desc', card.desc));
  const eff = el('div', 'm-effects');
  const rows = card.auto ? [['auto', card.effects.auto]] : Object.entries(card.effects);
  const maxKey = Math.max(...rows.map(([k]) => Number(k) || 0));
  const label = k => k === 'auto' ? 'toujours' : Number(k) === maxKey && maxKey > 0 ? `${k}+` : k;
  const odds = cardOdds(state, card);
  eff.textContent = rows.map(([k, e]) =>
    `${label(k)}${odds ? ` ${Math.round(odds[Number(k)] * 100)}%` : ''} → ${describeEffects(e)}`).join('   |   ');
  box.append(eff);
  const chk = canPlayCard(state, cardId);
  const risk = failRisk(state, card);
  const failP = odds ? odds[Math.min(...Object.keys(odds).map(Number))] : 0;
  const risky = !!(risk && failP >= 0.25);
  let armed = false;
  const guard = (btn, run) => {
    if (!risky) { run(); return; }
    if (!armed) {
      armed = true;
      btn.classList.add('btn-danger');
      btn.textContent = '⚠ Confirmer malgré le risque';
      return;
    }
    run();
  };
  if (risk) box.append(el('div', 'm-risk', risk === 'kill'
    ? '⚠ Échec : la menace peut atteindre 7 — un otage peut mourir'
    : `⚠ Échec : la presse peut atteindre ${state.assaultAt || 10} — assaut forcé`));
  if (!chk.ok) box.append(el('div', 'm-cond', `✖ ${chk.reason}`));
  else if (card.condText) box.append(el('div', 'm-cond', `Condition : ${card.condText}`));

  if (state.flags.rerollsLeft > 0 && !card.auto) {
    const rr = el('label', 'reroll-row');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    rr.append(cb, document.createTextNode(` Relancer les dés si besoin (Sang-froid : ${state.flags.rerollsLeft} restante)`));
    box.append(rr);
    box.dataset.reroll = '1';
  }

  if (card.needsTarget === 'demande' && chk.ok) {
    box.append(el('div', 'm-desc', 'Cible :'));
    const tg = el('div', 'targets');
    for (const dd of pendingDemands(state)) {
      const def = getDemandDef(state, dd.id);
      const b = el('button', 'target-btn', `${def.major ? '★ ' : ''}${def.label}`);
      b.addEventListener('click', () => guard(b, () => handlers.play(cardId, dd.id)));
      tg.append(b);
    }
    box.append(tg);
  } else if (chk.ok) {
    const play = el('button', 'btn btn-primary', 'Jouer cette carte');
    play.addEventListener('click', () => guard(play, () => handlers.play(cardId, null)));
    box.append(play);
  }
  const cancel = el('button', 'btn', 'Fermer');
  cancel.addEventListener('click', () => modal.classList.add('hidden'));
  box.append(cancel);
  modal.append(box);
  modal.classList.remove('hidden');
  modal.onclick = e => { if (e.target === modal) modal.classList.add('hidden'); };
  return box;
}

// ---------------- modale de décision ----------------
export function renderChoiceModal(state, onChoose) {
  const modal = $('#choice-modal');
  const ch = getChoice(state);
  if (!ch) { modal.classList.add('hidden'); return; }
  modal.innerHTML = '';
  const box = el('div', `ch-card${ch.question ? ' ch-dialog' : ''}`);
  if (ch.question) {
    // dialogue : le preneur parle, trois réponses proposées
    const taker = getTaker(state);
    const head = el('div', 'ch-speaker');
    const cv = PIX.spriteCanvas(PIX.portraitSprite(taker.portrait, 'parle'), 2);
    cv.className = 'ch-portrait';
    head.append(cv);
    const who = el('div');
    who.append(el('div', 'ch-title', 'IL DEMANDE'));
    who.append(el('div', 'ch-name', taker.name));
    head.append(who);
    box.append(head);
    box.append(el('div', 'ch-bubble', ch.prompt));
    const opts = el('div', 'ch-opts');
    ch.options.forEach((o, i) => {
      const b = el('button', 'ch-opt ch-reply');
      b.append(el('div', 'co-label', o.label));
      const row = el('div', 'co-row');
      row.append(el('span', `co-tag tag-${o.tag || 'default'}`, TAGS[o.tag] || 'Neutre'));
      if (replyCoherent(state, o)) row.append(el('span', 'co-badge', '✓ cohérent avec son profil'));
      b.append(row);
      b.addEventListener('click', () => onChoose(i));
      opts.append(b);
    });
    box.append(opts);
  } else {
    box.append(el('div', 'ch-title', 'DÉCISION'));
    box.append(el('div', 'ch-prompt', ch.prompt));
    const opts = el('div', 'ch-opts');
    ch.options.forEach((o, i) => {
      const b = el('button', 'ch-opt');
      b.append(el('div', 'co-label', o.label), el('div', 'co-desc', o.desc || ''));
      b.addEventListener('click', () => onChoose(i));
      opts.append(b);
    });
    box.append(opts);
  }
  modal.append(box);
  modal.classList.remove('hidden');
}

export function closeChoiceModal() {
  $('#choice-modal').classList.add('hidden');
}

// ============================================================
// RÈGLES — modale accordéon, fidèle au code (engine.js / données)
// ============================================================

export const RULES = [
  {
    id: 'sec-but', title: 'But du jeu et fins de partie',
    body: [
      'Vous êtes le négociateur. Votre but : faire sortir les otages vivants et terminer la mission sans bain de sang.',
      '<b>REDDITION</b> — la meilleure fin (+300 pts) : jouez « Proposer la reddition » (coût 3 PC, menace ≤ 2 et une demande majeure concédée ou neutralisée) et obtenez 3+ succès. En scénario avancé, elle n\'est jouable qu\'au dernier acte.',
      '<b>LIBÉRATION</b> — tous les otages sont sortis (+300 pts) : quand « Demander un otage » ou « Proposer un échange » vident les lieux. En mission classique, une libération après des morts n\'est une victoire que si libérés ≥ tués ; sinon c\'est une défaite.',
      '<b>ASSAUT</b> — les équipes reprennent les lieux (+100 pts) : lancé par vous (action d\'équipe), ordonné à pression 10, ou déclenché à l\'Heure H si la menace ≥ 6. Chaque otage restant risque sa vie (voir Actions d\'équipe).',
      '<b>FUITE</b> — le preneur s\'échappe (0 pt) : possible quand l\'assaut est donné avec une préparation à 0.',
      '<b>DÉFAITE</b> — tous les otages sont morts, ou (scénario avancé) le dernier otage restant est tué, ou un effet de scénario fait tout basculer.',
      '<b>HEURE H</b> — quand la dernière carte Terreur est tirée : menace ≤ 3 → reddition immédiate ; sinon un dé par otage restant tue sur 1 (sur 1-2 si menace ≥ 6), puis menace ≥ 6 → assaut, menace 4-5 → reddition.',
      'Chaque mort est comptée dans le bilan ; « Aucune mort » rapporte +200 pts.',
    ],
  },
  {
    id: 'sec-tour', title: 'Déroulement d\'un tour',
    body: [
      '1. <b>CONVERSATION</b> : dépensez vos PC pour jouer des cartes de dialogue.',
      '2. <b>PRÉPARATION</b> : dépensez les PC restants au marché (cartes à usage unique).',
      '3. <b>ACTION D\'ÉQUIPE</b> : une action par tour (facultative) et concessions de demandes.',
      '4. <b>TERREUR</b> : la carte du haut de la pioche se résout — puis la pression monte (+1 par tour, moins souvent sur les scénarios avancés) et un nouveau tour commence.',
      'Vous démarrez chaque tour avec 3 PC, + ceux gagnés au tour précédent.',
    ],
  },
  {
    id: 'sec-menace', title: 'Menace et point de rupture',
    body: [
      'La menace (1-7) mesure son instabilité. Elle modifie TOUS vos jets :',
      '• menace 1-2 → <b>+1 dé</b> · 3-4 → 0 · 5-6 → <b>−1 dé</b> · 7 → −2 dés.',
      '<b>POINT DE RUPTURE</b> : si la menace atteint 7, il craque et tue un otage, puis la menace retombe à 6. Chaque passage à 7 coûte une vie.',
      'Beaucoup d\'effets d\'échec donnent menace +1 ou +2 : ne jouez pas une carte risquée quand la menace est déjà haute.',
    ],
  },
  {
    id: 'sec-cartes', title: 'Cartes et dés',
    body: [
      'Chaque dé réussi sur <b>5-6</b>. Le palier de l\'effet dépend du nombre de succès : « ✗ » = 0 succès (souvent un effet négatif), « 1 » = 1 succès, « 2+ » = 2 succès ou plus.',
      'Le <b>pourcentage</b> de chaque palier est affiché sur la carte — c\'est la probabilité exacte avec vos dés du moment. La ligne rouge <b>⚠</b> signale un échec qui peut tuer un otage (menace → 7) ou forcer l\'assaut (presse → 10) : confirmez avant de jouer.',
      'Les <b>cartes de base</b> (vertes en main) sont réutilisables une fois par tour. Les <b>cartes du marché</b> (bordure en pointillés) sont à usage unique et s\'achètent en phase de préparation au prix indiqué.',
      'Une carte grisée indique pourquoi elle est bloquée : PC insuffisants, condition non remplie, déjà jouée ce tour.',
      'Certaines cartes ont des conditions (ex. « Demander un otage » exige menace ≤ 5) ou une cible (« Négocier une demande » cible une demande en attente).',
    ],
  },
  {
    id: 'sec-actions', title: 'Actions d\'équipe',
    body: [
      'Une action d\'équipe par tour, en phase « Action d\'équipe ».',
      '<b>RENSEIGNEMENT</b> — révèle un indice du dossier (bonus de dés, nouvelles cartes possibles). Coût : pression +1.',
      '<b>POSITIONNER LE TIREUR</b> — préparation +1 (max 3), indispensable pour un assaut sûr. Risque : si menace ≥ 5, il repère le laser → menace +1.',
      '<b>RAVITAILLEMENT</b> — menace −1 (et effet bonus dans certains scénarios). Coût : pression +1.',
      '<b>CONCÉDER UNE DEMANDE</b> — applique les effets de la demande. Une concession majeure coûte −100 pts au score.',
      '<b>DONNER L\'ASSAUT</b> — fin de mission immédiate. Pour CHAQUE otage restant, un dé : il meurt sur ≤ risque. Risque = <code>max(1, 3 − préparation)</code>, +1 si menace ≥ 6 (ex. préparation 2 → risque 1/6 ; préparation 0 → 3/6, voire 4/6 sous haute menace). À préparation 0, une issue sombre supplémentaire est possible (fuite du preneur sur un jet de 1).',
      'Certains scénarios ajoutent des actions propres (démineurs…) ou modifient les vôtres.',
    ],
  },
  {
    id: 'sec-demandes', title: 'Demandes',
    body: [
      'Le preneur formule des demandes (onglet Demandes). Deux façons de les lever :',
      '<b>CONCÉDER</b> (action d\'équipe) : effet immédiat décrit sur la demande — souvent de la pression ou un engagement à tenir. Une concession <b>majeure (★)</b> coûte −100 pts au score.',
      '<b>NÉGOCIER</b> (carte « Négocier une demande », ciblée, 2+ succès) : il y renonce, sans concession — mais 0 succès donne menace +2.',
      'Une demande majeure résolue (concédée ou abandonnée) est <b>requise pour proposer la reddition</b> : tant qu\'elle pend, il a une raison de rester.',
      'Attention : « Promesse » non tenue peut se retourner contre vous (une carte Terreur la rappelle).',
    ],
  },
  {
    id: 'sec-pression', title: 'Pression médiatique',
    body: [
      'La presse monte d\'elle-même chaque fin de tour (et plus vite avec certaines actions ou l\'option Médias déchaînés).',
      'À <b>9</b> : le préfet prévient. À <b>10</b> : <b>l\'assaut est ordonné de force</b> à la fin du tour — quoi que vous fassiez (seuil 9 si votre hiérarchie vous lâche — voir Réputation).',
      '« Gagner du temps » et « Mentir sur les délais » peuvent baisser la presse ou annuler la prochaine carte Terreur.',
    ],
  },
  {
    id: 'sec-dossier', title: 'Dossier et indices',
    body: [
      'L\'onglet Dossier contient le profil du preneur et des indices psychologiques cachés, révélés par Renseignement ou certaines cartes.',
      'Chaque indice révélé peut donner un <b>bonus ou malus de dés</b> selon le type de carte (empathie, autorité, pression, ruse) — certains débloquent des cartes spéciales (« Appel d\'un proche » exige un indice « proche »).',
      'Révéler tout le dossier rapporte +50 pts.',
    ],
  },
  {
    id: 'sec-questions', title: 'Ses questions',
    body: [
      'Parfois, en début de tour, <b>le preneur pose une question</b>. La partie se fige : choisissez votre réponse parmi les trois proposées.',
      'Chaque réponse porte un <b>ton</b> (Empathie, Autorité, Pression, Ruse). Le ton compte autant que les mots — relisez son profil.',
      'Le badge <b>✓ cohérent avec son profil</b> apparaît quand une réponse colle à un indice révélé : c\'est souvent la meilleure, mais pas toujours la plus sûre.',
      'Mentir ou promettre rapporte un avantage immédiat… qui peut se retourner. Une réponse n\'est jamais neutre : il retient tout.',
      'Le chrono est suspendu pendant la question.',
    ],
  },
  {
    id: 'sec-ops', title: 'Opérations spéciales',
    body: [
      'Débloquées une fois le tutoriel remporté, les opérations spéciales proposent des <b>missions générées</b> : nouveau preneur, nouveaux lieux, demandes et indices inédits — mêmes règles qu\'une mission classique.',
      '<b>MISSION DU JOUR</b> : la même pour tout le monde, renouvelée chaque jour. Le premier résultat du jour est enregistré (note, otages sauvés) et partageable — les replays ne l\'écrasent pas.',
      '<b>MISSION ALÉATOIRE</b> : un tirage à chaque fois ; « 🎲 Autre mission » au briefing en tire une autre.',
      'XP et stress s\'appliquent comme en mission classique ; les scores des missions générées ne gonflent pas vos records (seule la mission du jour est gardée).',
    ],
  },
  {
    id: 'sec-avances', title: 'Scénarios avancés',
    body: [
      'Les scénarios avancés se jouent en <b>plusieurs actes</b> : nouvel interlocuteur, nouvelle pioche Terreur, demandes et indices supplémentaires à chaque acte.',
      '<b>DÉCISIONS</b> : à certains moments, un choix fige la partie — chaque option a des effets (et parfois des conséquences durables).',
      '<b>COMPTEURS</b> (Rituel, Émeute, Explosifs…) : quand un compteur atteint son maximum, son effet critique se déclenche puis il redescend. Des cartes et actions d\'équipe permettent de le faire baisser.',
      'La reddition n\'est possible qu\'au <b>dernier acte</b> : les premiers interlocuteurs n\'ont pas le pouvoir de se rendre.',
      'La mort du dernier otage restant y est toujours une défaite, même si d\'autres ont été libérés.',
    ],
  },
  {
    id: 'sec-reputation', title: 'Réputation',
    body: [
      'Deux jauges de <b>réputation</b> (0–10, départ à 5) suivent votre campagne : la <b>presse</b> (Inès Morvan, journaliste) et votre <b>hiérarchie</b> (le commissaire Castagne). Elles montent ou descendent après chaque mission — sauf le tutoriel.',
      '<b>Presse</b> : monte quand la pression reste basse ou que vous obtenez une reddition ; chute si la pression explose, si un otage meurt ou si vous cédez une demande majeure.',
      '<b>Hiérarchie</b> : monte sur une reddition, une libération sans mort ou un assaut volontaire propre ; chute sur défaite, fuite ou concessions majeures.',
      'Effets au briefing (« Contexte ») : presse ≥ 8 → la presse vous ménage (2 montées automatiques sautées) ; presse ≤ 2 → pression de départ +2 ; hiérarchie ≥ 8 → préparation +1 ; hiérarchie ≤ 2 → l\'assaut forcé tombe à pression 9.',
      'Le débrief montre leurs <b>réactions</b> et un graphe du <b>déroulé</b> : menace et pression tour par tour.',
    ],
  },
  {
    id: 'sec-score', title: 'Score, notes et campagne',
    body: [
      'Score : otages sauvés ×100 · reddition/libération +300 · assaut +100 · aucune mort +200 · dossier complet +50 · sans concession majeure +100 · concession majeure −100 · acte franchi +100 (scénarios avancés).',
      'Notes : S ≥ 90 % du score maximal, A ≥ 75 %, B ≥ 55 %, C ≥ 35 %, D en dessous — toute défaite = D.',
      'XP = score ÷ 10. Rangs : Stagiaire (0), Négociateur (300), Principal (700), Chef de cellule (1200), Légende (2000). Chaque rang donne un point de compétence.',
      '<b>Stress</b> : +1 par otage tué, +2 en cas de défaite, −1 si aucune mort. À 3+ : −1 PC au premier tour. À 5 : arrêt maladie — reposez-vous (−2 stress / jour).',
      'Les scénarios avancés se débloquent en terminant le Braquage ET l\'Hôpital sans défaite.',
    ],
  },
  {
    id: 'sec-options', title: 'Options de partie',
    body: [
      '<b>Chrono</b> (×1.2) : 60 s réelles par phase de conversation ; à 0 → menace +1.',
      '<b>Médias déchaînés</b> (×1.2) : la pression monte deux fois plus vite.',
      '<b>Brouillard</b> (×1.1) : la menace exacte est cachée.',
      '<b>Otage blessé</b> (×1.3) : un otage mourra au tour 5 s\'il n\'est pas libéré.',
      '<b>Complice caché</b> (×1.3) : un second preneur se révélera (autorité −1 dé).',
      '<b>Négociateur épuisé</b> (×1.1) : −1 PC à partir du tour 5.',
      '<b>Mode hardcore</b> (×1.5) : pas de relance de dés ; défaite = stress 5.',
    ],
  },
  {
    id: 'sec-conseils', title: 'Conseils de négociateur',
    body: [
      '• Gardez la menace ≤ 4 tant que possible : chaque passage à 7 tue un otage.',
      '• Ne jouez jamais une carte à échec « menace +2 » quand la menace est déjà à 5-6.',
      '• Réglez la demande majeure tôt — sans elle, pas de reddition possible.',
      '• Positionnez le tireur quand la menace est < 5 (sinon il vous repère).',
      '• Surveillez la presse : à 9, jouez des cartes qui la baissent ou accélérez.',
      '• Les actions d\'équipe ont un prix caché : renseignement et ravitaillement donnent presse +1 — seul le tireur est « gratuit » (mais repérable si menace ≥ 5).',
      '• La psychologue de la cellule (<b>PSY — Dr Anselme</b>) intervient au fil de la partie avec des conseils ciblés sur la situation — désactivable dans les réglages du QG.',
    ],
  },
];

export function openRules(secId = null) {
  const modal = $('#rules-modal');
  modal.innerHTML = '';
  const box = el('div', 'rules-card');
  const head = el('div', 'rules-head');
  head.append(el('div', 'rules-title', 'RÈGLES DU JEU'));
  const close = el('button', 'btn btn-small', 'Fermer');
  close.addEventListener('click', () => modal.classList.add('hidden'));
  head.append(close);
  box.append(head);
  for (const sec of RULES) {
    const det = el('details', 'rule-sec');
    det.id = sec.id;
    const sum = el('summary', null, sec.title);
    det.append(sum);
    const bd = el('div', 'rule-body');
    for (const p of sec.body) {
      const d = el('p');
      d.innerHTML = p;
      bd.append(d);
    }
    det.append(bd);
    if (secId === sec.id) det.open = true;
    box.append(det);
  }
  modal.append(box);
  modal.classList.remove('hidden');
  if (secId) {
    const target = $('#' + secId);
    if (target) setTimeout(() => target.scrollIntoView({ block: 'start' }), 30);
  }
  modal.onclick = e => { if (e.target === modal) modal.classList.add('hidden'); };
}

// ============================================================
// GALERIE DEBUG — tous les portraits × expressions, scènes, vignettes
// ============================================================

function allTakers() {
  const out = [];
  for (const m of MISSION_LIST) {
    const seen = new Set();
    const push = (t, where) => {
      if (t && !seen.has(t)) { seen.add(t); out.push({ mission: m.title, where, taker: t }); }
    };
    push(m.taker, 'acte I');
    for (const a of m.acts || []) {
      if (a.taker && a.taker.ifFlag) { push(a.taker.then, `${a.id} (si ${a.taker.ifFlag})`); push(a.taker.else, a.id); }
      else push(a.taker, a.id);
    }
  }
  out.push({ mission: 'Négociateur', where: 'vous', taker: { name: 'Vous', portrait: PIX.PLAYER_PORTRAIT } });
  return out;
}

export function renderGallery() {
  const host = $('#gallery-body');
  host.innerHTML = '';
  host.append(el('h3', null, 'PORTRAITS — toutes expressions'));
  for (const { mission, where, taker } of allTakers()) {
    host.append(el('h4', null, `${taker.name} — ${mission} (${where})`));
    const row = el('div', 'gal-row');
    for (const expr of PIX.EXPRESSIONS) {
      const cell = el('div', 'gal-cell');
      const cv = PIX.spriteCanvas(PIX.portraitSprite(taker.portrait, expr), 3);
      cell.append(cv, el('div', 'gal-lbl', expr));
      row.append(cell);
    }
    host.append(row);
  }
  host.append(el('h3', null, 'SCÈNES'));
  for (const name of PIX.SCENE_NAMES) {
    host.append(el('h4', null, name));
    const cv = PIX.spriteCanvas(PIX.sceneSprite(name, 1, 6), 2);
    cv.className = 'gal-scene';
    host.append(cv);
  }
  host.append(el('h3', null, 'VIGNETTES'));
  const vrow = el('div', 'gal-row wrap');
  for (const kind of PIX.VIGNETTE_NAMES) {
    const cell = el('div', 'gal-cell');
    const cv = PIX.spriteCanvas(PIX.vignetteSprite(kind, 0), 2);
    cell.append(cv, el('div', 'gal-lbl', kind));
    vrow.append(cell);
  }
  host.append(vrow);
}
