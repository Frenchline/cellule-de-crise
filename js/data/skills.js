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
};

export const SKILL_LIST = Object.values(SKILLS);
