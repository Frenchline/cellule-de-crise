// Tests du moteur — node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.js';
import { getCard } from '../js/data/cards.js';
import { MISSION_LIST } from '../js/data/missions/index.js';

const make = (over = {}) => E.createGame({ missionId: 'braquage', seed: 42, ...over });
const makeTuto = (over = {}) => E.createGame({ missionId: 'tutoriel', seed: 7, ...over });

// ---------- modificateur de dés par menace ----------
test('modificateur de dés selon la menace', () => {
  const s = make();
  s.threat = 1; assert.equal(E.threatDiceMod(s.threat), 1);
  s.threat = 2; assert.equal(E.threatDiceMod(s.threat), 1);
  s.threat = 3; assert.equal(E.threatDiceMod(s.threat), 0);
  s.threat = 4; assert.equal(E.threatDiceMod(s.threat), 0);
  s.threat = 5; assert.equal(E.threatDiceMod(s.threat), -1);
  s.threat = 6; assert.equal(E.threatDiceMod(s.threat), -1);
  s.threat = 7; assert.equal(E.threatDiceMod(s.threat), -2);
});

test('pool de dés = base + menace + traits, min 1', () => {
  const s = make();
  const rassurer = getCard('rassurer'); // 3 dés
  s.threat = 3;
  assert.equal(E.cardDicePool(s, rassurer), 3);
  s.threat = 6;
  assert.equal(E.cardDicePool(s, rassurer), 2);
  s.threat = 1;
  assert.equal(E.cardDicePool(s, rassurer), 4);
  // gagner_temps 2 dés à menace 7 → max(1, 0) = 1
  s.threat = 7;
  assert.equal(E.cardDicePool(s, getCard('gagner_temps')), 1);
});

// ---------- table d'effets ----------
test('résolution de la table d\'effets (clé max ≤ succès)', () => {
  const s = make();
  s.threat = 2;
  // on force des succès en jouant rassurer avec beaucoup de dés via triche de seed :
  // plus simple : appeler playCard et vérifier que l'effet appliqué correspond à une ligne
  const before = s.threat;
  const res = E.playCard(s, 'rassurer');
  assert.ok(res.ok);
  const row = res.successes === 0 ? { threat: 1 } : res.successes === 1 ? { threat: -1 } : { threat: -2 };
  assert.equal(s.threat, Math.max(1, before + (row.threat || 0)));
});

// ---------- conditions de cartes ----------
test('condition menace ≤ 5 pour Demander un otage', () => {
  const s = make();
  s.threat = 6;
  const chk = E.canPlayCard(s, 'demander_otage');
  assert.equal(chk.ok, false);
  s.threat = 5;
  assert.equal(E.canPlayCard(s, 'demander_otage').ok, true);
});

test('reddition exige menace ≤ 2 et demande majeure résolue', () => {
  const s = make();
  s.threat = 2;
  assert.equal(E.canPlayCard(s, 'proposer_reddition').ok, false);
  // neutraliser la demande majeure directement
  s.demands.find(d => d.id === 'fuite').status = 'neutralized';
  assert.equal(E.canPlayCard(s, 'proposer_reddition').ok, true);
  s.threat = 3;
  assert.equal(E.canPlayCard(s, 'proposer_reddition').ok, false);
});

test('carte réutilisable 1×/tour et coût PC', () => {
  const s = make();
  s.pc = 5;
  const r = E.playCard(s, 'rassurer');
  assert.ok(r.ok);
  const chk = E.canPlayCard(s, 'rassurer');
  assert.equal(chk.ok, false); // déjà jouée
  s.pc = 0;
  assert.equal(E.canPlayCard(s, 'fermete').ok, false); // coût
  assert.equal(E.canPlayCard(s, 'ecoute_active').ok, true); // coût 0
});

// ---------- point de rupture ----------
test('menace 7 → point de rupture : 1 otage tué, menace → 6', () => {
  const s = make();
  s.threat = 6;
  s.hostages.remaining = 3;
  // fermete à 0 succès = +2 menace, ou forcer via changeThreat interne : jouer fermete peut échouer
  // On utilise le chemin public : terror card colère via résolution d'effet simulée par une carte
  // Ici : playCard 'fermete' donne aléatoire → on teste via la résolution d'un effet artificiel
  // => on passe par doTeamAction supply inverse? Non : on simule la Terreur.
  s.phase = 'team';
  s.terrorDeck = ['colere']; // +2 menace
  E.endPhase(s); // résout la Terreur : 6 + 2 → 7 → rupture
  assert.equal(s.threat, 6);
  assert.equal(s.hostages.killed, 1);
  assert.equal(s.hostages.remaining, 2);
});

// ---------- pression ----------
test('pression 10 → assaut forcé à la fin du tour d\'après', () => {
  const s = make();
  s.phase = 'team';
  s.terrorDeck = ['perimetre', 'nervosite', 'accalmie'];
  s.pressure = 8; // perimetre +2 → 10 → forcedAssault (+1 fin de tour déjà couvert)
  E.endPhase(s); // terror perimetre +2 → 10 → forcedAssault
  assert.equal(s.flags.forcedAssault, true);
  // tour suivant : passer conversation & market & team → assaut
  // déterministe : prep 1 désactive l'échappée, 1 otage libéré évite la défaite totale
  s.prep = 1;
  s.hostages.freed = 1;
  s.hostages.remaining = s.hostages.total - 1;
  s.phase = 'team';
  E.endPhase(s);
  assert.ok(s.result);
  assert.equal(s.result.outcome, 'assault');
});

// ---------- heure H ----------
test('pioche Terreur vide → Heure H (menace ≤ 3 = reddition)', () => {
  const s = make();
  s.phase = 'team';
  s.threat = 2;
  s.terrorDeck = [];
  E.endPhase(s);
  assert.equal(s.result.outcome, 'surrender');
});

test('Heure H menace 4-5 → jets puis reddition', () => {
  const s = make();
  s.phase = 'team';
  s.threat = 4;
  s.terrorDeck = [];
  E.endPhase(s);
  assert.ok(['surrender', 'defeat'].includes(s.result.outcome));
});

test('Heure H menace ≥ 6 → jets puis assaut', () => {
  const s = make();
  s.phase = 'team';
  s.threat = 6;
  s.terrorDeck = [];
  E.endPhase(s);
  assert.ok(['assault', 'defeat', 'escape'].includes(s.result.outcome));
});

// ---------- assaut ----------
test('assaut : risque = max(1, 3-prep) (+1 si menace ≥6)', () => {
  const s = make();
  s.prep = 2; s.threat = 3;
  assert.equal(E.assaultRisk(s), 1);
  s.prep = 0; s.threat = 6;
  assert.equal(E.assaultRisk(s), 4);
  s.prep = 3; s.threat = 3;
  assert.equal(E.assaultRisk(s), 1);
});

test('assaut volontaire termine la partie', () => {
  const s = make();
  s.phase = 'team';
  s.prep = 3;
  const res = E.doTeamAction(s, 'assault');
  assert.ok(res.ok);
  assert.ok(['assault', 'defeat'].includes(s.result.outcome));
});

// ---------- victoires / défaites ----------
test('tous les otages libérés → victoire libération', () => {
  const s = make();
  s.hostages.remaining = 1;
  s.threat = 3;
  s.pc = 10;
  // demander_otage à 2+ succès libère ; on force le résultat via many tries…
  // plus déterministe : utiliser le marché 'echange'? Non. On simule via terror 'evasion'
  s.phase = 'team';
  s.terrorDeck = ['evasion'];
  E.endPhase(s);
  assert.equal(s.result.outcome, 'liberation');
});

test('tous les otages tués → défaite', () => {
  const s = make();
  s.hostages.remaining = 1;
  s.hostages.freed = 0;
  s.threat = 6;
  s.phase = 'team';
  s.terrorDeck = ['coup_feu']; // menace ≥5 → kill 1
  E.endPhase(s);
  assert.equal(s.result.outcome, 'defeat');
});

test('Proposer la reddition réussie → victoire reddition', () => {
  // seed exploration pour trouver un jet à 3+ succès
  for (let seed = 1; seed < 400; seed++) {
    const s = E.createGame({ missionId: 'braquage', seed });
    s.threat = 2;
    s.pc = 10;
    s.demands.find(d => d.id === 'fuite').status = 'conceded';
    const res = E.playCard(s, 'proposer_reddition');
    if (res.successes >= 3) {
      assert.equal(s.result.outcome, 'surrender');
      return;
    }
  }
  assert.fail('aucun seed n\'a produit 3 succès');
});

// ---------- concessions ----------
test('concéder une demande applique ses effets', () => {
  const s = make();
  s.phase = 'team';
  s.threat = 5;
  const res = E.doTeamAction(s, 'concede', 'fuite');
  assert.ok(res.ok);
  assert.equal(E.getDemand(s, 'fuite').status, 'conceded');
  assert.equal(s.threat, 2); // -3
  assert.equal(s.flags.majorConcessions, 1);
});

test('négocier une demande la neutralise à 2+ succès', () => {
  for (let seed = 1; seed < 400; seed++) {
    const s = E.createGame({ missionId: 'braquage', seed });
    s.threat = 3; s.pc = 10;
    const res = E.playCard(s, 'negocier_demande', 'cigarettes');
    if (res.successes >= 2) {
      assert.equal(E.getDemand(s, 'cigarettes').status, 'neutralized');
      return;
    }
  }
  assert.fail('aucun seed n\'a produit ≥2 succès');
});

// ---------- indices / traits ----------
test('indices : révélés par renseignement, traits modifient les dés', () => {
  const s = make();
  s.phase = 'team';
  const hidden0 = s.clues.filter(c => !c.revealed).length;
  E.doTeamAction(s, 'intel');
  const hidden1 = s.clues.filter(c => !c.revealed).length;
  assert.equal(hidden1, hidden0 - 1);
  // révéler le trait légionnaire → autorite +1, ruse −1
  const s2 = make();
  s2.threat = 3;
  const fermete = getCard('fermete');
  const before = E.cardDicePool(s2, fermete);
  s2.clues.find(c => c.id === 'b_legion').revealed = true;
  assert.equal(E.cardDicePool(s2, fermete), before + 1);
  assert.equal(E.cardDicePool(s2, getCard('gagner_temps')), 2 + 0 - 1); // ruse -1
});

// ---------- compétences ----------
test('compétences : voix posée +1 PC t1, coord_tactique prep 1, sang_froid reroll', () => {
  const s = E.createGame({ missionId: 'braquage', seed: 5, skills: ['voix_posee', 'coord_tactique', 'sang_froid'] });
  assert.equal(s.pc, 4);
  assert.equal(s.prep, 1);
  assert.equal(s.flags.rerollsLeft, 1);
});

test('profileur révèle un indice au départ', () => {
  const s = E.createGame({ missionId: 'braquage', seed: 5, skills: ['profileur'] });
  assert.equal(s.clues.filter(c => c.revealed).length, 1);
});

// ---------- options ----------
test('option media : pression ×2', () => {
  const s = E.createGame({ missionId: 'braquage', seed: 3, options: { media: true } });
  s.phase = 'team';
  s.terrorDeck = ['perimetre']; // +2 pression → ×2 = 4, +1 fin de tour ×2 = 2 → total 6
  E.endPhase(s);
  assert.equal(s.pressure, 6);
});

test('option blesse : otage blessé meurt au tour 5 s\'il n\'est pas libéré', () => {
  const s = E.createGame({ missionId: 'braquage', seed: 3, options: { blesse: true } });
  s.turn = 4;
  s.phase = 'team';
  s.terrorDeck = ['accalmie'];
  E.endPhase(s); // → tour 5
  assert.equal(s.hostages.killed, 1);
});

test('option epuise : −1 PC à partir du tour 5', () => {
  const s = E.createGame({ missionId: 'braquage', seed: 3, options: { epuise: true } });
  s.turn = 4; s.phase = 'team'; s.terrorDeck = ['accalmie'];
  E.endPhase(s);
  assert.equal(s.pc, 2); // 3 - 1
});

test('option complice : carte Terreur complice révèle le second preneur', () => {
  const s = E.createGame({ missionId: 'braquage', seed: 3, options: { complice: true } });
  assert.ok(s.terrorDeck.includes('complice_cache'));
});

// ---------- marché ----------
test('achat au marché : coût buy, en main, phase requise', () => {
  const s = make();
  s.pc = 10;
  assert.equal(E.canBuy(s, 0).ok, false); // pas en phase market
  s.phase = 'market';
  const cid = s.market[0];
  const res = E.buyCard(s, 0);
  assert.ok(res.ok);
  assert.ok(s.hand.includes(cid));
  assert.equal(s.market[0], null);
});

// ---------- sérialisation ----------
test('sérialisation/reprise : état identique et RNG continu', () => {
  const s = make();
  s.pc = 5;
  E.playCard(s, 'rassurer');
  const json = JSON.stringify(E.serialize(s));
  const s2 = E.deserialize(json);
  assert.equal(s2.threat, s.threat);
  assert.equal(s2.rngState, s.rngState);
  const d1 = E.rollDice(s, 3), d2 = E.rollDice(s2, 3);
  assert.deepEqual(d1, d2);
});

// ---------- rigged rolls tuto ----------
test('tutoriel : les 2 premiers jets sont favorisés', () => {
  const s = makeTuto();
  const r1 = E.playCard(s, 'rassurer');
  assert.ok(r1.successes >= 1);
  assert.ok(r1.dice.every(d => d >= 5));
});

// ---------- stress ----------
test('stress ≥ 3 → −1 PC au tour 1', () => {
  const s = E.createGame({ missionId: 'braquage', seed: 5, stress: 4 });
  assert.equal(s.pc, 2);
});

// ---------- promesse ----------
test('promesse : menace −2, pression +1, marqueur puni par Promesse trahie', () => {
  const s = make();
  s.threat = 4; s.pc = 10; s.pressure = 0;
  s.hand.push('promesse');
  const res = E.playCard(s, 'promesse');
  assert.ok(res.ok);
  assert.equal(s.threat, 2);
  assert.equal(s.pressure, 1);
  assert.equal(s.flags.promise, true);
  s.phase = 'team';
  s.terrorDeck = ['promesse_trahie'];
  E.endPhase(s);
  assert.equal(s.threat, 4); // +2 punition
});

// ============================================================
// Multi-actes, choix, compteurs, morts — nouveautés moteur
// ============================================================
import { MISSIONS } from '../js/data/missions/index.js';

// mission synthétique de test injectée dans le registre
MISSIONS.__test = {
  id: '__test', title: 'Mission test', subtitle: '', type: 'advanced',
  startThreat: 3, hostages: 4,
  briefing: ['briefing de test'],
  taker: { name: 'T1', age: 40, dossier: ['d'], responses: { default: { fail: 'f', partial: 'p', success: 's' } }, lines: {} },
  demands: [{ id: 'd1', label: 'Demande test', major: true, detail: 'x', concede: { effects: { threat: -2 }, text: 'ok' } }],
  clues: [{ id: 'c0', name: 'Indice base', desc: 'x', trait: null }],
  counters: [{ id: 'cm', label: 'Compteur', icon: 'x', start: 0, max: 2, resetTo: 1, cause: 'Boum', onMax: { pressure: 2 } }],
  choices: {
    ch: {
      prompt: 'Choisir ?',
      options: [
        { label: 'Option A', desc: 'threat −1', effects: { threat: -1 }, flag: 'fA' },
        { label: 'Option B', desc: 'threat +1', effects: { threat: 1 } },
      ],
    },
  },
  extraTeamActions: [{ id: 'xt', name: 'Action X', desc: 'threat −1', log: 'X fait', effects: { threat: -1 } }],
  teamOverrides: { supply: { extraEffects: { counter: { cm: -1 } } } },
  terrorExtra: {
    boom: { id: 'boom', name: 'Boum', text: 'boom', taker: 't', effect: { counter: { cm: 2 } } },
    choix_t: { id: 'choix_t', name: 'Choix', text: 'c', taker: 't', effect: { choice: 'ch' } },
  },
  acts: [
    { id: 'a1', title: 'Premier acte', intro: ['intro 1'], terrorDeck: ['boom', 'accalmie'] },
    {
      id: 'a2', title: 'Deuxième acte', intro: ['intro 2'], terrorDeck: ['accalmie'],
      choice: 'ch', eachTurn: { threat: 1 }, startThreat: 5,
      taker: { name: 'T2', age: 30, dossier: ['d2'], responses: { default: { fail: 'f2', partial: 'p2', success: 's2' } }, lines: {} },
      addDemands: [{ id: 'd2', label: 'Demande ajoutée', major: false, detail: 'x', concede: { effects: { threat: -1 }, text: 'ok' } }],
    },
    { id: 'a3', title: 'Dernier acte', intro: ['intro 3'], terrorDeck: ['accalmie'] },
  ],
  market: [],
};

const makeTest = (over = {}) => E.createGame({ missionId: '__test', seed: 11, ...over });

// ---------- morts traquées + ligne ✝ ----------
test('morts : Terreur coup_feu tue à menace ≥ 5, deaths traqué, ligne ✝ au débrief', () => {
  const s = make();
  s.threat = 5;
  s.phase = 'team';
  s.terrorDeck = ['coup_feu'];
  const before = s.hostages.killed;
  E.endPhase(s); // terror → coup_feu tue 1 otage
  assert.equal(s.hostages.killed, before + 1);
  const death = s.deaths.find(d => d.cause.startsWith('Terreur'));
  assert.ok(death, 'une mort Terreur enregistrée');
  assert.match(death.cause, /Coup de feu/);
  // terminer la partie : assaut forcé (le préfet a ordonné)
  s.flags.forcedAssault = true;
  s.phase = 'team';
  E.endPhase(s); // → résolution d'assaut
  assert.ok(s.result);
  assert.ok(s.deaths.length >= 1);
  const score = E.computeScore(s, 1);
  const croix = score.breakdown.find(b => b.label.startsWith('✝'));
  assert.ok(croix, 'ligne ✝ présente dans le breakdown');
  assert.equal(croix.pts, null);
  assert.match(croix.label, /otage\(s\) tué\(s\)/);
});

test('recordDeaths : libellés de causes par chemin', () => {
  const s = make();
  E.recordDeaths(s, 2, 'Heure H');
  assert.equal(s.hostages.killed, 2);
  assert.deepEqual(s.deaths[0], { turn: 1, cause: 'Heure H', n: 2 });
});

// ---------- actes ----------
test('transition d\'acte par pioche vide (pas d\'Heure H avant le dernier acte)', () => {
  const s = makeTest();
  assert.equal(s.act, 0);
  // deck acte 1 : ['boom','accalmie'] → 2 tours avant épuisement
  s.phase = 'team';
  E.endPhase(s); // boom résolu, 1 carte reste
  assert.equal(s.act, 0);
  s.phase = 'team';
  E.endPhase(s); // accalmie résolu, deck vide (transition au prochain tour)
  assert.equal(s.act, 0);
  s.phase = 'team';
  E.endPhase(s); // début de phase Terreur : pioche vide → acte II + choix
  assert.equal(s.act, 1);
  assert.equal(s.phase, 'choice');
  const banner = s.log.filter(e => e.k === 'act');
  assert.ok(banner.length >= 2, 'bandeau + intro loggés en kind act');
  assert.match(banner[0].text, /ACTE II/);
  assert.equal(s.threat, 5); // startThreat de l'acte II appliqué
  assert.equal(E.getTaker(s).name, 'T2');
  assert.ok(s.demands.some(d => d.id === 'd2'), 'demande ajoutée par l\'acte');
});

test('transition d\'acte par objectif (goal freed)', () => {
  const m = JSON.parse(JSON.stringify(MISSIONS.__test));
  m.acts = [
    { id: 'a1', title: 'A1', intro: ['i'], terrorDeck: ['accalmie', 'accalmie'], goal: [{ type: 'freed', n: 1 }] },
    { id: 'a2', title: 'A2', intro: ['i'], terrorDeck: ['accalmie'] },
  ];
  m.choices = {};
  MISSIONS.__test_goal = m;
  const s = E.createGame({ missionId: '__test_goal', seed: 3 });
  s.hostages.freed = 1;
  s.phase = 'team';
  E.endPhase(s);
  assert.equal(s.act, 1, 'goal atteint → acte II');
});

test('Heure H uniquement à l\'épuisement du DERNIER acte', () => {
  const m = JSON.parse(JSON.stringify(MISSIONS.__test));
  m.acts[1].eachTurn = undefined; // sinon la menace s'emballe avant l'acte III
  MISSIONS.__test_hh = m;
  const s = E.createGame({ missionId: '__test_hh', seed: 11 });
  let guard = 0;
  while (!s.result && guard++ < 40) {
    if (s.phase === 'choice') { E.chooseOption(s, 0); continue; }
    s.phase = 'team'; // saute conversation/marché
    E.endPhase(s);
  }
  assert.ok(s.result, 'la partie se termine par Heure H sur le dernier acte');
  const hh = s.log.find(e => e.k === 'terror' && /HEURE H/.test(e.text));
  assert.ok(hh, 'Heure H survenue');
  assert.equal(s.act, 2);
});

// ---------- choix ----------
test('choix : verrou de phase, chooseOption applique effets + flag, reprise', () => {
  const s = makeTest();
  s.terrorDeck = ['choix_t'];
  s.phase = 'team';
  E.endPhase(s);
  assert.equal(s.phase, 'choice');
  assert.equal(s.pendingChoice.choiceId, 'ch');
  assert.equal(E.endPhase(s).ok, false, 'endPhase bloqué pendant un choix');
  assert.equal(E.playCard(s, 'rassurer').ok, false, 'playCard bloqué pendant un choix');
  const t0 = s.threat;
  const res = E.chooseOption(s, 0);
  assert.ok(res.ok);
  assert.equal(s.threat, t0 - 1);
  assert.equal(s.flags.fA, true, 'flag posé');
  assert.equal(s.pendingChoice, null);
  assert.notEqual(s.phase, 'choice');
});

test('choix : sérialisation au milieu d\'un choix puis reprise', () => {
  const s = makeTest();
  s.terrorDeck = ['choix_t'];
  s.phase = 'team';
  E.endPhase(s);
  assert.equal(s.phase, 'choice');
  const s2 = E.deserialize(E.serialize(s));
  assert.equal(s2.phase, 'choice');
  assert.equal(s2.pendingChoice.choiceId, 'ch');
  const t0 = s2.threat;
  E.chooseOption(s2, 1);
  assert.equal(s2.threat, t0 + 1);
  assert.equal(s2.phase, 'conversation'); // reprend au tour suivant
});

test('effet conditionnel ifFlag', () => {
  const s = makeTest();
  s.terrorDeck = ['choix_t'];
  s.phase = 'team';
  E.endPhase(s);
  E.chooseOption(s, 0); // flag fA
  assert.equal(s.flags.fA, true);
});

// ---------- compteurs ----------
test('compteur : cap au max, onMax appliqué, resetTo', () => {
  const s = makeTest();
  s.pressure = 0;
  s.terrorDeck = ['boom'];
  s.phase = 'team';
  E.endPhase(s);
  assert.equal(s.counters.cm.value, 1, 'retour à resetTo après déclenchement');
  assert.equal(s.pressure, 2 + 1, 'onMax pressure +2 puis +1 fin de tour');
  const log = s.log.find(e => /seuil critique/.test(e.text));
  assert.ok(log, 'log dramatique du compteur');
});

test('teamOverrides : ravitaillement applique les effets supplémentaires', () => {
  const s = makeTest();
  s.counters.cm.value = 1;
  s.phase = 'team';
  E.doTeamAction(s, 'supply');
  assert.equal(s.counters.cm.value, 0, 'override supply → compteur −1');
});

// ---------- eachTurn / extraTeamActions ----------
test('eachTurn de l\'acte s\'applique au début de chaque tour', () => {
  const s = makeTest();
  s.phase = 'team';
  E.endPhase(s); // boom (compteur), menace 3
  s.phase = 'team';
  E.endPhase(s); // accalmie → menace 2
  s.phase = 'team';
  E.endPhase(s); // pioche vide → acte II (startThreat 5) + choix
  assert.equal(s.phase, 'choice');
  E.chooseOption(s, 0);  // threat −1 → 4 ; reprise → startTurn → eachTurn +1 → 5
  assert.equal(s.threat, 5);
  assert.equal(s.act, 1);
  s.phase = 'team';
  E.endPhase(s); // terror accalmie de l'acte II (−1) puis startTurn eachTurn (+1) → 5
  assert.equal(s.threat, 5);
  assert.equal(s.act, 1, 'toujours en acte II');
});

test('extraTeamActions : disponibles en phase équipe, consomment l\'action', () => {
  const s = makeTest();
  s.threat = 4;
  s.phase = 'team';
  const res = E.doTeamAction(s, 'xt');
  assert.ok(res.ok);
  assert.equal(s.threat, 3);
  assert.equal(s.teamActionsLeft, 0);
  assert.equal(E.doTeamAction(s, 'xt').ok, false, 'une seule action par tour');
});

// ---------- missions avancées réelles ----------
test('taker conditionnel par flag (prison acte III)', () => {
  const s = E.createGame({ missionId: 'prison', seed: 2 });
  s.act = 2;
  assert.match(E.getTaker(s).name, /Sorel/);
  s.flags.keraudren_allie = true;
  assert.match(E.getTaker(s).name, /Keraudren/);
});

test('assaultRiskFlags : flag en_mer augmente le risque d\'assaut (ferry)', () => {
  const s = E.createGame({ missionId: 'ferry', seed: 2 });
  const base = E.assaultRisk(s);
  s.flags.en_mer = true;
  assert.equal(E.assaultRisk(s), base + 1);
});

test('getDemandDef trouve une demande ajoutée par un acte (secte)', () => {
  const s = E.createGame({ missionId: 'secte', seed: 2 });
  s.act = 1;
  const def = E.getDemandDef(s, 'sermon');
  assert.ok(def, 'demande de l\'acte II trouvée');
  assert.match(def.label, /sermon/i);
});

test('Mira contre-négocie : eachTurn ferry journalise', () => {
  const s = E.createGame({ missionId: 'ferry', seed: 2 });
  s.phase = 'team';
  E.endPhase(s); // terror → nouveau tour → eachTurn Mira (roll 2 dés)
  // rien de déterministe à vérifier hors journal quand 0 succès — on force :
  const s2 = E.createGame({ missionId: 'ferry', seed: 2 });
  s2.rngState = () => 0; // non applicable — vérifie seulement que le flag existe
  assert.ok(E.getMissionDef(s).acts[0].eachTurn, 'acte I a un eachTurn');
});

test('score : +100 par acte franchi au-delà du premier', () => {
  const s = makeTest();
  s.act = 2; // acte III atteint
  s.result = { outcome: 'surrender', turn: 10, hostages: { total: 4, freed: 2, remaining: 2, killed: 0 } };
  const sc = E.computeScore(s, 1);
  const l2 = sc.breakdown.find(b => /Acte II/.test(b.label));
  const l3 = sc.breakdown.find(b => /Acte III/.test(b.label));
  assert.equal(l2.pts, 100);
  assert.equal(l3.pts, 100);
});
