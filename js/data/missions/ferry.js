// ============================================================
// Scénario avancé — « L'Étoile du Levant »
// Ferry pris d'assaut dans le port de la Joliette, Marseille. 3 actes.
// ============================================================

// Passagers générés de façon déterministe (pas de RNG) — 6 nommés + 14 générés
// depuis des pools de noms français (11 enfants, 9 adultes, comme le briefing).
const P_KIDS = [['Noa', false], ['Gabin', false], ['Sacha', false], ['Maël', false], ['Nolan', false],
  ['Léa', true], ['Emma', true], ['Chloé', true], ['Mila', true], ['Romane', true]];
const P_ADULTS = [['Hugo', 'passager', false], ['Camille', 'passagère', true],
  ['Adam', 'passager', false], ['Inès', 'passagère', true]];
const P_NOMS = ['Perrin', 'Fabre', 'Collet', 'Marty', 'Navarro', 'Leclerc', 'Masson', 'Berger', 'Faure',
  'Pons', 'Roche', 'Lucas', 'Baron', 'Vidal'];

function ferryHostages() {
  const list = [
    { id: 'matelot', name: 'Karim Belaïd', role: 'matelot', trait: 'heros' },
    { id: 'enzo', name: 'Enzo Petit', role: 'enfant — 9 ans', trait: 'vulnerable' },
    { id: 'renee', name: 'Renée Aubrac', role: 'passagère — 74 ans', trait: 'vulnerable', f: true },
    { id: 'marcel', name: 'Marcel Aubrac', role: 'passager — 76 ans', trait: 'vulnerable' },
    { id: 'celine', name: 'Céline Vidal', role: 'hôtesse', f: true },
    { id: 'driss', name: 'Driss Hamadi', role: 'chef mécanicien' },
  ];
  P_KIDS.forEach(([p, f], i) => list.push({
    id: `enfant-${i + 1}`, name: `${p} ${P_NOMS[i]}`, role: `enfant — ${7 + (i % 5)} ans`,
    trait: 'vulnerable', f,
  }));
  P_ADULTS.forEach(([p, role, f], i) => list.push({
    id: `passager-${i + 1}`, name: `${p} ${P_NOMS[10 + i]}`, role, f,
  }));
  return list;
}

const MIRA = {
  name: 'Mira Castel',
  age: 36,
  portrait: { skin: 'mat', sex: 'f', hair: 'queue', hairColor: 'noir', clothes: 'tactique', age: 'adulte' },
  dossier: [
    'Porte-parole de la cellule. Ex-chargée de communication, formée aux techniques de négociation qu\'elle démonte une à une.',
    'Trois ans dans l\'« action éco-radicale ». Elle a écrit le communiqué de ce soir : elle le récite au téléphone.',
    'Ansel Roux est le chef ; Mira est la voix. Elle n\'a pas la main sur les charges — pas sûr qu\'elle le sache.',
  ],
  responses: {
    byTag: {
      empathie: {
        fail: ['Écoute active, c\'est ça ? J\'ai eu la même formation que vous, négociateur.', 'Votre empathie est un protocole. Mes passagers ne sont pas un protocole.'],
        partial: ['Oui, les familles à bord. C\'est exactement pour ça que vous ne donnerez pas l\'assaut.', 'Vous jouez bien votre rôle. Moi aussi, d\'ailleurs.'],
        success: ['Vous savez qu\'il y a onze enfants dans ce bateau ? Je les ai comptés aussi.', 'Vous avez presque l\'air sincère. Presque.'],
      },
      autorite: {
        fail: ['Ne perdez pas votre temps avec la voix grave. J\'ai fait des vocalises toute ma carrière.', 'L\'autorité morale est de mon côté, pas du vôtre.'],
        partial: ['Je note votre ton. Ansel aussi le note.', 'Vous avez dit « responsabilités ». Mot intéressant sur un bateau piégé.'],
        success: ['Très bien, soit. Discutons entre professionnels.', 'Votre voix tient bon. Je respecte les voix qui tiennent.'],
      },
      pression: {
        fail: ['La pression ? Sur vingt passagers et des charges armées ? Calculez mieux.', 'Vos menaces m\'amusent. Elles rendent mes passagers nerveux.'],
        partial: ['Je vois vos zodiacs sous le pont 3. Je les compte aussi.', 'Vous voulez monter la pression ? Attendez que l\'eau noire monte.'],
        success: ['Deux familles. Par la passerelle arrière. C\'est le seul canal que j\'autorise ce soir.', 'Trois passagers de plus. Pas de caméras dans le couloir.'],
      },
      ruse: {
        fail: ['Des délais ? J\'ai lu le même manuel que vous. Chapitre 7.', 'Votre « encore dix minutes »… classique. Je vous sens lire sur un écran.'],
        partial: ['Vous tournez autour du pot. Ça me va : chaque minute prouve que personne ne veut couler ce bateau.', 'On dirait un miroir qui négocie avec un miroir.'],
        success: ['D\'accord pour les familles d\'abord. Je vous accorde ça — une seule fois.', 'Votre combine passe. Cette fois.'],
      },
    },
    byCard: {
      proposer_reddition: {
        fail: ['Nous rendre ? On est venus pour être entendus, pas pour finir en GAV.'],
        partial: ['Ansel ne se rendra pas. Moi peut-être. Convainquez-moi.'],
        success: ['J\'ouvre la passerelle. Tout le monde descend. Écrivez dans votre rapport que personne n\'est mort ce soir — c\'est le seul mot qui compte.'],
      },
      passerelle: {
        fail: ['La passerelle ? Je la fais sauter si vos hommes s\'approchent.'],
        partial: ['Deux familles par rotation. Pas plus.'],
        success: ['Les familles descendent. Comptez-les comme je les compte : une par une, vivantes.'],
      },
    },
    default: {
      fail: ['Vous devriez écrire des manuels. Vous êtes meilleure sur le papier.'],
      partial: ['J\'entends. Vous entendez ? On s\'entend trop bien, vous et moi.'],
      success: ['Continuez à parler. Chaque mot que vous dites, je le rends à Ansel.'],
    },
  },
  lines: {
    kill: ['Ce pont vient de sauter. Vous vouliez jouer au chat ?', 'Le sang est sur le pont. Sur VOS mains aussi, négociateur.'],
    freed: ['La passerelle descend. Les familles passent. Ne les filmez pas.', 'Des otages de moins. Vous croyez gagner ?'],
    concede: ['Un couloir humanitaire. Le premier pas sensé de la soirée.', 'Les caméras au môle ? Elles restent. C\'est pour ça qu\'on est venus.'],
    terror: ['Les passagers paniquent sur le pont 6. Tenez vos hommes loin.', 'Ansel marche sur le pont 7. J\'espère pour vous qu\'il ne descend pas.'],
  },
};

const ANSEL = {
  name: 'Ansel Roux',
  age: 47,
  portrait: { skin: 'mat', hair: 'casquette', beard: 'courte', clothes: 'uniforme', age: 'adulte' },
  dossier: [
    'Ancien docker à la Joliette. Le port l\'a licencié, la ville l\'a oublié. Il connaît chaque passerelle de ce ferry.',
    'Il a posé les charges lui-même. Mira parle ; Ansel décide.',
    'Il a été trimard pendant 20 ans sur ce quai. Le bateau, pour lui, c\'est un fournisseur qui n\'a jamais payé.',
  ],
  responses: {
    byTag: {
      empathie: {
        fail: ['Les mots doux, c\'est Mira. Pas moi.', 'J\'ai donné vingt ans au port. Personne m\'a jamais demandé comment j\'allais.'],
        partial: ['Vous voulez savoir pourquoi ce bateau ? Posez la question à la mairie.', 'J\'entends votre gentillesse. Mira m\'a prévenu : c\'est une technique.'],
        success: ['Vingt ans à charger vos conteneurs, vos voitures, vos touristes. Ce soir, je charge la vérité.', 'Vous êtes le premier qui me parle de travail. Les autres parlent de terrorisme.'],
      },
      autorite: {
        fail: ['Ne haussez pas le ton sur MON bateau.', 'Votre autorité s\'arrête à la passerelle.'],
        partial: ['Vous parlez comme un contremaître. J\'en ai eu des meilleurs.', 'Continuez sur ce ton et je monte une charge de plus.'],
        success: ['Vous commandez bien. Moi aussi. C\'est ce qui fait le problème.', 'D\'accord. Un contremaître respecte un contremaître.'],
      },
      pression: {
        fail: ['Vous me menacez sur un navire piégé ? Vous êtes suicidaire.', 'La pression, c\'est ce qu\'il y a dans les tuyaux du pont 5. Ne jouez pas avec.'],
        partial: ['J\'ai vu vos hommes sur le môle. Je les vois tous.', 'Les charges répondent à mon téléphone. Pas au vôtre.'],
        success: ['Trois passagers de plus. Mais les charges restent armées.', 'Un groupe sort par l\'arrière. Je les compte. J\'en garde assez.'],
      },
      ruse: {
        fail: ['Des manèges ? Je suis docker, pas gamin.', 'Vos combines, j\'en ai vu pendant vingt ans de quais.'],
        partial: ['Vous barguignez. Moi je sais faire attendre des bateaux entiers.', 'Allez-y, racontez votre histoire. J\'écoute toujours une bonne histoire.'],
        success: ['Marché : les passagers contre vos gyrophares qui s\'éloignent.', 'T\'es pas bête pour un flic. Ça me va.'],
      },
    },
    byCard: {
      proposer_reddition: {
        fail: ['Me rendre ? Pour retourner au chômage avec un casier ?'],
        partial: ['Et mes gars ? Ils ont des familles aussi, en bas du pont.'],
        success: ['Je désamorce. Que le monde sache qu\'un docker a fait trembler le port une nuit — et que personne n\'est mort.'],
      },
    },
    default: {
      fail: ['Parlez mieux ou raccrochez.'],
      partial: ['Je vous écoute. Le port m\'a appris la patience.'],
      success: ['Continuez. La nuit est à nous.'],
    },
  },
  lines: {
    kill: ['Le pont 5 vient de sauter. C\'est la réalité du chantier.', 'Vous voyez le feu sur l\'eau ? C\'est votre travail aussi.'],
    freed: ['Les passagers sortent. Vous voyez ? On n\'est pas des bêtes.', 'Un groupe dehors. Il en reste assez pour que vous écoutiez.'],
    concede: ['La mer ? Vous me lâchez les amarres ? Vous êtes plus fou que moi.', 'Le couloir ouvert. Première chose intelligente de la soirée.'],
    terror: ['Les charges bipent sur le pont 7. Ne bougez pas vos hommes.', 'La mer se forme. Le bateau bouge. Tout peut sauter.'],
  },
};

export const MISSION_FERRY = {
  id: 'ferry',
  title: 'L\'Étoile du Levant',
  subtitle: 'Ferry Marseille–Ajaccio — port de la Joliette',
  type: 'advanced',
  duration: '≈ 40–50 min',
  startThreat: 4,
  hostages: 20,
  hostageList: ferryHostages(),
  pressureEvery: 6,
  scene: 'ferry',

  briefing: [
    'RAPPORT D\'INTERVENTION — SECTION NÉGOCIATION',
    '22h08. Ferry « L\'Étoile du Levant », à quai, port de la Joliette, Marseille. Une cellule armée de quatre membres revendique une « action éco-radicale » contre la pollution portuaire. Vingt passagers retenus à bord.',
    'Identité : CASTEL Mira, 36 ans, porte-parole — formée à nos propres techniques. Le chef : ROUX Ansel, 47 ans, ex-docker des quais. Il a posé des charges sous les ponts. Les démineurs confirment : elles sont réelles.',
    'Otages (20) : passagers dont onze enfants. Le ferry peut appareiller à tout moment — la question est de savoir si vous le laisserez partir.',
    'Consigne : Mira démontera vos techniques une à une. Ne la prenez pas pour une intermédiaire : elle EST la négociation.',
  ],

  counters: [
    {
      id: 'explosifs', label: 'Explosifs', icon: '💣', start: 1, max: 3, resetTo: 1,
      cause: 'Explosion (charges)',
      // première explosion : un pont saute ; à la seconde, la coque peut lâcher —
      // jet de structure : 0 succès = la chaîne se rompt et le ferry coule
      onMax: {
        ifFlag: {
          f: 'ferry_boomed',
          then: { roll: { dice: 1, table: {
            0: { kill: 3, pressure: 3, log: 'Une nouvelle déflagration. La coque tient — de justesse.' },
            1: { lose: 1, log: 'Les charges sautent en chaîne. Le ferry s\'embrase et gîte dans la rade.' },
          } } },
          else: { kill: 3, pressure: 3, flag: 'ferry_boomed' },
        },
      },
    },
  ],

  extraTeamActions: [
    {
      id: 'demineurs', name: 'Approche démineurs',
      desc: 'Les démineurs progressent sous les coques. Explosifs −1.',
      log: 'Les démineurs travaillent sous les coques. Chaque minute les rapproche des charges.',
      effects: { counter: { explosifs: -1 } },
    },
  ],

  assaultRiskFlags: { en_mer: 1 },

  choices: {
    appareiller: {
      prompt: 'Mira exige que le ferry appareille : « En mer, nous sommes invincibles. À quai, nous sommes des cibles. » Le préfet attend votre avis.',
      options: [
        {
          label: 'Laisser appareiller', flag: 'en_mer',
          desc: 'La tension retombe (menace −2) mais les caméras crient au scandale (pression +2) et l\'assaut en mer sera plus risqué (+1 risque par otage).',
          effects: { threat: -2, pressure: 2 },
        },
        {
          label: 'Refuser l\'appareillage',
          desc: 'Le bateau reste à quai, à portée de vos équipes. Ansel arme une charge de plus (Explosifs +1, menace +1).',
          effects: { counter: { explosifs: 1 }, threat: 1 },
        },
      ],
    },
  },

  taker: MIRA,

  demands: [
    {
      id: 'couloir', label: 'Couloir humanitaire + retrait des zodiacs', major: true,
      detail: 'Un couloir ouvert vers la passerelle et les zodiacs d\'assaut hors de vue.',
      concede: { effects: { threat: -3, free: 2, pressure: 2 }, text: 'Les zodiacs reculent. La passerelle s\'ouvre : deux familles descendent, les mains sur la tête, vers vos hommes.' },
    },
  ],

  clues: [
    { id: 'f_familles', name: 'Onze enfants à bord', famille: true,
      desc: 'Des familles entières sur le pont 6. Le levier le plus fort — et ce qui retient vos équipes.',
      trait: { tagMods: { empathie: 1 } } },
    { id: 'f_mira_form', name: 'Mira formée à vos techniques',
      desc: 'Elle a lu les mêmes manuels. Vos ruses, elle les reconnaît au premier mot. −1 ruse.',
      trait: { tagMods: { ruse: -1 } } },
    { id: 'f_roux_docker', name: 'Ansel, 20 ans de quai', famille: true, proche: true,
      desc: 'Il a nourri sa famille à la Joliette. Ce bateau, c\'est le port qui le lui a volé.',
      trait: { tagMods: { empathie: 1 } } },
    { id: 'f_bruit', name: 'Du bruit, pas du sang',
      desc: 'La cellule veut des caméras et un procès, pas un charnier. Le savoir calme l\'autorité. +1 autorité une fois compris.',
      trait: { tagMods: { autorite: 1 } } },
  ],

  terrorExtra: {
    f_charge: {
      id: 'f_charge', name: 'Une charge de plus',
      text: 'Ansel descend sous les ponts. Les démineurs voient une lumière bouger dans la salle des machines.',
      taker: 'Un bip de plus sur la fréquence. Vous l\'entendez ?',
      effect: { counter: { explosifs: 1 } },
    },
    f_detonateur: {
      id: 'f_detonateur', name: 'Le détonateur',
      text: 'Ansel montre un boîtier noir au hublot. Deux charges supplémentaires s\'arment quelque part sous vos pieds.',
      taker: 'Ce bouton-là, vous ne le négociez pas.',
      effect: { counter: { explosifs: 2 } },
    },
    f_pont7: {
      id: 'f_pont7', name: 'Sur le pont 7',
      text: 'Un homme apparaît à la rambarde du pont 7, silhouette contre les projecteurs. C\'est Ansel.',
      taker: 'Le patron vous regarde. Souriez.',
      effect: { threat: 1, reveal: 1 },
    },
    f_panique_passagers: {
      id: 'f_panique_passagers', name: 'Panique sur le pont 6',
      text: 'Une bousculade éclate près des canots. Des enfants crient.',
      taker: 'Ils se jettent à l\'eau si vos zodiacs avancent !',
      effect: { roll: { dice: 2, table: { 0: { kill: 1 }, 1: { threat: 1 } } } },
    },
    f_mer: {
      id: 'f_mer', name: 'La mer se forme',
      text: 'Le vent du large se lève. Le ferry tangue doucement à quai — ou lourdement en mer.',
      taker: 'Vous sentez ? Le bateau bouge.',
      effect: { ifFlag: { f: 'en_mer', then: { threat: 1, pressure: 1 }, else: { pressure: 1 } } },
    },
    f_molo: {
      id: 'f_molo', name: 'La foule au môle',
      text: 'Des centaines de Marseillais massés au môle. Des pancartes. Des téléphones levés.',
      taker: 'La ville regarde. Vous aussi, vous êtes jugés.',
      effect: { pressure: 2 },
    },
    f_siege: {
      id: 'f_siege', name: 'Le siège s\'installe',
      text: 'Des tentes montées sur le quai. Un siège médiatique. Le monde regarde le ferry.',
      taker: 'Le monde entier nous écoute maintenant. Merci.',
      effect: { pressure: 1, threat: 1 },
    },
  },

  acts: [
    {
      id: 'a1', title: 'À quai',
      intro: [
        'Le ferry respire contre le quai, lumières allumées, hublots comme des yeux.',
        'Mira Castel répond au premier coup. Sa voix est professionnelle. Trop.',
      ],
      terrorDeck: ['nervosite', 'f_charge', 'fait_divers', 'f_panique_passagers', 'accalmie', 'f_mer'],
      goal: [{ type: 'freed', n: 5 }],
      eachTurn: {
        roll: { dice: 2, table: {
          0: { ifThreatGte: { v: 6, then: { pc: -1, log: 'Mira contre votre approche.' }, else: { pc: -1, threat: 1, log: 'Mira contre votre approche.' } } },
          1: {},
        } },
      },
    },
    {
      id: 'a2', title: 'Le pont 7',
      scene: { ifFlag: 'en_mer', then: 'ferry_mer', else: 'ferry' },
      intro: [
        'Une silhouette a rejoint Mira au téléphone. Ansel Roux ne parle pas encore — mais il écoute.',
        'Sur le pont 7, des hommes patrouillent à la rambarde. Les charges répondent à sa voix.',
      ],
      terrorDeck: ['f_charge', 'f_detonateur', 'f_pont7', 'f_mer', 'fait_divers', 'fait_divers'],
      taker: MIRA,
      choice: 'appareiller',
      addMarket: ['passerelle'],
      eachTurn: {
        roll: { dice: 2, table: {
          0: { ifThreatGte: { v: 6, then: { pc: -1, log: 'Mira contre votre approche.' }, else: { pc: -1, threat: 1, log: 'Mira contre votre approche.' } } },
          1: {},
        } },
      },
    },
    {
      id: 'a3', title: 'Ansel',
      scene: { ifFlag: 'en_mer', then: 'ferry_mer', else: 'ferry' },
      intro: [
        'La voix de Mira s\'efface. Une autre prend le combiné. Grave. Économique. Ansel Roux.',
        '« Fini de parler à ma porte-parole. Maintenant, c\'est le patron du chantier qui vous écoute. »',
      ],
      terrorDeck: ['f_detonateur', 'f_charge', 'fait_divers', 'accalmie', 'souvenir', 'accalmie'],
      startThreat: 4,
      taker: ANSEL,
      addClues: [
        { id: 'f_epuise', name: 'Ansel à bout',
          desc: 'Il a posé les charges mais jamais tiré. La fatigue gagne. Il cherche peut-être une sortie honorable.',
          trait: { tagMods: { empathie: 1 } } },
      ],
    },
  ],

  market: ['verite_brutale', 'famille', 'dossier_psy', 'souffrance', 'echange', 'mediateur',
           'nourriture', 'bluff_assaut', 'mentir_delais', 'silence_tactique', 'promesse', 'passerelle', 'humour'],

  questions: [
    {
      id: 'q_manuels', minTurn: 2, act: 0,
      text: '« Vous allez me parler d\'écoute active ? J\'ai lu les mêmes manuels que vous. »',
      replies: [
        { label: '« Alors vous savez aussi comment ça finit sans issue. »', tag: 'autorite',
          answer: 'Le bruit, pas le sang. C\'est ce qu\'on veut ici.',
          effects: { ifClue: { id: 'f_bruit', then: { threat: -1 }, else: { threat: 1 } } } },
        { label: '« Pas de manuels ici. Je débute. »', tag: 'ruse',
          answer: 'Vous débutez ? Alors écoutez bien, débutant.',
          effects: { pcNext: 1, mark: 'promesse' } },
        { label: '« Alors vous savez aussi que le temps joue pour moi. »', tag: 'pression',
          answer: 'Le temps joue pour personne sur un ferry piégé.',
          effects: { threat: 1 } },
      ],
    },
    {
      id: 'q_pertes', minTurn: 2, act: 1,
      text: '« Vingt personnes à bord. Vous êtes prêt à en perdre combien ? »',
      replies: [
        { label: '« Le gouvernement n\'acceptera jamais de morts. Vous avez gagné. »', tag: 'ruse',
          answer: 'On verra ce que vaut votre gouvernement.',
          effects: { pcNext: 1, pressure: 1 } },
        { label: '« Zéro. Onze enfants comptent sur votre calme. »', tag: 'empathie',
          answer: 'Les enfants… personne ne touche aux enfants.',
          effects: { ifClue: { id: 'f_familles', then: { threat: -1 }, else: {} } } },
        { label: '« Autant qu\'il faudra pour vous arrêter. »', tag: 'autorite',
          answer: 'Dans ce cas préparez les sacs. Beaucoup.',
          effects: { threat: 1 } },
      ],
    },
    {
      id: 'q_charges', minTurn: 2, act: 2,
      text: '« Mira dit que mes charges feront peur. Et vous, vous y croyez ? »',
      replies: [
        { label: '« J\'y crois assez pour ne pas vouloir que vous appuyiez, Ansel. Sortez de là. »', tag: 'empathie',
          answer: 'Sortir… vingt ans de quai, et je finis ici. Vous avez peut-être raison.',
          effects: { ifClue: { id: 'f_epuise', then: { threat: -1, pc: 1 }, else: {} } } },
        { label: '« On a vérifié. Elles sont désamorcées depuis deux heures. »', tag: 'pression',
          answer: 'Désamorcées ?! Vous n\'y êtes pas allés de si près.',
          effects: { threat: 1 } },
        { label: '« Nos plongeurs sont sous la coque en ce moment. »', tag: 'ruse',
          answer: 'Sous la coque. Amusant. Vous bluffez, mais amusant.',
          effects: { pcNext: 1, mark: 'promesse' } },
      ],
    },
  ],

  epilogues: {
    surrender: 'Ansel Roux a désamorcé les charges à 04h17 et a descendu la passerelle lui-même. Les passagers sont sortis dans le silence du port. Mira a lu son communiqué aux caméras avant de tendre les poignets. Personne n\'est mort. C\'était le seul mot qui comptait.',
    liberation: 'Le dernier passager a touché le quai à 03h52. À bord, les quatre membres de la cellule ont posé les armes sur le pont et attendu. L\'Étoile du Levant n\'est jamais repartie — elle rouille toujours à la Joliette.',
    assault: 'Les zodiacs ont accosté à 03h11. Les équipes ont pris les ponts un par un dans la fumée des grenades. Ansel n\'a pas appuyé. Le rapport dira que la négociation a « permis d\'approcher » — vous savez ce que ça veut dire.',
    escape: 'Quand les équipes sont entrées, le ferry était vide de ses preneurs. Une annexe a filé dans le noir vers le large. On a retrouvé les charges désamorcées et une pancarte sur la rambarde : « LA MER APPARTIENT À PERSONNE ».',
    defeat: 'Le pont 5 a sauté à 02h40. Le ferry s\'est couché sur bâbord dans la rade. Les plongeurs ont travaillé jusqu\'au matin. On ne parle plus du nombre exact — on parle de l\'aube qui s\'est levée sur un port en deuil.',
  },
};
