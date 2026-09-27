// Tests campagne — localStorage mocké
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as CAM from '../js/campaign.js';
import { MISSION_LIST } from '../js/data/missions/index.js';

function mockStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
  };
}

CAM.setStorage(mockStorage());

test('campagne : création, sauvegarde, rechargement', () => {
  const c = CAM.defaultCampaign();
  c.agentName = 'Doc';
  c.xp = 150;
  CAM.saveCampaign(c);
  const c2 = CAM.loadCampaign();
  assert.equal(c2.agentName, 'Doc');
  assert.equal(c2.xp, 150);
});

test('rangs par paliers XP', () => {
  assert.equal(CAM.getRank(0).rank.name, 'Stagiaire');
  assert.equal(CAM.getRank(300).rank.name, 'Négociateur');
  assert.equal(CAM.getRank(750).rank.name, 'Négociateur principal');
  assert.equal(CAM.getRank(1300).rank.name, 'Chef de cellule');
  assert.equal(CAM.getRank(5000).rank.name, 'Légende du RAID');
});

test('recordResult : XP, victoire, stress', () => {
  CAM.setStorage(mockStorage());
  const c = CAM.defaultCampaign();
  c.agentName = 'X';
  const scoreInfo = { score: 800, grade: 'A', xp: 80 };
  const r = CAM.recordResult(c, 'tutoriel', 'surrender', scoreInfo, { killed: 0, freed: 3, remaining: 0, total: 3 });
  assert.equal(c.xp, 80);
  assert.equal(c.missions.tutoriel.wins, 1);
  assert.equal(c.missions.tutoriel.finished, true);
  assert.equal(c.stress, 0); // -1 sans mort
  const r2 = CAM.recordResult(c, 'braquage', 'defeat', scoreInfo, { killed: 4, freed: 0, remaining: 0, total: 6 });
  assert.equal(c.stress, 5); // 4 tués +2 défaite, cap 5
  // stress ≥ 3 → repos
  CAM.restDay(c);
  assert.equal(c.stress, 3);
  CAM.restDay(c);
  assert.equal(c.stress, 1);
});

test('déblocage : classiques après le tutoriel', () => {
  const c = CAM.defaultCampaign();
  assert.equal(CAM.missionUnlocked(c, 'braquage'), false);
  CAM.recordResult(c, 'tutoriel', 'surrender', { score: 100, grade: 'D', xp: 10 }, { killed: 0 });
  assert.equal(CAM.missionUnlocked(c, 'braquage'), true);
});

test('points de compétence à la montée de rang', () => {
  const c = CAM.defaultCampaign();
  c.xp = 290;
  CAM.recordResult(c, 'tutoriel', 'surrender', { score: 500, grade: 'B', xp: 50 }, { killed: 0 });
  assert.equal(c.skillPoints, 1); // 340 XP → rang Négociateur
  assert.equal(CAM.learnSkill(c, 'voix_posee'), true);
  assert.equal(CAM.learnSkill(c, 'voix_posee'), false); // déjà apprise
});

test('sauvegarde/reprise de partie', () => {
  CAM.setStorage(mockStorage());
  const fake = { version: 1, missionId: 'braquage', turn: 3, pc: 2 };
  CAM.saveGame(fake);
  const s = CAM.loadGame();
  assert.equal(s.missionId, 'braquage');
  assert.equal(s.turn, 3);
  CAM.clearGame();
  assert.equal(CAM.loadGame(), null);
});

test('réglages : fusion avec les défauts (joueur de retour)', () => {
  const store = mockStorage();
  CAM.setStorage(store);
  // ancienne sauvegarde sans la clé « music » (réglage ajouté après coup)
  store.setItem('negociateur_settings_v1', JSON.stringify({ mute: false, volume: 0.7, rain: true, flash: true }));
  const s = CAM.loadSettings();
  assert.equal(s.music, true);
  assert.equal(s.volume, 0.7);
  assert.equal(s.flash, true);
});

test('déblocage : scénarios avancés après les 2 classiques gagnées', () => {
  const c = CAM.defaultCampaign();
  const unlocked = () => CAM.missionUnlocked(c, 'secte', MISSION_LIST);
  assert.equal(unlocked(), false); // tutoriel pas fini
  CAM.recordResult(c, 'tutoriel', 'surrender', { score: 100, grade: 'D', xp: 10 }, { killed: 0 });
  assert.equal(unlocked(), false); // classiques pas finies
  CAM.recordResult(c, 'braquage', 'defeat', { score: 10, grade: 'D', xp: 1 }, { killed: 2 });
  CAM.recordResult(c, 'hopital', 'surrender', { score: 100, grade: 'D', xp: 10 }, { killed: 0 });
  assert.equal(unlocked(), false); // braquage = défaite, pas de win
  CAM.recordResult(c, 'braquage', 'liberation', { score: 500, grade: 'B', xp: 50 }, { killed: 0 });
  assert.equal(unlocked(), true);
  assert.equal(CAM.missionUnlocked(c, 'prison', MISSION_LIST), true);
  assert.equal(CAM.missionUnlocked(c, 'ferry', MISSION_LIST), true);
});

test('missions générées : pas d\'entrée dans campaign.missions, XP/stress appliqués', () => {
  const c = CAM.defaultCampaign();
  const scoreInfo = { score: 400, grade: 'B', xp: 40 };
  CAM.recordResult(c, 'gen:12345', 'surrender', scoreInfo, { killed: 0, freed: 4, remaining: 0, total: 4 });
  assert.equal(c.missions['gen:12345'], undefined);
  assert.equal(c.xp, 40);
  const daily = CAM.dailyMissionId();
  CAM.recordResult(c, daily, 'defeat', { score: 10, grade: 'D', xp: 1 }, { killed: 2, freed: 1, remaining: 0, total: 4 });
  assert.equal(c.missions[daily], undefined);
});

test('mission du jour : premier résultat seulement', () => {
  const c = CAM.defaultCampaign();
  const daily = CAM.dailyMissionId();
  const host = { killed: 1, freed: 3, remaining: 0, total: 4 };
  assert.ok(CAM.recordDaily(c, daily, 'liberation', { score: 500, grade: 'A' }, host));
  assert.deepEqual(c.daily, { date: CAM.dailySeed(), grade: 'A', score: 500, saved: 3, total: 4 });
  // un replay ne remplace pas le premier résultat
  assert.equal(CAM.recordDaily(c, daily, 'defeat', { score: 0, grade: 'D' }, host), false);
  assert.equal(c.daily.grade, 'A');
  // une autre mission générée ne touche pas le record du jour
  assert.equal(CAM.recordDaily(c, 'gen:999', 'liberation', { score: 700, grade: 'S' }, host), false);
});

test('réputation : défaut 5/5, migration d\'ancienne sauvegarde', () => {
  const c = CAM.defaultCampaign();
  assert.deepEqual(c.rep, { presse: 5, hierarchie: 5 });
  // ancienne campagne sans rep → merge des défauts au chargement
  const legacy = { version: 1, agentName: 'X', xp: 0, missions: {} };
  CAM.saveCampaign(legacy);
  const loaded = CAM.loadCampaign();
  assert.deepEqual(loaded.rep, { presse: 5, hierarchie: 5 });
  CAM.saveCampaign(c); // restaure un état propre pour les tests suivants
});

test('applyReputation : deltas appliqués, repLast rempli, tutoriel ignoré', () => {
  const c = CAM.defaultCampaign();
  const game = {
    result: { outcome: 'surrender' },
    pressure: 4, turn: 8,
    hostages: { killed: 0, freed: 6, remaining: 0, total: 6 },
    flags: { majorConcessions: 0 },
  };
  const report = CAM.applyReputation(c, 'braquage', game);
  assert.ok(report);
  assert.equal(c.rep.presse, 7);        // +1 presse ≤5, +1 reddition
  assert.equal(c.rep.hierarchie, 6);    // +1 reddition
  assert.equal(report.presse.before, 5);
  assert.equal(report.presse.after, 7);
  assert.ok(c.repLast.presse && c.repLast.hierarchie);
  // tutoriel : pas de réputation
  const c2 = CAM.defaultCampaign();
  assert.equal(CAM.applyReputation(c2, 'tutoriel', game), null);
  assert.equal(c2.rep.presse, 5);
  // défaite avec morts : bornes
  const dead = { ...game, result: { outcome: 'defeat' }, pressure: 9, hostages: { killed: 6, freed: 0, remaining: 0, total: 6 } };
  CAM.applyReputation(c, 'braquage', dead);
  assert.ok(c.rep.presse <= 10 && c.rep.presse >= 0);
  assert.equal(c.rep.hierarchie, 4);    // 6 − 2
});
