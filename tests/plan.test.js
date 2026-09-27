// Tests : plan tactique — postes de tireur, axes d'assaut, planKnown,
// sprites pixelplan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.js';
import { PLANS, getPlan, sceneBase } from '../js/data/plans.js';
import { planSprite, PLAN_BASES } from '../js/pixelplan.js';
import { validateSprite } from '../js/pixel.js';
import { MISSION_LIST } from '../js/data/missions/index.js';

const make = (over = {}) => E.createGame({ missionId: 'braquage', seed: 42, ...over });
const teamPhase = s => { s.phase = 'team'; return s; };

test('chaque plan : 2 postes + 3 entrées, posts[0] = comportement historique', () => {
  for (const base of PLAN_BASES) {
    const p = PLANS[base];
    assert.equal(p.posts.length, 2, base);
    assert.equal(p.entries.length, 3, base);
    assert.deepEqual({ prep: p.posts[0].prep, detectAt: p.posts[0].detectAt }, { prep: 1, detectAt: 5 }, base);
    assert.deepEqual({ prep: p.posts[1].prep, detectAt: p.posts[1].detectAt }, { prep: 2, detectAt: 4 }, base);
    assert.equal(p.entries[0].riskMod, 0, base);
    assert.equal(p.entries[1].needsPlan, true, base);
    assert.equal(p.entries[2].escapeOn.length, 2, base);
  }
});

test('getPlan résout la base de scène (variantes d\'acte incluses)', () => {
  assert.equal(sceneBase('pharmacie'), 'pharmacie');
  assert.equal(sceneBase('ferry_mer'), 'ferry');
  assert.equal(sceneBase('prison_feu'), 'prison');
  assert.equal(sceneBase('ferme_aube'), 'ferme');
  for (const m of MISSION_LIST) {
    const s = E.createGame({ missionId: m.id, seed: 1 });
    assert.ok(getPlan(s).posts.length === 2, m.id);
  }
});

test('sniper : poste par défaut = ancien comportement (prep +1, repéré à 5)', () => {
  const s = teamPhase(make());
  E.doTeamAction(s, 'sniper');
  assert.equal(s.prep, 1);
  assert.equal(s.sniperPost, 'toit');
  assert.equal(s.threat, 4); // inchangé
});

test('sniper : poste exposé donne +2 (cap 3), repéré dès menace 4', () => {
  const s = teamPhase(make());
  s.threat = 4;
  E.doTeamAction(s, 'sniper', 'lucarne');
  assert.equal(s.prep, 2);
  assert.equal(s.sniperPost, 'lucarne');
  assert.equal(s.threat, 5); // repéré à 4 → menace +1
});

test('intel : pose planKnown une seule fois', () => {
  const s = teamPhase(make());
  assert.equal(s.planKnown, false);
  E.doTeamAction(s, 'intel');
  assert.equal(s.planKnown, true);
  const line = s.log.find(e => e.text.includes('plan des lieux'));
  assert.ok(line, 'ligne « plan des lieux » absente');
});

test('assaut : entrée discrète refusée sans plan, acceptée avec', () => {
  const s = teamPhase(make());
  const r = E.doTeamAction(s, 'assault', 'conduits');
  assert.equal(r.ok, false);
  assert.match(r.reason, /plan/);
  assert.equal(s.result, null); // pas de partie terminée sur un refus
  const s2 = teamPhase(make());
  E.doTeamAction(s2, 'intel'); // consomme l'action du tour
  s2.teamActionsLeft = 1;      // action bonus pour le test
  s2.prep = 3;
  const r2 = E.doTeamAction(s2, 'assault', 'conduits');
  assert.equal(r2.ok, true);
  assert.ok(s2.result, 'l\'assaut doit terminer la partie');
});

test('assaultOdds : risque plancher 1, entrée discrète −1, attendus cohérents', () => {
  const s = make();
  s.prep = 3;
  const o1 = E.assaultOdds(s, 'porte');
  assert.equal(o1.risk, 1); // max(1, 3-3)=1, entrée +0
  const o2 = E.assaultOdds(s, 'conduits');
  assert.equal(o2.risk, 1); // plancher 1 (1-1→0→1)
  s.prep = 0;
  const o3 = E.assaultOdds(s, 'mur');
  assert.equal(o3.risk, 2); // max(1, 3-0) = 3, effraction −1 → 2
  assert.equal(o3.perHostageDeath, o3.risk / 6);
  assert.equal(o3.expectedDeaths, o3.perHostageDeath * s.hostages.remaining);
});

test('assaut : le journal nomme l\'axe d\'entrée', () => {
  const s = teamPhase(make());
  s.prep = 3;
  E.doTeamAction(s, 'assault', 'porte');
  const line = s.log.find(e => e.text.includes('ASSAUT'));
  assert.ok(line.text.includes('Entrée principale'), line.text);
});

test('planSprite : valide pour les 6 bases, distinctes, animées', () => {
  const sprites = PLAN_BASES.map(b => planSprite(b, { held: 5, planKnown: true, sniperPost: null }, 0));
  for (const s of sprites) {
    assert.equal(s.w, 160);
    assert.equal(s.h, 96);
    assert.deepEqual(validateSprite(s), []);
  }
  const uniques = new Set(sprites.map(s => s.rows.join()));
  assert.equal(uniques.size, PLAN_BASES.length);
  // frame animée (preneur clignotant) + planKnown change le rendu
  const a = planSprite('banque', { held: 5, planKnown: false }, 0);
  const b = planSprite('banque', { held: 5, planKnown: true }, 0);
  const c = planSprite('banque', { held: 5, planKnown: true }, 1);
  assert.notEqual(a.rows.join(), b.rows.join());
  assert.notEqual(b.rows.join(), c.rows.join());
});
