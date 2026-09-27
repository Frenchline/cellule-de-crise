// ============================================================
// Compétences du négociateur (débloquées par rang)
// ============================================================

export const SKILLS = {
  voix_posee: {
    id: 'voix_posee', name: 'Voix posée',
    desc: '+1 PC au tour 1. Votre première phrase pose le cadre.',
    effect: { pcTurn1: 1 },
  },
  profileur: {
    id: 'profileur', name: 'Profileur',
    desc: 'Un indice psychologique est révélé dès le départ.',
    effect: { revealAtStart: 1 },
  },
  sang_froid: {
    id: 'sang_froid', name: 'Sang-froid',
    desc: 'Une relance de dés par mission (le meilleur jet est gardé).',
    effect: { rerolls: 1 },
  },
  reseau: {
    id: 'reseau', name: 'Réseau',
    desc: 'Une action d\'équipe supplémentaire par mission.',
    effect: { extraTeamAction: 1 },
  },
  coord_tactique: {
    id: 'coord_tactique', name: 'Coordinateur tactique',
    desc: 'La préparation de l\'assaut commence à 1.',
    effect: { prepStart: 1 },
  },
  empathie_nat: {
    id: 'empathie_nat', name: 'Empathie naturelle',
    desc: '+1 dé sur toutes les cartes « empathie ».',
    effect: { diceTag: { empathie: 1 } },
  },
  presence: {
    id: 'presence', name: 'Présence',
    desc: '+1 dé sur toutes les cartes « autorité ».',
    effect: { diceTag: { autorite: 1 } },
  },
  presse: {
    id: 'presse', name: 'Relations presse',
    desc: 'La pression médiatique ne monte qu\'un tour sur deux.',
    effect: { pressureEveryOther: true },
  },
  // ---------- compétences avancées (coût en points) ----------
  lecture_froide: {
    id: 'lecture_froide', name: 'Lecture froide', cost: 2,
    desc: 'À sa première question, les réponses cohérentes avec son profil sont marquées — même sans indice révélé.',
    effect: { readFirstQuestion: true },
  },
  relations: {
    id: 'relations', name: 'Relations', cost: 1,
    desc: 'Carnet d\'adresses : vos réputations (presse, hiérarchie) comptent pour 6 au minimum dans les modificateurs de mission.',
    effect: { repFloor: 6 },
  },
  nerfs_acier: {
    id: 'nerfs_acier', name: 'Nerfs d\'acier', cost: 2,
    desc: 'L\'option Chrono passe de 60 s à 75 s par phase de conversation.',
    effect: { chrono: 75 },
  },
  discipline: {
    id: 'discipline', name: 'Discipline d\'équipe', cost: 2,
    desc: 'Un jet d\'équipe raté (1) est relancé une fois — le second jet fait foi.',
    effect: { teamReroll: true },
  },
};

export const SKILL_LIST = Object.values(SKILLS);
