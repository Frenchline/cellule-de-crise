// ============================================================
// Simulation : bot heuristique — N parties par mission.
// Usage : node tools/simulate.js [nbParties]
// ============================================================

import * as E from '../js/engine.js';
import { getCard } from '../js/data/cards.js';
import { MISSION_LIST } from '../js/data/missions/index.js';

const N = parseInt(process.argv[2] || '2000', 10);

// Choisit l'option de dilemme la moins dangereuse (bot pacifiste)
function pickChoice(state, ch) {
  let best = 0, bestScore = Infinity;
  ch.options.forEach((o, i) => {
    const fx = o.effects || {};
    let s = 0;
    if (fx.assault) s += 100;
    if (fx.lose) s += 100;
    if (fx.kill) s += 50;
    for (const [cid, d] of Object.entries(fx.counter || {})) {
      const c = state.counters[cid];
      if (d > 0 && c) s += 20 * (c.value + d >= c.max ? 2 : 1);
    }
    if (fx.pressure) s += 2 * fx.pressure;
    if (fx.threat) s += fx.threat;
    if (s < bestScore) { bestScore = s; best = i; }
  });
  return best;
}

// Bot : joue selon des priorités simples (pacifiste, gestion de la menace d'abord)
export function botPlay(state) {
  const mission = E.getMissionDef(state);
  const CALM = ['famille', 'souffrance', 'humour', 'mediateur', 'verite_brutale', 'nourriture',
    'appel_proche', 'promesse', 'dernier_souffle', 'monde_avant', 'evac_medicale',
    'passerelle', 'appel_avocat', 'solidarite_detenus', 'silence_tactique', 'bluff_assaut'];
  const WANTED = ['nourriture', 'souffrance', 'famille', 'echange', 'humour', 'mediateur',
    'dossier_psy', 'verite_brutale', 'appel_proche', 'promesse', 'mentir_delais',
    'passerelle', 'monde_avant', 'dernier_souffle', 'evac_medicale', 'appel_avocat',
    'solidarite_detenus', 'silence_tactique', 'bluff_assaut'];
  const singles = () => state.hand.filter(id => !getCard(id).reusable && E.canPlayCard(state, id).ok);
  const calmables = () => singles().filter(id => CALM.includes(id));
  let guard = 0;
  while (guard++ < 400 && !state.result) {
    if (state.phase === 'choice') {
      E.chooseOption(state, pickChoice(state, E.getChoice(state)));
      continue;
    }
    if (state.phase === 'conversation') {
      // 1) reddition si possible
      if (E.canPlayCard(state, 'proposer_reddition').ok) {
        E.playCard(state, 'proposer_reddition');
        continue;
      }
      // 2) menace haute → tout ce qui calme, en priorité Rassurer
      if (state.threat >= 5) {
        if (E.canPlayCard(state, 'rassurer').ok) { E.playCard(state, 'rassurer'); continue; }
        const calm = calmables();
        if (calm.length) { E.playCard(state, calm[0], null); continue; }
      }
      // 3) neutraliser la demande majeure en attente — jamais au-dessus de menace 3
      //    (un échec coûte +2 : jouer à menace 4+ risque le point de rupture)
      const pend = state.demands.filter(d => d.status === 'pending');
      if (pend.length && E.canPlayCard(state, 'negocier_demande').ok && state.pc >= 2 && state.threat <= 3) {
        const major = pend.find(d => E.getDemandDef(state, d.id).major) || pend[0];
        E.playCard(state, 'negocier_demande', major.id);
        continue;
      }
      // 4) cartes achetées utiles
      const calm = calmables();
      if (calm.length && state.threat >= 3) { E.playCard(state, calm[0], null); continue; }
      // 5) demander un otage (même discipline : échec = menace +2)
      if (state.threat <= 3 && E.canPlayCard(state, 'demander_otage').ok && state.pc >= 2) {
        E.playCard(state, 'demander_otage');
        continue;
      }
      if (singles().includes('echange') && state.pc >= 3) { E.playCard(state, 'echange'); continue; }
      // 6) pression haute → gagner du temps
      if (state.pressure >= 7 && E.canPlayCard(state, 'gagner_temps').ok) {
        E.playCard(state, 'gagner_temps');
        continue;
      }
      // 7) base restante
      if (E.canPlayCard(state, 'rassurer').ok && state.threat >= 3) { E.playCard(state, 'rassurer'); continue; }
      if (E.canPlayCard(state, 'fermete').ok && state.threat <= 3) { E.playCard(state, 'fermete'); continue; }
      if (E.canPlayCard(state, 'gagner_temps').ok) { E.playCard(state, 'gagner_temps'); continue; }
      if (E.canPlayCard(state, 'ecoute_active').ok) { E.playCard(state, 'ecoute_active'); continue; }
      E.endPhase(state);
      continue;
    }
    if (state.phase === 'market') {
      let bought = false;
      for (let i = 0; i < 3; i++) {
        const cid = state.market[i];
        if (cid && WANTED.includes(cid) && E.canBuy(state, i).ok) {
          E.buyCard(state, i);
          bought = true;
          break;
        }
      }
      if (!bought) E.endPhase(state);
      continue;
    }
    if (state.phase === 'team') {
      if (E.teamActionsLeft(state) > 0) {
        // actions de scénario (démineurs…) si un compteur approche son max
        let didExtra = false;
        for (const a of (mission.extraTeamActions || [])) {
          const cIds = Object.keys(a.effects.counter || {});
          const hot = cIds.some(id => state.counters[id] && state.counters[id].value >= state.counters[id].max - 1);
          if (hot && state.pressure + (a.effects.pressure || 0) <= 9) {
            E.doTeamAction(state, a.id);
            didExtra = true;
            break;
          }
        }
        if (didExtra) continue;
        // concéder une demande dont la concession refroidit un compteur chaud ou la pression
        const hot = Object.values(state.counters || {}).find(c => c.value >= c.max - 1);
        const cooler = state.demands.find(d => {
          if (d.status !== 'pending') return false;
          const eff = E.getDemandDef(state, d.id).concede.effects;
          if (state.pressure + (eff.pressure || 0) > 9) return false;
          return (hot && eff.counter && Object.entries(eff.counter).some(([cid, dv]) => dv < 0 && state.counters[cid] === hot))
            || (eff.pressure < 0 && state.pressure >= 6);
        });
        if (cooler) { E.doTeamAction(state, 'concede', cooler.id); continue; }
        // concéder la majeure si pression supportable (la concession coûte ~+2)
        const pend = state.demands.filter(d => d.status === 'pending');
        const major = pend.find(d => E.getDemandDef(state, d.id).major);
        const mEff = major ? E.getDemandDef(state, major.id).concede.effects : {};
        if (major && state.pressure + (mEff.pressure || 0) <= 9 && (state.threat >= 4 || !E.majorDemandResolved(state))) {
          E.doTeamAction(state, 'concede', major.id);
          continue;
        }
        // ravitaillement : compteur chaud (effet de scénario) ou menace haute — attention à la pression
        if (hot && state.pressure <= 7) { E.doTeamAction(state, 'supply'); continue; }
        if (state.threat >= 5 && state.pressure <= 5) { E.doTeamAction(state, 'supply'); continue; }
        // tireur si calme
        if (state.prep < 3 && state.threat < 4) { E.doTeamAction(state, 'sniper'); continue; }
        // renseignement si pression basse
        if (state.clues.some(c => !c.revealed) && state.pressure <= 5) { E.doTeamAction(state, 'intel'); continue; }
      }
      E.endPhase(state);
      continue;
    }
    break;
  }
}

function simulate(missionId, n) {
  const out = { surrender: 0, liberation: 0, assault: 0, escape: 0, defeat: 0 };
  let savedSum = 0, turnsSum = 0, killedSum = 0;
  for (let i = 0; i < n; i++) {
    const s = E.createGame({ missionId, seed: (i * 2654435761) | 0 });
    botPlay(s);
    if (!s.result) { out.defeat++; continue; }
    out[s.result.outcome]++;
    savedSum += s.hostages.total - s.hostages.killed;
    killedSum += s.hostages.killed;
    turnsSum += s.turn;
  }
  return { out, avgSaved: savedSum / n, avgKilled: killedSum / n, avgTurns: turnsSum / n };
}

const isMain = process.argv[1] && process.argv[1].endsWith('simulate.js');
if (isMain) {
console.log(`Simulation : ${N} parties par mission (sans options, sans compétences)\n`);
for (const m of MISSION_LIST) {
  const r = simulate(m.id, N);
  const pct = k => (100 * r.out[k] / N).toFixed(1) + '%';
  const noDefeat = 100 * (N - r.out.defeat) / N;
  const nonAssault = 100 * (r.out.surrender + r.out.liberation) / N;
  console.log(`■ ${m.title} (${m.id})`);
  console.log(`  reddition   ${pct('surrender')}`);
  console.log(`  libération  ${pct('liberation')}`);
  console.log(`  assaut      ${pct('assault')}`);
  console.log(`  fuite       ${pct('escape')}`);
  console.log(`  défaite     ${pct('defeat')}`);
  console.log(`  → sans défaite : ${noDefeat.toFixed(1)}%  |  victoire non-assaut : ${nonAssault.toFixed(1)}%`);
  console.log(`  otages sauvés moy. : ${r.avgSaved.toFixed(2)}/${m.hostages} · tués moy. : ${r.avgKilled.toFixed(2)} · tours moy. : ${r.avgTurns.toFixed(1)}\n`);
}
}
