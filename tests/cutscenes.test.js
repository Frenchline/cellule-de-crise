// Tests : cinématiques (données, arts pixelcut, déclencheurs)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CUTSCENES, getIntro, pickCutscene } from '../js/data/cutscenes.js';
import { cutSprite, CUT_ARTS } from '../js/pixelcut.js';
import { validateSprite } from '../js/pixel.js';
import { createGame } from '../js/engine.js';

// ---------- cohérence données ↔ arts ----------
test('chaque art référencé existe dans CUT_ARTS', () => {
  const used = new Set();
  for (const m of Object.values(CUTSCENES)) {
    for (const p of m.intro || []) used.add(p.art);
    for (const c of m.mid || []) for (const p of c.panels) used.add(p.art);
  }
  for (const id of used) assert.ok(CUT_ARTS.includes(id), `art manquant : ${id}`);
});

test('tous les arts rendent 160×120 et passent validateSprite (frames 0..3)', () => {
  for (const id of CUT_ARTS) {
    for (let f = 0; f < 4; f++) {
      const s = cutSprite(id, f);
      assert.equal(s.w, 160, `${id} f${f} largeur`);
      assert.equal(s.h, 120, `${id} f${f} hauteur`);
      assert.ok(validateSprite(s), `${id} f${f} invalide`);
    }
  }
});

test('frame 0 et frame 3 diffèrent pour chaque art (au moins un élément animé)', () => {
  for (const id of CUT_ARTS) {
    const a = cutSprite(id, 0).rows.join('\n');
    const b = cutSprite(id, 3).rows.join('\n');
    assert.notEqual(a, b, `${id} n'est pas animé`);
  }
});

// ---------- les 6 missions écrites ont des cinématiques ----------
test('les 6 missions écrites ont une intro (3 panneaux) et des mids', () => {
  assert.deepEqual(Object.keys(CUTSCENES).sort(),
    ['braquage', 'ferry', 'hopital', 'prison', 'secte', 'tutoriel']);
  for (const id of Object.keys(CUTSCENES)) {
    const def = CUTSCENES[id];
    assert.equal(def.intro.length, 3, `intro ${id}`);
    assert.ok(def.mid.length >= 3, `mid ${id}`);
  }
  assert.equal(getIntro('gen:42'), null);
});

// ---------- pickCutscene ----------
function mkGame(missionId, patch = {}) {
  const g = createGame({ missionId, seed: 42 });
  Object.assign(g, patch);
  return g;
}

test('pickCutscene : déclencheur tour au bon tour, une seule fois', () => {
  const g = mkGame('hopital', { turn: 2, threat: 2 });
  const seen = [];
  assert.equal(pickCutscene(g, seen), null);          // turn 2 < 3
  g.turn = 3;
  assert.equal(pickCutscene(g, seen)?.key, 'alarme');
  seen.push('alarme');
  assert.equal(pickCutscene(g, seen), null);          // une fois seulement (helene: turn 6, menace: threat 5)
});

test('pickCutscene : threatGte ignoré sous brouillard', () => {
  const g = mkGame('braquage', { threat: 6, options: { brouillard: true } });
  const seen = [];
  assert.equal(pickCutscene(g, seen), null);          // 'tireur' masqué par le brouillard
  g.options.brouillard = false;
  assert.equal(pickCutscene(g, seen)?.key, 'tireur');
});

test('pickCutscene : null si résultat ou phase choice', () => {
  const g = mkGame('braquage', { threat: 6 });
  g.result = { outcome: 'surrender' };
  assert.equal(pickCutscene(g, []), null);
  g.result = null;
  g.phase = 'choice';
  assert.equal(pickCutscene(g, []), null);
});

test('pickCutscene : déclencheurs freed et death', () => {
  const g = mkGame('tutoriel', { turn: 1, threat: 2 });
  g.hostages.freed = 1;
  assert.equal(pickCutscene(g, [])?.key, 'libere');
  const g2 = mkGame('braquage', { turn: 1, threat: 2, pressure: 0 });
  g2.hostages.killed = 1;
  assert.equal(pickCutscene(g2, [])?.key, 'mort');
});

test('pickCutscene : pressureGte', () => {
  const g = mkGame('braquage', { turn: 1, threat: 2, pressure: 6 });
  assert.equal(pickCutscene(g, [])?.key, 'media');
});

// ---------- triggers avancés : counterGte / act / actTurn ----------
test('pickCutscene : counterGte lit les compteurs du scénario', () => {
  const g = mkGame('secte', { turn: 2 });
  g.counters.rituel.value = 2;
  assert.equal(pickCutscene(g, []), null);            // seuil 3 non atteint
  g.counters.rituel.value = 3;
  assert.equal(pickCutscene(g, [])?.key, 'rituel');
  const gp = mkGame('prison', { turn: 2 });
  gp.counters.emeute.value = 4;
  assert.equal(pickCutscene(gp, [])?.key, 'toit');
  const gf = mkGame('ferry', { turn: 2 });
  gf.counters.explosifs.value = 2;
  assert.equal(pickCutscene(gf, [])?.key, 'explosifs');
});

test('pickCutscene : act + actTurn (premier tour de l\'acte)', () => {
  const g = mkGame('secte', { turn: 12 });
  g.counters.rituel.value = 3; // 'rituel' primerait : on l'écarte
  const seen = ['rituel'];
  g.act = 1; g.actStartTurn = 12;
  assert.equal(pickCutscene(g, seen)?.key, 'aube');      // act 1, actTurn 1
  g.turn = 13;
  assert.notEqual(pickCutscene(g, seen)?.key, 'aube');   // plus le 1er tour
  // acte 3 de prison : fumée au premier tour de l'acte
  const gp = mkGame('prison', { turn: 20 });
  gp.act = 2; gp.actStartTurn = 20;
  assert.equal(pickCutscene(gp, [])?.key, 'fumee');
  gp.act = 1;
  assert.notEqual(pickCutscene(gp, [])?.key, 'fumee');   // mauvais acte
});

test('pickCutscene : conditions ET combinées (act + actTurn)', () => {
  const g = mkGame('ferry', { turn: 15 });
  g.act = 1; g.actStartTurn = 10;      // bon acte, mauvais tour d'acte
  assert.notEqual(pickCutscene(g, [])?.key, 'houle');
  g.act = 2; g.actStartTurn = 15;      // mauvais acte, bon actTurn
  assert.notEqual(pickCutscene(g, [])?.key, 'houle');
});


