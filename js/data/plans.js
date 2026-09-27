// ============================================================
// Plans tactiques — données déclaratives par base de scène.
// posts  : positions du tireur (posts[0] = poste sûr, comportement
//          historique : prép. +1, repéré si menace ≥ 5).
// entries: axes d'assaut (entries[0] = entrée principale, défaut
//          pour assaut forcé et Heure H).
//   riskMod  : ajouté au risque de base (plancher à 1).
//   needsPlan: nécessite state.planKnown (premier Renseignement).
//   escapeOn : à préparation 0, jets de fuite possibles (défaut [1]).
// ============================================================

import { getMissionDef } from '../engine.js';

export const PLANS = {
  pharmacie: {
    posts: [
      { id: 'toit', name: 'Toit de la galerie', desc: 'prép. +1 · repéré si menace ≥ 5', prep: 1, detectAt: 5 },
      { id: 'reserve', name: 'Fenêtre de la réserve', desc: 'prép. +2 · repéré si menace ≥ 4', prep: 2, detectAt: 4 },
    ],
    entries: [
      { id: 'porte', name: 'Porte vitrée', desc: 'entrée frontale', riskMod: 0, needsPlan: false },
      { id: 'arriere', name: 'Réserve, côté cour', desc: 'discrète — plan requis', riskMod: -1, needsPlan: true },
      { id: 'vitrine', name: 'Effraction vitrine', desc: 'risque −1 · il est prévenu : fuite possible sur 1–2 si prép. 0', riskMod: -1, needsPlan: false, escapeOn: [1, 2] },
    ],
  },
  banque: {
    posts: [
      { id: 'toit', name: 'Toit de l\'immeuble d\'en face', desc: 'prép. +1 · repéré si menace ≥ 5', prep: 1, detectAt: 5 },
      { id: 'lucarne', name: 'Lucarne des archives', desc: 'prép. +2 · repéré si menace ≥ 4', prep: 2, detectAt: 4 },
    ],
    entries: [
      { id: 'porte', name: 'Entrée principale', desc: 'entrée frontale', riskMod: 0, needsPlan: false },
      { id: 'conduits', name: 'Conduits des archives', desc: 'discrète — plan requis', riskMod: -1, needsPlan: true },
      { id: 'mur', name: 'Effraction mur mitoyen', desc: 'risque −1 · il est prévenu : fuite possible sur 1–2 si prép. 0', riskMod: -1, needsPlan: false, escapeOn: [1, 2] },
    ],
  },
  hopital: {
    posts: [
      { id: 'toit', name: 'Toit de l\'aile sud', desc: 'prép. +1 · repéré si menace ≥ 5', prep: 1, detectAt: 5 },
      { id: 'office', name: 'Fenêtre de l\'office', desc: 'prép. +2 · repéré si menace ≥ 4', prep: 2, detectAt: 4 },
    ],
    entries: [
      { id: 'sas', name: 'Sas du service', desc: 'entrée frontale', riskMod: 0, needsPlan: false },
      { id: 'vestiaire', name: 'Vestiaire du personnel', desc: 'discrète — plan requis', riskMod: -1, needsPlan: true },
      { id: 'baie', name: 'Baie vitrée du couloir', desc: 'risque −1 · il est prévenu : fuite possible sur 1–2 si prép. 0', riskMod: -1, needsPlan: false, escapeOn: [1, 2] },
    ],
  },
  ferme: {
    posts: [
      { id: 'grange', name: 'Fenil de la grange', desc: 'prép. +1 · repéré si menace ≥ 5', prep: 1, detectAt: 5 },
      { id: 'pignon', name: 'Pignon est', desc: 'prép. +2 · repéré si menace ≥ 4', prep: 2, detectAt: 4 },
    ],
    entries: [
      { id: 'porte', name: 'Porte de la maison', desc: 'entrée frontale', riskMod: 0, needsPlan: false },
      { id: 'cave', name: 'Cave à légumes', desc: 'discrète — plan requis', riskMod: -1, needsPlan: true },
      { id: 'grangeporte', name: 'Porte de grange', desc: 'risque −1 · il est prévenu : fuite possible sur 1–2 si prép. 0', riskMod: -1, needsPlan: false, escapeOn: [1, 2] },
    ],
  },
  prison: {
    posts: [
      { id: 'tour', name: 'Tour de garde nord', desc: 'prép. +1 · repéré si menace ≥ 5', prep: 1, detectAt: 5 },
      { id: 'rambarde', name: 'Rambarde du deuxième', desc: 'prép. +2 · repéré si menace ≥ 4', prep: 2, detectAt: 4 },
    ],
    entries: [
      { id: 'grille', name: 'Grille du quartier', desc: 'entrée frontale', riskMod: 0, needsPlan: false },
      { id: 'coursive', name: 'Coursive de service', desc: 'discrète — plan requis', riskMod: -1, needsPlan: true },
      { id: 'porte-cellules', name: 'Porte des cellules', desc: 'risque −1 · il est prévenu : fuite possible sur 1–2 si prép. 0', riskMod: -1, needsPlan: false, escapeOn: [1, 2] },
    ],
  },
  ferry: {
    posts: [
      { id: 'passerelle', name: 'Passerelle supérieure', desc: 'prép. +1 · repéré si menace ≥ 5', prep: 1, detectAt: 5 },
      { id: 'dunette', name: 'Dunette avant', desc: 'prép. +2 · repéré si menace ≥ 4', prep: 2, detectAt: 4 },
    ],
    entries: [
      { id: 'rampe', name: 'Rampe du garage', desc: 'entrée frontale', riskMod: 0, needsPlan: false },
      { id: 'equipage', name: 'Passerelle des équipages', desc: 'discrète — plan requis', riskMod: -1, needsPlan: true },
      { id: 'sabord', name: 'Sabord du garage', desc: 'risque −1 · il est prévenu : fuite possible sur 1–2 si prép. 0', riskMod: -1, needsPlan: false, escapeOn: [1, 2] },
    ],
  },
};

export function sceneBase(scene) {
  if (scene && typeof scene === 'object') scene = scene.else || scene.then || 'banque';
  if (!scene) return 'banque';
  if (scene.startsWith('ferry')) return 'ferry';
  if (scene.startsWith('prison')) return 'prison';
  if (scene.startsWith('ferme')) return 'ferme';
  if (scene.startsWith('banque')) return 'banque';
  if (scene.startsWith('hopital')) return 'hopital';
  if (scene.startsWith('pharmacie')) return 'pharmacie';
  return scene;
}

// Plan tactique courant (scène de mission ou variante d'acte → base).
export function getPlan(state) {
  const m = getMissionDef(state);
  let scene = m.scene;
  if (m.acts && state.act != null && state.act < m.acts.length) {
    const s = m.acts[state.act].scene;
    if (s) scene = typeof s === 'object' ? (state.flags[s.ifFlag] ? s.then : s.else) : s;
  }
  return PLANS[sceneBase(scene)] || PLANS.banque;
}
