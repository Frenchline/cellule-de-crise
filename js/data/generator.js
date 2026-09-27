// ============================================================
// Générateur de missions « Opérations spéciales »
// generateMission(seed) → mission au format classique.
// RNG PROPRE (mulberry32 du seed) — jamais le flux de la partie.
// ============================================================

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- pools génériques ----------

const TOWNS = [
  'Lyon', 'Nantes', 'Toulouse', 'Lille', 'Bordeaux', 'Rouen', 'Dijon', 'Angers',
  'Tours', 'Clermont-Ferrand', 'Besançon', 'Valence', 'Poitiers', 'Limoges',
  'Brest', 'Perpignan', 'Amiens', 'Reims', 'Mulhouse', 'Chambéry',
];

const VENUES = {
  pharmacie: [
    { place: 'la pharmacie des Lilas', hostRole: 'pharmacien', roles: ['pharmacienne', 'préparatrice', 'cliente', 'client', 'livreur'], art: 'néons blancs, rayonnages bas' },
    { place: 'le bureau de tabac « Le Fumoir »', hostRole: 'buraliste', roles: ['buraliste', 'caissière', 'habitué', 'habituée', 'client'], art: 'comptoir de zinc, vitrine dépolie' },
    { place: 'la supérette Carrefour Contact', hostRole: 'caissier', roles: ['caissière', 'employé rayon', 'cliente', 'client', 'gérant'], art: 'linoléum, caddies renversés' },
  ],
  banque: [
    { place: 'l\'agence Banque Seine & Loire', hostRole: 'guichetier', roles: ['directrice d\'agence', 'guichetière', 'guichetier', 'cliente', 'conseiller', 'agent d\'accueil'], art: 'marbre froid, guichets vitrés' },
    { place: 'le bureau de poste Gambetta', hostRole: 'employé', roles: ['guichetière', 'factrice', 'cliente', 'client', 'chef de bureau'], art: 'distributeurs, sonnerie d\'appel' },
    { place: 'la bijouterie Aubert', hostRole: 'vendeur', roles: ['bijoutière', 'vendeur', 'apprenti', 'cliente', 'agent de sécurité'], art: 'vitrines éclatées, tapis rouge' },
  ],
  hopital: [
    { place: 'la clinique des Peupliers', hostRole: 'infirmier', roles: ['infirmière', 'aide-soignant', 'cadre de santé', 'standardiste', 'patiente'], art: 'couloir de linoleum, sonnettes de chambre' },
    { place: 'l\'EHPAD « Les Glycines »', hostRole: 'aide-soignant', roles: ['infirmière', 'aide-soignante', 'résidente', 'résident', 'psychologue'], art: 'salle commune, chaises roulantes' },
    { place: 'les urgences Sainte-Anne', hostRole: 'brancardier', roles: ['interne', 'infirmière', 'agent d\'accueil', 'brancardier', 'patient'], art: 'box rideau, écran de monitorage' },
  ],
};

const FIRST_M = ['Karim', 'Julien', 'Marc', 'Antoine', 'Sofiane', 'Pierre', 'Lucas', 'Hugo', 'Rayan', 'Thomas', 'Nicolas', 'Bruno', 'Mathis', 'Ilyes', 'Fabien', 'Serge'];
const FIRST_F = ['Nadia', 'Claire', 'Léa', 'Meriem', 'Fatima', 'Élodie', 'Sonia', 'Julie', 'Aurélie', 'Inès', 'Camille', 'Brigitte', 'Nora', 'Hélène', 'Sabrina', 'Anne'];
const LAST = ['Ferrand', 'Joubert', 'Vasseau', 'Attia', 'Lefort', 'Roche', 'Ziani', 'Sarda', 'Rhazi', 'Girard', 'Devos', 'Mery', 'Coupat', 'Vignal', 'Borel', 'Castel', 'Roux', 'Lenoir', 'Petit', 'Fabre', 'Morvan', 'Thibault'];

// pool Terreur « classique » existant
const TERROR_POOL = ['nervosite', 'coup_feu', 'otage_panique', 'direct_tv', 'ultimatum',
  'accalmie', 'otage_malade', 'coupure', 'promesse_trahie', 'revelation',
  'complice_tel', 'nuit_blanche', 'souvenir', 'perimetre', 'colere', 'fait_divers'];

const MARKET_POOL = ['promesse', 'humour', 'verite_brutale', 'nourriture', 'echange',
  'famille', 'appel_proche', 'mentir_delais', 'silence_tactique', 'souffrance',
  'bluff_assaut', 'mediateur', 'dossier_psy', 'liberation_ciblee'];

// ---------- helpers ----------

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function pickN(rng, arr, n) {
  const pool = arr.slice(); const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}
function shuffleR(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function randName(rng, sex) {
  return `${pick(rng, sex === 'f' ? FIRST_F : FIRST_M)} ${pick(rng, LAST)}`;
}

// ---------- archétypes ----------
// Chaque archétype porte ses propres demandes, indices, réponses, questions.
// Les ids d'indices sont propres à l'archétype : les questions peuvent les
// référencer en toute sécurité (l'indice est sélectionné quand une question
// le cite — voir generateMission).

const ARCHETYPES = [
  {
    id: 'pere', label: 'Un père au bout du rouleau',
    teaser: 'Dettes, un enfant à protéger, un geste désespéré.',
    sex: 'm', ageRange: [32, 52],
    dossier: [
      'Père isolé. Un enfant qu\'il ne veut pas perdre de vue.',
      'Travailleur précaire, dettes qui s\'accumulent depuis des mois.',
      'Aucun casier. Ce soir, il a franchi la ligne qu\'il s\'était jurée.',
    ],
    demands: [
      { id: 'gd_pere_enfant', label: 'Parler à son enfant', major: true,
        detail: 'Il veut entendre sa voix avant toute chose.',
        concede: { effects: { threat: -3, free: 1, pressure: 2 }, text: 'L\'appel est passé. Il pleure sans bruit, combine serré contre l\'oreille. Il laisse sortir un otage.' } },
      { id: 'gd_pere_fuite', label: 'Une voiture et du carburant', major: true,
        detail: 'Une sortie de route, dit-il. Personne n\'y croit, pas même lui.',
        concede: { effects: { threat: -2, pressure: 2 }, text: 'La voiture stationne phares éteints. Il regarde par la vitre, sans bouger.' } },
      { id: 'gd_pere_dettes', label: 'L\'effacement de ses dettes', major: false,
        detail: 'Un courrier de l\'huissier, déchiré. Il veut qu\'on lui certifie.',
        concede: { effects: { threat: -1, pressure: 1 }, text: 'La procureure adjointe signe un papier sans valeur. Il le plie soigneusement.' } },
    ],
    clues: [
      { id: 'gc_pere_enfant', name: 'Un enfant qu\'il aime', famille: true, proche: true,
        desc: 'Tout le plan tourne autour de lui. Le nommer ouvre une brèche.',
        trait: { tagMods: { empathie: 1 } } },
      { id: 'gc_pere_dettes', name: 'Étranglé par les dettes',
        desc: 'Huissier, compte bloqué, crédit revolving. Il ne croit plus aux promesses.',
        trait: { tagMods: { ruse: -1 } } },
      { id: 'gc_pere_orgueil', name: 'L\'orgueil blessé',
        desc: 'Quinze ans de travail balayés d\'un courrier. Il ne supporte plus qu\'on lui parle de haut.',
        trait: { tagMods: { autorite: -1 } } },
      { id: 'gc_pere_arme', name: 'Une arme qu\'il ne maîtrise pas',
        desc: 'Le revolver tremble. Il l\'a trouvée, il ne l\'a jamais tirée.',
        trait: { tagMods: { pression: -1 } } },
      { id: 'gc_pere_ex', name: 'L\'ex-compagne inquiète', famille: true, proche: true,
        desc: 'Elle a peur, pas de rancœur. Elle répondrait au téléphone.',
        trait: { tagMods: { empathie: 1 } } },
      { id: 'gc_pere_nuit', name: 'Trois nuits sans dormir',
        desc: 'Il tourne en rond depuis lundi. La fatigue le rend imprévisible.',
        trait: null },
    ],
    questions: [
      { id: 'gqp_nuit', minTurn: 3,
        text: '« Vous avez des enfants, vous ? »',
        replies: [
          { label: '« J\'ai une fille. Je sais ce qu\'on ferait pour elle. »', tag: 'empathie',
            answer: 'Une fille… alors vous savez. Vous savez ce que ça veut dire.',
            effects: { ifClue: { id: 'gc_pere_enfant', then: { threat: -1, pc: 1 }, else: { threat: -1 } } } },
          { label: '« Ce n\'est pas le sujet. On parle de vous. »', tag: 'autorite',
            answer: 'Bien sûr que c\'est le sujet. TOUT est le sujet.',
            effects: { threat: 1 } },
          { label: '« Deux garçons. Ils m\'attendent aussi ce soir. »', tag: 'ruse',
            answer: 'Et ils vous attendront combien de temps encore ?',
            effects: { pcNext: 1, mark: 'promesse' } },
        ] },
      { id: 'gqp_plan', minTurn: 5,
        text: '« Vous pensez que j\'ai prévu tout ça depuis longtemps ? »',
        replies: [
          { label: '« Depuis que les dettes vous étouffent, non ? »', tag: 'ruse',
            answer: 'Qui vous a parlé de mes dettes ?!',
            effects: { ifClue: { id: 'gc_pere_dettes', then: { threat: -1 }, else: { threat: 1 } } } },
          { label: '« Depuis ce matin. On voit bien que ce n\'est pas votre monde. »', tag: 'empathie',
            answer: '…Non. C\'est pas mon monde. Vous avez raison là-dessus.',
            effects: { threat: -1 } },
          { label: '« Peu importe. L\'important c\'est comment ça finit. »', tag: 'autorite',
            answer: 'Ça finit comme je le décide. Compris ?',
            effects: { threat: 1 } },
        ] },
    ],
    responses: {
      byTag: {
        empathie: { fail: ['Ne me parlez pas comme à un dossier.', 'Vos mots doux, je les connais.'], partial: ['Facile à dire, de l\'extérieur.', 'Vous êtes payé pour dire ça.'], success: ['Personne ne m\'avait parlé comme ça ce soir.', 'Mon fils s\'appelle Tiago. Il a sept ans.'] },
        autorite: { fail: ['Ne me donnez pas d\'ordres. Pas ce soir.', 'Vous commandez rien du tout, de là où vous êtes.'], partial: ['J\'entends. Ça ne change rien.', 'Continuez.'], success: ['D\'accord. Pas de coup fourré alors.', 'Vous êtes le seul qui parle franc.'] },
        pression: { fail: ['Vous me pressez ? Vous voulez voir ce que je peux faire ?', 'Encore un mot comme ça et je raccroche.'], partial: ['Je réfléchis. Ne bougez pas.', 'C\'est tout ce que vous avez ?'], success: ['Un. Un seul otage. Après on négocie la voiture.', 'Elle sort. Allez, vas-y, sors.'] },
        ruse: { fail: ['Vous me prenez pour un imbécile. Tout le monde me prend pour un imbécile.', 'Je vois les gyrophares, moi.'], partial: ['Combien de temps ? Dites-moi juste combien.', 'Vous parlez comme les banquiers.'], success: ['Dix minutes. Pas une de plus.', 'Je compte sur vous. J\'ai plus personne.'] },
      },
      default: { fail: ['Laissez-moi. Laissez-moi réfléchir.'], partial: ['Je vois ce que vous essayez de faire.'], success: ['D\'accord. On continue à parler.'] },
    },
    lines: {
      kill: ['Vous avez entendu ?! C\'est vous. C\'est VOUS qui m\'avez parlé de lui !', 'Je voulais pas. Je voulais pas…'],
      freed: ['Elle sort. Marche doucement, te presse pas.', 'Un de moins. Comme promis. À vous maintenant.'],
      concede: ['C\'est tout ce que je demande depuis le début.', 'Passez-la-moi. Deux minutes, juste deux.'],
      terror: ['Qu\'est-ce qui se passe ? J\'ai entendu du bruit !', 'Restez en ligne. RESTEZ EN LIGNE !'],
    },
  },
  {
    id: 'militaire', label: 'Un ancien militaire méthodique',
    teaser: 'Entraîné, discipliné, convaincu d\'être trahi.',
    sex: 'm', ageRange: [38, 58],
    dossier: [
      'Ex-militaire de carrière. Retrait civil difficile, pension insuffisante.',
      'Il parle en termes de terrain : « la position », « le périmètre », « la relève ».',
      'Arme légale ou de service détournée. Il sait s\'en servir.',
    ],
    demands: [
      { id: 'gd_mil_releve', label: 'Le retrait des tireurs', major: true,
        detail: 'Il exige la relève des positions sur les toits. Vérifiable.',
        concede: { effects: { threat: -3, free: 1, pressure: 2 }, text: 'Les tireurs se replient en vue. Il constate, acquiesce, fait sortir un otage.' } },
      { id: 'gd_mil_vehicule', label: 'Un véhicule blindé', major: true,
        detail: 'Pour partir « en sécurité ». Le RAID n\'en laissera jamais passer un.',
        concede: { effects: { threat: -2, pressure: 2 }, text: 'Le fourgon se gare devant l\'entrée. Il le scrute longtemps, méfiant.' } },
      { id: 'gd_mil_medaille', label: 'Restituer sa médaille', major: false,
        detail: 'Confisquée à son départ. Il la veut, épinglée.',
        concede: { effects: { threat: -1, pressure: 1 }, text: 'La médaille arrive dans un sachet. Il la fixe sur sa poitrine, se redresse.' } },
    ],
    clues: [
      { id: 'gc_mil_code', name: 'Le sens de l\'honneur',
        desc: 'Sa parole vaut quelque chose. Il respecte la franchise frontale.',
        trait: { tagMods: { autorite: 1 } } },
      { id: 'gc_mil_tspt', name: 'Blessures invisibles',
        desc: 'Des nuits qui recommencent. Les bruits secs le font tressaillir.',
        trait: { tagMods: { empathie: 1 } } },
      { id: 'gc_mil_mefiance', name: 'La méfiance du vétéran',
        desc: 'Il a appris à repérer les baratins. Les mensonges le détectent.',
        trait: { tagMods: { ruse: -1 } } },
      { id: 'gc_mil_unite', name: 'L\'unité démantelée', famille: true,
        desc: 'Ses camarades sont partis ou disparus. Il n\'a plus de régiment.',
        trait: null },
      { id: 'gc_mil_pression', name: 'Ne supporte pas l\'ultimatum',
        desc: 'On ne le met pas dos au mur. La pression le fait monter.',
        trait: { tagMods: { pression: -1 } } },
      { id: 'gc_mil_famille', name: 'Une sœur à l\'étranger', proche: true, famille: true,
        desc: 'Elle téléphone chaque dimanche. Il n\'a jamais manqué un appel.',
        trait: { tagMods: { empathie: 1 } } },
    ],
    questions: [
      { id: 'gqm_hommes', minTurn: 3,
        text: '« Combien d\'hommes avez-vous sur le toit ? »',
        replies: [
          { label: '« Assez. Mais personne ne tire tant que vous parlez. »', tag: 'autorite',
            answer: 'C\'est une réponse de militaire. Je respecte ça.',
            effects: { ifClue: { id: 'gc_mil_code', then: { threat: -1 }, else: { threat: 1 } } } },
          { label: '« Aucun. Périmètre civil uniquement. »', tag: 'ruse',
            answer: 'Civil ? J\'ai compté les silhouettes, moi.',
            effects: { pcNext: 1, mark: 'promesse' } },
          { label: '« Ce n\'est pas à vous de compter. »', tag: 'pression',
            answer: 'On compte toujours. On compte jusqu\'au bout.',
            effects: { threat: 1 } },
        ] },
      { id: 'gqm_sortie', minTurn: 5,
        text: '« Vous savez comment ça se finit, les situations comme celle-ci ? »',
        replies: [
          { label: '« Oui. Et je sais aussi comment elles ne se finissent pas. »', tag: 'empathie',
            answer: '…Vous connaissez les nuits, vous aussi.',
            effects: { ifClue: { id: 'gc_mil_tspt', then: { threat: -1, pc: 1 }, else: {} } } },
          { label: '« Par votre reddition, si vous êtes intelligent. »', tag: 'autorite',
            answer: 'Se rendre n\'est pas dans ma doctrine.',
            effects: { threat: 1 } },
          { label: '« Par une sortie honorable. Je peux la construire. »', tag: 'ruse',
            answer: 'Honorable. C\'est le mot qu\'il faut. Continuez.',
            effects: { pcNext: 1, pressure: 1 } },
        ] },
    ],
    responses: {
      byTag: {
        empathie: { fail: ['Vous ne savez rien de moi. De ce que j\'ai vu.', 'Épargnez-moi votre compassion de bureau.'], partial: ['Vous essayez de me cerner. Continuez.', 'Parler ne change pas le terrain.'], success: ['Vous avez servi ? On entend ça, à la voix.', 'Les nuits… oui. Vous savez.'] },
        autorite: { fail: ['Je ne reçois pas d\'ordres de civils.', 'Vous n\'avez pas le grade pour me parler comme ça.'], partial: ['Direct. J\'aime autant.', 'Noté. Mais la position est à moi.'], success: ['Enfin quelqu\'un qui parle vrai.', 'À ces mots-là, je réponds.'] },
        pression: { fail: ['Ne me mettez pas dos au mur. JAMAIS.', 'Vous voulez accélérer ? Je peux accélérer.'], partial: ['Je n\'aime pas les ultimatums.', 'Vous jouez avec le feu.'], success: ['Délai accepté. Tenez le vôtre.', 'Un otage contre du temps. Marché.'] },
        ruse: { fail: ['J\'ai appris à repérer les baratins. Recommencez.', 'Vos mensonges sentent à un kilomètre.'], partial: ['C\'est tentant. Trop tentant, d\'ailleurs.', 'Prouvez-le.'], success: ['Accordé. Et si c\'est faux, vous le paierez.', 'Sur parole, alors. Les deux côtés.'] },
      },
      default: { fail: ['Silence. Je calcule.'], partial: ['J\'écoute.'], success: ['Bien. La ligne tient.'] },
    },
    lines: {
      kill: ['Contact. Contact ! C\'est vous qui avez voulu ça !', 'Ennemi abattu. Vous avez entendu ?!'],
      freed: ['Sortie dégagée. Allez-y, marchez droit.', 'Un civil de moins sur la position. Comptez.'],
      concede: ['Accord accepté. Tenez-le.', 'La relève est confirmée. Ne bougez plus rien.'],
      terror: ['Bruit sur le périmètre ! Identifiez-vous !', 'Position compromise ? Répondez !'],
    },
  },
  {
    id: 'jaloux', label: 'Un conjoint rongé par la jalousie',
    teaser: 'Une rupture, une obsession, une arme trouvée.',
    sex: 'm', ageRange: [28, 48],
    dossier: [
      'Séparation récente, non acceptée. Il guette l\'autre depuis des semaines.',
      'Aujourd\'hui il est venu « pour parler ». Il a apporté une arme.',
      'Instable. Alterne menaces et sanglots.',
    ],
    demands: [
      { id: 'gd_jal_parler', label: 'Parler à l\'autre', major: true,
        detail: 'Il veut lui parler en direct. Une conversation qui peut tout déclencher.',
        concede: { effects: { threat: -3, free: 1, pressure: 2 }, text: 'L\'appel passe. La voix de l\'autre le fait vaciller. Il libère un otage en sanglotant.' } },
      { id: 'gd_jal_retract', label: 'Un démenti public', major: true,
        detail: 'Que la liaison soit niée devant témoins. Impossible à organiser.',
        concede: { effects: { threat: -2, pressure: 2 }, text: 'Le communiqué est lu au téléphone. Il l\'écoute trois fois, méfiant.' } },
      { id: 'gd_jal_lettre', label: 'La lettre', major: false,
        detail: 'Une lettre écrite à la main. Il croit que ça arrangera tout.',
        concede: { effects: { threat: -1, pressure: 1 }, text: 'La lettre passe sous la porte. Il la lit en tremblant.' } },
    ],
    clues: [
      { id: 'gc_jal_amour', name: 'Il l\'aime encore', famille: true, proche: true,
        desc: 'Sous la colère, un amour qui n\'a pas fini de brûler.',
        trait: { tagMods: { empathie: 1 } } },
      { id: 'gc_jal_controle', name: 'Le contrôle',
        desc: 'Il vérifiait le téléphone, les horaires, les trajets. Être contourné l\'affole.',
        trait: { tagMods: { ruse: -1 } } },
      { id: 'gc_jal_fierte', name: 'La fierté blessée',
        desc: 'Ce qu\'il ne supporte pas, c\'est d\'être abandonné. L\'autorité le braque.',
        trait: { tagMods: { autorite: -1 } } },
      { id: 'gc_jal_ami', name: 'Un ami qui le connaît', proche: true, famille: true,
        desc: 'Un seul ami de toujours, à qui il a parlé ce matin encore.',
        trait: { tagMods: { empathie: 1 } } },
      { id: 'gc_jal_fragile', name: 'Des armes, pas d\'entraînement',
        desc: 'L\'arme est lourde dans sa main. La panique peut lui faire fermer les yeux.',
        trait: { tagMods: { pression: -1 } } },
      { id: 'gc_jal_nuits', name: 'Insomnies',
        desc: 'Il n\'a pas dormi depuis la séparation. Il voit des choses.',
        trait: null },
    ],
    questions: [
      { id: 'gqj_verite', minTurn: 3,
        text: '« Dites-moi la vérité. Elle m\'aime encore ? »',
        replies: [
          { label: '« Je ne sais pas. Mais vous, vous l\'aimez. C\'est ça qui compte. »', tag: 'empathie',
            answer: 'Je l\'aime. C\'est pour ça que je suis là.',
            effects: { ifClue: { id: 'gc_jal_amour', then: { threat: -1, pc: 1 }, else: { threat: -1 } } } },
          { label: '« Oui. Elle n\'attend que vous. »', tag: 'ruse',
            answer: 'Vous mentez. Vous mentez comme eux tous.',
            effects: { pcNext: 1, mark: 'promesse' } },
          { label: '« Cette question n\'a plus d\'importance. »', tag: 'autorite',
            answer: 'C\'est la SEULE question qui compte !',
            effects: { threat: 1 } },
        ] },
      { id: 'gqj_qui', minTurn: 5,
        text: '« Vous savez qui je suis ? Ce qu\'on a fait de moi ? »',
        replies: [
          { label: '« Un homme qu\'on a brisé. On peut encore le réparer. »', tag: 'empathie',
            answer: 'Brisé. C\'est le mot. Vous le savez, vous.',
            effects: { ifClue: { id: 'gc_jal_fierte', then: { threat: -1 }, else: {} } } },
          { label: '« Un homme armé avec des otages. Voilà qui vous êtes. »', tag: 'pression',
            answer: 'Alors traitez-moi comme tel !',
            effects: { threat: 1 } },
          { label: '« Un ami à moi, bientôt. Si vous me laissez faire. »', tag: 'ruse',
            answer: 'Un ami. Vous feriez ça pour moi ?',
            effects: { pcNext: 1, mark: 'promesse' } },
        ] },
    ],
    responses: {
      byTag: {
        empathie: { fail: ['Vous ne savez pas ce que je ressens. Personne ne sait.', 'Votre compassion, je m\'en fiche.'], partial: ['Peut-être. Peut-être que vous comprenez.', 'Elle disait ça aussi, au début.'], success: ['C\'est la première fois qu\'on me comprend.', 'Je l\'aime, vous savez. Malgré tout, je l\'aime.'] },
        autorite: { fail: ['Ne me parlez pas comme à un enfant !', 'Vous êtes qui pour me dire quoi faire ?'], partial: ['Je vous entends. Mais c\'est moi qui décide.', 'Continuez si vous voulez.'], success: ['D\'accord. Vous avez raison. Comme toujours.', 'Vous êtes le seul honnête ce soir.'] },
        pression: { fail: ['Ne me forcez pas. Je vous jure, ne me forcez pas.', 'Vous voulez qu\'il se passe quoi, au juste ?'], partial: ['J\'ai peur. Je le sais, que j\'ai peur.', 'Votre ton, je n\'aime pas.'], success: ['Elle sort. L\'otage sort. Content ?', 'D\'accord pour le délai. Mais c\'est court.'] },
        ruse: { fail: ['Vous mentez. Je vois les mensonges, maintenant.', 'Ne me prenez plus pour un idiot.'], partial: ['Vous diriez n\'importe quoi pour gagner du temps.', 'Vraiment ? Vous le jurez ?'], success: ['Vous me promettez ? Sur votre vie ?', 'Alors je vous crois. Il faut bien croire quelqu\'un.'] },
      },
      default: { fail: ['Laissez-moi. J\'ai besoin de respirer.'], partial: ['Je ne sais pas si je dois vous croire.'], success: ['Parlez encore. Ça me calme.'] },
    },
    lines: {
      kill: ['Qu\'est-ce que j\'ai fait ?! Qu\'est-ce que j\'ai fait ?!', 'C\'est sa faute à elle. À ELLE.'],
      freed: ['Sors. Sors avant que je change d\'avis.', 'Un de moins. Il reste qu\'elle et moi, au fond.'],
      concede: ['Elle va me parler ? Vraiment ?', 'La lettre. Lisez-la-moi deux fois.'],
      terror: ['C\'était quoi, ce bruit ?! Elle arrive ?!', 'Ne coupez pas. Ne me laissez pas seul !'],
    },
  },
  {
    id: 'toxico', label: 'En manque, en détresse',
    teaser: 'La défonce comme seule logique, le corps qui lâche.',
    sex: null, ageRange: [24, 44],
    dossier: [
      'Usager en manque sévère. Tremble, transpire, ne tient pas en place.',
      'La prise d\'otages est un accident autant qu\'un plan.',
      'Impulsif. Chaque minute sans produit aggrave la panique.',
    ],
    demands: [
      { id: 'gd_tox_medecin', label: 'Un médecin', major: true,
        detail: 'Il réclame un soignant et des calmants. Négociable.',
        concede: { effects: { threat: -3, free: 1, pressure: 2 }, text: 'Le médecin légiste entre, dépose le nécessaire, ressort. Il respire enfin. Un otage sort dans la foulée.' } },
      { id: 'gd_tox_produit', label: 'Le produit', major: true,
        detail: 'Il veut « juste de quoi tenir ». Aucun policier ne le fera.',
        concede: { effects: { threat: -2, pressure: 2 }, text: 'De faux cachets passent sous la porte. Il les avale sans regarder.' } },
      { id: 'gd_tox_tabac', label: 'Cigarettes et café', major: false,
        detail: 'Des cigarettes. Il fume nervosité à en vider un paquet.',
        concede: { effects: { threat: -1, pressure: 1 }, text: 'Le paquet glisse par l\'entrebâillement. La flamme tremble sur son visage.' } },
    ],
    clues: [
      { id: 'gc_tox_manque', name: 'Le manque qui parle',
        desc: 'C\'est le corps qui commande, pas la volonté. L\'empathie calme le corps.',
        trait: { tagMods: { empathie: 1 } } },
      { id: 'gc_tox_dettes', name: 'Une dette au fournisseur',
        desc: 'Il doit de l\'argent à quelqu\'un de plus méchant que lui.',
        trait: { tagMods: { autorite: 1 } } },
      { id: 'gc_tox_panique', name: 'Panique instable',
        desc: 'La pression fait tout sauter. Il ne contrôle plus rien.',
        trait: { tagMods: { pression: -1 } } },
      { id: 'gc_tox_famille', name: 'Une mère qui l\'attend', famille: true, proche: true,
        desc: 'Elle prépare son repas tous les soirs, même les mauvais.',
        trait: { tagMods: { empathie: 1 } } },
      { id: 'gc_tox_mef', name: 'On l\'a trop souvent menti',
        desc: 'Assistances, dealers, promesses : il flaire le mensonge.',
        trait: { tagMods: { ruse: -1 } } },
      { id: 'gc_tox_suivi', name: 'Un rendez-vous manqué',
        desc: 'Il devait entrer en cure la semaine prochaine. Il n\'y sera pas.',
        trait: null },
    ],
    questions: [
      { id: 'gqt_med', minTurn: 3,
        text: '« Vous croyez que je fais semblant, c\'est ça ? »',
        replies: [
          { label: '« Non. On voit bien que vous souffrez. On va vous aider. »', tag: 'empathie',
            answer: '…Personne ne dit jamais ça. Personne ne voit.',
            effects: { ifClue: { id: 'gc_tox_manque', then: { threat: -1, pc: 1 }, else: { threat: -1 } } } },
          { label: '« Ce que je crois importe peu. Ce sont les otages qui comptent. »', tag: 'autorite',
            answer: 'Les otages ! Toujours les otages !',
            effects: { threat: 1 } },
          { label: '« Un médecin est en route. Patientez encore un peu. »', tag: 'ruse',
            answer: 'En route ? Vous me promettez ?',
            effects: { pcNext: 1, mark: 'promesse' } },
        ] },
      { id: 'gqt_dettes', minTurn: 5,
        text: '« Il faut que je paie ce que je dois. Vous comprenez ? »',
        replies: [
          { label: '« On s\'occupe de la dette. Sortez d\'abord. »', tag: 'autorite',
            answer: 'Vous pouvez régler ça ? Vraiment ?',
            effects: { ifClue: { id: 'gc_tox_dettes', then: { threat: -1 }, else: {} } } },
          { label: '« Votre mère vous attend, pas votre dette. »', tag: 'empathie',
            answer: 'Maman… elle sait même pas où je suis.',
            effects: { threat: -1 } },
          { label: '« On vous a déjà tout donné. À vous maintenant. »', tag: 'pression',
            answer: 'RIEN ! Vous m\'avez rien donné !',
            effects: { threat: 1 } },
        ] },
    ],
    responses: {
      byTag: {
        empathie: { fail: ['Vous savez rien de ce que je vis !', 'Arrêtez avec vos mots doux.'], partial: ['J\'ai mal partout. Vous savez ?', 'Pourquoi vous êtes gentil ?'], success: ['Merci. Merci de me voir comme quelqu\'un.', 'Ma mère… elle m\'attend pour le dîner.'] },
        autorite: { fail: ['Ne me criez pas dessus !', 'Je fais ce que JE veux !'], partial: ['D\'accord. D\'accord, calmez-vous.', 'Je vous entends.'], success: ['Vous gérez ça, alors. Je vous fais confiance.', 'D\'accord. Vous êtes le chef ici ? Bien.'] },
        pression: { fail: ['Arrêtez ! Vous allez tout faire exploser !', 'Je craque ! Vous voulez que je craque ?!'], partial: ['Une minute. Donnez-moi une minute.', 'C\'est dur, tout ça. C\'est trop dur.'], success: ['Un seul. Prenez-en un seul et c\'est fini.', 'Allez, sors. Sors !'] },
        ruse: { fail: ['Vous mentez. J\'ai trop l\'habitude des menteurs.', 'Ne me prenez pas pour un camé, je vois clair.'], partial: ['Vous jurez ? Jurez-le.', 'Tout le monde me ment. Vous aussi ?'], success: ['Je vous crois. J\'ai besoin de croire quelqu\'un.', 'Bien. On fait comme vous dites.'] },
      },
      default: { fail: ['Une minute. J\'ai besoin d\'une minute.'], partial: ['Je tremble. Vous voyez ?'], success: ['D\'accord. Laissez-moi souffler.'] },
    },
    lines: {
      kill: ['Je voulais pas ! C\'est le manque ! C\'est le manque !', 'Non non non non !'],
      freed: ['Vas-y, sors. Fuis ce que je suis devenu.', 'Un de moins. Bien. Bien, oui.'],
      concede: ['Le médecin arrive ? Enfin.', 'Les cachets. Donnez-les-moi, vite.'],
      terror: ['C\'est quoi ce bruit ?! Ils entrent ?!', 'Ne raccrochez pas ! Je tiendrai pas !'],
    },
  },
  {
    id: 'licencie', label: 'Un employé licencié, en colère',
    teaser: 'Vingt ans de service balayés d\'un courrier.',
    sex: null, ageRange: [42, 60],
    dossier: [
      'Salarié loyal licencié par un plan social. Plus rien à perdre.',
      'Il connaît les lieux : c\'était sa place de travail.',
      'Il veut être entendu. Et reconnu.',
    ],
    demands: [
      { id: 'gd_lic_reconnu', label: 'La reconnaissance publique', major: true,
        detail: 'Que la direction reconnaisse son tort devant témoin. Difficile.',
        concede: { effects: { threat: -3, free: 1, pressure: 2 }, text: 'Le DRH lit le communiqué au téléphone. Il hoche la tête, laisse sortir un otage.' } },
      { id: 'gd_lic_reintegration', label: 'Sa réintégration', major: true,
        detail: 'Reprendre son poste. Impossible en l\'état, mais il y croit.',
        concede: { effects: { threat: -2, pressure: 2 }, text: 'Le papier « réintégration provisoire » passe sous la porte. Il le serre contre lui.' } },
      { id: 'gd_lic_indemnite', label: 'Une indemnité revue', major: false,
        detail: 'De l\'argent pour les années volées. Négociable.',
        concede: { effects: { threat: -1, pressure: 1 }, text: 'Le chiffre est accepté par écrit. Il le plie en quatre.' } },
    ],
    clues: [
      { id: 'gc_lic_orgueil', name: 'Vingt ans de loyauté',
        desc: 'Un dévouement balayé d\'une signature. L\'autorité lui rappelle la direction.',
        trait: { tagMods: { autorite: -1 } } },
      { id: 'gc_lic_famille', name: 'Une famille à nourrir', famille: true, proche: true,
        desc: 'Un conjoint, des enfants. C\'est pour eux qu\'il fait tout ça.',
        trait: { tagMods: { empathie: 1 } } },
      { id: 'gc_lic_mensonge', name: 'Trop de promesses rompues',
        desc: 'On lui a juré cent fois que ça s\'arrangerait. Le ruse le braque.',
        trait: { tagMods: { ruse: -1 } } },
      { id: 'gc_lic_syndicat', name: 'Le syndicat fantôme',
        desc: 'Ses camarades ont capitulé. Il s\'est senti seul dès le premier jour.',
        trait: { tagMods: { empathie: 1 } } },
      { id: 'gc_lic_medoc', name: 'Sous anxiolytiques',
        desc: 'Il mélange cachets et fatigue. Il flotte, parfois.',
        trait: { tagMods: { pression: -1 } } },
      { id: 'gc_lic_dirigeant', name: 'Le directeur protégé',
        desc: 'Il sait que le patron est à l\'abri dans son bureau. Ça le ronge.',
        trait: null },
    ],
    questions: [
      { id: 'gql_justice', minTurn: 3,
        text: '« Vous trouvez ça juste, vous ? Vingt ans contre un courrier ? »',
        replies: [
          { label: '« Non. Mais il y a d\'autres façons de le faire savoir. »', tag: 'empathie',
            answer: 'D\'autres façons… j\'ai tout essayé avant, vous savez.',
            effects: { ifClue: { id: 'gc_lic_orgueil', then: { threat: -1 }, else: {} } } },
          { label: '« Ce n\'est pas à moi de juger. »', tag: 'autorite',
            answer: 'Vous êtes tous pareils. Tous dans le système.',
            effects: { threat: 1 } },
          { label: '« La direction va payer. On peut vous le garantir. »', tag: 'ruse',
            answer: 'Garantir. Ils me garantissaient un avenir, aussi.',
            effects: { pcNext: 1, mark: 'promesse' } },
        ] },
      { id: 'gql_famille', minTurn: 5,
        text: '« Et mes enfants ? C\'est moi qui dois leur expliquer ? »',
        replies: [
          { label: '« Ils ont besoin de leur père vivant, pas d\'un héros. »', tag: 'empathie',
            answer: 'Leur père… c\'est ce que je suis encore, non ?',
            effects: { ifClue: { id: 'gc_lic_famille', then: { threat: -1, pc: 1 }, else: {} } } },
          { label: '« Vous les avez déjà expliqué, en venant ici. »', tag: 'pression',
            answer: 'Ne parlez pas de mes enfants !',
            effects: { threat: 1 } },
          { label: '« Je peux arranger un appel. Ils doivent entendre votre voix. »', tag: 'ruse',
            answer: 'Un appel… ils entendraient quoi, au juste ?',
            effects: { pcNext: 1, mark: 'promesse' } },
        ] },
    ],
    responses: {
      byTag: {
        empathie: { fail: ['Vous ne savez pas ce que c\'est, perdre sa place.', 'Parlez-moi autrement.'], partial: ['Peut-être. Peut-être que vous comprenez un peu.', 'Ils disaient pareil, avant de me licencier.'], success: ['C\'est vrai, tout ça. Vous me comprenez.', 'Ma fille… elle croit encore que je travaille.'] },
        autorite: { fail: ['Ne me parlez pas comme la direction !', 'J\'en ai assez des ordres, ce soir.'], partial: ['Vous parlez fort. Je vous entends.', 'Continuez, si ça vous fait plaisir.'], success: ['Enfin quelqu\'un qui me respecte.', 'D\'accord. Pas de bêtises, des deux côtés.'] },
        pression: { fail: ['Vous voulez que je pète un câble ? C\'est ça ?', 'J\'ai déjà tout perdu ! Vous pouvez rien me prendre !'], partial: ['Vous jouez avec les nerfs.', 'J\'ai mal à la tête. Arrêtez.'], success: ['Un otage contre le délai. Marché.', 'Elle sort. Mais ça n\'arrange rien, pour moi.'] },
        ruse: { fail: ['J\'ai entendu cent fois ces promesses.', 'Ne me prenez pas pour le dernier des idiots.'], partial: ['Prouvez-le. Sur papier.', 'C\'est trop beau pour être vrai.'], success: ['Un écrit. Je veux un écrit. Et je vous crois.', 'Alors on fait ça. Vous avez ma parole.'] },
      },
      default: { fail: ['J\'ai besoin de réfléchir.'], partial: ['Je vous écoute.'], success: ['Bien. Continuez à parler.'] },
    },
    lines: {
      kill: ['C\'est la faute de la direction ! Leur faute à eux !', 'Non… j\'ai fait quoi… j\'ai fait quoi…'],
      freed: ['Sors, va. Rentre chez toi, toi au moins.', 'Un de moins. C\'est le début de la fin.'],
      concede: ['La direction plie. Enfin.', 'Le papier. Je veux le papier entre les mains.'],
      terror: ['Ils arrivent ?! Je les entends ?!', 'Ne me laissez pas seul ici !'],
    },
  },
  {
    id: 'doute', label: 'Un jeune qui doute',
    teaser: 'Embrigadé, puis perdu. Il n\'en veut plus, mais n\'ose plus rien.',
    sex: null, ageRange: [18, 26],
    dossier: [
      'Recruté par un groupement radical il y a quelques mois. Aucun passé.',
      'Aujourd\'hui il devait « prouver ». Il n\'a pas su quoi faire.',
      'Il cherche une porte de sortie sans le savoir.',
    ],
    demands: [
      { id: 'gd_dou_mere', label: 'Parler à sa mère', major: true,
        detail: 'Il veut entendre sa voix. Elle ne sait rien.',
        concede: { effects: { threat: -3, free: 1, pressure: 2 }, text: 'Sa mère prend la ligne. Il pleure longtemps, fait sortir un otage.' } },
      { id: 'gd_dou_sortie', label: 'Une sortie sans éclat', major: true,
        detail: 'Il veut disparaître sans que le groupe ne le sache.',
        concede: { effects: { threat: -2, pressure: 2 }, text: 'Le couloir de service est ouvert. Il regarde la sortie, immobile, hésitant.' } },
      { id: 'gd_dou_benediction', label: 'Un mot de sa communauté', major: false,
        detail: 'Un aîné qu\'il respecte pourrait le délivrer.',
        concede: { effects: { threat: -1, pressure: 1 }, text: 'Le vieil homme dit quelques mots au combiné. Le silence retombe.' } },
    ],
    clues: [
      { id: 'gc_dou_doute', name: 'Le doute immense',
        desc: 'Il n\'y croit plus. Il ne sait plus où il en est.',
        trait: { tagMods: { empathie: 1 } } },
      { id: 'gc_dou_groupe', name: 'Le groupe qui attend',
        desc: 'Des « frères » qui ont dit de tenir. Il n\'ose décevoir.',
        trait: { tagMods: { autorite: -1 } } },
      { id: 'gc_dou_mere', name: 'Sa mère l\'attend', famille: true, proche: true,
        desc: 'Elle l\'a élevé seule. Il ne lui a pas dit au revoir.',
        trait: { tagMods: { empathie: 1 } } },
      { id: 'gc_dou_crainte', name: 'La peur des représailles',
        desc: 'S\'il lâche, le groupe le fera payer. La pression l\'affole.',
        trait: { tagMods: { pression: -1 } } },
      { id: 'gc_dou_naif', name: 'Les belles paroles',
        desc: 'On l\'a eu avec des mots. Il se méfie, mais il écoute.',
        trait: { tagMods: { ruse: -1 } } },
      { id: 'gc_dou_age', name: 'Presque un enfant',
        desc: 'Il a à peine l\'âge de voter. Le doute est là, partout.',
        trait: null },
    ],
    questions: [
      { id: 'gqd_faire', minTurn: 3,
        text: '« Qu\'est-ce que je suis censé faire, maintenant ? »',
        replies: [
          { label: '« Poser l\'arme. C\'est tout ce qui reste à faire. »', tag: 'empathie',
            answer: 'Poser l\'arme… ils me tueraient.',
            effects: { ifClue: { id: 'gc_dou_doute', then: { threat: -1, pc: 1 }, else: {} } } },
          { label: '« Tenir, comme ils vous ont dit. »', tag: 'pression',
            answer: 'Ils m\'ont dit tellement de choses.',
            effects: { threat: 1 } },
          { label: '« Ce que vous voulez. On peut tout arranger. »', tag: 'ruse',
            answer: 'Tout arranger ? Vous pouvez ?',
            effects: { pcNext: 1, mark: 'promesse' } },
        ] },
      { id: 'gqd_mere', minTurn: 5,
        text: '« Ma mère… elle penserait quoi de moi ? »',
        replies: [
          { label: '« Qu\'elle veut juste son fils vivant. Rien d\'autre. »', tag: 'empathie',
            answer: 'Son fils… je suis encore son fils ?',
            effects: { ifClue: { id: 'gc_dou_mere', then: { threat: -1 }, else: {} } } },
          { label: '« Qu\'elle serait déçue. Et elle aurait raison. »', tag: 'autorite',
            answer: 'Ne parlez pas d\'elle !',
            effects: { threat: 1 } },
          { label: '« Qu\'elle serait fière que vous teniez bon. »', tag: 'ruse',
            answer: 'Fière ? …Peut-être. Peut-être.',
            effects: { pcNext: 1, pressure: 1 } },
        ] },
    ],
    responses: {
      byTag: {
        empathie: { fail: ['Vous ne pouvez pas comprendre. Personne ne peut.', 'Laissez-moi. S\'il vous plaît.'], partial: ['Peut-être. Peut-être que vous voyez.', 'Je ne sais plus ce que je pense.'], success: ['Je crois que vous êtes la première personne gentille ce soir.', 'Ma mère… j\'aurais dû l\'écouter.'] },
        autorite: { fail: ['Ne me parlez pas comme eux !', 'Vous n\'êtes pas mon chef !'], partial: ['Je n\'ai plus de chef, au fond.', 'Votre voix… elle est différente.'], success: ['D\'accord. Vous, au moins, vous savez.', 'Vous me dites quoi faire, alors.'] },
        pression: { fail: ['Ne me faites pas peur ! J\'ai déjà trop peur !', 'Vous allez tout gâcher !'], partial: ['J\'ai peur. Je le sais, que j\'ai peur.', 'Je tiens plus.'], success: ['L\'otage sort. Allez, sors, vite.', 'Un délai. Juste un petit délai.'] },
        ruse: { fail: ['Vous mentez comme eux. Tous pareils.', 'Je ne crois plus personne.'], partial: ['Vous diriez n\'importe quoi.', 'C\'est vrai ? Vous le jurez ?'], success: ['Je vous crois. J\'ai besoin de croire.', 'On fait comme vous dites, alors.'] },
      },
      default: { fail: ['J\'ai besoin de respirer.'], partial: ['Je ne sais plus rien.'], success: ['Parlez encore. Ça m\'aide.'] },
    },
    lines: {
      kill: ['Non ! Je voulais pas ! C\'est pas moi !', 'Qu\'est-ce que j\'ai fait ?!'],
      freed: ['Va. Rentre chez ta mère, toi au moins.', 'Un de moins. C\'est mieux comme ça.'],
      concede: ['Elle va me parler ? Vraiment ?', 'Le couloir est libre ? Il est libre ?'],
      terror: ['C\'est quoi ?! Ils viennent ?! Ils viennent me chercher ?!', 'Ne raccrochez pas, je vous en supplie !'],
    },
  },
];

// ---------- assemblage ----------

function makePortrait(rng, sex, age) {
  const female = sex === 'f' || (sex === null && rng() < 0.45);
  const skins = ['clair', 'mat', 'fonce'];
  const hairs = female ? ['court', 'long', 'queue', 'chignon'] : ['court', 'court', 'casquette', 'chauve'];
  const hairColors = ['brun', 'noir', 'noir', 'gris', 'blond', 'roux'];
  const clothes = ['sweat', 'chemise', 'tactique', 'uniforme'];
  const spec = {
    skin: pick(rng, skins),
    hair: pick(rng, hairs),
    hairColor: age > 50 ? pick(rng, ['gris', 'blanc']) : pick(rng, hairColors),
    clothes: pick(rng, clothes),
    age: age > 50 ? 'âgé' : age < 30 ? 'jeune' : 'adulte',
  };
  if (female) spec.sex = 'f';
  if (!female && rng() < 0.4) spec.beard = rng() < 0.7 ? 'courte' : 'longue';
  else if (!female) spec.beard = 'aucune';
  if (rng() < 0.18) spec.glasses = true;
  if (rng() < 0.22) spec.accessory = pick(rng, ['scar', 'bandana']);
  return spec;
}

function makeHostages(rng, venue, n) {
  const used = new Set();
  const name = (sex) => {
    for (let i = 0; i < 40; i++) {
      const nm = randName(rng, sex);
      if (!used.has(nm)) { used.add(nm); return nm; }
    }
    return randName(rng, sex);
  };
  const out = [];
  for (let i = 0; i < n; i++) {
    const role = i === 0 ? venue.hostRole : pick(rng, venue.roles);
    const sex = /e$|euse$|ice$/.test(role) && !/^(client|agent|patient|cadre|résident|interne|brancardier|aide-soignant|employé|livreur|habitué|apprenti|guichetier|conseiller|gérant|directeur|psychologue|bijoutière?)/.test(role)
      ? 'f' : rng() < 0.5 ? 'f' : 'm';
    const h = { id: `h${i}`, name: name(sex), role };
    if (sex === 'f' && /e$|euse$|ice$|ère$|trice$/.test(role)) h.f = true;
    else if (sex === 'f') h.f = true;
    out.push(h);
  }
  // exactement un vulnerable, parfois un heros
  const vi = Math.floor(rng() * n);
  out[vi].trait = 'vulnerable';
  if (rng() < 0.35) {
    let hi;
    do { hi = Math.floor(rng() * n); } while (hi === vi);
    out[hi].trait = 'heros';
  }
  return out;
}

export function generateMission(seed) {
  const rng = mulberry32((seed | 0) ^ 0x5EED);
  const arch = pick(rng, ARCHETYPES);
  const scene = pick(rng, Object.keys(VENUES));
  const venue = pick(rng, VENUES[scene]);
  const town = pick(rng, TOWNS);
  const sex = arch.sex || (rng() < 0.3 ? 'f' : 'm');
  const firstName = pick(rng, sex === 'f' ? FIRST_F : FIRST_M);
  const lastName = pick(rng, LAST);
  const takerName = `${firstName} ${lastName}`;
  const age = arch.ageRange[0] + Math.floor(rng() * (arch.ageRange[1] - arch.ageRange[0] + 1));
  const hostages = 4 + Math.floor(rng() * 3);            // 4–6
  const hostageList = makeHostages(rng, venue, hostages);
  const startThreat = 3 + Math.floor(rng() * 3);          // 3–5

  // questions : 2 dont les indices référencés seront inclus
  const questions = pickN(rng, arch.questions, 2);
  const wantedClues = new Set();
  for (const q of questions) {
    for (const r of q.replies) {
      if (r.effects && r.effects.ifClue) wantedClues.add(r.effects.ifClue.id);
    }
  }
  const cluePool = arch.clues.slice();
  const picked = cluePool.filter(c => wantedClues.has(c.id));
  const rest = shuffleR(rng, cluePool.filter(c => !wantedClues.has(c.id)));
  const clues = picked.concat(rest).slice(0, 5);

  // demandes : 2–3, au moins une majeure
  const majors = arch.demands.filter(d => d.major);
  const minors = arch.demands.filter(d => !d.major);
  const nDem = 2 + (rng() < 0.5 ? 1 : 0);
  const demands = pickN(rng, majors, Math.min(nDem, majors.length))
    .concat(pickN(rng, minors, Math.max(0, nDem - majors.length)));

  // Terreur : 10 uniques + 2 doublons tirés du pool
  const terrorDeck = shuffleR(rng, pickN(rng, TERROR_POOL, 10)
    .concat([pick(rng, TERROR_POOL), pick(rng, TERROR_POOL)]));
  const market = pickN(rng, MARKET_POOL, 10);

  const hour = `${String(20 + Math.floor(rng() * 5)).padStart(2, '0')}h${String(Math.floor(rng() * 60)).padStart(2, '0')}`;

  return {
    id: `gen:${seed}`,
    title: `Opération « ${town} »`,
    subtitle: `${venue.place.replace(/^l[a']\s*/, s => s.charAt(0).toUpperCase() + s.slice(1))} — ${town}`,
    type: 'classic',
    duration: '≈ 30-45 min',
    startThreat,
    hostages,
    hostageList,
    terrorDeck,
    market,
    demands,
    clues,
    questions,
    scene,
    briefing: [
      'RAPPORT D\'INTERVENTION — SECTION NÉGOCIATION (OPÉRATION SPÉCIALE)',
      `${hour}. ${venue.place.charAt(0).toUpperCase() + venue.place.slice(1)}, ${town}. ${venue.art.charAt(0).toUpperCase() + venue.art.slice(1)}. Un individu armé retient ${hostages} personne${hostages > 1 ? 's' : ''}.`,
      `Identité : ${lastName.toUpperCase()} ${firstName}, ${age} ans. ${arch.dossier[0]}`,
      `Profil : ${arch.teaser}`,
      `Otages (${hostages}) : recensement en cours. Périmètre établi. La ligne intérieure est ouverte : il a décroché.`,
      'Consigne : ne laissez personne mourir ce soir.',
    ],
    epilogues: {
      surrender: `${takerName} est sorti${sex === 'f' ? 'e' : ''} les mains vides au petit matin. La ligne est restée ouverte jusqu'au bout. ${town} se réveillera sans savoir. Vous, vous dormirez.`,
      liberation: `Le dernier otage a franchi le cordon avant l'aube. Seul${sex === 'f' ? 'e' : ''} dans ${venue.place}, ${firstName} a posé l'arme et attendu. On l'a trouvé${sex === 'f' ? 'e' : ''} comme ça : enfin au repos.`,
      assault: `L'assaut a duré onze secondes. ${takerName} est neutralisé${sex === 'f' ? 'e' : ''}. Les otages sont sortis de ${venue.place}. C'est le seul chiffre du rapport qui compte.`,
      escape: `Quand le périmètre s'est resserré, ${venue.place} était vide. On a retrouvé l'arme abandonnée. ${firstName} ${lastName} court encore, quelque part entre ${town} et l'oubli.`,
      defeat: `À ${hour}, ${venue.place} a cessé d'être un théâtre d'otages pour devenir une scène de crime. On vous a reconduit au QG. Dehors, ${town} continuait de vivre comme si de rien n'était.`,
    },
    taker: {
      name: takerName,
      age,
      dossier: arch.dossier,
      responses: arch.responses,
      lines: arch.lines,
      portrait: makePortrait(rng, sex === 'f' ? 'f' : 'm', age),
    },
  };
}
