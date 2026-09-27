// Tests UI / pixel-art : shortEffects + composition des sprites.
import test from 'node:test';
import assert from 'node:assert/strict';
import { shortEffects, cardTierLines } from '../js/ui.js';
import * as PIX from '../js/pixel.js';
import { MISSION_LIST } from '../js/data/missions/index.js';
import { createGame } from '../js/engine.js';

test('shortEffects — effets simples', () => {
  assert.equal(shortEffects({ threat: -2 }), 'menace −2');
  assert.equal(shortEffects({ threat: 1 }), 'menace +1');
  assert.equal(shortEffects({ pressure: -1 }), 'presse −1');
  assert.equal(shortEffects({ pc: 1 }), '+1 PC');
  assert.equal(shortEffects({ pc: -1 }), '−1 PC');
  assert.equal(shortEffects({ free: 1 }), '⛓ libère 1');
  assert.equal(shortEffects({ free: 2 }), '⛓ libère 2');
  assert.equal(shortEffects({ kill: 1 }), '✝ 1');
  assert.equal(shortEffects({ reveal: 1 }), 'indice');
  assert.equal(shortEffects({ prep: 1 }), 'prép. +1');
  assert.equal(shortEffects({ discardNextTerror: true }), 'Terreur annulée');
  assert.equal(shortEffects({ win: 'surrender' }), 'reddition');
  assert.equal(shortEffects({ neutralizeDemand: true }), 'demande abandonnée');
  assert.equal(shortEffects({}), '—');
  // combinaison
  assert.equal(shortEffects({ threat: -1, pressure: -1 }), 'menace −1 · presse −1');
});

test('shortEffects — compteurs avec icônes', () => {
  assert.equal(shortEffects({ counter: { rituel: -1 } }, { rituel: '🕯' }), '🕯 −1');
  assert.equal(shortEffects({ counter: { emeute: 2 } }, { emeute: '🔥' }), '🔥 +2');
  // sans icône fournie → id brut
  assert.equal(shortEffects({ counter: { explosifs: -1 } }), 'explosifs −1');
});

test('shortEffects — roll', () => {
  const s = shortEffects({ roll: { dice: 2, table: { 0: { kill: 1 }, 1: { threat: 1 } } } });
  assert.ok(s.startsWith('🎲2d'), s);
  assert.ok(s.includes('0·✝ 1'), s);
  assert.ok(s.includes('1+·menace +1'), s);
});

test('shortEffects — conditionnels', () => {
  const s = shortEffects({ ifThreatGte: { v: 5, then: { kill: 1 }, else: { threat: 1 } } });
  assert.ok(s.includes('menace≥5→✝ 1'), s);
  assert.ok(s.includes('sinon menace +1'), s);
  const s2 = shortEffects({ ifCounterGte: { id: 'rituel', v: 3, then: { choice: 'signe' }, else: { threat: 1 } } }, { rituel: '🕯' });
  assert.ok(s2.includes('🕯≥3→décision'), s2);
  const s3 = shortEffects({ ifFlag: { f: 'en_mer', then: { threat: 1, pressure: 1 }, else: { pressure: 1 } } });
  assert.ok(s3.includes('si en_mer→'), s3);
});

test('cardTierLines — carte à dés avec probabilités', () => {
  const g = createGame({ missionId: 'braquage', seed: 42 });
  const lines = cardTierLines({ effects: { 0: { threat: 1 }, 1: { threat: -1 }, 2: { threat: -2 } } }, g);
  assert.deepEqual(lines.map(l => l[0]), ['✗', '1', '2+']);
  // pool effectif : 1 dé (pas de champ dice → max(1, 0 + mod)) → 67/33/0 %
  assert.deepEqual(lines.map(l => l[1]), ['67%', '33%', '0%']);
  assert.equal(lines[0][2], 'menace +1');
  // carte auto
  const auto = cardTierLines({ auto: true, effects: { auto: { threat: -1 } } }, g);
  assert.deepEqual(auto, [['✓', null, 'menace −1']]);
});

// ---------------- portraits ----------------

function allTakerSpecs() {
  const specs = [];
  for (const m of MISSION_LIST) {
    const seen = new Set();
    const push = (t) => { if (t && t.portrait && !seen.has(t)) { seen.add(t); specs.push({ mission: m.id, name: t.name, spec: t.portrait }); } };
    push(m.taker);
    for (const a of m.acts || []) {
      if (a.taker && a.taker.ifFlag) { push(a.taker.then); push(a.taker.else); }
      else push(a.taker);
    }
  }
  return specs;
}

test('chaque interlocuteur a un portrait et les 5 expressions valides', () => {
  const specs = allTakerSpecs();
  // Thomas, Julien, Marc, Sabine, Élie, Keraudren, Sorel, Mira, Ansel = 9
  assert.equal(specs.length, 9);
  for (const { mission, name, spec } of specs) {
    for (const expr of PIX.EXPRESSIONS) {
      const spr = PIX.portraitSprite(spec, expr);
      const errs = PIX.validateSprite(spr);
      assert.deepEqual(errs, [], `${name} (${mission}) / ${expr} : ${errs.join('; ')}`);
      assert.equal(spr.w, 32);
      assert.equal(spr.h, 32);
    }
  }
});

test('portrait du négociateur valide pour toutes les expressions', () => {
  for (const expr of PIX.EXPRESSIONS) {
    assert.deepEqual(PIX.validateSprite(PIX.portraitSprite(PIX.PLAYER_PORTRAIT, expr)), []);
  }
});

test('portraits visuellement distincts entre interlocuteurs', () => {
  const rows = allTakerSpecs().map(({ spec }) => PIX.portraitSprite(spec, 'calme').rows.join(''));
  const uniq = new Set(rows);
  assert.equal(uniq.size, rows.length, 'deux portraits identiques');
});

test('scènes : dimensions cohérentes et palette définie', () => {
  for (const name of PIX.SCENE_NAMES) {
    for (const frame of [0, 1, 3]) {
      const spr = PIX.sceneSprite(name, frame, 12);
      assert.equal(spr.w, 224); assert.equal(spr.h, 64);
      assert.deepEqual(PIX.validateSprite(spr), [], `${name} frame ${frame}`);
    }
  }
});

test('vignettes : dimensions cohérentes et palette définie', () => {
  for (const kind of PIX.VIGNETTE_NAMES) {
    const spr = PIX.vignetteSprite(kind, 0);
    assert.equal(spr.w, 128); assert.equal(spr.h, 72);
    assert.deepEqual(PIX.validateSprite(spr), [], kind);
  }
});

test('animation : les scènes animées changent selon la frame', () => {
  // pharmacie (croix clignotante), hopital (ECG), ferme (neige), ferry (vagues)
  for (const name of ['pharmacie', 'hopital', 'ferme', 'ferry']) {
    const a = PIX.sceneSprite(name, 0, 0).rows.join('');
    const b = PIX.sceneSprite(name, 1, 0).rows.join('');
    assert.notEqual(a, b, `${name} : aucune différence entre frame 0 et 1`);
  }
});
