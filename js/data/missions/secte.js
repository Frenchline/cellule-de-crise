// ============================================================
// Scénario avancé — « Les Enfants de l'Aube »
// Communauté retranchée, plateau du Vercors, hiver. 3 actes.
// ============================================================

const SABINE = {
  name: 'Sabine Corvel',
  age: 44,
  portrait: { skin: 'clair', sex: 'f', hair: 'voile', hairColor: 'brun', clothes: 'robe', age: 'adulte' },
  dossier: [
    'Lieutenante et « sœur aînée » de la communauté. Ex-infirmière. C\'est elle qui porte les enfants à la sieste.',
    'A tout quitté il y a neuf ans après le décès de son fils. La communauté l\'a recueillie.',
    'Elle contrôle les clés du portail et le téléphone. Élie lui fait confiance — elle seule ose le contredire.',
  ],
  responses: {
    byTag: {
      empathie: {
        fail: ['Ne me parlez pas de chagrin. J\'ai enterré mon fils, vos mots sont des mots.', 'Vos psy ont écrit ça sur une fiche ?'],
        partial: ['Les enfants dorment. C\'est tout ce qui compte ici.', 'Vous parlez comme une assistante sociale. J\'en étais une, une fois.'],
        success: ['Mon garçon s\'appelait Mathis. Il aurait quinze ans. Élie l\'a béni, cette nuit-là.', 'Vous êtes la seule voix dehors qui ne hurle pas.'],
      },
      autorite: {
        fail: ['Vos ordres ne franchissent pas le portail.', 'La Loi des hommes s\'arrête à la grille.'],
        partial: ['J\'entends. Je transmettrai. Ou pas.', 'Vous avez un ton de préfecture. Ici, personne ne vote.'],
        success: ['D\'accord. Pas pour vous : pour les petits.', 'Je ferai ce qui protège les enfants. Rien de plus.'],
      },
      pression: {
        fail: ['Vous osez me presser avec des enfants derrière moi ?', 'Chaque menace dehors rend Élie plus sûr de lui.'],
        partial: ['Je vois vos équipes sur la crête. Élie les voit aussi.', 'Pas de geste hostile. Pas un.'],
        success: ['Une fillette et sa mère. Elles sortent. C\'est tout ce que j\'obtiens ce soir.', 'Le petit Adam va sortir. Il est trop jeune pour comprendre, pas assez pour se taire.'],
      },
      ruse: {
        fail: ['Je connais les promesses d\'hommes. J\'en ai épousé un.', 'Vos délais, vos autorisations… Ne me prenez pas pour une sainte.'],
        partial: ['Je relaie vos mots. Élie décidera ce qu\'ils valent.', 'Vous êtes lisse. Trop lisse.'],
        success: ['Les caméras ? Éloignez-les, alors. Les enfants ne sont pas un spectacle.', 'D\'accord. Mais si je vous surprends à mentir, la ligne est morte.'],
      },
    },
    byCard: {
      proposer_reddition: {
        fail: ['Et puis quoi ? Des cages ? Des enfants placés ? Vous ne connaissez rien à l\'Aube.'],
        partial: ['Élie ne sortira jamais les poignets liés. Jamais.'],
        success: ['J\'ouvrirai le portail moi-même. Pour les enfants. Pas pour vous : pour eux.'],
      },
      voix_enfants: {
        fail: ['Ne les faites pas parler. Vous ne savez pas ce que vous réveillez.'],
        partial: ['Ils demandent leur maman. Qu\'est-ce que vous voulez que je réponde ?'],
        success: ['Écoutez-les. Écoutez ce qu\'on leur a appris à dire. Vous entendez ? C\'est ça, notre prison.'],
      },
    },
    default: {
      fail: ['Vous déraisonnez. Je reste en ligne, mais vous déraisonnez.'],
      partial: ['Je note vos mots. Rien de plus.'],
      success: ['Continuez. Les enfants ont besoin que cette nuit finisse doucement.'],
    },
  },
  lines: {
    kill: ['Vous avez entendu ? Ils ont dit que c\'était l\'heure. C\'est de VOTRE faute !', 'Non. Non, pas les enfants, pas comme ça…'],
    freed: ['Elle passe le portail. Ne la touchez pas. NE LA TOUCHEZ PAS.', 'Un de plus. Souvenez-vous de ce que je fais pour vous.'],
    concede: ['Les caméras s\'en vont ? Bien. Les enfants ne sont pas votre spectacle.', 'Élie sera content. Ou méfiant. Avec lui, on ne sait jamais.'],
    terror: ['Qu\'est-ce que c\'est, ce bruit ?! Les chants couvrent tout !', 'Élie monte dans la grande salle. Quelque chose se prépare.'],
  },
};

const ELIE = {
  name: 'Élie Vasseur',
  age: 58,
  portrait: { skin: 'clair', hair: 'long', hairColor: 'blanc', beard: 'longue', clothes: 'robe', accessory: 'pendentif', age: 'âgé' },
  dossier: [
    'Ancien kinésithérapeute à Grenoble. La voix est douce, lente, appliquée — celle d\'un homme qui a soigné des corps.',
    'Fondateur des Enfants de l\'Aube. Douze ans de communauté. Aucun antécédent violent connu.',
    'Les médecins de la cellule soupçonnent une pathologie grave non traitée. Il le sait. Peut-être.',
    'Il parle des enfants comme de « ses germes ». La loi dit : otages.',
  ],
  responses: {
    byTag: {
      empathie: {
        fail: { high: ['Votre compassion sent le rapport médical.', 'Ne touchez pas à mes germes.'], any: ['La douceur est un instrument. Le vôtre est faux.'] },
        partial: ['Vous croyez me comprendre. Comprendre, c\'est déjà se soumettre.', 'J\'entends votre voix. Elle tremble. Elle m\'intéresse.'],
        success: ['Mes mains ont soigné cent corps avant cette nuit. Vous êtes le premier à le dire.', 'Parlez-moi encore de l\'extérieur. Dites-moi si le monde vaut encore la peine.'],
      },
      autorite: {
        fail: ['L\'AUTORITÉ ? Je suis la Lumière de l\'Aube ! Votre rang n\'est que poussière.', 'Ne haussez pas le ton. La Lumière ne tolère pas le bruit.'],
        partial: ['J\'écoute les chefs. J\'en suis un, plus grand que vous.', 'Votre loi s\'arrête où commence l\'Aube.'],
        success: ['Votre voix porte. Elle ressemble à la mienne, autrefois.', 'Vous commandez bien. Moi, je guide. Ce n\'est pas pareil.'],
      },
      pression: {
        fail: ['Pressez-moi et je ferme les paupières des germes. Pour toujours.', 'La menace est le langage des faibles. Vous êtes faible.'],
        partial: ['Je vois vos hommes sur la crête. Je les compte. J\'en sourie.', 'Le temps n\'est pas vôtre. Il est à l\'Aube.'],
        success: ['Une mère et son germe. Qu\'elles passent. L\'Aube n\'a pas besoin de chaînes.', 'Deux sortiront. C\'est ma décision. La mienne.'],
      },
      ruse: {
        fail: ['Vos ruses me divertissent. Comme un enfant cache un caillou.', 'La Lumière voit à travers vos mensonges.'],
        partial: ['Vous tournez autour. Moi aussi. Nous dansons, négociateur.', 'Encore un tour de passe-passe ? Allez, montrez-moi.'],
        success: ['Très bien, votre manège. Pour l\'heure, il me convient.', 'Vous êtes habile. Je vous garde à l\'oreille.'],
      },
    },
    byCard: {
      proposer_reddition: {
        fail: ['Me rendre ? Je suis l\'Aube. On ne se rend pas, on se lève.'],
        partial: ['Et mes germes ? Qui les gardera des hommes ?'],
        success: ['J\'ouvrirai les bras, négociateur. Pas les poignets — les bras. Laissez les germes me voir partir vivant.'],
      },
      parler_mort: {
        fail: ['Ma mort ? Ma mort est une LUMIÈRE. N\'en parlez pas comme d\'un diagnostic.'],
        partial: ['Le corps meurt. L\'Aube, non.'],
        success: ['Vous avez vu mon dossier médical. Alors vous savez. Aidez-moi à choisir comment ça finit.'],
      },
      monde_avant: {
        fail: ['Avant ? Avant, je soignais des ingrats.'],
        partial: ['L\'hôpital de Grenoble… J\'y laissais des mains reconnaissantes.'],
        success: ['J\'étais bon, vous savez. Vraiment bon. Les gens pleuraient quand je partais en vacances.'],
      },
    },
    default: {
      fail: ['Votre voix s\'éteint. L\'Aube, elle, se lève.'],
      partial: ['Je vous écoute. C\'est ma seule concession de l\'heure.'],
      success: ['Parlez. La Lumière aime les voix posées.'],
    },
  },
  lines: {
    kill: ['Ils sont partis vers la Lumière. C\'est vous qui les y avez poussés.', 'Le sang lave. C\'est écrit.'],
    freed: ['Que la mère passe. Le germe avec elle. L\'Aube retient ceux qui veulent rester.', 'Une brèche dans le cercle. L\'Aube la refermera.'],
    concede: ['Les médias m\'entendront ? Alors le monde entendra l\'Aube.', 'Le pain et l\'eau pour les germes. La Lumière pourvoit.'],
    terror: ['Le chant monte. Vous l\'entendez ? L\'Aube appelle.', 'Les germes sont agités. La veillée a commencé.'],
  },
};

export const MISSION_SECTE = {
  id: 'secte',
  title: 'Les Enfants de l\'Aube',
  subtitle: 'Ferme de l\'Aube — plateau du Vercors',
  type: 'advanced',
  duration: '≈ 40–50 min',
  startThreat: 4,
  hostages: 12,
  hostageList: [
    { id: 'lina', name: 'Lina Roy', role: 'enfant — 7 ans', trait: 'vulnerable', f: true },
    { id: 'ezra', name: 'Ezra Roy', role: 'enfant — 5 ans', trait: 'vulnerable' },
    { id: 'noah', name: 'Noah Marchand', role: 'enfant — 9 ans', trait: 'vulnerable' },
    { id: 'alma', name: 'Alma Voss', role: 'enfant — 11 ans', trait: 'vulnerable', f: true },
    { id: 'matthias', name: 'Matthias Roy', role: 'adepte — père de Lina et Ezra' },
    { id: 'helene', name: 'Hélène Bram', role: 'adepte — sœur aînée', f: true },
    { id: 'jonas', name: 'Jonas Keler', role: 'adepte' },
    { id: 'pia', name: 'Pia Voss', role: 'adepte — mère d\'Alma', f: true },
    { id: 'odile', name: 'Odile Marchand', role: 'adepte — mère de Noah', f: true },
    { id: 'bastien', name: 'Bastien Kroll', role: 'adepte' },
    { id: 'ruth', name: 'Ruth Ansel', role: 'adepte', f: true },
    { id: 'theo', name: 'Théo Kern', role: 'adepte' },
  ],
  pressureEvery: 5,
  scene: 'ferme',

  briefing: [
    'RAPPORT D\'INTERVENTION — SECTION NÉGOCIATION',
    '19h22. Ferme dite « de l\'Aube », plateau du Vercors, −4 °C. La gendarmerie est venue signifier la fermeture de la communauté pour dysfonctionnements graves. Le portail ne s\'est pas ouvert. Une voix a dit : « Partez, ou on commence. »',
    'Identité : VASSEUR Élie, 58 ans, ex-kinésithérapeute, fondateur des Enfants de l\'Aube. Douze ans de communauté, jamais de violence connue. Interlocuteur en ligne : CORVEL Sabine, 44 ans, sa lieutenante.',
    'Otages (12) : huit adultes volontaires ou non — dont quatre enfants que la loi considère comme otages quoi qu\'on leur ait appris.',
    'Consigne : ce soir, la liturgie monte. Les renseignements parlent d\'un « voyage » collectif. Surveillez le Rituel : chaque chant qui s\'élève le rapproche.',
  ],

  counters: [
    {
      id: 'rituel', label: 'Rituel', icon: '🕯', start: 0, max: 4, resetTo: 1,
      cause: 'Suicide collectif (Rituel)',
      onMax: { kill: 2, threat: 2 },
    },
  ],

  teamOverrides: {
    supply: { extraEffects: { counter: { rituel: -1 } } },
  },

  choices: {
    electricite: {
      prompt: 'Couper l\'électricité de la ferme ?',
      options: [
        {
          label: 'Couper le courant', flag: null,
          desc: 'Les équipes gagnent un angle mort (préparation +1) mais l\'obscurité nourrit la prophétie (Rituel +1).',
          effects: { prep: 1, counter: { rituel: 1 } },
        },
        {
          label: 'Laisser le courant', flag: null,
          desc: 'Pas de geste hostile envers une communauté. La presse spécule sur votre attendrissement (pression +2).',
          effects: { pressure: 2 },
        },
      ],
    },
    signe: {
      prompt: 'Le chant vient de s\'arrêter net. Dans le silence, Élie ordonne aux enfants de s\'asseoir en cercle. Le Rituel semble sur le point de basculer.',
      options: [
        {
          label: 'Assaut immédiat',
          desc: 'Les équipes entrent maintenant. Plus de temps pour parler.',
          effects: { assault: true },
        },
        {
          label: 'Parler aux enfants directement',
          desc: 'Faire entendre les voix des petits au combiné (Rituel −3, menace −1).',
          effects: { counter: { rituel: -3 }, threat: -1 },
        },
      ],
    },
  },

  taker: SABINE,

  demands: [
    {
      id: 'cameras', label: 'Renvoyer les caméras de presse', major: false,
      detail: '« Vos caméras font des enfants des monstres. Éloignez-les. »',
      concede: { effects: { threat: -1, pressure: -2 }, text: 'Les caméras reculent de trois cents mètres. Sabine remercie d\'une voix basse.' },
    },
  ],

  clues: [
    { id: 's_enfants', name: 'Quatre enfants parmi les otages', famille: true,
      desc: 'De 6 à 11 ans. Ils ne comprennent pas ce qui se passe. C\'est votre levier le plus humain — et le plus dangereux.',
      trait: { tagMods: { empathie: 1 } } },
    { id: 's_sabine', name: 'Sabine, ex-gendarme adjoint',
      desc: 'Avant la communauté, elle a porté l\'uniforme. Elle connaît vos procédures. −1 ruse.',
      trait: { tagMods: { ruse: -1 } } },
    { id: 's_hiver', name: 'Le grand froid',
      desc: '−4 °C et la nuit qui tombe. La survie à l\'intérieur compte autant que vos mots.',
      trait: null },
    { id: 's_mort', name: 'Maladie incurable',
      desc: 'Les médecins de la cellule ont écouté sa voix : souffle court, pauses, fatigue. Une pathologie grave, non traitée. Élie se sait condamné — il choisit sa fin.',
      trait: { tagMods: { empathie: 1 } } },
    { id: 's_donateur', name: 'Un bienfaiteur',
      desc: 'La communauté vit d\'un donateur invisible. Élie n\'a besoin de personne — sauf de ses germes.',
      trait: null },
  ],

  terrorExtra: {
    s_veillee: {
      id: 's_veillee', name: 'Veillée de prière',
      text: 'Toute la ferme chante. La même phrase, en boucle, depuis une heure.',
      taker: 'Vous entendez ? La voix de l\'Aube est plus forte que la nôtre.',
      effect: { counter: { rituel: 1 } },
    },
    s_chants: {
      id: 's_chants', name: 'Chants de l\'Aube',
      text: 'Les chants reprennent, plus forts, plus lents. La liturgie avance.',
      taker: 'Ne parlez pas. Ils prient.',
      effect: { counter: { rituel: 1 }, threat: 1 },
    },
    s_breuvage: {
      id: 's_breuvage', name: 'Le breuvage',
      text: 'On prépare quelque chose dans la grande salle. Des tasses alignées. Élie veille sur chacune.',
      taker: 'L\'Aube pourvoit. Toujours.',
      effect: {
        ifCounterGte: {
          id: 'rituel', v: 3,
          then: { counter: { rituel: 1 }, kill: 3 },
          else: { counter: { rituel: 1 }, pressure: 1 },
        },
      },
    },
    s_adepte: {
      id: 's_adepte', name: 'Un adepte franchit la grille',
      text: 'Une silhouette court dans la neige vers le cordon. Une femme. Elle pleure.',
      taker: 'Elle n\'était pas prête. Les autres, si.',
      effect: { free: 1, pressure: 1 },
    },
    s_gel: {
      id: 's_gel', name: 'Le gel gagne',
      text: 'La température chute encore. Vos mains tremblent sur le combiné.',
      taker: 'Vous avez froid ? Imaginez les enfants.',
      effect: { threat: 1, pcNext: -1 },
    },
    s_signe: {
      id: 's_signe', name: 'Le signe',
      text: 'Le chant s\'arrête net. Dans le silence, Élie ordonne aux enfants de s\'asseoir en cercle.',
      taker: 'L\'Aube se lève. Vous le voyez à peine, au-dessus des crêtes.',
      effect: { ifCounterGte: { id: 'rituel', v: 3, then: { choice: 'signe' }, else: { threat: 1 } } },
    },
    s_bebe: {
      id: 's_bebe', name: 'Les pleurs d\'un enfant',
      text: 'Un enfant pleure derrière la porte, longuement. Les rédactions captent le son.',
      taker: 'Il demande sa maman. Sa maman est ici. Avec nous.',
      effect: { pressure: 1 },
    },
  },

  acts: [
    {
      id: 'a1', title: 'Le portail',
      intro: [
        'Le portail ne s\'est pas rouvert depuis la nuit. Derrière : la cour, la neige, les fenêtres éclairées à la bougie.',
        'Sabine Corvel tient le téléphone. Élie, lui, ne parle à personne. Pour l\'instant.',
      ],
      terrorDeck: ['nervosite', 's_veillee', 'fait_divers', 'accalmie', 's_chants', 's_adepte', 's_bebe', 'nuit_blanche'],
      goal: [
        { type: 'clue', id: 's_mort' },
        { type: 'freed', n: 2 },
      ],
    },
    {
      id: 'a2', title: 'L\'Aube',
      intro: [
        'Une voix nouvelle au combiné. Plus lente. Plus basse. Élie Vasseur a pris la ligne.',
        '« Vous parliez à mes enfants. Maintenant, vous parlez à l\'Aube. »',
      ],
      terrorDeck: ['revelation', 's_chants', 's_breuvage', 'otage_panique', 'accalmie', 's_gel', 's_veillee', 'souvenir', 'nuit_blanche'],
      startThreat: 5,
      taker: ELIE,
      choice: 'electricite',
      addDemands: [
        {
          id: 'sermon', label: 'Diffuser le sermon de l\'Aube en direct', major: true,
          detail: 'Élie veut que le monde entende l\'Aube. Une chaîne s\'en dit capable. La préfecture hésite.',
          concede: { effects: { threat: -3, free: 1, pressure: 2 }, text: 'Le sermon passe à l\'antenne pendant huit minutes. Élie a pleuré. Deux otages sont sortis dans la foulée.' },
        },
      ],
      addClues: [
        { id: 's_narcissique', name: 'Narcissisme',
          desc: 'Il parle de lui à la troisième personne : « l\'Aube ». Ne jamais le remettre en cause frontalement. −1 autorité.',
          trait: { tagMods: { autorite: -1 } } },
        { id: 's_exclue', name: 'Une adepte veut partir', famille: true,
          desc: 'La mère du petit Adam. Elle glisse des mots à Sabine. Une brèche dans le cercle.',
          trait: null },
      ],
      addMarket: ['monde_avant', 'parler_mort', 'voix_enfants'],
    },
    {
      id: 'a3', title: 'Le dernier matin',
      scene: 'ferme_aube',
      intro: [
        'L\'aube se lève sur le plateau. Une aube pâle, froide. Élie dit que « la Lumière attend ».',
        'Les enfants sont rassemblés dans la grande salle. Il ne reste que peu de temps.',
      ],
      terrorDeck: ['s_breuvage', 'coup_feu', 's_signe', 's_chants', 's_chants', 's_gel', 'otage_panique', 'otage_malade', 'otage_panique'],
      goal: [{ type: 'demand', id: 'sermon' }],
      // l'aube se lève : la tension ne retombe plus, la communauté attend le signe
      eachTurn: { ifThreatGte: { v: 6, then: {}, else: { threat: 1 } } },
    },
  ],

  market: ['nourriture', 'souffrance', 'dossier_psy', 'mediateur', 'famille', 'humour',
           'silence_tactique', 'echange', 'verite_brutale', 'mentir_delais', 'promesse', 'monde_avant'],

  epilogues: {
    surrender: 'Élie Vasseur est sorti au premier matin, les bras ouverts, et s\'est agenouillé dans la neige pour se laisser menotter. Derrière lui, les enfants regardaient sans comprendre. Sabine les a ramenés à l\'intérieur une dernière fois, puis a suivi.',
    liberation: 'Le dernier enfant a franchi le portail au petit jour. Élie est resté dans la grande salle éteinte, assis au centre du cercle de bougies. On l\'a trouvé comme ça : seul, calme, la bouche ouverte comme s\'il parlait encore à l\'Aube.',
    assault: 'L\'assaut sur la ferme a duré neuf minutes. Les hommes ont franchi le portail gelé et la porte de la grande salle en même temps. Élie n\'a pas résisté. Les enfants ont crié plus fort que les hommes.',
    escape: 'On n\'a jamais retrouvé Élie Vasseur. La cheminée de la grande salle, un sentier de montagne, la neige qui efface tout — les chiens ont perdu la trace au torrent. Quelque part, un homme qui sait soigner les corps refait sa vie.',
    defeat: 'À l\'aube, le silence était complet. Douze bougies brûlaient encore dans la grande salle. On a fermé le dossier à midi. Le Vercors garde les secrets.',
  },
};
