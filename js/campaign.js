// ============================================================
// Campagne — persistance localStorage (versionné, mockable)
// ============================================================
import { REP_DEFAULT, repDeltas, repReport } from './reputation.js';
import { SKILLS } from './data/skills.js';
import { checkTrophies, repAfterMission } from './trophies.js';
import { appendStoryLog, updateStoryFlags } from './data/story.js';

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
const DEFAULT_SETTINGS = { mute: false, volume: 0.7, flash: true, music: true, advice: true };

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
    rep: { ...REP_DEFAULT },     // réputation : presse / hierarchie (0–10)
    repLast: null,               // dernières répliques { presse, hierarchie }
    settings: { ...DEFAULT_SETTINGS },
    daily: null,                 // résultat de la mission du jour
    dailyStreak: { count: 0, lastSeed: null }, // jours consécutifs de mission du jour
    stats: { savedTotal: 0 },    // otages sauvés en carrière
    trophies: [],                // ids de trophées débloqués
    storyLog: [],                // journal narratif (cap 20)
    story: { complice: false, levant: false }, // fils narratifs entre missions
  };
}

// Remplit les champs manquants d'une campagne (migration douce).
function fillCampaignDefaults(c) {
  const d = defaultCampaign();
  for (const k of Object.keys(d)) if (c[k] === undefined) c[k] = d[k];
  c.rep = { ...REP_DEFAULT, ...(c.rep || {}) };
  c.dailyStreak = { count: 0, lastSeed: null, ...(c.dailyStreak || {}) };
  c.stats = { savedTotal: 0, ...(c.stats || {}) };
  c.story = { complice: false, levant: false, ...(c.story || {}) };
  return c;
}

export function loadCampaign() {
  const raw = get(KEY_CAMPAIGN);
  if (!raw) return null;
  try {
    const c = JSON.parse(raw);
    if (!c || c.version !== 1) return null;
    // migration : jauges de réputation ajoutées en v9 + champs v12
    return fillCampaignDefaults(c);
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

// Missions générées (« gen:<seed> ») : pas d'entrée dans c.missions
// (localStorage borné) — seul campaign.daily persiste, et la mission du jour.
export function isGeneratedMission(id) { return typeof id === 'string' && id.startsWith('gen:'); }

// Seed de la mission du jour : date locale AAAAMMJJ, identique pour tous.
export function dailySeed(date = new Date()) {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}
export function dailyMissionId(date = new Date()) { return `gen:${dailySeed(date)}`; }

// Premier résultat du jour seulement — les replays n'écrasent pas.
// Met à jour la série de jours consécutifs (dailyStreak, trophée « serie7 »).
export function recordDaily(c, missionId, outcome, scoreInfo, hostages, date = new Date()) {
  const today = dailySeed(date);
  if (missionId !== `gen:${today}`) return false;
  if (c.daily && c.daily.date === today) return false;
  c.daily = {
    date: today,
    grade: scoreInfo.grade,
    score: scoreInfo.score,
    saved: hostages.total - hostages.killed,
    total: hostages.total,
  };
  c.dailyStreak = c.dailyStreak || { count: 0, lastSeed: null };
  const y = new Date(date); y.setDate(y.getDate() - 1);
  if (c.dailyStreak.lastSeed === dailySeed(y)) c.dailyStreak.count += 1;
  else if (c.dailyStreak.lastSeed !== today) c.dailyStreak.count = 1;
  c.dailyStreak.lastSeed = today;
  return true;
}

// `state` = l'état de fin de partie (optionnel : trophées/journal limités sans lui).
export function recordResult(c, missionId, outcome, scoreInfo, hostages, options = {}, state = null) {
  const m = c.missions[missionId] || { plays: 0, wins: 0, bestScore: 0, bestGrade: 'D', finished: false };
  m.plays++;
  m.finished = true;
  const win = outcome !== 'defeat';
  if (win) m.wins++;
  if (scoreInfo.score > m.bestScore) { m.bestScore = scoreInfo.score; m.bestGrade = scoreInfo.grade; }
  if (!isGeneratedMission(missionId)) c.missions[missionId] = m;

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

  // stats carrière + journal narratif + fils entre missions + trophées
  c.stats = c.stats || { savedTotal: 0 };
  c.stats.savedTotal += Math.max(0, (hostages.total || 0) - (hostages.killed || 0));
  appendStoryLog(c, missionId, outcome);
  updateStoryFlags(c, missionId, outcome);
  const repAfter = repAfterMission(c, missionId, outcome, state);
  const newTrophies = state ? checkTrophies(c, { missionId, outcome, win, state, scoreInfo, repAfter }) : [];

  return { rankUps, win, stress: c.stress, newTrophies };
}

// Applique les deltas de réputation après une mission (sauf tutoriel).
// Retourne le rapport {presse, hierarchie, psy} pour le débrief, ou null.
export function applyReputation(c, missionId, game) {
  if (missionId === 'tutoriel' || !game || !game.result) return null;
  c.rep = { ...REP_DEFAULT, ...(c.rep || {}) };
  const report = repReport(c.rep, repDeltas(game.result.outcome, game), game, c.stress);
  c.rep.presse = report.presse.after;
  c.rep.hierarchie = report.hierarchie.after;
  c.repLast = { presse: report.presse.line, hierarchie: report.hierarchie.line };
  return report;
}

export function restDay(c) {
  c.stress = Math.max(0, c.stress - 2);
  c.day += 1;
}

export function learnSkill(c, skillId) {
  const s = SKILLS[skillId];
  const cost = s ? (s.cost || 1) : 1;
  if (c.skillPoints < cost || c.skills.includes(skillId)) return false;
  c.skillPoints -= cost;
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

// ---------------- Export / import de la progression ----------------
// Code base64url d'un JSON { v: 1, campaign }. Sans dépendance.

function toB64url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(str) {
  const b64 = String(str).trim().replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, ch => ch.charCodeAt(0)));
}

export function exportSave(campaign) {
  return toB64url(JSON.stringify({ v: 1, campaign }));
}

// Retourne une campagne validée (fusionnée avec les défauts) ou jette.
export function importSave(str) {
  let data;
  try { data = JSON.parse(fromB64url(str)); }
  catch { throw new Error('Code invalide'); }
  if (!data || data.v !== 1 || !data.campaign || typeof data.campaign !== 'object') {
    throw new Error('Code invalide');
  }
  const src = data.campaign;
  const c = fillCampaignDefaults({ ...defaultCampaign(), ...src });
  c.missions = (src.missions && typeof src.missions === 'object') ? src.missions : {};
  c.skills = Array.isArray(src.skills) ? src.skills.filter(s => typeof s === 'string' && SKILLS[s]) : [];
  c.trophies = Array.isArray(src.trophies) ? src.trophies.filter(t => typeof t === 'string') : [];
  c.storyLog = Array.isArray(src.storyLog) ? src.storyLog.slice(-20) : [];
  c.xp = Math.max(0, src.xp | 0);
  c.skillPoints = Math.max(0, src.skillPoints | 0);
  c.stress = Math.max(0, Math.min(5, src.stress | 0));
  c.day = Math.max(1, src.day | 0);
  c.agentName = src.agentName || 'Négociateur';
  return c;
}
