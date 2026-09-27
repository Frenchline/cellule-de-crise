// Tests : réputation (deltas, modificateurs, seuils moteur)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.js';
import { REP_DEFAULT, repDeltas, repModifiers, repReport, repLine } from '../js/reputation.js';
import { getCard, MARKET_CARDS } from '../js/data/cards.js';

// état minimal pour repDeltas
const mkState = (over = {}) => ({
  pressure: 4,
  hostages: { killed: 0 },
  flags: { majorConcessions: 0 },
  turn: 8,
  result: { outcome: 'surrender' },
  ...over,
});

// ---------- repDeltas ----------
test('reddition propre, presse basse : presse +2, hiérarchie +1', () => {
  const d = repDeltas('surrender', mkState());
  assert.equal(d.presse, 2);            // +1 pression ≤5, +1 reddition
  assert.equal(d.hierarchie, 1);
});

test('libération sans mort : hiérarchie +1 ; avec morts : rien', () => {
  assert.equal(repDeltas('liberation', mkState()).hierarchie, 1);
  assert.equal(repDeltas('liberation', mkState({ hostages: { killed: 2 } })).hierarchie, 0);
});

test('concessions majeures : presse −1, hiérarchie −1 chacune (plafond −2)', () => {
  const s = mkState({ flags: { majorConcessions: 3 } });
  const d = repDeltas('surrender', s);
  assert.equal(d.presse, 1);            // +1 pression +1 reddition −1 majeure
  assert.equal(d.hierarchie, -1);       // +1 reddition −2 (plafond)
});

test('pression haute + morts : presse chute fortement mais bornée à −2', () => {
  const d = repDeltas('assault', mkState({
    pressure: 9, hostages: { killed: 3 },
    flags: { majorConcessions: 1 },
  }));
  assert.equal(d.presse, -2);           // −1 presse 8+, −1 majeure, −1 morts → borné
});

test('défaite : hiérarchie −2 ; fuite : −1', () => {
  assert.equal(repDeltas('defeat', mkState()).hierarchie, -2);
  assert.equal(repDeltas('escape', mkState()).hierarchie, -1);
});

test('assaut volontaire sans mort : hiérarchie +1 ; forcé : 0', () => {
  assert.equal(repDeltas('assault', mkState({ flags: { assaultKind: 'volontaire' } })).hierarchie, 1);
  assert.equal(repDeltas('assault', mkState({ flags: { assaultKind: 'forcé' } })).hierarchie, 0);
  assert.equal(repDeltas('assault', mkState({
    hostages: { killed: 1 }, flags: { assaultKind: 'volontaire' },
  })).hierarchie, 0);
});

// ---------- repModifiers ----------
test('rep 5/5 : aucun modificateur', () => {
  const m = repModifiers(REP_DEFAULT);
  assert.equal(m.mediaGrace, 0);
  assert.equal(m.pressureStart, 0);
  assert.equal(m.prepBonus, 0);
  assert.equal(m.assaultAt, 10);
  assert.equal(m.contexts.length, 0);
});

test('rep extrêmes : modificateurs et contextes', () => {
  const hi = repModifiers({ presse: 9, hierarchie: 8 });
  assert.equal(hi.mediaGrace, 2);
  assert.equal(hi.prepBonus, 1);
  assert.equal(hi.contexts.length, 2);
  const lo = repModifiers({ presse: 1, hierarchie: 2 });
  assert.equal(lo.pressureStart, 2);
  assert.equal(lo.assaultAt, 9);
  assert.equal(lo.contexts.length, 2);
});

// ---------- createGame : application des modificateurs ----------
test('createGame rep presse ≤ 2 : pression de départ 2 ; hiérarchie ≥ 8 : prep +1 ; ≤ 2 : assaultAt 9', () => {
  const g1 = E.createGame({ missionId: 'braquage', seed: 7, rep: { presse: 1, hierarchie: 9 } });
  assert.equal(g1.pressure, 2);
  assert.equal(g1.prep, 1);
  assert.equal(g1.assaultAt, 10);
  const g2 = E.createGame({ missionId: 'braquage', seed: 7, rep: { presse: 5, hierarchie: 1 } });
  assert.equal(g2.assaultAt, 9);
  assert.equal(g2.prep, 0);
});

// joue des tours complets avec le même choix déterministe pour deux états
function runTurns(s, n) {
  const target = s.turn + n;
  let guard = 0;
  while (!s.result && s.turn < target && guard++ < 500) {
    if (s.pendingChoice) E.chooseOption(s, 0);
    else if (s.phase === 'conversation') {
      const cid = s.hand.find(id => E.canPlayCard(s, id).ok);
      if (cid) E.playCard(s, cid, null); else E.endPhase(s);
    } else E.endPhase(s);
  }
}

test('rep presse ≥ 8 : mediaGrace saute les ticks de presse, pas les autres', () => {
  const g = E.createGame({ missionId: 'braquage', seed: 7, rep: { presse: 9 } });
  const ref = E.createGame({ missionId: 'braquage', seed: 7 });
  assert.equal(g.flags.mediaGrace, 2);
  runTurns(g, 1); runTurns(ref, 1);
  // même seed → mêmes tirages ; seule la grâce diffère : exactement 1 tick sauté
  assert.equal(g.flags.mediaGrace, 1);
  assert.equal(ref.pressure - g.pressure, 1);
});

test('assaultAt 9 : failRisk détecte l\'assaut forcé plus tôt', () => {
  const g = E.createGame({ missionId: 'braquage', seed: 7, rep: { hierarchie: 1 } });
  g.pressure = 8;
  // une carte dont l'échec donne pression +1 : atteint 9 → 'assault'
  const cid = Object.keys(MARKET_CARDS).find(id => {
    const c = getCard(id);
    return c && !c.auto && c.effects && c.effects[0] && c.effects[0].pressure > 0;
  });
  const c = getCard(cid);
  assert.equal(E.failRisk(g, c), 'assault');
  const g10 = E.createGame({ missionId: 'braquage', seed: 7 });
  g10.pressure = 8;
  assert.notEqual(E.failRisk(g10, c), 'assault');
});

test('assaultAt 9 : l\'assaut forcé se déclenche à pression 9', () => {
  const g = E.createGame({ missionId: 'braquage', seed: 7, rep: { hierarchie: 1 } });
  g.pressure = 8;
  // fin de tour déterministe : « Accalmie » n'a ni jet ni effet de pression —
  // le tick médiatique mène à 9 ≥ assaultAt → ordre d'assaut
  g.phase = 'team';
  g.terrorDeck = ['accalmie'];
  E.endPhase(g);
  assert.equal(g.pressure, 9);
  assert.equal(g.flags.forcedAssault, true);
});

// ---------- repReport / lignes ----------
test('repReport : bornes 0–10, flèches et lignes cohérentes', () => {
  const before = { presse: 10, hierarchie: 0 };
  const d = { presse: 2, hierarchie: -2 };
  const r = repReport(before, d, mkState());
  assert.equal(r.presse.after, 10);     // borné
  assert.equal(r.hierarchie.after, 0);  // borné
  assert.ok(r.presse.line && r.hierarchie.line && r.psy.line);
  assert.equal(repLine('presse', 1, 0), repLine('presse', 1, 0)); // déterministe
});
