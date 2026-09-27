// Tests lot 5 : échecs d'actions d'équipe, promesse, exfiltration ciblée,
// journal narratif, trophées, compétences, export/import de campagne.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.js';
import * as CAM from '../js/campaign.js';
import { repEffective } from '../js/reputation.js';
import { checkTrophies, TROPHIES, getTrophy } from '../js/trophies.js';
import { storyContexts, missionStoryEntries } from '../js/data/story.js';
import { MARKET_CARDS } from '../js/data/cards.js';
import { getMission } from '../js/data/missions/index.js';
import { generateMission } from '../js/data/generator.js';

// ---------- helpers ----------
const mk = (over = {}) => E.createGame({ missionId: 'braquage', seed: 42, ...over });

// Trouve un état RNG dont les prochains jets valent exactement `dice`.
function seedFor(...dice) {
  for (let s = 0; s < 500000; s++) {
    const probe = { rngState: s };
    const r = E.rollDice(probe, dice.length);
    if (dice.every((v, i) => v === r[i])) return s;
  }
  throw new Error(`pas de rngState pour ${dice}`);
}

function teamPhase(g) { g.phase = 'team'; g.teamActionsLeft = 1; }
const logText = (g) => (g.log || []).map(e => e.text || '').join('\n');
const lastLog = (g) => (g.log || []).filter(e => e.k === 'radio' || e.k === 'sys').map(e => e.text).pop() || '';

// ============ 1. Actions d'équipe — échecs ============

test('renseignement : jet de 1 → aucun indice, pression +1, journal « à côté »', () => {
  const g = mk();
  g.flags.teamSlip = 2;             // l'épreuve du feu est déjà consommée
  g.rngState = seedFor(1);
  teamPhase(g);
  const p0 = g.pressure;
  const hidden0 = g.clues.filter(c => !c.revealed).length;
  const r = E.doTeamAction(g, 'intel');
  assert.equal(r.ok, true);
  assert.equal(g.clues.filter(c => !c.revealed).length, hidden0);
  assert.equal(g.pressure, p0 + 1);
  assert.match(logText(g), /Renseignement : à côté\. Pression \+1/);
  assert.match(logText(g), /ÉQUIPE — Renseignement : \[1\]/);
});

test('renseignement : jet ≥ 2 → un indice révélé', () => {
  const g = mk();
  g.rngState = seedFor(4);
  teamPhase(g);
  const hidden0 = g.clues.filter(c => !c.revealed).length;
  E.doTeamAction(g, 'intel');
  assert.equal(g.clues.filter(c => !c.revealed).length, hidden0 - 1);
});

test('tireur : menace < 5, jet de 1 → repéré, menace +1, pas de préparation', () => {
  const g = mk();
  g.flags.teamSlip = 2;
  g.threat = 3;
  g.rngState = seedFor(1);
  teamPhase(g);
  E.doTeamAction(g, 'sniper');
  assert.equal(g.threat, 4);
  assert.equal(g.prep, 0);
  assert.match(logText(g), /repéré — menace \+1/);
});

test('tireur : menace ≥ 5 → toujours repéré, aucun jet consommé', () => {
  const g = mk();
  g.threat = 5;
  const rng0 = g.rngState;
  teamPhase(g);
  E.doTeamAction(g, 'sniper');
  assert.equal(g.threat, 6);
  assert.equal(g.prep, 0);
  assert.equal(g.rngState, rng0); // comportement inchangé : pas de jet
  assert.match(logText(g), /repéré le laser/);
});

test('tireur : jet ≥ 2 → préparation +1', () => {
  const g = mk();
  g.threat = 3;
  g.rngState = seedFor(6);
  teamPhase(g);
  E.doTeamAction(g, 'sniper');
  assert.equal(g.prep, 1);
  assert.equal(g.threat, 3);
});

test('ravitaillement : jet de 1 → compromis, menace inchangée, pression +1', () => {
  const g = mk();
  g.flags.teamSlip = 2;
  g.threat = 4;
  g.rngState = seedFor(1);
  teamPhase(g);
  const p0 = g.pressure;
  E.doTeamAction(g, 'supply');
  assert.equal(g.threat, 4);
  assert.equal(g.pressure, p0 + 1);
  assert.match(logText(g), /ravitaillement est compromis/);
});

test('ravitaillement : jet ≥ 2 → menace −1', () => {
  const g = mk();
  g.threat = 4;
  g.rngState = seedFor(3);
  teamPhase(g);
  E.doTeamAction(g, 'supply');
  assert.equal(g.threat, 3);
});

// ============ 2. Compétence discipline ============

test('discipline : un 1 est relancé une fois, journal « rattrapé »', () => {
  const g = mk({ skills: ['discipline'] });
  g.flags.teamSlip = 2;             // grâce déjà consommée → discipline prend le relais
  g.rngState = seedFor(1, 5);
  teamPhase(g);
  const hidden0 = g.clues.filter(c => !c.revealed).length;
  E.doTeamAction(g, 'intel');
  assert.equal(g.clues.filter(c => !c.revealed).length, hidden0 - 1);
  assert.match(logText(g), /rattrapé \[5\]/);
});

test('discipline : le second jet fait foi — un second 1 échoue quand même', () => {
  const g = mk({ skills: ['discipline'] });
  g.flags.teamSlip = 2;
  g.rngState = seedFor(1, 1);
  teamPhase(g);
  const hidden0 = g.clues.filter(c => !c.revealed).length;
  E.doTeamAction(g, 'intel');
  assert.equal(g.clues.filter(c => !c.revealed).length, hidden0);
  assert.match(logText(g), /rattrapé \[1\]/);
});

test('épreuve du feu : les deux premiers 1 d\'équipe sont couverts, le troisième mord', () => {
  const g = mk();
  teamPhase(g);
  const hidden0 = g.clues.filter(c => !c.revealed).length;
  g.rngState = seedFor(1);
  E.doTeamAction(g, 'intel');
  assert.equal(g.flags.teamSlip, 1);
  g.teamActionsLeft = 1; g.phase = 'team';
  g.rngState = seedFor(1);
  E.doTeamAction(g, 'intel');
  assert.equal(g.flags.teamSlip, 2);
  const covered = (logText(g).match(/couvert par la cellule/g) || []).length;
  assert.equal(covered, 2);
  assert.equal(g.clues.filter(c => !c.revealed).length, hidden0 - 2, 'les deux faux pas sont absorbés');
  // le troisième 1 mord pour de bon
  g.teamActionsLeft = 1; g.phase = 'team';
  g.rngState = seedFor(1);
  E.doTeamAction(g, 'intel');
  assert.match(logText(g), /à côté/);
});

// ============ 3. Promesse ============

function toNextTurn(g) {
  // avance une boucle complète : team → terreur (accalmie) → début de tour
  g.phase = 'team';
  g.terrorDeck = ['accalmie'];
  E.endPhase(g);
}

test('promesse : après 3 tours, jet ≤ 2 → mensonge découvert, marque levée, menace +1', () => {
  const g = mk();
  g.threat = 2;
  g.flags.promise = true;
  g.flags.promiseTurn = g.turn - 3;   // la promesse a déjà 3 tours
  g.rngState = seedFor(2);
  toNextTurn(g);
  assert.equal(g.flags.promise, false);
  assert.match(logText(g), /compris le mensonge/);
  assert.match(logText(g), /Il se demande si vous avez menti/);
});

test('promesse : jet > 2 → la marque expire, journal « tient encore » (une fois)', () => {
  const g = mk();
  g.threat = 2;
  g.flags.promise = true;
  g.flags.promiseTurn = g.turn - 3;
  g.rngState = seedFor(6);
  toNextTurn(g);
  assert.equal(g.flags.promise, false);   // la marque expire silencieusement
  const n1 = (logText(g).match(/tient encore/g) || []).length;
  assert.equal(n1, 1);
  // tour suivant : plus de vérification, aucun jet consommé
  const rng1 = g.rngState;
  toNextTurn(g);
  assert.equal(g.rngState, rng1);
  const n2 = (logText(g).match(/tient encore/g) || []).length;
  assert.equal(n2, 1);
});

test('promesse : avant 3 tours, aucun jet consommé', () => {
  const g = mk();
  g.threat = 2;
  g.flags.promise = true;
  g.flags.promiseTurn = g.turn;       // promesse fraîche
  const rng0 = g.rngState;
  toNextTurn(g);
  // un seul jet possible dans la boucle : rien ne doit l'avoir consommé
  assert.equal(g.rngState, rng0);
  assert.equal(g.flags.promise, true);
});

test('promesse : mark « promesse » enregistre le tour de la promesse', () => {
  const g = mk();
  g.turn = 4;
  g.phase = 'conversation';
  g.pc = 9;
  g.hand.push('promesse');           // carte auto : applique mark promesse
  const r = E.playCard(g, 'promesse');
  assert.equal(r.ok, true);
  assert.equal(g.flags.promise, true);
  assert.equal(g.flags.promiseTurn, 4);
});

// ============ 4. Exfiltration ciblée ============

test('exfiltration ciblée : succès → pendingChoice hostagePick, choix libère l\'otage désigné', () => {
  const g = mk();
  g.phase = 'conversation';
  g.pc = 9;
  g.threat = 2;
  g.hand.push('liberation_ciblee');
  g.rngState = seedFor(5, 5, 5);      // 3 dés, 3 succès → palier haut
  const r = E.playCard(g, 'liberation_ciblee');
  assert.equal(r.ok, true);
  assert.equal(g.phase, 'choice');
  assert.ok(g.pendingChoice && g.pendingChoice.hostagePick);

  const ch = E.getChoice(g);
  assert.ok(ch.hostagePick);
  assert.ok(ch.options.length > 1);
  // toutes les options sont des otages encore retenus
  const heldIds = E.heldHostages(g).map(h => h.id);
  assert.ok(ch.options.every(o => heldIds.includes(o.hid)));

  // choisir un otage NON vulnérable : c'est lui qui sort
  const idx = ch.options.findIndex(o => o.desc !== 'fragile');
  assert.ok(idx >= 0);
  const name = ch.options[idx].label;
  const freed0 = g.hostages.freed;
  const rc = E.chooseOption(g, idx);
  assert.equal(rc.ok, true);
  assert.equal(g.hostages.freed, freed0 + 1);
  assert.ok(logText(g).includes('Faites sortir'));
  assert.ok(E.heldHostages(g).length === heldIds.length - 1);
  const freedH = g.hostageList.find(h => h.status === 'freed' && name.includes(h.name));
  assert.ok(freedH, 'l\'otage choisi est marqué libéré');
});

test('exfiltration ciblée : carte présente dans les 6 missions écrites + pool générateur', () => {
  for (const mid of ['tutoriel', 'braquage', 'hopital', 'secte', 'prison', 'ferry']) {
    assert.ok(getMission(mid).market.includes('liberation_ciblee'), mid);
  }
  let found = false;
  for (let s = 1; s <= 30 && !found; s++) {
    if (generateMission(s).market.includes('liberation_ciblee')) found = true;
  }
  assert.ok(found, 'le pool du générateur doit contenir liberation_ciblee');
  assert.ok(MARKET_CARDS.liberation_ciblee.dice === 3);
});

// ============ 5. Journal narratif ============

test('recordResult ajoute des lignes de journal ; complice donne du contexte prison', () => {
  CAM.setStorage({ getItem: () => null, setItem: () => { }, removeItem: () => { } });
  const c = CAM.defaultCampaign();
  const score = { score: 500, grade: 'B', xp: 50 };
  CAM.recordResult(c, 'braquage', 'surrender', score, { killed: 0, freed: 6, remaining: 0, total: 6 });
  assert.ok(c.storyLog.length >= 1);
  assert.ok(c.storyLog.every(e => e.from && e.text && typeof e.day === 'number'));
  assert.equal(c.story.complice, true);
  const ctxs = storyContexts(c, 'prison');
  assert.ok(ctxs.length >= 1 && ctxs[0].text.includes('Rhodanien'));
  // en mission prison : le drapeau et la question dédiée sont actifs
  const g = E.createGame({ missionId: 'prison', seed: 7, story: c.story });
  assert.equal(g.flags.storyComplice, true);
  const q = getMission('prison').questions.find(q => q.id === 'q_rhodanien');
  assert.ok(q && q.flag === 'storyComplice');
});

test('story : lignes victoire/défaite pour les 6 écrites + générique', () => {
  for (const mid of ['tutoriel', 'braquage', 'hopital', 'secte', 'prison', 'ferry']) {
    for (const out of ['surrender', 'defeat']) {
      const entries = missionStoryEntries(mid, out);
      assert.ok(entries.length >= 1 && entries.length <= 2, `${mid}/${out}`);
      assert.ok(entries.every(e => e.from && e.text.length > 10));
    }
  }
  assert.ok(missionStoryEntries('gen:1', 'surrender').length >= 1);
});

// ============ 6. Trophées ============

function trophyCtx(over = {}) {
  const c = CAM.defaultCampaign();
  const state = over.state || {
    hostages: { killed: 0, freed: 6, remaining: 0, total: 6 },
    clues: [{ revealed: true }, { revealed: true }],
    threatMax: 4, log: [], stats: { conceded: 0 },
    result: { outcome: 'surrender' },
  };
  const ctx = {
    missionId: 'braquage', outcome: 'surrender', win: true,
    state, scoreInfo: { score: 500 }, repAfter: { presse: 5, hierarchie: 5 },
    ...over,
  };
  return { c, ctx };
}
const awarded = (c, ctx) => checkTrophies(c, ctx).map(t => t.id);

test('trophées : cas limites', () => {
  // premier_sang : une mission terminée dans la campagne
  {
    const { c, ctx } = trophyCtx();
    assert.ok(!awarded(c, ctx).includes('premier_sang'));
    const { c: c2, ctx: x2 } = trophyCtx();
    c2.missions['braquage'] = { finished: true };
    assert.ok(awarded(c2, x2).includes('premier_sang'));
  }
  // sans_faute : victoire sans mort / refus avec une mort
  {
    const { c, ctx } = trophyCtx();
    assert.ok(awarded(c, ctx).includes('sans_faute'));
    const { c: c2, ctx: x2 } = trophyCtx();
    x2.state.hostages.killed = 1;
    assert.ok(!awarded(c2, x2).includes('sans_faute'));
  }
  // pacificateur : victoire sans assaut ; refusé si issue = assault
  {
    const { c, ctx } = trophyCtx();
    assert.ok(awarded(c, ctx).includes('pacificateur'));
    const { c: c2, ctx: x2 } = trophyCtx({ outcome: 'assault' });
    x2.state.result = { outcome: 'assault' };
    assert.ok(!awarded(c2, x2).includes('pacificateur'));
  }
  // dossier : tous les indices révélés
  {
    const { c, ctx } = trophyCtx();
    assert.ok(awarded(c, ctx).includes('dossier'));
    const { c: c2, ctx: x2 } = trophyCtx();
    x2.state.clues[1].revealed = false;
    assert.ok(!awarded(c2, x2).includes('dossier'));
  }
  // menace : victoire après un pic à 6 ; refusé à 5
  {
    const { c, ctx } = trophyCtx();
    ctx.state.threatMax = 6;
    assert.ok(awarded(c, ctx).includes('menace'));
    const { c: c2, ctx: x2 } = trophyCtx();
    x2.state.threatMax = 5;
    assert.ok(!awarded(c2, x2).includes('menace'));
  }
  // heure_h : victoire après « HEURE H » dans le journal
  {
    const { c, ctx } = trophyCtx();
    ctx.state.log = [{ k: 'terror', text: '◆ HEURE H — la nuit touche à sa fin.' }];
    assert.ok(awarded(c, ctx).includes('heure_h'));
    const { c: c2, ctx: x2 } = trophyCtx();
    assert.ok(!awarded(c2, x2).includes('heure_h'));
  }
  // negociateur : reddition sur mission avancée seulement
  {
    const { c, ctx } = trophyCtx({ missionId: 'prison' });
    assert.ok(awarded(c, ctx).includes('negociateur'));
    const { c: c2, ctx: x2 } = trophyCtx({ missionId: 'braquage' });
    assert.ok(!awarded(c2, x2).includes('negociateur'));
  }
  // sauveur : 30 sauvés en carrière — 29 refusé, 30 accepté
  {
    const { c, ctx } = trophyCtx();
    c.stats.savedTotal = 29;
    assert.ok(!awarded(c, ctx).includes('sauveur'));
    const { c: c2, ctx: x2 } = trophyCtx();
    c2.stats.savedTotal = 30;
    assert.ok(awarded(c2, x2).includes('sauveur'));
  }
  // opinion / confiance : jauges ≥ 9
  {
    const { c, ctx } = trophyCtx();
    ctx.repAfter = { presse: 9, hierarchie: 8 };
    const got = awarded(c, ctx);
    assert.ok(got.includes('opinion') && !got.includes('confiance'));
    const { c: c2, ctx: x2 } = trophyCtx();
    x2.repAfter = { presse: 8, hierarchie: 9 };
    const got2 = awarded(c2, x2);
    assert.ok(got2.includes('confiance') && !got2.includes('opinion'));
  }
  // improvise : victoire sur mission générée
  {
    const { c, ctx } = trophyCtx({ missionId: 'gen:12345' });
    assert.ok(awarded(c, ctx).includes('improvise'));
    const { c: c2, ctx: x2 } = trophyCtx();
    assert.ok(!awarded(c2, x2).includes('improvise'));
  }
  // un trophée déjà acquis n'est pas redonné
  {
    const { c, ctx } = trophyCtx();
    c.trophies = ['sans_faute'];
    assert.ok(!awarded(c, ctx).includes('sans_faute'));
  }
});

test('trophée serie7 : sept missions du jour sur sept dates consécutives', () => {
  CAM.setStorage({ getItem: () => null, setItem: () => { }, removeItem: () => { } });
  const c = CAM.defaultCampaign();
  const host = { killed: 0, freed: 4, remaining: 0, total: 4 };
  const d0 = new Date(2024, 5, 10);
  for (let i = 0; i < 6; i++) {
    const d = new Date(d0); d.setDate(d.getDate() + i);
    CAM.recordDaily(c, `gen:${CAM.dailySeed(d)}`, 'surrender', { score: 10, grade: 'D' }, host, d);
  }
  const { ctx } = trophyCtx();
  ctx.c = c;
  assert.equal(c.dailyStreak.count, 6);
  assert.ok(!checkTrophies(c, ctx).map(t => t.id).includes('serie7'));
  const d7 = new Date(d0); d7.setDate(d7.getDate() + 6);
  CAM.recordDaily(c, `gen:${CAM.dailySeed(d7)}`, 'defeat', { score: 1, grade: 'D' }, host, d7);
  assert.equal(c.dailyStreak.count, 7);
  const ctx2 = { missionId: 'x', outcome: 'defeat', win: false, state: { hostages: { killed: 0 }, clues: [], log: [] }, repAfter: { presse: 5, hierarchie: 5 } };
  assert.ok(checkTrophies(c, ctx2).map(t => t.id).includes('serie7'));
  // trou dans la série → repart à 1
  const d9 = new Date(d0); d9.setDate(d9.getDate() + 8);
  CAM.recordDaily(c, `gen:${CAM.dailySeed(d9)}`, 'surrender', { score: 1, grade: 'D' }, host, d9);
  assert.equal(c.dailyStreak.count, 1);
  assert.ok(getTrophy('serie7'));
});

// ============ 7. Compétences ============

test('lecture_froide : badge cohérent sans indice révélé à la première question', () => {
  const m = getMission('braquage');
  const q = m.questions.find(q => q.replies.some(r => r.effects && r.effects.ifClue && r.effects.ifClue.then && (r.effects.ifClue.then.threat || 0) < 0));
  assert.ok(q, 'il faut une question avec réponse cohérente');
  const reply = q.replies.find(r => r.effects && r.effects.ifClue && (r.effects.ifClue.then.threat || 0) < 0);
  const clueId = reply.effects.ifClue.id;

  const g1 = mk({ skills: ['lecture_froide'] });
  g1.questionsAsked = [q.id];                      // première question en cours
  assert.equal(E.getClue(g1, clueId).revealed, false);
  assert.equal(E.replyCoherent(g1, reply), true);

  const g2 = mk();                                  // sans la compétence → pas de badge
  g2.questionsAsked = [q.id];
  assert.equal(E.replyCoherent(g2, reply), false);

  const g3 = mk({ skills: ['lecture_froide'] });    // questions suivantes → indice requis
  g3.questionsAsked = ['q1', 'q2'];
  assert.equal(E.replyCoherent(g3, reply), false);
});

test('nerfs_acier : chrono de base 75 s via flags.chronoBase', () => {
  const g = mk({ skills: ['nerfs_acier'] });
  assert.equal(g.flags.chronoBase, 75);
  const g0 = mk();
  assert.equal(g0.flags.chronoBase, 60);
});

test('relations : jauges plancher à 6 pour les modificateurs', () => {
  const rep = { presse: 1, hierarchie: 1 };
  const eff = repEffective(rep, ['relations']);
  assert.deepEqual(eff, { presse: 6, hierarchie: 6 });
  assert.deepEqual(repEffective(rep, []), rep);
  // en moteur : presse 1 sans relations → pression de départ +2 ; avec → rien
  const low = mk({ rep: { presse: 1, hierarchie: 5 } });
  assert.ok(low.pressure >= 2, 'presse basse doit presser');
  const lifted = mk({ rep: { presse: 1, hierarchie: 1 }, skills: ['relations'] });
  assert.equal(lifted.assaultAt, 10, 'hiérarchie 1 vue à 6 : pas de seuil abaissé');
});

// ============ 8. Export / import ============

test('export/import : aller-retour de la campagne', () => {
  const c = CAM.defaultCampaign();
  c.agentName = 'Doc';
  c.xp = 640;
  c.skills = ['voix_posee', 'lecture_froide'];
  c.trophies = ['premier_sang'];
  c.story.complice = true;
  c.storyLog = [{ day: 3, mission: 'braquage', from: 'castagne', text: 'x'.repeat(20) }];
  c.rep = { presse: 7, hierarchie: 3 };
  const code = CAM.exportSave(c);
  assert.ok(/^[A-Za-z0-9_-]+$/.test(code), 'base64url');
  const back = CAM.importSave(code);
  assert.equal(back.agentName, 'Doc');
  assert.equal(back.xp, 640);
  assert.deepEqual(back.skills, ['voix_posee', 'lecture_froide']);
  assert.deepEqual(back.trophies, ['premier_sang']);
  assert.equal(back.story.complice, true);
  assert.equal(back.storyLog.length, 1);
  assert.deepEqual(back.rep, { presse: 7, hierarchie: 3 });
});

test('import : données invalides rejetées', () => {
  assert.throws(() => CAM.importSave('pas-du-base64!!!'));
  assert.throws(() => CAM.importSave(''));
  const badV = btoa(JSON.stringify({ v: 2, campaign: {} }));
  assert.throws(() => CAM.importSave(badV));
  const noCamp = btoa(JSON.stringify({ v: 1 }));
  assert.throws(() => CAM.importSave(noCamp));
});

test('migration : ancienne campagne sans trophées/journal/streak chargée', () => {
  const store = new Map();
  CAM.setStorage({
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
  });
  const legacy = { version: 1, agentName: 'X', xp: 120, missions: {}, skills: ['voix_posee'], rep: { presse: 8 } };
  store.set('negociateur_campaign_v1', JSON.stringify(legacy));
  const c = CAM.loadCampaign();
  assert.deepEqual(c.trophies, []);
  assert.deepEqual(c.storyLog, []);
  assert.deepEqual(c.dailyStreak, { count: 0, lastSeed: null });
  assert.deepEqual(c.stats, { savedTotal: 0 });
  assert.deepEqual(c.story, { complice: false, levant: false });
  assert.equal(c.rep.presse, 8);
  assert.equal(c.rep.hierarchie, 5);
});

// ============ 9. threatMax ============

test('threatMax suit le pic de menace (trophée « menace »)', () => {
  const g = mk();
  const t0 = g.threat;
  assert.equal(g.threatMax, t0);
  g.threat = 6;
  g.phase = 'team'; g.teamActionsLeft = 1;
  g.threat = 5; g.rngState = seedFor(1);
  E.doTeamAction(g, 'sniper');         // repéré → menace 6
  assert.equal(g.threatMax, 6);
  g.threat = 2;                        // descente : le pic reste
  g.phase = 'team'; g.teamActionsLeft = 1;
  E.doTeamAction(g, 'supply');
  assert.equal(g.threatMax, 6);
});
