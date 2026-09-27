// ============================================================
// Scénario avancé — « Quartier B »
// Mutinerie à la maison centrale de Saint-Aubin-des-Fers. 3 actes.
// ============================================================

const KERAUDREN = {
  name: 'Yann Keraudren',
  age: 49,
  portrait: { skin: 'mat', hair: 'chauve', beard: 'courte', clothes: 'detenu', age: 'âgé' },
  dossier: [
    'Condamné à perpétuité il y a seize ans. Vol commis, homicide au cours du braquage. Il assume, dit-il.',
    'Intellectuel de prison : correspondances avec l\'université, droit carcéral par cœur. Les surveillants le respectent — et le craignent.',
    'A organisé la mutinerie « pour les conditions », dit-il. Le bloc B s\'est emballé plus vite que prévu.',
  ],
  responses: {
    byTag: {
      empathie: {
        fail: ['L\'empathie en centrale ? Vous lisez trop de romans, monsieur le négociateur.', 'Seize ans de cellule. Votre compassion arrive seize ans trop tard.'],
        partial: ['Vous me parlez comme à un homme. Ça m\'avait manqué. Presque.', 'C\'est pas moi qui souffre le plus. C\'est l\'infirmière. Elle ne devrait pas être là.'],
        success: ['Vous connaissez la loi pénitentiaire ? Lisez l\'article R.57. Ils nous doivent ça depuis 2019.', 'Ma fille a cessé de répondre en 2015. Vous saviez ça, monsieur le négociateur ?'],
      },
      autorite: {
        fail: ['L\'autorité a construit ce quartier. Voyez ce qu\'elle a produit.', 'Je suis condamné à perpétuité. Qu\'est-ce que votre autorité peut me faire de plus ?'],
        partial: ['Vous parlez fort. Les anciens parlent fort aussi. Écoutez-les.', 'Votre chaîne de commandement m\'intéresse autant que la mienne.'],
        success: ['Très bien. Parlementons alors. En chefs, si vous voulez.', 'Vous avez le ton d\'un directeur. Attention : ici, les directeurs démissionnent.'],
      },
      pression: {
        fail: ['Vous pressez une centrale qui bouillonne. Je suis pas sûr de pouvoir contenir le quartier.', 'Vos équipes d\'intervention ? On les attend. On s\'est préparés seize ans.'],
        partial: ['Un surveillant pour un journaliste. C\'est le taux change de ce soir.', 'Je contrôle le quartier pour l\'instant. Pas demain. Comprenez la différence.'],
        success: ['L\'aide-soignant de nuit sort. Pas un cadeau : il a des enfants, comme vous.', 'Un homme sort. Maintenant, le journaliste. Vous m\'avez entendu.'],
      },
      ruse: {
        fail: ['J\'ai vu tous les films de négociation, monsieur. Recommencez.', 'Des combines ? En prison on vit de combines. Je reconnais les vôtres.'],
        partial: ['Votre manège a du métier. Continuez, je regarde.', 'On négocie. Pas besoin de magie pour ça.'],
        success: ['Un compromis, donc. Signé par le directeur, pas par vous.', 'Vous êtes plus intelligent que les autres. C\'est un problème pour moi.'],
      },
    },
    byCard: {
      proposer_reddition: {
        fail: ['Me rendre ? Je vis déjà ma reddition. Seize ans.'],
        partial: ['Le quartier m\'écoute encore. Donnez-moi une raison de les rendre.'],
        success: ['On ouvre les portes. Vous notez : Keraudren a tenu parole. Pas vos hommes — moi.'],
      },
      appel_avocat: {
        fail: ['Un avocat ? J\'en ai eu douze. Ils ont tous promis.'],
        partial: ['Verdier connaît mon dossier. Il vous dira que je tiens parole.'],
        success: ['Dites à Verdier que je lisais Dostoevski. Il saura.'],
      },
    },
    default: {
      fail: ['Vous me fatiguez, monsieur le négociateur.'],
      partial: ['On parle. C\'est déjà plus que la plupart des jours.'],
      success: ['On discute sérieusement, là. Continuez.'],
    },
  },
  lines: {
    kill: ['Le quartier a débordé. Je vous avais prévenu de contenir vos hommes.', 'C\'est plus sous mon contrôle. Vous entendez ? C\'est plus sous mon contrôle.'],
    freed: ['Le surveillant sort. Dites à sa femme qu\'il est vivant — c\'est tout ce qu\'on lui a volé ce soir.', 'L\'infirmière ou le gros surveillant. Un seul. Vous choisissez ? Non, moi je choisis.'],
    concede: ['Le journaliste est là ? Faites-le entrer par le sas nord. Avec un carnet.', 'Des repas chauds. C\'est tout ce qu\'on demandait depuis six mois.'],
    terror: ['Le quartier gronde. Vous entendez les barres qui tremblent ?', 'Y a du monde qui casse dans l\'aile sud. Je fais ce que je peux.'],
  },
};

const SOREL = {
  name: 'Mickaël Sorel, dit « Vingt-Deux »',
  age: 27,
  portrait: { skin: 'clair', hair: 'court', hairColor: 'noir', clothes: 'detenu', accessory: 'bandana', age: 'jeune' },
  dossier: [
    'Sept ans pour agressions en récidive, violences en détention. « Vingt-Deux » : sa durée au trou, en mois cumulés.',
    'Sous produits. A pris le contrôle du bloc quand Keraudren a hésité.',
    'Pas d\'idéologie. De la rage et une audience. C\'est tout.',
  ],
  responses: {
    byTag: {
      empathie: {
        fail: ['Ta pitié, garde-la pour toi, flic.', 'Tu me prends pour qui ? Pour le vieux ?'],
        partial: ['T\'as une voix douce. La voix douce, j\'aime pas.', 'Tu veux m\'écouter ? Écoute le feu dans l\'aile sud.'],
        success: ['Personne m\'a parlé comme ça depuis ma mère. Et ma mère est morte.', 'Tu crois que je suis qu\'un chien ? Les autres, ils croient ça. Toi non, peut-être.'],
      },
      autorite: {
        fail: ['L\'autorité ?! J\'EN AI MARRE DE VOTRE AUTORITÉ !', 'Vingt-deux mois au trou à cause de ton autorité !'],
        partial: ['T\'as du cran de me parler comme ça. Un peu.', 'T\'es pas le chef ici. Moi je suis le chef du quartier B.'],
        success: ['Ouais, bon. Tu parles comme un maton en chef. J\'aime bien les chefs.', 'D\'accord, t\'es solide. On discute.'],
      },
      pression: {
        fail: ['Tu me presses ?! J\'AI UNE INFIRMIÈRE, TU VAS PAS ME PRESSER !', 'Les gars vont déboulonner un maton si tu continues.'],
        partial: ['Un surveillant contre un pack de clopes et une télé. Vite.', 'Dépêche-toi, le quartier tient plus.'],
        success: ['Un. Un seul. Et tu me trouves une télé dans la nuit.', 'Le petit surveillant sort. Il pleure. Pathétique.'],
      },
      ruse: {
        fail: ['Tu me baratines. JE SUIS PAS UN GAMIN !', 'Des magouilles ? J\'en ai vendu en taule, des magouilles.'],
        partial: ['Tu tournes. Moi je vais droit. On verra qui gagne.', 'C\'est quoi ton plan, le flic ?'],
        success: ['La télé et les clopes. Marché conclu. Un maton dehors.', 'Ouais. T\'es pas aussi con que les autres.'],
      },
    },
    byCard: {
      proposer_reddition: {
        fail: ['Me rendre ? Pour aller dans une cellule à côté du trou ? Jamais.'],
        partial: ['Et si je sors, ils m\'envoient où ? Ailleurs en taule. Pourquoi je bougerais ?'],
        success: ['J\'ouvre la porte. Mais tu dis aux journaux que c\'est Sorel qui a tenu le quartier. SOREL.'],
      },
    },
    default: {
      fail: ['Tu m\'énerves, le flic.'],
      partial: ['J\'écoute. C\'est ma nuit, j\'écoute qui je veux.'],
      success: ['Parle. La nuit est longue et j\'ai le quartier derrière moi.'],
    },
  },
  lines: {
    kill: ['Le quartier a fait ce qu\'il avait à faire. Toi aussi t\'as fait ton choix.', 'Un de moins. Le suivant si tu bouges pas.'],
    freed: ['Le maigrichon sort. Qu\'il aille pleurer chez sa mère.', 'Un dehors. Compte bien : il en reste.'],
    concede: ['Le vieux a eu son journaliste ? Et moi j\'ai rien ?! T\'as oublié qui tient le quartier !', 'Des repas ? Des TELEVISEURS, je t\'ai dit !'],
    terror: ['Le feu prend dans l\'aile sud ! Tu vois les flammes ?', 'Ça hurle partout. C\'est la fête ce soir !'],
  },
};

export const MISSION_PRISON = {
  id: 'prison',
  title: 'Quartier B',
  subtitle: 'Maison centrale de Saint-Aubin-des-Fers',
  type: 'advanced',
  duration: '≈ 35–45 min',
  startThreat: 4,
  hostages: 6,
  hostageList: [
    { id: 'surv-bellac', name: 'Marc Bellac', role: 'surveillant' },
    { id: 'surv-ferhat', name: 'Yanis Ferhat', role: 'surveillant' },
    { id: 'surv-kaufmann', name: 'Denis Kaufmann', role: 'surveillant' },
    { id: 'surv-brant', name: 'Olivia Brant', role: 'surveillante', f: true },
    { id: 'surv-amrani', name: 'Rachid Amrani', role: 'surveillant' },
    { id: 'infirmiere', name: 'Paulette Ansel', role: 'infirmière — 58 ans', trait: 'vulnerable', f: true },
  ],
  pressureEvery: 5,
  scene: 'prison',

  briefing: [
    'RAPPORT D\'INTERVENTION — SECTION NÉGOCIATION',
    '21h40. Maison centrale de Saint-Aubin-des-Fers. La promenade du bloc B a dégénéré : les détenus ont retourné le quartier et retiennent cinq surveillants et une infirmière.',
    'Identité : KERAUDREN Yann, 49 ans, perpétuité depuis seize ans, figure du quartier. Il dit vouloir « des conditions dignes et un témoin ». Le deuxième homme à surveiller : SOREL Mickaël, « Vingt-Deux », 27 ans, violent et imprévisible.',
    'Otages (6) : cinq surveillants, une infirmière du service médical. Le bloc est barricadé ; l\'incendie n\'est qu\'une question de temps si ça s\'enlise.',
    'Consigne : le quartier est une cocotte. L\'Émeute monte par à-coups — surveillez-la, ou le premier otage passe par-dessus la rambarde.',
  ],

  counters: [
    {
      id: 'emeute', label: 'Émeute', icon: '🔥', start: 0, max: 5, resetTo: 2,
      cause: 'Lynchage (Émeute)',
      onMax: { kill: 1, pressure: 2 },
    },
  ],

  choices: {
    keraudren_deal: {
      prompt: 'Keraudren propose un marché : accordez-lui sa demande — le journaliste et la médiation — et il reprend le contrôle du quartier.',
      options: [
        {
          label: 'Accorder sa demande', flag: 'keraudren_allie',
          desc: 'Le journaliste entre par le sas nord (concession majeure). Keraudren reprend la main sur le quartier.',
          effects: { concedeDemand: 'mediation' },
        },
        {
          label: 'Refuser le marché',
          desc: 'Pas de combine avec un condamné. Le quartier s\'emballe davantage (Émeute +2).',
          effects: { counter: { emeute: 2 } },
        },
      ],
    },
  },

  taker: KERAUDREN,

  demands: [
    {
      id: 'mediation', label: 'Journaliste et médiateur sur place', major: true,
      detail: 'Un journaliste témoin des conditions de détention, et un médiateur reconnu par l\'administration.',
      concede: { effects: { threat: -3, free: 1, pressure: 2 }, text: 'Le journaliste franchit le sas nord, carnet en main. Keraudren libère le surveillant blessé « en signe de bonne foi ».' },
    },
    {
      id: 'repas', label: 'Repas chauds et tabac', major: false,
      detail: 'Le quartier n\'a pas mangé depuis midi.',
      concede: { effects: { threat: -1, counter: { emeute: -1 } }, text: 'Les gamelles passent sous la barricade. Le quartier mange. La tension retombe d\'un cran.' },
    },
  ],

  clues: [
    { id: 'p_code', name: 'Un code d\'honneur',
      desc: 'Keraudren tient parole — c\'est sa fierté et sa survie en taule. La parole d\'un homme +1 autorité une fois comprise.',
      trait: { tagMods: { autorite: 1 } } },
    { id: 'p_infirmiere', name: 'L\'infirmière', famille: true, proche: true,
      desc: 'Elle soigne les détenus depuis huit ans. Certains la protègent. Sa fille l\'attend au téléphone.',
      trait: { tagMods: { empathie: 1 } } },
    { id: 'p_greffe', name: 'Refus de transfert',
      desc: 'Keraudren a cassé une dent à un administratif qui voulait le déplacer. Transférer = déclencher.',
      trait: { tagMods: { pression: -1 } } },
  ],

  terrorExtra: {
    p_graffiti: {
      id: 'p_graffiti', name: 'Les murs parlent',
      text: 'Sur la barricade, une bombe de peinture : « L\'ADMINISTRATION TUE ». Le quartier approuve.',
      taker: 'Vous lisez ? C\'est écrit depuis longtemps.',
      effect: { threat: 1 },
    },
    p_fenetre: {
      id: 'p_fenetre', name: 'La rambarde',
      text: 'Un otage est sorti sur la rambarde du deuxième étage. La foule en bas hurle.',
      taker: 'Ils le tiennent. Pour l\'instant.',
      effect: { counter: { emeute: 1 } },
    },
    p_embuscade: {
      id: 'p_embuscade', name: 'Un maton tabassé',
      text: 'Des cris derrière la barricade. Un surveillant a croisé le mauvais groupe.',
      taker: 'Ça saigne. Vous faites quoi, vous ?',
      effect: { counter: { emeute: 1 }, threat: 1 },
    },
    p_tele: {
      id: 'p_tele', name: 'Le JT du quartier',
      text: 'Une télé allumée dans le bloc : le direct sur la mutinerie. Le quartier exulte.',
      taker: 'On passe à la télé ! Vingt ans qu\'on nous ignore !',
      effect: { pressure: 1 },
    },
    p_fumee: {
      id: 'p_fumee', name: 'La fumée',
      text: 'De la fumée noire sort de l\'aile incendiée. L\'air devient irrespirable pour les otages.',
      taker: 'Ça brûle ! Vous envoyez les pompiers ou on crève tous !',
      effect: { roll: { dice: 2, table: { 0: { kill: 1 }, 1: { threat: 1, counter: { emeute: 1 } } } } },
    },
    p_incendie: {
      id: 'p_incendie', name: 'L\'aile flambe',
      text: 'Le feu court le long des matelas entassés. Le bloc devient un four.',
      taker: 'Le quartier crame ! Bougez vos hommes !',
      effect: { counter: { emeute: 1 }, threat: 1 },
    },
  },

  acts: [
    {
      id: 'a1', title: 'Le négociateur en chef',
      intro: [
        'Keraudren parle posément au téléphone de la barricade, comme un homme qui attendait ce moment depuis seize ans.',
        'Derrière lui : les barres qui vibrent, les slogans, la cocotte.',
      ],
      terrorDeck: ['nervosite', 'p_graffiti', 'p_fenetre', 'accalmie', 'revelation', 'p_tele', 'souvenir', 'nuit_blanche'],
      goal: [
        { type: 'demand', id: 'mediation' },
        { type: 'freed', n: 1 },
      ],
    },
    {
      id: 'a2', title: 'Le rival',
      intro: [
        'La voix au téléphone a changé. Plus jeune, plus haute, plus dure. « C\'est Sorel. Le vieux a fini de parler. »',
        'Keraudren a été délogé du combiné. Le quartier a un nouveau maître — imprévisible.',
      ],
      terrorDeck: ['p_embuscade', 'revelation', 'p_tele', 'accalmie', 'fait_divers', 'p_fenetre', 'souvenir', 'nuit_blanche', 'p_embuscade'],
      startThreat: 4,
      taker: SOREL,
      choice: 'keraudren_deal',
      // Sorel s'enflamme un peu plus chaque tour, tant que sa vulnérabilité n'est pas connue ;
      // à haute menace, la tension se déverse dans l'Émeute plutôt que dans un point de rupture
      eachTurn: { ifClue: { id: 'p_sorel_drogue', then: {}, else: {
        ifThreatGte: { v: 4, then: {}, else: { threat: 1 } },
      } } },
      addClues: [
        { id: 'p_sorel_drogue', name: 'Sous produits',
          desc: 'Sorel a vidé la réserve de calmants de l\'infirmerie. Impulsif, imprévisible. −1 ruse.',
          trait: { tagMods: { ruse: -1 } } },
        { id: 'p_honneur', name: 'La parole de Keraudren',
          desc: 'Même évincé, le vieux garde son influence. S\'il s\'engage, le quartier écoute.',
          trait: null },
      ],
      addMarket: ['appel_avocat', 'solidarite_detenus'],
    },
    {
      id: 'a3', title: 'L\'aile incendiée',
      scene: 'prison_feu',
      intro: [
        'De la fumée noire rampe sous les portes du quartier B. L\'incendie a pris dans l\'aile sud.',
        'La négociation est devenue une course contre le feu.',
      ],
      terrorDeck: ['p_fumee', 'p_incendie', 'perimetre', 'accalmie', 'fait_divers', 'direct_tv', 'nuit_blanche', 'accalmie'],
      taker: { ifFlag: 'keraudren_allie', then: KERAUDREN, else: SOREL },
      onEnter: { ifFlag: { f: 'keraudren_allie', then: { threat: -2 }, else: { threat: 1 } } },
      // le feu gagne du terrain : la tension ne retombe plus, plafonnée juste sous la rupture
      eachTurn: { ifThreatGte: { v: 4, then: {}, else: { threat: 1 } } },
    },
  ],

  market: ['verite_brutale', 'dossier_psy', 'souffrance', 'mediateur', 'echange', 'nourriture',
           'bluff_assaut', 'mentir_delais', 'silence_tactique', 'promesse', 'appel_avocat', 'solidarite_detenus', 'humour',
           'liberation_ciblee'],

  questions: [
    {
      id: 'q_rhodanien', minTurn: 3, act: 0, flag: 'storyComplice',
      text: '« Morel vous salue. L\'homme du Crédit Rhodanien — il est parmi nous. Il dit que vous, vous tenez parole. C\'est vrai ? »',
      replies: [
        { label: '« Il a tenu parole cette nuit-là. Et vous êtes sortis vivants tous les deux. »', tag: 'empathie',
          answer: 'Il a raconté. Un négociateur qui ne promet que ce qu\'il peut. Alors promettez peu, mais tenez.',
          effects: { threat: -1 } },
        { label: '« Demandez-lui comment ça s\'est terminé pour lui. »', tag: 'autorite',
          answer: 'Debout, mains levées, les caméras. Je sais. C\'est mieux qu\'un sac mortuaire.',
          effects: { threat: -1, pcNext: 1 } },
        { label: '« Il a eu son véhicule, non ? Vous pouvez l\'avoir aussi. »', tag: 'ruse',
          answer: 'Le véhicule, oui. Et les menottes au bout. Morel m\'a raconté la suite aussi.',
          effects: { pcNext: 1, mark: 'promesse' } },
      ],
    },
    {
      id: 'q_maison', minTurn: 2, act: 0,
      text: '« Vous êtes de quelle maison, vous ? »',
      replies: [
        { label: '« De celle où on rend les clés, pas où on les garde. »', tag: 'autorite',
          answer: 'Hé. Vous parlez comme un type de l\'intérieur. J\'aime ça.',
          effects: { ifClue: { id: 'p_code', then: { threat: -1 }, else: {} } } },
        { label: '« De Saint-Aubin, comme vous. »', tag: 'ruse',
          answer: 'Saint-Aubin ? Peut-être. On verra si c\'est vrai.',
          effects: { pcNext: 1, mark: 'promesse' } },
        { label: '« D\'aucune. C\'est pour ça que vous me parlez. »', tag: 'empathie',
          answer: 'Un homme de dehors. Faudra pas me décevoir.',
          effects: { threat: -1 } },
      ],
    },
    {
      id: 'q_ligne', minTurn: 2, act: 1,
      text: '« Le vieux dort. C\'est moi qui parle, ou vous coupez la ligne ? »',
      replies: [
        { label: '« On a réglé ça : il ne vous dérangera plus. »', tag: 'ruse',
          answer: 'Réglé comment ? Si vous mentez, je le saurai.',
          effects: { pcNext: 1, mark: 'promesse' } },
        { label: '« Tant que l\'infirmière est en sécurité, on parle. »', tag: 'empathie',
          answer: 'L\'infirmière… elle va bien. Personne ne la touche.',
          effects: { ifClue: { id: 'p_infirmiere', then: { threat: -1 }, else: {} } } },
        { label: '« Vous ne décidez plus de rien, Sorel. »', tag: 'pression',
          answer: 'Vous allez voir ce que je décide !',
          effects: { ifClue: { id: 'p_sorel_drogue', then: { threat: 2 }, else: { threat: 1 } } } },
      ],
    },
    {
      id: 'q_transfert', minTurn: 2, act: 2, flag: 'keraudren_allie',
      text: '« Le directeur voulait me muter en centrale. Dites-lui que je reste. »',
      replies: [
        { label: '« Le refus est déjà signé. Parlez-moi d\'abord des otages. »', tag: 'pression',
          answer: 'Signé ? …Alors faites-le déchirer.',
          effects: { ifClue: { id: 'p_greffe', then: { threat: -1 }, else: { threat: 1 } } } },
        { label: '« Vous resterez où vos gens seront en sécurité. Sortez d\'abord. »', tag: 'empathie',
          answer: 'Ma sécurité… seize ans que j\'entends plus ce mot.',
          effects: { threat: -1 } },
        { label: '« C\'est acté. Je m\'en porte garant. »', tag: 'ruse',
          answer: 'Un garant. J\'en ai entendu d\'autres.',
          effects: { pcNext: 1, mark: 'promesse' } },
      ],
    },
  ],

  epilogues: {
    surrender: 'Les portes du quartier B se sont ouvertes à 03h12. Les otages sont sortis un par un, le visage noir de suie. Keraudren a remis ses clés au directeur comme à un notaire. Sorel dormait déjà à l\'isolement.',
    liberation: 'Le dernier surveillant a franchi la barricade à 02h47. Le quartier, épuisé, s\'est laissé évacuer. Il restera un mois pour reconstruire l\'aile incendiée — et des années pour oublier cette nuit.',
    assault: 'L\'ERIS est entrée par les toits et par la barricade à 03h04. Douze minutes, des grenades, des extincteurs. Le quartier B a été repris. Le rapport dira « reconquête menée à bien ».',
    escape: 'Keraudren s\'est volatilisé dans le chaos de l\'incendie — trouvé dans le faux plafond de la buanderie deux jours plus tard, un plan de la centrale dans la poche. Il n\'a dit qu\'une phrase : « J\'attendais ma libération, pas la vôtre. »',
    defeat: 'À 02h30, le quartier B n\'était plus qu\'un brasier et un charnier. On a coupé l\'alarme de la centrale à l\'aube. Votre casque est resté sur vos oreilles longtemps après que la ligne est morte.',
  },
};
