// ============================================================
// Campagne — persistance localStorage (versionné, mockable)
// ============================================================

export const RANKS = [
  { name: 'Stagiaire', xp: 0 },
  { name: 'Négociateur', xp: 300 },
  { name: 'Négociateur principal', xp: 700 },
  { name: 'Chef de cellule', xp: 1200 },
  { name: 'Légende du RAID', xp: 2000 },
];

const KEY_CAMPAIGN = 'negociateur_campaign_v1';
const KEY_SAVE = 'negociateur_save_v1';
const KEY_SETTINGS = 'negociateur_settings_v1';

// Stockage injectable pour les tests (mock localStorage)
let store = typeof localStorage !== 'undefined' ? localStorage : null;
export function setStorage(s) { store = s; }
function get(k) { try { return store ? store.getItem(k) : null; } catch { return null; } }
function set(k, v) { try { store && store.setItem(k, v); } catch { /* quota */ } }
function del(k) { try { store && store.removeItem(k); } catch { } }

// ---------------- Campagne ----------------
const DEFAULT_SETTINGS = { mute: false, volume: 0.7, flash: true, music: true };

export function defaultCampaign() {
  return {
    version: 1,
    agentName: null,
    xp: 0,
    skillPoints: 0,
    skills: [],
    stress: 0,
    day: 1,
    missions: {}, // id -> {plays, wins, bestScore, bestGrade, finished}
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function loadCampaign() {
  const raw = get(KEY_CAMPAIGN);
  if (!raw) return null;
  try {
    const c = JSON.parse(raw);
    return c && c.version === 1 ? c : null;
  } catch { return null; }
}

export function saveCampaign(c) {
  set(KEY_CAMPAIGN, JSON.stringify(c));
}

export function resetCampaign() {
  del(KEY_CAMPAIGN);
  del(KEY_SAVE);
}

export function getRank(xp) {
  let r = RANKS[0], idx = 0;
  RANKS.forEach((rank, i) => { if (xp >= rank.xp) { r = rank; idx = i; } });
  const next = RANKS[idx + 1] || null;
  return { rank: r, index: idx, next };
}

export function missionUnlocked(c, missionId, missionList) {
  if (missionId === 'tutoriel') return true;
  const tuto = c.missions['tutoriel'];
  if (!(tuto && tuto.finished)) return false;
  // scénarios avancés : les deux classiques terminés hors défaite
  const m = missionList && missionList.find(x => x.id === missionId);
  if (m && m.type === 'advanced') {
    return ['braquage', 'hopital'].every(id => c.missions[id] && c.missions[id].wins > 0);
  }
  return true;
}

export function recordResult(c, missionId, outcome, scoreInfo, hostages, options = {}) {
  const m = c.missions[missionId] || { plays: 0, wins: 0, bestScore: 0, bestGrade: 'D', finished: false };
  m.plays++;
  m.finished = true;
  const win = outcome !== 'defeat';
  if (win) m.wins++;
  if (scoreInfo.score > m.bestScore) { m.bestScore = scoreInfo.score; m.bestGrade = scoreInfo.grade; }
  c.missions[missionId] = m;

  // XP + rangs
  const before = getRank(c.xp).index;
  c.xp += scoreInfo.xp;
  const after = getRank(c.xp).index;
  const rankUps = after - before;
  c.skillPoints += rankUps;

  // Stress
  if (options.hardcore && outcome === 'defeat') {
    c.stress = 5;
  } else {
    c.stress = Math.max(0, Math.min(5, c.stress + hostages.killed + (outcome === 'defeat' ? 2 : 0) - (hostages.killed === 0 ? 1 : 0)));
  }

  return { rankUps, win, stress: c.stress };
}

export function restDay(c) {
  c.stress = Math.max(0, c.stress - 2);
  c.day += 1;
}

export function learnSkill(c, skillId) {
  if (c.skillPoints <= 0 || c.skills.includes(skillId)) return false;
  c.skillPoints--;
  c.skills.push(skillId);
  return true;
}

// ---------------- Sauvegarde de partie ----------------
export function saveGame(state) {
  set(KEY_SAVE, JSON.stringify(state));
}

export function loadGame() {
  const raw = get(KEY_SAVE);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearGame() {
  del(KEY_SAVE);
}

// ---------------- Réglages ----------------
export function loadSettings() {
  const raw = get(KEY_SETTINGS);
  if (raw) { try { return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }; } catch { } }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(s) {
  set(KEY_SETTINGS, JSON.stringify(s));
}
