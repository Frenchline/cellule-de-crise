// Tests : cinématiques (données, arts pixelcut, déclencheurs) + tensionLevel
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CUTSCENES, getIntro, pickCutscene } from '../js/data/cutscenes.js';
import { cutSprite, CUT_ARTS } from '../js/pixelcut.js';
import { validateSprite } from '../js/pixel.js';
import { tensionLevel } from '../js/audio.js';
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

// ---------- seules les 3 missions classiques ont des cinématiques ----------
test('seules tutoriel/braquage/hopital ont des cinématiques', () => {
  assert.deepEqual(Object.keys(CUTSCENES).sort(), ['braquage', 'hopital', 'tutoriel']);
  assert.ok(getIntro('tutoriel'));
  assert.equal(getIntro('ferry'), null);
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

// ---------- tensionLevel ----------
test('tensionLevel : mapping menace → piste, brouillard → tendu', () => {
  assert.equal(tensionLevel(1, false), 'calme');
  assert.equal(tensionLevel(2, false), 'calme');
  assert.equal(tensionLevel(3, false), 'tendu');
  assert.equal(tensionLevel(4, false), 'tendu');
  assert.equal(tensionLevel(5, false), 'danger');
  assert.equal(tensionLevel(6, false), 'danger');
  assert.equal(tensionLevel(7, false), 'panique');
  assert.equal(tensionLevel(7, true), 'tendu');
  assert.equal(tensionLevel(1, true), 'tendu');
});
