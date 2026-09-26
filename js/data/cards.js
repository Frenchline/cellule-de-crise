// ============================================================
// NÉGOCIATEUR — Cellule de crise
// Cartes de conversation (base réutilisable + marché à usage unique)
// Textes 100 % originaux. Les effets sont des descripteurs
// interprétés par js/engine.js.
// ============================================================

// Descripteurs d'effets reconnus par le moteur :
//   threat:n          variation de menace (+/-)
//   pressure:n        variation de pression médiatique
//   pc:n              PC immédiats
//   pcNext:n          PC au prochain tour
//   free:n            otages libérés
//   kill:n            otages tués
//   reveal:n          indices révélés (au hasard parmi les cachés)
//   prep:n            préparation tactique
//   discardNextTerror prochaine carte Terreur défaussée sans effet
//   win:'surrender'   victoire-reddition immédiate
//   neutralizeDemand  la demande ciblée devient 'neutralized'
//   mark:'promesse'   pose le marqueur promesse non tenue

export const TAGS = {
  empathie: 'Empathie',
  autorite: 'Autorité',
  pression: 'Pression',
  ruse: 'Ruse',
};

// ---------- Cartes de base (toujours en main, 1×/tour) ----------
export const BASE_CARDS = {
  ecoute_active: {
    id: 'ecoute_active', name: 'Écoute active', cost: 0, dice: 2,
    tag: 'empathie', reusable: true,
    desc: 'Le laisser parler. Vider son sac. Ne rien promettre.',
    effects: { 0: {}, 1: { pcNext: 1 }, 2: { reveal: 1, threat: -1 } },
    line: 'Je vous écoute. Racontez-moi comment on en est arrivé là.',
  },
  rassurer: {
    id: 'rassurer', name: 'Rassurer', cost: 1, dice: 3,
    tag: 'empathie', reusable: true,
    desc: 'Apaiser la voix, ralentir le tempo, nommer sa peur.',
    effects: { 0: { threat: 1 }, 1: { threat: -1 }, 2: { threat: -2 } },
    line: 'Respirez. Personne ne veut que cette nuit finisse mal. Ni vous, ni moi.',
  },
  gagner_temps: {
    id: 'gagner_temps', name: 'Gagner du temps', cost: 1, dice: 2,
    tag: 'ruse', reusable: true,
    desc: 'Meubler, temporiser, promettre des vérifications sans fin.',
    effects: { 0: { threat: 1 }, 1: { pressure: -1 }, 2: { discardNextTerror: true, pressure: -1 } },
    line: 'Ça demande des autorisations. Je fais le nécessaire, mais il me faut du temps.',
  },
  fermete: {
    id: 'fermete', name: 'Fermeté', cost: 1, dice: 3,
    tag: 'autorite', reusable: true,
    desc: 'Poser les limites. Sans crier. Sans céder.',
    effects: { 0: { threat: 2 }, 1: {}, 2: { threat: -1, pc: 1 } },
    line: 'Écoutez-moi bien. On trouve une sortie ensemble, mais pas comme ça.',
  },
  demander_otage: {
    id: 'demander_otage', name: 'Demander un otage', cost: 2, dice: 3,
    tag: 'pression', reusable: true,
    desc: 'Obtenir une libération en échange de votre coopération.',
    cond: 'threat_lte_5',
    condText: 'Menace ≤ 5 requise',
    effects: { 0: { threat: 2 }, 1: { threat: 1 }, 2: { free: 1 }, 3: { free: 2 } },
    line: 'Vous voulez que je vous aide ? Alors aidez-moi d\'abord. Laissez sortir quelqu\'un.',
  },
  proposer_reddition: {
    id: 'proposer_reddition', name: 'Proposer la reddition', cost: 3, dice: 4,
    tag: 'autorite', reusable: true,
    desc: 'La porte de sortie. Lui offrir de se rendre, vivant.',
    cond: 'surrender_ready',
    condText: 'Menace ≤ 2 et demande majeure concédée ou neutralisée',
    effects: { 0: { threat: 1 }, 1: { threat: 1 }, 2: { threat: -1 }, 3: { win: 'surrender' } },
    line: 'Posez votre arme et marchez vers la porte. Je vous promets que vous sortirez vivant.',
  },
  negocier_demande: {
    id: 'negocier_demande', name: 'Négocier une demande', cost: 2, dice: 3,
    tag: 'ruse', reusable: true, needsTarget: 'demande',
    desc: 'Dénaturer une exigence jusqu\'à ce qu\'il y renonce.',
    cond: 'pending_demand',
    condText: 'Une demande en attente à cibler',
    effects: { 0: { threat: 2 }, 1: {}, 2: { neutralizeDemand: true } },
    line: 'Soyons honnêtes : ce que vous demandez, personne ne pourra jamais vous le donner.',
  },
};

// ---------- Marché (usage unique, achetées au prix `buy`) ----------
export const MARKET_CARDS = {
  promesse: {
    id: 'promesse', name: 'Promesse', cost: 2, buy: 3, auto: true,
    tag: 'ruse', reusable: false,
    desc: 'Jurer qu\'il obtiendra ce qu\'il veut. Menace −2, pression +1. Si la promesse n\'est pas tenue, elle se paiera.',
    effects: { auto: { threat: -2, pressure: 1, mark: 'promesse' } },
    line: 'Vous avez ma parole. Je vais vous le faire obtenir.',
  },
  humour: {
    id: 'humour', name: 'Humour désamorçant', cost: 1, buy: 2, dice: 3,
    tag: 'empathie', reusable: false,
    desc: 'Une plaisanterie en pleine nuit. Risqué. Parfois salvateur.',
    effects: { 0: { threat: 2 }, 1: { threat: -1 }, 2: { threat: -2 } },
    line: 'Vous savez ce qu\'on dit dans la police ? Jamais de prise d\'otage un mardi.',
  },
  verite_brutale: {
    id: 'verite_brutale', name: 'Vérité brutale', cost: 2, buy: 3, dice: 4,
    tag: 'autorite', reusable: false,
    desc: 'Lui dire les choses telles qu\'elles sont. Toutes.',
    effects: { 0: { threat: 2 }, 1: { threat: -1 }, 2: { threat: -2, pc: 1 } },
    line: 'Je ne vais pas vous mentir. Voilà exactement où vous en êtes.',
  },
  nourriture: {
    id: 'nourriture', name: 'Offrir de la nourriture', cost: 1, buy: 2, auto: true,
    tag: 'empathie', reusable: false,
    desc: 'Des sandwichs passés sous la porte. Un geste humain. Menace −1.',
    effects: { auto: { threat: -1 } },
    line: 'Des vivres arrivent. Pour vous et pour les autres. Faites-les manger.',
  },
  echange: {
    id: 'echange', name: 'Proposer un échange', cost: 3, buy: 4, dice: 4,
    tag: 'pression', reusable: false,
    desc: 'Un contre un. Otages contre concessions partielles.',
    effects: { 0: { threat: 2 }, 1: { threat: 1 }, 2: { free: 1 }, 3: { free: 2 } },
    line: 'Je vous donne quelque chose, vous me donnez quelqu\'un. C\'est ainsi que ça marche.',
  },
  famille: {
    id: 'famille', name: 'Évoquer la famille', cost: 2, buy: 3, dice: 4,
    tag: 'empathie', reusable: false,
    desc: 'Rappeler ceux qui l\'attendent. −2 dés si aucun indice « famille » n\'est révélé.',
    diceModKey: 'famille',
    effects: { 0: { threat: 1 }, 1: { threat: -1 }, 2: { threat: -2, reveal: 1 } },
    line: 'Il y a des gens qui vous attendent dehors. Qui comptent encore sur vous.',
  },
  appel_proche: {
    id: 'appel_proche', name: 'Appel d\'un proche', cost: 3, buy: 4, dice: 5,
    tag: 'empathie', reusable: false,
    desc: 'Faire passer un être cher en ligne. Indice « proche » révélé requis.',
    cond: 'clue_proche',
    condText: 'Un indice « proche » révélé est requis',
    effects: { 0: { threat: 2 }, 1: { threat: -1 }, 2: { threat: -2, free: 1 }, 3: { threat: -3, free: 1 } },
    line: 'J\'ai quelqu\'un en ligne qui veut vous parler. Décrochez.',
  },
  mentir_delais: {
    id: 'mentir_delais', name: 'Mentir sur les délais', cost: 1, buy: 2, dice: 2,
    tag: 'ruse', reusable: false,
    desc: '« Encore dix minutes. » Toujours dix minutes.',
    effects: { 0: { threat: 2 }, 1: { discardNextTerror: true }, 2: { discardNextTerror: true, pressure: -1 } },
    line: 'Le véhicule est en route. Dix minutes, peut-être quinze. Restez avec moi.',
  },
  silence_tactique: {
    id: 'silence_tactique', name: 'Silence tactique', cost: 1, buy: 2, dice: 2,
    tag: 'ruse', reusable: false,
    desc: 'Laisser le silence peser. Écouter ce qu\'il remplit.',
    effects: { 0: { threat: 1 }, 1: { pcNext: 1 }, 2: { pcNext: 2, threat: -1 } },
    line: '…',
  },
  souffrance: {
    id: 'souffrance', name: 'Reconnaître sa souffrance', cost: 1, buy: 2, dice: 3,
    tag: 'empathie', reusable: false,
    desc: 'Nommer ce qui le ronge. Sans juger.',
    effects: { 0: { threat: 1 }, 1: { threat: -1 }, 2: { threat: -1, pcNext: 1 } },
    line: 'Ce que vous vivez, personne ne devrait avoir à le vivre. Je le sais.',
  },
  bluff_assaut: {
    id: 'bluff_assaut', name: 'Bluff sur l\'assaut', cost: 2, buy: 3, dice: 3,
    tag: 'pression', reusable: false,
    desc: 'Laisser entendre que les hommes en cagoule attendent un signal.',
    effects: { 0: { threat: 2, pressure: 1 }, 1: { threat: -1 }, 2: { threat: -2 } },
    line: 'Vous voyez les vans noirs devant ? C\'est vous qui décidez s\'ils restent garés.',
  },
  mediateur: {
    id: 'mediateur', name: 'Intermédiaire religieux', cost: 2, buy: 3, dice: 4,
    tag: 'empathie', reusable: false,
    desc: 'Une voix qu\'il respecte. Un prêtre, un imam, un aumônier.',
    effects: { 0: { threat: 1 }, 1: { threat: -1 }, 2: { threat: -2, pcNext: 1 } },
    line: 'Quelqu\'un que vous respectez veut vous parler. Écoutez-le, je vous en prie.',
  },
  dossier_psy: {
    id: 'dossier_psy', name: 'Analyse du profil', cost: 1, buy: 2, auto: true,
    tag: 'ruse', reusable: false,
    desc: 'Les psychologues de la cellule décortiquent sa voix. Révèle un indice.',
    effects: { auto: { reveal: 1 } },
    line: '(Vous tendez le dossier aux analystes. « Dites-moi qui j\'ai au bout du fil. »)',
  },
};

// ---------- Cartes de scénario (missions avancées) ----------
export const SCENARIO_CARDS = {
  monde_avant: {
    id: 'monde_avant', name: 'Évoquer le monde d\'avant', cost: 1, buy: 2, dice: 3,
    tag: 'empathie', reusable: false,
    desc: 'Rappeler la vie d\'avant la ferme : un métier, une odeur, une chanson. 2+ : Rituel −1.',
    effects: { 0: { threat: 1 }, 1: { threat: -1 }, 2: { threat: -1, counter: { rituel: -1 } } },
    line: 'Avant tout ça, vous aviez une vie. Des mains qui soignaient. Dites-moi ce que vous aimiez.',
  },
  parler_mort: {
    id: 'parler_mort', name: 'Parler de sa mort', cost: 2, buy: 3, dice: 4,
    tag: 'empathie', reusable: false,
    desc: 'Il sait qu\'il est condamné par son corps. En parler sans détour. Indice « maladie » révélé requis.',
    cond: { clue: 's_mort' }, condText: 'Indice « maladie » révélé requis',
    effects: { 0: { threat: 1 }, 1: { threat: -1 }, 2: { threat: -2, counter: { rituel: -1 } }, 3: { threat: -3 } },
    line: 'Vous n\'êtes pas immortel, Élie. On le sait tous les deux. Parlons de ce que vous laissez.',
  },
  voix_enfants: {
    id: 'voix_enfants', name: 'Les voix des enfants', cost: 2, buy: 3, dice: 3,
    tag: 'empathie', reusable: false,
    desc: 'Faire parler les enfants au combiné. Cruel et nécessaire.',
    effects: { 0: { threat: 2 }, 1: { threat: -1 }, 2: { free: 1 } },
    line: 'Les enfants demandent à sortir. Écoutez-les, Élie. Ils ont peur.',
  },
  appel_avocat: {
    id: 'appel_avocat', name: 'Appel de l\'avocat', cost: 2, buy: 3, dice: 3,
    tag: 'ruse', reusable: false,
    desc: 'Un avocat pénal connu des détenus plaide votre cause. 2+ : Émeute −1.',
    effects: { 0: { threat: 1 }, 1: { threat: -1 }, 2: { threat: -1, counter: { emeute: -1 } } },
    line: 'J\'ai Maître Verdier en ligne. Vous le connaissez. Écoutez-le.',
  },
  solidarite_detenus: {
    id: 'solidarite_detenus', name: 'Solidarité carcérale', cost: 1, buy: 2, dice: 2,
    tag: 'empathie', reusable: false,
    desc: 'Parler aux détenus comme à des hommes, pas à des numéros. 1+ : Émeute −1.',
    effects: { 0: { threat: 1 }, 1: { counter: { emeute: -1 } }, 2: { counter: { emeute: -1 }, threat: -1 } },
    line: 'Je sais ce que vaut une journée en quartier B. Ce soir, personne n\'a intérêt à un bain de sang.',
  },
  passerelle: {
    id: 'passerelle', name: 'Passerelle humanitaire', cost: 2, buy: 3, dice: 4,
    tag: 'pression', reusable: false,
    desc: 'Un accord de couloir : les familles d\'abord. 2+ : otages libérés.',
    effects: { 0: { threat: 2 }, 1: { threat: -1 }, 2: { free: 1 }, 3: { free: 2 } },
    line: 'La passerelle est à quai. Vos passagers n\'ont rien à voir avec votre combat. Laissez-les.',
  },
};

export const ALL_CARDS = { ...BASE_CARDS, ...MARKET_CARDS, ...SCENARIO_CARDS };

export function getCard(id) {
  return ALL_CARDS[id] || null;
}
