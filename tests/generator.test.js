// Tests : missions générées « Opérations spéciales » — déterminisme,
// validité des références, invariant de partie complète (300 seeds).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.js';
import { generateMission } from '../js/data/generator.js';
import { getMission } from '../js/data/missions/index.js';
import { getCard, MARKET_CARDS } from '../js/data/cards.js';
import { TERROR_GENERIC } from '../js/data/terror.js';
import * as PIX from '../js/pixel.js';
import { botPlay } from '../tools/simulate.js';

const SEEDS = [];
for (let i = 0; i < 300; i++) SEEDS.push(1 + i * 37);

function validateMission(m) {
  assert.ok(m.id.startsWith('gen:'), m.id);
  assert.equal(m.type, 'classic');
  assert.ok(m.title && m.subtitle);
  assert.ok(m.startThreat >= 3 && m.startThreat <= 5, 'startThreat');
  assert.ok(m.hostages >= 4 && m.hostages <= 6, 'hostages');
  assert.equal(m.hostageList.length, m.hostages, 'hostageList');
  const vuln = m.hostageList.filter(h => h.trait === 'vulnerable');
  assert.equal(vuln.length, 1, 'exactement un vulnerable');
  assert.ok(m.hostageList.filter(h => h.trait === 'heros').length <= 1, '≤ 1 heros');
  assert.equal(m.terrorDeck.length, 12, 'terrorDeck 12');
  for (const t of m.terrorDeck) assert.ok(TERROR_GENERIC[t], `Terreur inconnue ${t}`);
  for (const cid of m.market) assert.ok(MARKET_CARDS[cid], `carte marché inconnue ${cid}`);
  assert.ok(m.demands.length >= 2 && m.demands.length <= 3, '2-3 demandes');
  assert.ok(m.demands.some(d => d.major), '≥ 1 demande majeure');
  assert.equal(m.clues.length, 5, '5 indices');
  const clueIds = new Set(m.clues.map(c => c.id));
  for (const q of m.questions) for (const r of q.replies) {
    if (r.effects && r.effects.ifClue) assert.ok(clueIds.has(r.effects.ifClue.id), `indice de question absent : ${r.effects.ifClue.id}`);
    assert.ok(r.tag && r.answer && r.label, 'réponse complète');
  }
  assert.equal(m.questions.length, 2, '2 questions');
  for (const k of ['surrender', 'liberation', 'assault', 'escape', 'defeat']) {
    assert.ok(m.epilogues[k] && m.epilogues[k].length > 30, `épilogue ${k}`);
  }
  assert.ok(m.taker && m.taker.name && m.taker.dossier.length >= 2, 'taker');
  assert.ok(['pharmacie', 'banque', 'hopital'].includes(m.scene), `scène ${m.scene}`);
  assert.ok(Array.isArray(m.briefing) && m.briefing.length >= 4, 'briefing');
  const spr = PIX.portraitSprite(m.taker.portrait, 'calme');
  assert.ok(PIX.validateSprite(spr), 'portrait valide');
}

// ---------- déterminisme ----------
test('même seed → mission profondément identique', () => {
  for (const s of [1, 7, 42, 12345]) {
    assert.deepEqual(generateMission(s), generateMission(s));
  }
});

test('seeds différents → missions qui varient', () => {
  const sigs = new Set();
  for (let i = 0; i < 40; i++) sigs.add(JSON.stringify(generateMission(i + 1)));
  assert.ok(sigs.size > 30, `seulement ${sigs.size} signatures distinctes`);
});

test('getMission(gen:<seed>) résout et mémoïse', () => {
  const a = getMission('gen:555');
  const b = getMission('gen:555');
  assert.ok(a && a.id === 'gen:555');
  assert.equal(a, b); // mémoïsé : même objet (sauvegarde/reprise cohérente)
  assert.equal(getMission('gen:abc'), null);
  assert.equal(getMission('inconnu'), null);
});

// ---------- validation 300 seeds ----------
test('300 seeds : mission valide', () => {
  for (const s of SEEDS) validateMission(generateMission(s));
});

test('300 seeds : partie complète sans exception, invariants', () => {
  for (const s of SEEDS) {
    const g = E.createGame({ missionId: `gen:${s}`, seed: s * 31 + 7 });
    botPlay(g);
    assert.ok(g.result, `gen:${s} : partie non terminée`);
    const list = E.ensureHostageList(g);
    assert.equal(list.filter(h => h.status === 'freed').length, g.hostages.freed, `gen:${s}`);
    assert.equal(list.filter(h => h.status === 'dead').length, g.hostages.killed, `gen:${s}`);
    assert.equal(list.filter(h => h.status === 'held').length, g.hostages.remaining, `gen:${s}`);
  }
});

test('pas de cinématique pour les missions générées', async () => {
  const { getIntro } = await import('../js/data/cutscenes.js');
  assert.equal(getIntro('gen:42'), null);
});
