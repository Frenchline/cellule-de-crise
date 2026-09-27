// Tests : conseils de la psychologue (advice.js) + addAdvice (engine.js)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adviceFor } from '../js/advice.js';
import * as E from '../js/engine.js';

const mk = (over = {}) => E.createGame({ missionId: 'braquage', seed: 42, ...over });

test('priorité : rupture (menace ≥ 6) avant tout le reste', () => {
  const g = mk();
  g.threat = 6; g.pressure = 9;
  const a = adviceFor(g, {});
  assert.equal(a.key, 'rupture');
  assert.ok(a.text.includes('6/7'));
});

test('brouillard : la règle rupture ne doit pas fuiter la menace', () => {
  const g = mk({ options: { brouillard: true } });
  g.threat = 6; g.pressure = 9;
  const a = adviceFor(g, {});
  assert.equal(a.key, 'presse');      // rupture sauté → règle suivante
});

test('demande majeure en attente → conseil « demande »', () => {
  const g = mk();
  g.turn = 2;                          // évite la règle ouverture… priorité 3 < 7 de toute façon
  const a = adviceFor(g, {});
  assert.equal(a.key, 'demande');
  assert.ok(a.text.includes('Véhicule'));
});

test('fenêtre de répétition : 3 tours minimum', () => {
  const g = mk();
  g.threat = 6; g.turn = 7;
  const seen = { rupture: 5 };         // vu au tour 5 → 2 < 3 → sauté
  const a = adviceFor(g, seen);
  assert.notEqual(a.key, 'rupture');
  seen.rupture = 4;                    // vu au tour 4 → 3 ≥ 3 → de nouveau proposé
  const a2 = adviceFor(g, seen);
  assert.equal(a2.key, 'rupture');
});

test('indice révélé avec tagMods → conseil « trait_<id> »', () => {
  const g = mk();
  g.turn = 2;
  g.demands = [];                      // supprime la règle demande
  g.clues[0].revealed = true;          // révèle le 1er indice du braquage
  const a = adviceFor(g, {});
  assert.ok(a.key.startsWith('trait_'), a.key);
  assert.ok(/gagnent un dé|perdent un dé/.test(a.text));
});

test('pioche Terreur ≤ 3 → conseil « horloge »', () => {
  const g = mk();
  g.turn = 2; g.demands = []; g.clues.forEach(c => { c.revealed = true; });
  g.clues.forEach(c => { const d = E.getClueDef(g, c.id); if (d) d.trait = {}; });
  g.terrorDeck = g.terrorDeck.slice(0, 3);
  const a = adviceFor(g, {});
  assert.equal(a.key, 'horloge');
  assert.ok(a.text.includes('3'));
});

test('tour 1 seul → « ouverture » ; sinon null quand tout est couvert', () => {
  const g = mk();
  g.demands = []; g.clues = [];        // isole la règle (indices/traits exclus)
  const a = adviceFor(g, {});
  assert.equal(a.key, 'ouverture');
  // tout vu récemment → plus rien à dire
  const g2 = mk();
  const seen = { demande: g2.turn, ouverture: g2.turn, indices: g2.turn };
  for (const c of g2.clues) seen[`trait_${c.id}`] = g2.turn;
  g2.demands = [];
  assert.equal(adviceFor(g2, seen), null);
});

test('addAdvice : journalise « psy » et persiste adviceSeen', () => {
  const g = mk();
  const before = g.log.length;
  const adv = E.addAdvice(g);
  assert.ok(adv);
  assert.equal(g.log.length, before + 1);
  assert.equal(g.log[g.log.length - 1].k, 'psy');
  assert.equal(g.adviceSeen[adv.key], g.turn);
  // sérialisable
  const g2 = E.deserialize(JSON.parse(JSON.stringify(g)));
  assert.equal(g2.adviceSeen[adv.key], g.turn);
});

// ---------- probabilités de paliers ----------
test('tierOdds : n=1 → [2/3, 1/3], somme = 1', () => {
  const o = E.tierOdds(1, [0, 1]);
  assert.ok(Math.abs(o[0] - 2 / 3) < 1e-9);
  assert.ok(Math.abs(o[1] - 1 / 3) < 1e-9);
  const sum = Object.values(o).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
});

test('tierOdds : n=3, keys [0,1,2] → [8/27, 12/27, 7/27]', () => {
  const o = E.tierOdds(3, [0, 1, 2]);
  assert.ok(Math.abs(o[0] - 8 / 27) < 1e-9);
  assert.ok(Math.abs(o[1] - 12 / 27) < 1e-9);
  assert.ok(Math.abs(o[2] - 7 / 27) < 1e-9);
});

test('tierOdds : clé max = « k+ » (keys [0,1,3], n=4)', () => {
  const o = E.tierOdds(4, [0, 1, 3]);
  // P(S>=3) = 8/81 + 1/81 = 1/9
  assert.ok(Math.abs(o[3] - 1 / 9) < 1e-9);
  const sum = Object.values(o).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
});

test('cardOdds : pool réel, auto → null, riggedRolls → palier haut 100 %', () => {
  const g = E.createGame({ missionId: 'tutoriel', seed: 7 });
  assert.ok(g.flags.riggedRolls > 0);
  const card = { effects: { 0: { threat: 1 }, 1: { threat: -1 }, 2: { threat: -2 } }, dice: 3, tag: 'empathie' };
  const o = E.cardOdds(g, card);
  assert.equal(o[2], 1);
  assert.equal(o[0], 0);
  assert.equal(E.cardOdds(g, { auto: true, effects: { auto: {} } }), null);
});

test('failRisk : menace → 7 = « kill », presse → 10 = « assault »', () => {
  const g = mk();
  const cardKill = { effects: { 0: { threat: 1 }, 1: { threat: -1 } }, dice: 2 };
  const cardPress = { effects: { 0: { pressure: 1 }, 1: {} }, dice: 2 };
  g.threat = 6;
  assert.equal(E.failRisk(g, cardKill), 'kill');
  g.threat = 5;
  assert.equal(E.failRisk(g, cardKill), null);
  g.pressure = 9;
  assert.equal(E.failRisk(g, cardPress), 'assault');
  assert.equal(E.failRisk(g, { auto: true, effects: { auto: {} } }), null);
});
