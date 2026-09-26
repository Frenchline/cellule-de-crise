// ============================================================
// NÉGOCIATEUR — Cellule de crise
// Pioche Terreur : l'horloge de la mission.
// Descripteurs interprétés par engine.js :
//   {threat, pressure, kill, free, reveal, pcNext, ...}
//   {ifThreatGte:{v, then, else}}
//   {roll:{dice, table:{0:.., 1:.., '2':..}}}   (clé max ≤ succès)
//   {demandMajorPending:{then, else}}
//   {promise:{then, else}}                     (consomme le marqueur)
//   {flag:'complice'}                          (option complice caché)
// ============================================================

export const TERROR_GENERIC = {
  nervosite: {
    id: 'nervosite', name: 'Nervosité',
    text: 'Sa voix se tend. Il serre l\'arme plus fort.',
    taker: 'Ne me parlez plus comme ça. Vous m\'entendez ?',
    effect: { threat: 1 },
  },
  coup_feu: {
    id: 'coup_feu', name: 'Coup de feu en l\'air',
    text: 'Une détonation dans le combiné. Un éclat de plâtre. Des cris.',
    taker: 'C\'était un avertissement ! Le prochain, je le compte !',
    effect: { ifThreatGte: { v: 5, then: { kill: 1 }, else: { threat: 1 } } },
  },
  otage_panique: {
    id: 'otage_panique', name: 'Otage paniqué',
    text: 'Un otage hurle, se jette vers la porte. Tout bascule en une seconde.',
    taker: 'RETOURNE T\'ASSEOIR ! TOUT DE SUITE !',
    effect: { roll: { dice: 2, table: { 0: { kill: 1 }, 1: { threat: 1 } } } },
  },
  direct_tv: {
    id: 'direct_tv', name: 'Direct TV',
    text: 'Une chaîne d\'info passe en édition spéciale. Il regarde.',
    taker: 'Ils montrent mon visage à la télé ?! Éteins cette saloperie !',
    effect: { pressure: 2 },
  },
  ultimatum: {
    id: 'ultimatum', name: 'Ultimatum',
    text: 'Il fixe une heure limite. Sa demande n\'est pas une question.',
    taker: 'Vous avez une heure. Après, je ne réponds plus de rien.',
    effect: { demandMajorPending: { then: { threat: 2 }, else: { threat: 1 } } },
  },
  accalmie: {
    id: 'accalmie', name: 'Accalmie',
    text: 'Sa respiration ralentit. Quelques minutes de trêve.',
    taker: 'Laissez-moi… laissez-moi juste une minute.',
    effect: { threat: -1 },
  },
  otage_malade: {
    id: 'otage_malade', name: 'Otage malade',
    text: 'Un otage s\'effondre, pâle, en sueur. Il ne sait pas quoi faire.',
    taker: 'Il va pas me faire ça. Il va pas me mourir dessus, là.',
    effect: { roll: { dice: 2, table: { 0: { kill: 1 }, 1: { pressure: 1 } } } },
  },
  coupure: {
    id: 'coupure', name: 'Coupure de courant',
    text: 'Le bâtiment plonge dans le noir. Les radios crépitent.',
    taker: 'C\'est vous qui coupez le jus ?! Rallumez. RALLUMEZ !',
    effect: { threat: 1, pressure: 1 },
  },
  promesse_trahie: {
    id: 'promesse_trahie', name: 'Promesse trahie',
    text: 'Il a vérifié. Ce que vous aviez promis n\'est jamais arrivé.',
    taker: 'Vous m\'avez menti. JE VOUS AI CRU ET VOUS M\'AVEZ MENTI !',
    effect: { promise: { then: { threat: 2 }, else: { threat: 1 } } },
  },
  revelation: {
    id: 'revelation', name: 'Révélation',
    text: 'Dans un moment de lassitude, il laisse échapper un détail de sa vie.',
    taker: 'Pourquoi je vous raconte ça, à vous…',
    effect: { reveal: 1 },
  },
  complice_tel: {
    id: 'complice_tel', name: 'Appel extérieur',
    text: 'Son téléphone vibre. Quelqu\'un l\'appelle. Quelqu\'un qui compte.',
    taker: 'Je décroche. Pas un mot. PAS UN MOT.',
    effect: { threat: 1, pressure: 1 },
  },
  nuit_blanche: {
    id: 'nuit_blanche', name: 'Épuisement',
    text: 'La fatigue ronge tout le monde. La vôtre aussi.',
    taker: 'Vous dormez, vous, là-bas ? Moi je dors plus.',
    effect: { threat: 1, pcNext: -1 },
  },
  souvenir: {
    id: 'souvenir', name: 'Un souvenir',
    text: 'Une odeur, une chanson à la radio du magasin. Il se souvient.',
    taker: 'C\'est idiot… ça me rappelle quelqu\'un.',
    effect: { threat: -1, reveal: 1 },
  },
  perimetre: {
    id: 'perimetre', name: 'Périmètre franchi',
    text: 'Un badaud a franchi le cordon. Les caméras rapprochent.',
    taker: 'Y a des gens dehors. Je les vois. Qui les fait entrer ?!',
    effect: { pressure: 2 },
  },
  colere: {
    id: 'colere', name: 'Accès de colère',
    text: 'Un meuble tombe. Un cri. Puis le silence le plus lourd de la nuit.',
    taker: 'Vous voulez voir de quoi je suis capable ?! VOUS VOULEZ VOIR ?!',
    effect: { threat: 2 },
  },
  evasion: {
    id: 'evasion', name: 'Évasion',
    text: 'Un bruit de verrière. Un otage a sauté. Il court vers le cordon.',
    taker: 'Il a sauté ! Le con… Ramenez-le ! TUEZ PERSONNE !',
    effect: { free: 1, pressure: 2 },
  },
  fait_divers: {
    id: 'fait_divers', name: 'Autre fait divers',
    text: 'Un accident sur le périphérique accapare les rédactions. Les caméras tournent ailleurs.',
    taker: 'Ils s\'en foutent déjà de moi, vos journalistes ?',
    effect: { pressure: -2 },
  },
  neg_flanquement: {
    id: 'neg_flanquement', name: 'Mouvement repéré',
    text: 'Il a vu un reflet sur le toit d\'en face. Il pense que c\'est un tireur.',
    taker: 'Sur le toit. En face. Je l\'ai vu. Retirez-le ou je jure…',
    effect: { threat: 1, pressure: 1 },
  },
};

// Carte injectée par l'option « Complice caché »
export const TERROR_COMPLICE = {
  id: 'complice_cache', name: 'Le second',
  text: 'Une ombre bouge dans le fond. Il n\'est pas seul. Il ne l\'a jamais été.',
  taker: 'Vous croyiez négocier avec un seul homme ?',
  effect: { threat: 2, flag: 'complice' },
};

export function getTerror(id) {
  return TERROR_GENERIC[id] || null;
}
