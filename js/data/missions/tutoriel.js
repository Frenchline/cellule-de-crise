// ============================================================
// Mission 0 — TUTORIEL « Premier appel »
// Pharmacie des Coteaux, Saint-Étienne, 23h12.
// ============================================================

export const MISSION_TUTORIEL = {
  id: 'tutoriel',
  title: 'Premier appel',
  subtitle: 'Pharmacie des Coteaux — Saint-Étienne',
  type: 'tutorial',
  tutorial: true,
  noKillBeforeTurn: 3,
  terrorOrdered: false,
  startThreat: 4,
  hostages: 3,
  hostageList: [
    { id: 'pharmacienne', name: 'Sonia Mery', role: 'pharmacienne', f: true },
    { id: 'retraite', name: 'André Coupat', role: 'retraité', trait: 'vulnerable' },
    { id: 'etudiant', name: 'Lucas Vignal', role: 'étudiant en rayon' },
  ],

  briefing: [
    'RAPPORT D\'INTERVENTION — SECTION NÉGOCIATION',
    '23h12. Pharmacie des Coteaux, rue des Forges, Saint-Étienne. Un homme est entré pour de l\'insuline sans ordonnance ni argent. La pharmacienne a refusé. Il a sorti un revolver.',
    'Identité : RÉAL Thomas, 34 ans. Licencié de l\'usine il y a six semaines. Sa fille de huit ans est diabétique. Le matériel coûte plus cher que ce qu\'il reste sur le compte.',
    'Otages (3) : la pharmacienne, un retraité, un étudiant en rayon. Périmètre établi. La ligne intérieure de la pharmacie est ouverte : il a décroché.',
    'Consigne : il n\'a jamais tué personne. Faites que ça reste vrai.',
  ],

  scene: 'pharmacie',
  taker: {
    name: 'Thomas Réal',
    age: 34,
    portrait: { skin: 'clair', hair: 'court', hairColor: 'brun', beard: 'aucune', clothes: 'sweat', age: 'jeune' },
    dossier: [
      'Ouvrier fraiseur, licencié économique il y a 6 semaines. Aucun casier.',
      'Séparé de la mère de sa fille — garde alternée. Pension en retard.',
      'Fille : Lina, 8 ans, diabétique de type 1. Il est à court d\'insuline depuis 3 jours.',
      'Arme : revolver de collection de son grand-père. Il ne sait probablement pas s\'il est chargé correctement.',
    ],
    responses: {
      byTag: {
        empathie: {
          fail: ['Vos belles paroles, je connais. L\'usine aussi ils me parlaient gentiment.', 'Ne me prenez pas pour un enfant.'],
          partial: ['Ouais. Facile à dire de l\'extérieur.', 'Vous êtes payé pour dire ça, non ?'],
          success: ['C\'est la première fois ce soir qu\'on me parle comme à un homme.', 'Ma fille s\'appelle Lina. Elle a huit ans. Vous saviez ?'],
        },
        autorite: {
          fail: ['Ne me donnez pas d\'ordres. Ici c\'est moi qui donne les ordres.', 'HAUSSEZ PAS LE TON AVEC MOI.'],
          partial: ['Vous commandez pas grand-chose de là où vous êtes.', 'J\'entends ce que vous dites.'],
          success: ['D\'accord. D\'accord. Mais pas de coup fourré.', 'Vous êtes le seul qui parle vrai, ce soir.'],
        },
        pression: {
          fail: ['Vous me pressez ? VOUS me pressez ? J\'ai trois personnes ici !', 'J\'aime pas votre ton. Raccrochez pas, mais j\'aime pas votre ton.'],
          partial: ['Mouais. C\'est tout ce que vous avez ?', 'Je réfléchis. Touchez à rien.'],
          success: ['Un. Un seul. Et après vous bougez sur la voiture.', 'D\'accord, elle sort. La vieille dame. Elle tremble trop de toute façon.'],
        },
        ruse: {
          fail: ['Vous me prenez pour un idiot. Tout le monde me prend pour un idiot.', 'Arrêtez vos manèges. Je vois les gyrophares d\'ici.'],
          partial: ['Combien de temps encore ? Dites-moi juste combien de temps.', 'Vous parlez comme les assurances au téléphone.'],
          success: ['Dix minutes alors. Pas une de plus.', 'OK. Je compte sur vous. J\'ai plus personne d\'autre.'],
        },
      },
      byCard: {
        proposer_reddition: {
          fail: ['Me rendre ? Pour la taule ? Vous savez ce que c\'est, la taule, quand on a une fille ?'],
          partial: ['Et Lina ? Qu\'est-ce qu\'elle devient si je sors les mains en l\'air ?'],
          success: ['Je mets l\'arme par terre. Vous le dites à Lina que son père… qu\'il a rien fait de mal. Dites-lui.'],
        },
        appel_proche: {
          fail: ['Je veux pas qu\'elle m\'entende comme ça !'],
          partial: ['Elle pleure ? Elle pleure, là ?'],
          success: ['Lina… ma puce… non, non, papa va bien. Papa va bien, mon cœur.'],
        },
      },
      default: {
        fail: ['Laissez-moi tranquille. Laissez-moi réfléchir.'],
        partial: ['J\'entends. Je vois ce que vous essayez de faire.'],
        success: ['D\'accord. On continue à parler.'],
      },
    },
    lines: {
      kill: ['Vous avez entendu ?! C\'est de votre faute. C\'est vous qui me parliez de Lina !', 'Je voulais pas. Oh non, je voulais pas…'],
      freed: ['Elle sort. Allez, vas-y, sors. Ne cours pas, marche.', 'Un de moins. Comme promis. À vous de tenir, maintenant.'],
      concede: ['L\'insuline et la voiture. C\'est tout ce que je demande depuis le début.', 'Ma femme ? Passez-la-moi. Juste deux minutes.'],
      terror: ['Qu\'est-ce qui se passe ? J\'ai entendu du bruit !', 'Restez en ligne. Vous restez en ligne !'],
    },
  },

  demands: [
    {
      id: 'insuline', label: 'De l\'insuline et une voiture', major: true,
      detail: 'Il veut de quoi soigner sa fille et partir. Impossible à satisfaire tel quel.',
      concede: { effects: { threat: -3, free: 1, pressure: 2 }, text: 'L\'insuline est déposée devant la porte. Il pleure en la récupérant. Il laisse sortir un otage.' },
    },
    {
      id: 'femme', label: 'Parler à son ex-femme', major: false,
      detail: 'Il veut deux minutes au téléphone avec elle.',
      concede: { effects: { threat: -1, pressure: 1 }, text: 'L\'appel est passé. Il reste silencieux longtemps après avoir raccroché.' },
    },
  ],

  clues: [
    { id: 't_fille', name: 'Fille diabétique', famille: true, proche: true,
      desc: 'Lina, 8 ans, diabétique. Tout ce qu\'il fait, il le fait pour elle. L\'évoquer ouvre une brèche.',
      trait: null },
    { id: 't_licencie', name: 'Licencié il y a 6 semaines',
      desc: 'Vingt ans d\'usine, un courrier recommandé, rien d\'autre. Le mot « restructuration » le fait monter.',
      trait: { tagMods: { autorite: -1 } } },
    { id: 't_dettes', name: 'Surendetté',
      desc: 'Découvert bloqué, huissier. Il sait qu\'il n\'a plus rien à perdre — sauf une chose.',
      trait: { tagMods: { ruse: -1 } } },
    { id: 't_revolver', name: 'Arme héritée',
      desc: 'Le revolver appartenait à son grand-père. Il l\'a pris dans la cave. Il tremble quand il le lève.',
      trait: { tagMods: { pression: -1 } } },
    { id: 't_exfemme', name: 'Ex-femme pas hostile', proche: true, famille: true,
      desc: 'Elle répondra si on l\'appelle. Elle ne le déteste pas : elle a peur pour lui.',
      trait: { tagMods: { empathie: 1 } } },
  ],

  terrorExtra: {
    tut_insuline: {
      id: 'tut_insuline', name: 'L\'insuline en vue',
      text: 'Il décrit les boîtes bleues derrière le comptoir. L\'équipe note le détail.',
      taker: 'C\'est là. À deux mètres de moi. Trois jours que j\'en ai plus à la maison.',
      effect: { reveal: 1 },
    },
    tut_pleurs: {
      id: 'tut_pleurs', name: 'Pleurs au téléphone',
      text: 'Il craque. Son épaule glisse le long de l\'armoire à pharmacie.',
      taker: 'Je suis pas un braqueur. Je suis un père. Vous comprenez la différence ?',
      effect: { threat: -1 },
    },
    tut_etudiant: {
      id: 'tut_etudiant', name: 'L\'étudiant implose',
      text: 'Le plus jeune otage hyperventile. Thomas le rassure maladroitement.',
      taker: 'Respire, petit. Je te ferai rien. J\'ai une fille de ton âge… presque.',
      effect: { pressure: 1 },
    },
    tut_nuit: {
      id: 'tut_nuit', name: 'La nuit s\'installe',
      text: 'Les néons de la pharmacie clignotent. La fatigue gagne du terrain.',
      taker: 'Vous êtes toujours là ? Dites quelque chose.',
      effect: { threat: 1 },
    },
  },

  terrorDeck: ['nervosite', 'tut_insuline', 'accalmie', 'tut_pleurs', 'fait_divers', 'souvenir', 'tut_etudiant', 'revelation'],

  market: ['nourriture', 'humour', 'famille', 'souffrance', 'dossier_psy', 'verite_brutale',
           'appel_proche', 'echange', 'mentir_delais', 'silence_tactique', 'mediateur', 'bluff_assaut', 'promesse'],

  questions: [
    {
      id: 'q_mot', minTurn: 2,
      text: '« Vous êtes payé combien, pour écouter un type comme moi ? »',
      replies: [
        { label: '« Peu importe. Posez le revolver et on n\'en parle plus. »', tag: 'autorite',
          answer: 'Vous voyez ! Tout le monde veut juste que ça s\'arrête !',
          effects: { threat: 1 } },
        { label: '« Je suis payé pour que personne ne se fasse mal, Thomas. Vous y compris. »', tag: 'empathie',
          answer: '…Ouais. Vous dites ça comme si c\'était vrai.',
          effects: { threat: -1 } },
        { label: '« Plus que l\'inspecteur qui a monté votre dossier. »', tag: 'ruse',
          answer: 'C\'est censé me faire rire ?',
          effects: { pcNext: 1, mark: 'promesse' } },
      ],
    },
  ],

  epilogues: {
    surrender: 'Thomas Réal est sorti à 02h41, les mains vides, un thermos d\'insuline serré contre lui. Lina ne saura rien de cette nuit avant longtemps. Le parquet décidera. Vous, vous dormirez.',
    liberation: 'Le dernier otage a franchi le cordon à 02h10. Thomas Réal, seul dans la pharmacie éclairée au néon, a posé son revolver sur le comptoir et attendu. Vous étiez en ligne quand les hommes sont entrés.',
    assault: 'Les hommes du GIPN sont entrés à 02h04. Quatre secondes, trois flashs. Thomas Réal est neutralisé. Les otages sont sortis. Vous écrirez le rapport avec des mains qui ne tremblent pas. Presque.',
    escape: 'Quand le périmètre s\'est resserré, la pharmacie était vide. On a retrouvé le revolver sur le comptoir et une boîte d\'insuline manquante. Thomas Réal court encore. Quelque part, une fillette attend son père.',
    defeat: '02h58. Plus personne à secourir dans la pharmacie des Coteaux. On vous a retiré le casque et le combiné. Dehors, la pluie continue de tomber sur Saint-Étienne comme si de rien n\'était.',
  },
};
