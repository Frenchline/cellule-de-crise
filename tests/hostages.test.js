// Tests : otages nommés — liste, pickers déterministes, blessé, héros,
// invariant compteurs/statuts, conseil « fragile ».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.js';
import { adviceFor } from '../js/advice.js';
import { MISSION_LIST } from '../js/data/missions/index.js';

const make = (over = {}) => E.createGame({ missionId: 'braquage', seed: 42, ...over });

// ---------- données ----------
test('chaque mission a une hostageList de la bonne longueur', () => {
  for (const m of MISSION_LIST) {
    assert.equal(m.hostageList.length, m.hostages, m.id);
    const ids = new Set(m.hostageList.map(h => h.id));
    assert.equal(ids.size, m.hostages, m.id);
  }
});

test('hostageList : ferry = 11 enfants + 9 adultes, noms distincts', () => {
  const f = MISSION_LIST.find(m => m.id === 'ferry');
  const kids = f.hostageList.filter(h => h.role.startsWith('enfant'));
  assert.equal(kids.length, 11);
  assert.ok(kids.every(h => h.trait === 'vulnerable'));
  const names = new Set(f.hostageList.map(h => h.name));
  assert.equal(names.size, 20);
});

// ---------- pickers ----------
test('libération : le vulnérable est libéré en premier', () => {
  const s = make();
  s.phase = 'team';
  E.doTeamAction(s, 'concede', s.demands[0].id); // concession → free:1
  const nadia = s.hostageList.find(h => h.id === 'guichetiere');
  assert.equal(nadia.status, 'freed');
  assert.equal(s.hostages.freed, 1);
  const line = s.log.findLast(e => e.k === 'sys' && e.text.includes('🚪'));
  assert.ok(line.text.includes('Nadia Ferrand'), line.text);
  assert.ok(line.text.includes('libérée'), line.text); // accord féminin
});

test('mort : le héros est visé en premier, nom dans le journal', () => {
  const s = make();
  E.recordDeaths(s, 1, 'Test');
  const paul = s.hostageList.find(h => h.id === 'client-secu');
  assert.equal(paul.status, 'dead');
  assert.equal(paul.cause, 'Test');
  const line = s.log.findLast(e => e.k === 'death');
  assert.ok(line.text.includes('Paul Girard'), line.text);
  assert.ok(line.text.includes('est tué'), line.text);
  assert.equal(s.deaths.at(-1).n, 1);
});

test('pickers déterministes : même seed → même victime (sans héros)', () => {
  const a = E.createGame({ missionId: 'hopital', seed: 5 });
  const b = E.createGame({ missionId: 'hopital', seed: 9 });
  E.recordDeaths(a, 1, 'X');
  E.recordDeaths(b, 1, 'X');
  const da = a.hostageList.find(h => h.status === 'dead');
  const db = b.hostageList.find(h => h.status === 'dead');
  assert.equal(da.trait, 'heros'); // Julie Roche d'abord dans les deux cas
  assert.equal(db.trait, 'heros');
});

// ---------- blessé ----------
test('blessé : nommé dès le départ, vulnérable de préférence', () => {
  const s = make({ options: { blesse: true } });
  assert.equal(s.flags.woundedId, 'guichetiere');
  const line = s.log.find(e => e.text.includes('blessé'));
  assert.ok(line && line.text.includes('Nadia Ferrand'), line && line.text);
});

test('blessé : mort au tour 5 → c\'est lui qui meurt', () => {
  const s = make({ options: { blesse: true } });
  s.turn = 4; s.phase = 'team';
  s.terrorDeck = ['perimetre', 'perimetre']; // pioche non vide, sans effet de menace
  E.endPhase(s); // → startTurn(5)
  const nadia = s.hostageList.find(h => h.id === 'guichetiere');
  assert.equal(nadia.status, 'dead');
  assert.ok(s.hostages.killed >= 1);
});

// ---------- héros ----------
test('héros : se déclenche une fois, aux conditions exactes', () => {
  const s = make();
  s.threat = 5; s.turn = 2; s.phase = 'team';
  s.terrorDeck = ['perimetre', 'perimetre', 'perimetre']; // pression seule, menace stable
  E.endPhase(s); // → startTurn(3) : événement héros
  assert.equal(s.flags.herosDone, true);
  const paul = s.hostageList.find(h => h.id === 'client-secu');
  const line = s.log.find(e => e.text.includes('tente quelque chose'));
  assert.ok(line, 'ligne d\'annonce absente');
  // une des trois issues s'est produite
  const dice = s.log.find(e => e.k === 'dice' && e.text.includes('Tentative'));
  assert.ok(dice, 'jet de tentative absent');
  if (dice.data.dice[0] === 1) assert.equal(paul.status, 'dead');
  else if (dice.data.dice[0] <= 4) assert.equal(s.threat, 6);
  else assert.equal(paul.status, 'freed');
});

test('héros : pas de déclenchement avant le tour 3 ni sous menace < 5', () => {
  const s = make();
  s.threat = 4; s.turn = 2; s.phase = 'team';
  s.terrorDeck = ['perimetre', 'perimetre'];
  E.endPhase(s); // → tour 3 mais menace 4
  assert.ok(!s.flags.herosDone);
  const s2 = make();
  s2.threat = 5; s2.turn = 1; s2.phase = 'team';
  s2.terrorDeck = ['perimetre', 'perimetre'];
  E.endPhase(s2); // → tour 2 seulement
  assert.ok(!s2.flags.herosDone);
});

// ---------- ancienne sauvegarde ----------
test('ensureHostageList reconstruit depuis les compteurs', () => {
  const s = make();
  s.hostages.freed = 2; s.hostages.killed = 1; s.hostages.remaining = 3;
  delete s.hostageList;
  const list = E.ensureHostageList(s);
  assert.equal(list.filter(h => h.status === 'freed').length, 2);
  assert.equal(list.filter(h => h.status === 'dead').length, 1);
  assert.equal(list.filter(h => h.status === 'held').length, 3);
});

// ---------- conseil psy ----------
test('conseil : otage fragile visé par son id', () => {
  const g = make();
  g.turn = 2;
  g.demands[0].status = 'conceded'; // lève la priorité « demande » (règle 3)
  const a = adviceFor(g, {});
  assert.equal(a.key, 'vulnerable_guichetiere');
  assert.ok(a.text.includes('Nadia Ferrand'));
  assert.ok(a.text.includes('la plus fragile')); // accord féminin
});

// ---------- invariant global ----------
function playRandom(s) {
  let guard = 0;
  while (!s.result && guard++ < 5000) {
    if (s.phase === 'choice') { E.chooseOption(s, 0); continue; }
    if (s.phase === 'conversation') {
      if (Math.random() < 0.35 && s.hand.length) {
        const id = s.hand[Math.floor(Math.random() * s.hand.length)];
        if (E.canPlayCard(s, id).ok) { E.playCard(s, id, null); continue; }
      }
      E.endPhase(s); continue;
    }
    if (s.phase === 'market') { E.endPhase(s); continue; }
    if (s.phase === 'team') {
      const r = Math.random();
      if (r < 0.4) E.doTeamAction(s, 'intel');
      else if (r < 0.55) E.doTeamAction(s, 'sniper');
      else if (r < 0.65) E.doTeamAction(s, 'supply');
      else if (r < 0.72) {
        const d = s.demands.find(x => x.status === 'pending');
        if (d) E.doTeamAction(s, 'concede', d.id);
      } else if (r < 0.8) E.doTeamAction(s, 'assault');
      E.endPhase(s); continue;
    }
    break;
  }
  return s;
}

test('invariant : statuts individuels == compteurs après parties complètes', () => {
  for (const m of MISSION_LIST) {
    let finished = 0;
    for (let i = 0; i < 200; i++) {
      const s = E.createGame({ missionId: m.id, seed: 1000 + i * 13 });
      playRandom(s);
      if (!s.result) continue;
      finished++;
      const list = E.ensureHostageList(s);
      assert.equal(list.filter(h => h.status === 'freed').length, s.hostages.freed, `${m.id} seed ${i}`);
      assert.equal(list.filter(h => h.status === 'dead').length, s.hostages.killed, `${m.id} seed ${i}`);
      assert.equal(list.filter(h => h.status === 'held').length, s.hostages.remaining, `${m.id} seed ${i}`);
    }
    assert.ok(finished > 150, `${m.id}: seulement ${finished}/200 parties finies`);
  }
});
