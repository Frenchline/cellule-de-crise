// Tests : historique par tour (graphe DÉROULÉ) + moments clés + entrées turn du journal
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.js';
import { keyMoments } from '../js/ui.js';

// petit joueur déterministe (joue la première carte jouable, choix 0)
function play(s, maxSteps = 2000) {
  let steps = 0;
  while (!s.result && steps++ < maxSteps) {
    if (s.pendingChoice) { E.chooseOption(s, 0); continue; }
    if (s.phase === 'conversation') {
      const cid = s.hand.find(id => E.canPlayCard(s, id).ok);
      if (cid) E.playCard(s, cid, null); else E.endPhase(s);
    } else E.endPhase(s);
  }
  return s;
}

test('state.history : une entrée par tour + entrée finale, champs cohérents', () => {
  const g = play(E.createGame({ missionId: 'braquage', seed: 11 }));
  assert.ok(g.result, 'partie terminée');
  // entrées : tour 1 (createGame) + chaque startTurn + l'entrée finale endGame
  assert.ok(g.history.length >= g.result.turn, `history ${g.history.length} >= ${g.result.turn}`);
  assert.equal(g.history[0].turn, 1);
  for (const p of g.history) {
    assert.ok(p.threat >= 1 && p.threat <= 7, `threat ${p.threat}`);
    assert.ok(p.pressure >= 0 && p.pressure <= 10, `pressure ${p.pressure}`);
    assert.ok(p.held >= 0, `held ${p.held}`);
  }
  const last = g.history[g.history.length - 1];
  assert.equal(last.held, g.hostages.remaining);
  assert.equal(last.turn, g.result.turn);
});

test('les entrées de journal portent le tour', () => {
  const g = E.createGame({ missionId: 'braquage', seed: 3 });
  E.endPhase(g); E.endPhase(g); E.endPhase(g); // jusqu'à la terreur / nouveau tour
  for (const e of g.log) assert.ok(typeof e.turn === 'number', `entrée sans turn : ${e.k}`);
});

test('keyMoments : ordre chronologique, types attendus, priorité morts/libérations', () => {
  const log = [
    { k: 'terror', text: '◆ TERREUR — Coupure de courant', turn: 2 },
    { k: 'sys', text: '🚪 Nadia Ferrand (guichetière) est libérée. (5 restants)', turn: 3 },
    { k: 'clue', text: '📁 Indice révélé : « Fierté »', turn: 4 },
    { k: 'death', text: '✝ Paul Girard (client) est tué.', turn: 5 },
    { k: 'player', text: 'Reste calme, je t\'écoute.', turn: 6, data: { q: 'q1' } },
    { k: 'act', text: '═══ ACTE II — L\'Aube ═══', turn: 7 },
    { k: 'radio', text: 'Concession : « Des cigarettes ». Il souffle.', turn: 8 },
    { k: 'radio', text: '◆ ASSAUT — entrée « porte principale » — risque 2/6.', turn: 9 },
    { k: 'player', text: 'ligne normale hors question', turn: 9 },
  ];
  const ms = keyMoments(log);
  const kinds = ms.map(m => m.icon);
  for (const ic of ['◆', '🚪', '🔍', '✝', '❓', '§', '⚑', '⚔']) {
    assert.ok(kinds.includes(ic), `icône ${ic} manquante dans ${kinds}`);
  }
  assert.ok(!ms.some(m => m.label === 'ligne normale hors question'));
  // trié par tour
  for (let i = 1; i < ms.length; i++) assert.ok(ms[i].turn >= ms[i - 1].turn);
  // libellés propres
  assert.equal(ms.find(m => m.icon === '🔍').label, 'Fierté');
});

test('keyMoments : limite à 12 en privilégiant morts/libérations/assaut', () => {
  const log = [];
  for (let i = 1; i <= 15; i++) log.push({ k: 'terror', text: `◆ TERREUR — Carte ${i}`, turn: i });
  log.push({ k: 'death', text: '✝ Otage tué.', turn: 16 });
  const ms = keyMoments(log);
  assert.ok(ms.length <= 12);
  assert.ok(ms.some(m => m.icon === '✝'), 'la mort doit passer avant les terreurs');
});

test('history complet sur une mission avancée (transitions d\'actes)', () => {
  const g = play(E.createGame({ missionId: 'prison', seed: 5 }), 3000);
  assert.ok(g.result);
  assert.ok(g.history.length >= 3);
  // actStartTurn posé par la transition
  if (g.act > 0) assert.ok(g.actStartTurn > 1, `actStartTurn ${g.actStartTurn}`);
});
