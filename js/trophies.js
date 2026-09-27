// ============================================================
// Trophées de campagne — module pur, aucun DOM.
// checkTrophies(campaign, ctx) est appelé depuis recordResult
// (après le calcul de l'issue) et retourne les nouveaux trophées.
// ctx = { missionId, outcome, win, state, scoreInfo, repAfter }
// ============================================================

import { repDeltas, REP_DEFAULT } from './reputation.js';
import { getMission } from './data/missions/index.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Réputation projetée après application des deltas (même logique que
// applyReputation — sauf tutoriel qui ne fait pas bouger les jauges).
export function repAfterMission(c, missionId, outcome, state) {
  const rep = { ...REP_DEFAULT, ...(c.rep || {}) };
  if (missionId === 'tutoriel' || !state) return rep;
  const d = repDeltas(outcome, state);
  return {
    presse: clamp(rep.presse + d.presse, 0, 10),
    hierarchie: clamp(rep.hierarchie + d.hierarchie, 0, 10),
  };
}

export const TROPHIES = [
  {
    id: 'premier_sang', name: 'Premier sang',
    desc: 'Terminer sa première mission, quelle que soit l\'issue.',
    check: (ctx) => Object.values(ctx.c.missions || {}).some(m => m.finished),
  },
  {
    id: 'sans_faute', name: 'Sans faute',
    desc: 'Victoire sans aucun otage tué.',
    check: (ctx) => ctx.win && ctx.state.hostages.killed === 0,
  },
  {
    id: 'pacificateur', name: 'Pacificateur',
    desc: 'Victoire sans jamais donner l\'assaut.',
    check: (ctx) => ctx.win && ctx.outcome !== 'assault',
  },
  {
    id: 'dossier', name: 'Dossier complet',
    desc: 'Terminer une mission avec tous les indices révélés.',
    check: (ctx) => (ctx.state.clues || []).length > 0 && ctx.state.clues.every(c => c.revealed),
  },
  {
    id: 'menace', name: 'Au bord',
    desc: 'Survivre à une menace de 6 et gagner quand même.',
    check: (ctx) => ctx.win && (ctx.state.threatMax ?? ctx.state.threat) >= 6,
  },
  {
    id: 'heure_h', name: 'À l\'heure H',
    desc: 'Victoire après épuisement de la pioche Terreur.',
    check: (ctx) => ctx.win && (ctx.state.log || []).some(e => /HEURE H/.test(e.text || '')),
  },
  {
    id: 'negociateur', name: 'La voix seule',
    desc: 'Obtenir la reddition sur un scénario avancé.',
    check: (ctx) => ctx.outcome === 'surrender' && !!(getMission(ctx.missionId) || {}).acts,
  },
  {
    id: 'serie7', name: 'Semaine de garde',
    desc: 'Jouer la mission du jour sept jours de suite.',
    check: (ctx) => ((ctx.c.dailyStreak && ctx.c.dailyStreak.count) || 0) >= 7,
  },
  {
    id: 'sauveur', name: 'Trente vies',
    desc: 'Trente otages sauvés sur l\'ensemble de la carrière.',
    check: (ctx) => ((ctx.c.stats && ctx.c.stats.savedTotal) || 0) >= 30,
  },
  {
    id: 'opinion', name: 'La une du 20 heures',
    desc: 'Réputation presse à 9 ou plus.',
    check: (ctx) => (ctx.repAfter ? ctx.repAfter.presse : 0) >= 9,
  },
  {
    id: 'confiance', name: 'Confiance du préfet',
    desc: 'Réputation hiérarchie à 9 ou plus.',
    check: (ctx) => (ctx.repAfter ? ctx.repAfter.hierarchie : 0) >= 9,
  },
  {
    id: 'improvise', name: 'Sans dossier',
    desc: 'Victoire sur une mission générée (Opérations spéciales).',
    check: (ctx) => ctx.win && typeof ctx.missionId === 'string' && ctx.missionId.startsWith('gen:'),
  },
];

export function getTrophy(id) { return TROPHIES.find(t => t.id === id) || null; }

// Vérifie les trophées non encore acquis ; écrit c.trophies.
// Retourne les trophées nouvellement débloqués [{id,name,desc}].
export function checkTrophies(c, ctx) {
  if (!Array.isArray(c.trophies)) c.trophies = [];
  ctx.c = c;
  const fresh = [];
  for (const t of TROPHIES) {
    if (c.trophies.includes(t.id)) continue;
    let ok = false;
    try { ok = !!t.check(ctx); } catch { ok = false; }
    if (ok) { c.trophies.push(t.id); fresh.push({ id: t.id, name: t.name, desc: t.desc }); }
  }
  return fresh;
}
