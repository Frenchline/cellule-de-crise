// ============================================================
// Mission 1 — « Crédit Rhodanien »
// Braquage raté, agence bancaire, Lyon 7e.
// ============================================================

export const MISSION_BRAQUAGE = {
  id: 'braquage',
  title: 'Crédit Rhodanien',
  subtitle: 'Agence bancaire — Lyon 7e',
  type: 'classic',
  startThreat: 4,
  hostages: 6,
  hostageList: [
    { id: 'directrice', name: 'Anne Joubert', role: 'directrice d\'agence', f: true },
    { id: 'guichetiere', name: 'Nadia Ferrand', role: 'guichetière enceinte', trait: 'vulnerable', f: true },
    { id: 'guichetier1', name: 'Karim Ziani', role: 'guichetier' },
    { id: 'guichetiere2', name: 'Léa Sarda', role: 'guichetière', f: true },
    { id: 'client-secu', name: 'Paul Girard', role: 'client — ex-agent de sécurité', trait: 'heros' },
    { id: 'cliente', name: 'Fatima Rhazi', role: 'cliente', f: true },
  ],

  briefing: [
    'RAPPORT D\'INTERVENTION — SECTION NÉGOCIATION',
    '16h38. Agence Crédit Rhodanien, avenue Berthelot, Lyon 7e. Un braquage a tourné court : un témoin a donné l\'alerte, les rideaux de fer ont fondu. Le braqueur est resté avec le personnel et les clients.',
    'Identité : MOREL Julien, 41 ans, dit « Le Chat ». Ex-légionnaire, deux séjours en Afghanistan, aucun fait de sang. Condamnations anciennes : vols avec effraction. Il doit 63 000 € à un réseau de paris. Le réseau ne patiente plus.',
    'Otages (6) : directeur d\'agence, trois employés de guichet, deux clients. Il a coupé les caméras mais gardé le standard téléphonique. Il connaît la procédure — il a peut-être vécu l\'autre côté du périmètre.',
    'Consigne : c\'est un soldat, pas un tueur. Traitez-le comme tel, il s\'y accrochera.',
  ],

  scene: 'banque',
  taker: {
    name: 'Julien Morel, dit « Le Chat »',
    age: 41,
    portrait: { skin: 'mat', hair: 'court', hairColor: 'noir', beard: 'courte', clothes: 'sweat', accessory: 'scar', age: 'adulte' },
    dossier: [
      'Legio Patria Nostra : 9 ans de légion, trois décorations, une décharge pour raison médicale jamais acceptée.',
      'Dette de 63 000 € envers un réseau de paris clandestins. Deux rappels « physiques ». Son poignet droit porte encore la marque.',
      'Un fils, Nolan, 14 ans, qu\'il ne voit plus depuis le divorce. Le juge a dit « père inadapté ».',
      'Connaît la tactique : périmètre, tireurs, tempo. Il sait ce que vous allez dire avant que vous le disiez.',
    ],
    responses: {
      byTag: {
        empathie: {
          fail: ['Épargnez-moi la psychologie de comptoir, j\'ai eu mon quota au régiment.', 'Vos trucs d\'empathie, c\'est écrit où, sur une fiche ?'],
          partial: ['Ouais, on est tous des victimes. Et alors ?', 'Vous faites ça depuis combien d\'années, vous ?'],
          success: ['Neuf ans. Neuf ans pour la France. Et la France m\'a dit merci avec un papier d\'inaptitude.', 'Vous savez ce que c\'est, un fils qui vous regarde comme un étranger ?'],
        },
        autorite: {
          fail: ['Ne me parlez pas comme à une recrue. J\'en ai formé, des recrues.', 'Votre grade, j\'en ai rien à faire. Ici c\'est moi le chef.'],
          partial: ['Allez. On écoute. Pas longtemps.', 'Vous parlez comme un officier. J\'aimais pas les officiers.'],
          success: ['À vos ordres, alors. C\'est bien le problème : j\'ai plus d\'ordres depuis dix ans.', 'D\'accord. Mais la discipline, ça s\'arrête pas parce qu\'on n\'a plus d\'uniforme.'],
        },
        pression: {
          fail: ['Vous me couvez ? J\'ai assez tenu des embuscades pour connaître le jeu.', 'La pression, c\'est pas sur moi qu\'elle marche ce soir. C\'est sur eux.'],
          partial: ['Je sais compter. Six plus un. Faites votre calcul.', 'Déployez vos hommes si vous voulez. Vous savez comment ça finit.'],
          success: ['Un contre un service rendu. Ça marche. Dépêchez-vous.', 'La caissière. Elle sort. C\'est pas de la bonté : elle me gênait.'],
        },
        ruse: {
          fail: ['Le Chat. Vous savez pourquoi on m\'appelle comme ça ? Je vois dans le noir.', 'Des délais ? Des autorisations ? Essayez encore.'],
          partial: ['Votre combine, je la sens à trois mètres. Continuez pour voir.', 'Vous me roulez dans la farine ou c\'est juste que vous êtes lent ?'],
          success: ['Véhicule et tireurs retirés. Comme convenu. Le Chat sait attendre.', 'D\'accord. Mais une souris joue pas avec un chat deux fois.'],
        },
      },
      byCard: {
        proposer_reddition: {
          fail: ['La prison ? J\'ai fait Kandahar, monsieur. La prison c\'est pas la mort — c\'est pire : c\'est le réseau qui m\'attendra dedans.'],
          partial: ['Condamnés à perpète ? Non. Je sais ce que je risque. Un homme sait toujours ce qu\'il risque.'],
          success: ['Arme au sol. Nolan n\'aura pas à lire que son père est mort en braquant une banque. C\'est tout ce qui me reste.'],
        },
        famille: {
          fail: ['Ne parlez pas de Nolan. Vous ne connaissez pas mon fils.'],
          partial: ['Il a quatorze ans. Il joue au foot. Il déteste son beau-père.'],
          success: ['Son match est le samedi. Je manque tous ses matchs depuis deux ans. Donnez-moi un foutu samedi.'],
        },
      },
      default: {
        fail: ['Recadrez votre tir, négociateur.'],
        partial: ['J\'écoute. C\'est mon métier aussi, écouter.'],
        success: ['Bien. On continue.'],
      },
    },
    lines: {
      kill: ['Vous avez voulu jouer. On a tous vu comment ça a fini.', 'C\'est la guerre ici. VOUS l\'avez déclarée.'],
      freed: ['Le comptable. Dehors. Ça fait un compte de moins à régler.', 'Elle sort. La dette, elle, elle sort pas.'],
      concede: ['Un fourgon, plein d\'essence, et vos tireurs loin de mon toit. Négociable.', 'Des clopes et de l\'eau. C\'est pas de l\'humanitaire, c\'est de la logistique.'],
      terror: ['C\'est quoi ce bruit ? Vos hommes bougent ?', 'Je vois tout, négociateur. Je suis le Chat.'],
    },
  },

  demands: [
    {
      id: 'fuite', label: 'Véhicule et retrait des tireurs', major: true,
      detail: 'Un fourgon gavé d\'essence et les toits dégagés. La totale.',
      concede: { effects: { threat: -3, free: 1, pressure: 2 }, text: 'Le fourgon se gare devant l\'agence. Il regarde les toits se vider. Il libère un otage en signe de bonne foi.' },
    },
    {
      id: 'cigarettes', label: 'Cigarettes et eau', major: false,
      detail: 'Un paquet de cigarettes et de quoi boire pour les six.',
      concede: { effects: { threat: -1 }, text: 'Le panier passe sous le rideau de fer. Il allume une cigarette, la première depuis dix ans.' },
    },
  ],

  clues: [
    { id: 'b_legion', name: 'Ex-légionnaire',
      desc: 'Neuf ans de légion. Il répond à l\'autorité comme un soldat — à condition qu\'elle soit vraie. +1 autorité une fois identifié, mais il détecte les ruses. −1 ruse.',
      trait: { tagMods: { autorite: 1, ruse: -1 } } },
    { id: 'b_dette', name: 'Dette au réseau',
      desc: '63 000 €. Il préfère une balle à une cellule où le réseau le retrouverait. La pression l\'excite plus qu\'elle ne l\'effraie. −1 pression.',
      trait: { tagMods: { pression: -1 } } },
    { id: 'b_fils', name: 'Nolan, 14 ans', famille: true, proche: true,
      desc: 'Son fils qu\'il ne voit plus. « Père inadapté », a dit le juge. L\'évoquer touche au cœur. +1 empathie.',
      trait: { tagMods: { empathie: 1 } } },
    { id: 'b_afiost', name: 'Trouble de stress post-traumatique',
      desc: 'Istres, Kaboul, deux réveils par nuit. Il connaît la fatigue du combattant. L\'autorité froide le révolte ; l\'empathie le désamorce.',
      trait: { tagMods: { autorite: -1, empathie: 1 } } },
    { id: 'b_alibi', name: 'Le braquage n\'était pas pour lui',
      desc: 'Il vole pour effacer la dette, pas pour partir en vacances. Il ne veut pas être un méchant.',
      trait: null },
  ],

  terrorExtra: {
    brak_chat: {
      id: 'brak_chat', name: 'Le Chat vérifie',
      text: 'Il refait le tour des issues. Comptant les angles, les fuites, les chances.',
      taker: 'Deux issues, trois angles morts. Vos gars ont intérêt à être bons.',
      effect: { threat: 1 },
    },
    brak_reseau: {
      id: 'brak_reseau', name: 'Le réseau appelle',
      text: 'Son téléphone vibre. Le réseau veut son argent — et n\'attend plus.',
      taker: 'Ils disent que le temps est compté. Ils ne disent pas ça pour rire.',
      effect: { threat: 2 },
    },
    brak_sang: {
      id: 'brak_sang', name: 'La coupure',
      text: 'Un employé a la main entaillée par le rideau de fer. Le sang goutte.',
      taker: 'Il saigne. Je sais pas arrêter ça. Envoyez quelqu\'un ou laissez-le.',
      effect: { roll: { dice: 2, table: { 0: { kill: 1 }, 1: { threat: 1 } } } },
    },
    brak_nolan: {
      id: 'brak_nolan', name: 'Samedi',
      text: 'Sur l\'écran d\'un téléphone laissé allumé : un match de foot de benjamins. Nolan joue ailier gauche.',
      taker: 'Il joue ailier. Il marche sur la pointe des pieds. Comme moi.',
      effect: { threat: -2, reveal: 1 },
    },
  },

  terrorDeck: ['otage_panique', 'brak_chat', 'ultimatum', 'souvenir', 'otage_panique', 'brak_reseau', 'direct_tv',
               'accalmie', 'otage_malade', 'coup_feu', 'brak_sang', 'brak_nolan'],

  market: ['verite_brutale', 'famille', 'promesse', 'echange', 'bluff_assaut', 'mediateur',
           'dossier_psy', 'souffrance', 'mentir_delais', 'appel_proche', 'humour', 'silence_tactique', 'nourriture'],

  epilogues: {
    surrender: 'Julien Morel est sorti en formation carrée, mains sur la tête, ex-militaire jusqu\'au bout. Le fourgon est resté garé. Il n\'a pas regardé en arrière. Nolan ne verra jamais les images.',
    liberation: 'Les six otages sont sortis les uns après les autres. Seul dans l\'agence vidée, le Chat s\'est assis par terre, dos à la caisse, et a attendu. On l\'a trouvé comme ça : enfin au repos.',
    assault: 'L\'assaut a duré onze secondes. Julien Morel n\'a pas tiré. Les médecins disent qu\'il n\'en avait plus la force. Les otages sont vivants. C\'est le seul chiffre du rapport qui compte.',
    escape: 'Le Chat a trouvé l\'issue que personne n\'avait vue. On a retrouvé le fusil dans la cave, démonté, huilé, propre — un geste d\'ancien légionnaire. Le réseau le cherche. Nous aussi.',
    defeat: 'À 19h52, l\'agence du Crédit Rhodanien a cessé d\'être un théâtre d\'otages pour devenir une scène de crime. On vous a reconduit au QG. On vous a servi un café. Vous n\'avez rien bu.',
  },
};
