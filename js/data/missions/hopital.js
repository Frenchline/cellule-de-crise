// ============================================================
// Mission 2 — « Réanimation, 4e étage »
// CHU de Nantes. Un homme et les morts qui ne répondent pas.
// ============================================================

export const MISSION_HOPITAL = {
  id: 'hopital',
  title: 'Réanimation, 4e étage',
  subtitle: 'CHU de Nantes — Service de réanimation',
  type: 'classic',
  startThreat: 5,
  hostages: 5,
  hostageList: [
    { id: 'infirmiere1', name: 'Claire Vasseau', role: 'infirmière de réa', f: true },
    { id: 'infirmiere2', name: 'Meriem Attia', role: 'infirmière diabétique', trait: 'vulnerable', f: true },
    { id: 'aide', name: 'Bruno Lefort', role: 'aide-soignant' },
    { id: 'interne', name: 'Julie Roche', role: 'interne', trait: 'heros', f: true },
    { id: 'cadre', name: 'Serge Devos', role: 'cadre de santé' },
  ],

  briefing: [
    'RAPPORT D\'INTERVENTION — SECTION NÉGOCIATION',
    '09h14. CHU de Nantes, service de réanimation, 4e étage. Un homme a poussé un lit de réa contre les portes du sas stérile et s\'est enfermé avec une arme. Cinq soignants sont avec lui.',
    'Identité : DELAUNAY Marc, 52 ans. Veuf depuis 11 jours. Sa femme, Hélène, est morte dans ce service — infection nosocomiale, selon lui ; « complication », selon l\'hôpital. Il accuse le chef de service de faute. L\'enquête interne est close.',
    'Otages (5) : deux infirmières, un aide-soignant, un interne, un cadre de santé. PROBLÈME : le sas donne sur deux chambres de réa — des patients sous respirateurs dépendent du personnel retenu.',
    'Consigne : c\'est un homme en deuil, pas un criminel. Le deuil ne se négocie pas — il s\'entend.',
  ],

  scene: 'hopital',
  taker: {
    name: 'Marc Delaunay',
    age: 52,
    portrait: { skin: 'clair', hair: 'court', hairColor: 'gris', glasses: true, clothes: 'chemise', age: 'âgé' },
    dossier: [
      'Ébéniste, 28 ans de métier, main droite amputée d\'un doigt par une scie. Aucun antécédent.',
      'Hélène, sa femme depuis 26 ans, admise ici pour une appendicite. Morte 9 jours plus tard d\'une infection.',
      'A déposé trois plaintes, toutes classées. Le chef de service ne l\'a jamais reçu.',
      'Il ne dort plus. Il décrit les machines, les alarmes, l\'odeur. Il est revenu « chercher la vérité ».',
    ],
    responses: {
      byTag: {
        empathie: {
          fail: ['Vous ne savez pas ce que c\'est, perdre la moitié de soi.', 'Ne me parlez pas d\'elle comme d\'un cas.'],
          partial: ['Elle s\'appelait Hélène. Dites son nom, au moins.', 'Vous croyez que vos paroles réparent quelque chose ?'],
          success: ['Vingt-six ans. On s\'est rencontrés au conservatoire. Elle jouait du hautbois.', 'Personne ne l\'a pleurée à l\'hôpital. Vous comprenez ? PERSONNE.'],
        },
        autorite: {
          fail: ['L\'autorité ? Elle a tué ma femme, l\'autorité. L\'autorité du chef de service.', 'Vos ordres valent quoi face à des machines qui respirent à leur place ?'],
          partial: ['Je reconnais le ton. C\'est le ton qu\'ils prenaient avec moi.', 'Allez, faites votre métier. Comme eux.'],
          success: ['Si c\'était un ordre qui fallait… je l\'aurais déjà obéi.', 'D\'accord. Mais que le chef vienne. Qu\'il regarde ce qu\'il a fait.'],
        },
        pression: {
          fail: ['Vous me menacez dans un hôpital ? J\'y ai tout perdu dans un hôpital !', 'Des patients ? Vous croyez que je le sais pas, pour les patients ?'],
          partial: ['Les patients… oui. Je vois les écrans d\'ici. Je les surveille.', 'C\'est pas moi qui les ai mis là.'],
          success: ['L\'infirmière. Celle qui s\'occupe du 412. Laissez-la retourner à ses machines.', 'D\'accord. Un. Mais que le 412 continue de respirer.'],
        },
        ruse: {
          fail: ['Des stratagèmes ? Comme leur enquête interne ? « Classée sans suite » ?', 'Je sais mentir aussi. On m\'a appris.'],
          partial: ['Vous essayez de me tourner autour. Je le vois.', 'Encore du temps. C\'est ce qu\'ils disaient. Encore du temps.'],
          success: ['Peut-être que vous êtes différent. Peut-être.', 'Très bien. J\'attends. J\'ai appris à attendre dans ce service.'],
        },
      },
      byCard: {
        proposer_reddition: {
          fail: ['Partir ? Et Hélène ? Qui demandera pardon pour Hélène ?'],
          partial: ['Si je sors, le chef de service avoue ? Vous le promettez ?'],
          success: ['Je pose l\'arme. Dites-leur qu\'elle s\'appelait Hélène. Qu\'elle jouait du hautbois. Que c\'est pas une complication.'],
        },
        appel_proche: {
          fail: ['Je veux pas du directeur. Je veux qu\'il admette.'],
          partial: ['Il a peur de moi, le directeur ? Bien. Qu\'il ait peur.'],
          success: ['Monsieur le directeur… ma femme s\'appelait Hélène. Dites-le à votre équipe.'],
        },
      },
      default: {
        fail: ['Vous ne comprenez rien à cette histoire.'],
        partial: ['J\'écoute. Hélène aurait voulu que j\'écoute.'],
        success: ['Continuez. Il y a des machines qui bipent mais je vous entends.'],
      },
    },
    lines: {
      kill: ['Une de plus. Dans ce service, on est habitués.', 'Il fallait pas. IL FALLAIT PAS. Comme elle.'],
      freed: ['Sortez. Retournez à vos malades. C\'est eux qui comptent, pas moi.', 'Elle peut partir. Elle ressemble pas à celle qui a laissé mourir ma femme.'],
      concede: ['Il a avoué ? À la télé ? Enfin. ENFIN.', 'Sa photo ? Vous avez trouvé sa photo ?'],
      terror: ['Les alarmes… je les entends. Comme cette nuit-là.', 'Les machines seules peuvent pas les sauver. Il faut les soignants.'],
    },
  },

  demands: [
    {
      id: 'aveu', label: 'Aveu public de faute', major: true,
      detail: 'Que le chef de service reconnaisse la faute devant les caméras.',
      concede: { effects: { threat: -3, free: 1, pressure: 3 }, text: 'Sur les écrans, le chef de service lit la déclaration préparée. Marc s\'assoit par terre et pleure sans bruit. Il libère l\'interne.' },
    },
    {
      id: 'directeur', label: 'Parler au directeur', major: false,
      detail: 'Un échange téléphonique avec le directeur de l\'hôpital.',
      concede: { effects: { threat: -2, pressure: 1 }, text: 'Le directeur a parlé. Marc a écouté. Il a raccroché en disant : « Elle s\'appelait Hélène. »' },
    },
    {
      id: 'photo', label: 'La photo d\'Hélène', major: false,
      detail: 'Une photo de sa femme, apportée de leur maison.',
      concede: { effects: { threat: -2 }, text: 'On glisse la photo sous le sas. Il l\'a prise avec ses mains qui tremblent. Il l\'a posée sur le moniteur du lit 412.' },
    },
  ],

  clues: [
    { id: 'h_helene', name: 'Hélène, 26 ans de mariage', famille: true, proche: true,
      desc: 'Tout tourne autour d\'elle. L\'évoquer, c\'est risquer la rupture — ou trouver la porte. +1 empathie une fois révélé.',
      trait: { tagMods: { empathie: 1 } } },
    { id: 'h_dette_soi', name: 'Faute médicale présumée',
      desc: 'Infection nosocomiale, trois plaintes classées. Il veut une reconnaissance, pas une indemnité. −1 ruse : il flaire les stratagèmes.',
      trait: { tagMods: { ruse: -1 } } },
    { id: 'h_patients', name: 'Les patients du 4e',
      desc: 'Il sait que des vies dépendent de ses otages. C\'est sa conscience et son levier. +1 autorité quand on le sait.',
      trait: { tagMods: { autorite: 1 } } },
    { id: 'h_insomnie', name: 'Onze nuits sans dormir',
      desc: 'Depuis la mort d\'Hélène. Il est à bout. La fatigue fait le reste : −1 pression (la pression le crispe).',
      trait: { tagMods: { pression: -1 } } },
    { id: 'h_hautbois', name: 'Le hautbois', famille: true,
      desc: 'Hélène jouait du hautbois au conservatoire. Il gardait son instrument dans le séjour. Un détail qui humanise.',
      trait: null },
  ],

  terrorExtra: {
    hop_generateur: {
      id: 'hop_generateur', name: 'Panne de générateur',
      text: 'Le groupe électrogène hoquette. Les écrans des respirateurs clignotent.',
      taker: 'Les machines ! Réparez vos foutues machines !',
      effect: { roll: { dice: 2, table: { 0: { kill: 1 }, 1: { threat: 1, pressure: 1 } } } },
    },
    hop_patient: {
      id: 'hop_patient', name: 'Patient en détresse',
      text: 'L\'alarme du lit 412 hurle. Une infirmière otage supplie qu\'on la laisse intervenir.',
      taker: 'Il s\'étouffe ! Je peux pas ! Laissez-moi l\'infirmière !',
      effect: { roll: { dice: 2, table: { 0: { kill: 1 }, 1: { threat: 1 } } } },
    },
    hop_chef: {
      id: 'hop_chef', name: 'Le chef craque',
      text: 'Le chef de service, en bas, effondré devant les caméras. Marc le regarde sur un écran.',
      taker: 'Il pleure. Pourquoi il pleure que maintenant ?',
      effect: { threat: -1, pressure: 1 },
    },
    hop_couloir: {
      id: 'hop_couloir', name: 'Dans le couloir',
      text: 'Des bruits de pas dans le couloir du 4e. Il plaque l\'oreille contre la porte.',
      taker: 'J\'entends des pas. Si c\'est vos hommes, je le jure…',
      effect: { threat: 1 },
    },
  },

  terrorDeck: ['nervosite', 'hop_couloir', 'ultimatum', 'hop_generateur', 'souvenir', 'otage_panique',
               'hop_patient', 'accalmie', 'hop_chef', 'accalmie'],

  market: ['famille', 'appel_proche', 'souffrance', 'dossier_psy', 'mediateur', 'promesse',
           'nourriture', 'verite_brutale', 'echange', 'mentir_delais', 'silence_tactique', 'humour', 'bluff_assaut'],

  questions: [
    {
      id: 'q_nuits', minTurn: 2,
      text: '« Vous êtes déjà resté onze nuits sans dormir, vous ? »',
      replies: [
        { label: '« Tout le temps, dans ce métier. »', tag: 'ruse',
          answer: '…Oui. On voit des choses, à force.',
          effects: { pcNext: 1, pressure: 1 } },
        { label: '« C\'est une question ? Répondez plutôt aux miennes. »', tag: 'pression',
          answer: 'Vos questions. Toujours vos questions.',
          effects: { threat: 1 } },
        { label: '« Non. Et vous, vous les portez depuis onze nuits. »', tag: 'empathie',
          answer: 'Onze. Je compte plus les cafés.',
          effects: { ifClue: { id: 'h_insomnie', then: { threat: -1 }, else: {} } } },
      ],
    },
    {
      id: 'q_machines', minTurn: 4,
      text: '« Si les machines s\'arrêtent, c\'est vous les responsables. »',
      replies: [
        { label: '« C\'est pour ça que les soignants comptent ici, pas moi. »', tag: 'autorite',
          answer: 'Les soignants… oui. Eux ils comptent, au moins.',
          effects: { ifClue: { id: 'h_patients', then: { threat: -1 }, else: {} } } },
        { label: '« Hélène ne vous voudrait pas ça. »', tag: 'empathie',
          answer: 'Ne prononcez pas son nom. PAS SON NOM.',
          effects: { ifClue: { id: 'h_helene', then: { threat: -1, pc: 1 }, else: { threat: 1 } } } },
        { label: '« Les générateurs tiendront. On a des techniciens prêts. »', tag: 'ruse',
          answer: 'J\'espère pour vous. Pour tout le monde.',
          effects: { pcNext: 1, mark: 'promesse' } },
      ],
    },
    {
      id: 'q_onze', minTurn: 6,
      text: '« Onze jours qu\'elle est partie. Vous avez une idée de ce que ça fait ? »',
      replies: [
        { label: '« Non. Mais deux patients en bas dépendent encore de vous. »', tag: 'autorite',
          answer: 'Les machines dépendent de moi. Pas les patients.',
          effects: { ifClue: { id: 'h_patients', then: { threat: -1 }, else: { threat: 1 } } } },
        { label: '« Vingt-six ans. Personne ne peut imaginer. Parlez-moi d\'elle. »', tag: 'empathie',
          answer: 'Elle… elle jouait du hautbois. Vous saviez ?',
          effects: { ifClue: { id: 'h_helene', then: { threat: -1, pc: 1 }, else: {} } } },
        { label: '« Oui. J\'ai perdu ma femme aussi. »', tag: 'ruse',
          answer: 'Alors vous savez qu\'on ne s\'en remet pas.',
          effects: { pcNext: 1, mark: 'promesse' } },
      ],
    },
  ],

  epilogues: {
    surrender: 'Marc Delaunay a posé l\'arme sur le lit d\'Hélène. Il a tenu la photo contre sa poitrine tout le long du couloir. Le chef de service a fait sa déclaration trois jours plus tard. Le rapport du procureur dira « dénouement sans effusion de sang ». Vous savez ce qu\'il en a coûté.',
    liberation: 'Le dernier soignant a franchi le sas à 13h46. Les respirateurs n\'ont jamais cessé. Marc, seul avec le lit 412 et la photo d\'Hélène, a attendu que les hommes viennent. Il n\'a plus rien dit. Il n\'avait plus rien à dire.',
    assault: 'Les hommes ont fait sauter le lit qui bloquait le sas. Onze secondes. Marc Delaunay est neutralisé, les soignants ont repris leur poste sans un mot. Le lit 412 respire encore. C\'est écrit au rapport. C\'est tout ce qu\'il fallait sauver.',
    escape: 'Il est descendu par les gaines techniques, jusqu\'à la morgue, où Hélène n\'est plus. On a retrouvé l\'arme sur un chariot, et la photo, légèrement pliée. Marc Delaunay est toujours en fuite. Il cherchera toujours la vérité sur ces onze jours.',
    defeat: 'À 14h03, le 4e étage du CHU a cessé de respirer pour tout le monde. On a coupé l\'alarme du lit 412 au bout d\'une heure. Votre casque est resté sur vos oreilles longtemps après que la ligne est morte.',
  },
};
