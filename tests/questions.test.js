// Tests : questions du preneur — déclenchement, unicité, espacement,
// choix d'acte, badge « cohérent », sérialisation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.js';
import { getMission, MISSION_LIST } from '../js/data/missions/index.js';

const make = (id = 'tutoriel', over = {}) => E.createGame({ missionId: id, seed: 42, ...over });

// Avance de phases jusqu'à la prochaine question ou la fin.
function untilQuestion(s, max = 200) {
  let g = 0;
  while (!s.result && g++ < max) {
    if (s.phase === 'choice' && s.pendingChoice && s.pendingChoice.questionId) return s.pendingChoice.questionId;
    if (s.phase === 'choice') { E.chooseOption(s, 0); continue; }
    E.endPhase(s);
  }
  return null;
}

// ---------- données ----------
test('chaque mission a des questions bien formées', () => {
  const expected = { tutoriel: 1, braquage: 3, hopital: 3, secte: 3, prison: 3, ferry: 3 };
  for (const m of MISSION_LIST) {
    const qs = m.questions || [];
    assert.equal(qs.length, expected[m.id], m.id);
    const ids = new Set();
    for (const q of qs) {
      assert.ok(q.id && !ids.has(q.id), `${m.id}/${q.id} : id unique`);
      ids.add(q.id);
      assert.ok(q.text && q.text.length > 10, `${m.id}/${q.id} : texte`);
      assert.equal(q.replies.length, 3, `${m.id}/${q.id} : 3 réponses`);
      for (const r of q.replies) {
        assert.ok(r.label, `${m.id}/${q.id} : label`);
        assert.ok(r.tag, `${m.id}/${q.id} : tag`);
        assert.ok(r.answer, `${m.id}/${q.id} : réponse du preneur`);
        assert.ok(r.effects, `${m.id}/${q.id} : effets`);
        assert.ok(!r.effects.kill, `${m.id}/${q.id} : pas de mort directe`);
      }
    }
  }
});

test('les ifClue des questions référencent des indices existants', () => {
  for (const m of MISSION_LIST) {
    const allClueIds = new Set(m.clues.map(c => c.id));
    for (const act of m.acts || []) for (const c of act.addClues || []) allClueIds.add(c.id);
    for (const q of m.questions || []) {
      for (const r of q.replies) {
        const c = r.effects.ifClue;
        if (c) assert.ok(allClueIds.has(c.id), `${m.id}/${q.id} : indice inconnu ${c.id}`);
      }
    }
  }
});

// ---------- déclenchement ----------
test('question posée quand minTurn atteint, une seule fois', () => {
  const s = make('tutoriel');
  const qid = untilQuestion(s);
  assert.equal(qid, 'q_mot');
  assert.equal(s.phase, 'choice');
  assert.ok(s.questionsAsked.includes('q_mot'));
  assert.equal(s.lastQuestionTurn, s.turn);
});

test('la réponse journalise la ligne du joueur et la réplique du preneur', () => {
  const s = make('tutoriel');
  untilQuestion(s);
  const threat0 = s.threat;
  E.chooseOption(s, 1); // la réponse empathie, effet threat -1
  assert.equal(s.phase, 'conversation');
  assert.equal(s.threat, threat0 - 1);
  const kinds = s.log.slice(-6).map(e => e.k);
  assert.ok(kinds.includes('player'));
  assert.ok(kinds.includes('taker'));
});

test('jamais deux fois la même question, ≥ 2 tours d\'écart', () => {
  const s = make('braquage', { seed: 7 });
  const asked = [];
  let guard = 0;
  while (!s.result && guard++ < 400) {
    if (s.phase === 'choice' && s.pendingChoice && s.pendingChoice.questionId) {
      asked.push({ id: s.pendingChoice.questionId, turn: s.turn });
      E.chooseOption(s, 0); continue;
    }
    if (s.phase === 'choice') { E.chooseOption(s, 0); continue; }
    E.endPhase(s);
  }
  const ids = asked.map(a => a.id);
  assert.equal(new Set(ids).size, ids.length, 'question répétée');
  for (let i = 1; i < asked.length; i++) {
    assert.ok(asked[i].turn - asked[i - 1].turn >= 2, `espacement ${asked[i - 1].turn}→${asked[i].turn}`);
  }
});

test('pas de question si résultat déjà fixé', () => {
  const s = make('tutoriel');
  s.result = { outcome: 'surrender' };
  s.turn = 5;
  E.maybeQuestion(s);
  assert.equal(s.phase, 'conversation');
  assert.ok(!s.pendingChoice);
});

test('act gating : la question d\'un autre acte n\'est pas posée', () => {
  const s = make('secte');
  s.turn = 6; s.act = 0;
  E.maybeQuestion(s);
  assert.ok(s.pendingChoice && s.pendingChoice.questionId === 'q_enfants');
  // acte suivant : les questions d'acte 0 ne reviennent pas
  const s2 = make('secte');
  s2.turn = 6; s2.act = 1; s2.questionsAsked = ['q_enfants'];
  E.maybeQuestion(s2);
  assert.equal(s2.pendingChoice.questionId, 'q_lumiere');
});

test('flag gating : q_transfert exige keraudren_allie', () => {
  const s = make('prison');
  s.turn = 10; s.act = 2; s.questionsAsked = ['q_maison', 'q_ligne'];
  E.maybeQuestion(s);
  assert.ok(!s.pendingChoice, 'question posée sans le flag');
  s.flags.keraudren_allie = true;
  E.maybeQuestion(s);
  assert.equal(s.pendingChoice.questionId, 'q_transfert');
});

// ---------- badge « cohérent » ----------
test('replyCoherent : badge seulement si indice révélé et branche bénéfique', () => {
  const s = make('braquage');
  const q = getMission('braquage').questions[0]; // q_toit, réponse 1 = ifClue b_legion
  const r = q.replies[1];
  assert.equal(E.replyCoherent(s, r), false);
  const clue = E.getClue(s, 'b_legion');
  clue.revealed = true;
  assert.equal(E.replyCoherent(s, r), true);
  // réponse sans ifClue → jamais de badge
  assert.equal(E.replyCoherent(s, q.replies[0]), false);
});

// ---------- sérialisation ----------
test('question en attente : état sérialisable et restaure', () => {
  const s = make('tutoriel');
  untilQuestion(s);
  const raw = JSON.parse(JSON.stringify(s));
  const s2 = E.deserialize ? E.deserialize(raw) : raw;
  const ch = E.getChoice(s2);
  assert.ok(ch && ch.question && ch.question.id === 'q_mot');
  assert.equal(ch.options.length, 3);
});
