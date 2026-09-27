// ============================================================
// Cinématiques pixel-art (données déclaratives)
// intro  : jouée avant le briefing quand « Illustrations » est on
// mid    : déclenchées une fois par partie via pickCutscene()
// Triggers : { turn }, { threatGte }, { pressureGte }, { freed }, { death }
// ============================================================

export const CUTSCENES = {
  tutoriel: {
    intro: [
      { art: 'ville_pluie', lines: [
        "Saint-Étienne, 23h12. Il pleut depuis trois jours.",
        "Un homme entre à la Pharmacie des Coteaux. Il n'a ni ordonnance, ni argent.",
      ] },
      { art: 'pharma_revolver', lines: [
        "« Juste l'insuline. S'il vous plaît. »",
        "La pharmacienne refuse. Le revolver sort de la poche.",
      ] },
      { art: 'voiture_nego', lines: [
        "Votre téléphone sonne. Le commissaire : « Il a décroché la ligne intérieure. »",
        "« C'est à vous. »",
      ] },
    ],
    mid: [
      { key: 'photo', trigger: { turn: 4 }, panels: [
        { art: 'photo_fille', lines: [
          "Sur le comptoir, entre deux boîtes d'insuline, une photo d'école. Une petite fille édentée qui sourit.",
        ] },
      ] },
      { key: 'menace', trigger: { threatGte: 5 }, panels: [
        { art: 'yeux', lines: [
          "Dans la lunette du tireur, Réal arpente le comptoir. Il ne tient plus son arme comme un homme qui hésite.",
        ] },
      ] },
      { key: 'libere', trigger: { freed: true }, panels: [
        { art: 'porte_lumiere', lines: [
          "Un otage franchit la porte. Couverture de survie, pas un mot. Derrière lui, le rideau retombe.",
        ] },
      ] },
    ],
  },

  braquage: {
    intro: [
      { art: 'banque_alarme', lines: [
        "Lyon 7e, 16h38. L'alarme silencieuse du Crédit Rhodanien vient de se déclencher.",
        "Les rideaux de fer tombent.",
      ] },
      { art: 'banque_otages', lines: [
        "Six personnes à genoux sur le carrelage.",
        "Un homme cagoulé compte les sorties. Calme. Comme un soldat.",
      ] },
      { art: 'perimetre', lines: [
        "Le périmètre se remplit. Les premiers téléphones filment.",
        "Le Chat a laissé le standard ouvert. Il attend votre appel.",
      ] },
    ],
    mid: [
      { key: 'media', trigger: { pressureGte: 6 }, panels: [
        { art: 'helico', lines: [
          "Un hélicoptère d'une chaîne d'info survole l'avenue Berthelot. En direct, tout le pays regarde.",
        ] },
      ] },
      { key: 'tireur', trigger: { threatGte: 5 }, panels: [
        { art: 'lunette', lines: [
          "Sur le toit d'en face : « Cible visible. J'attends l'ordre. » Vous ne répondez pas.",
        ] },
      ] },
      { key: 'mort', trigger: { death: true }, panels: [
        { art: 'rideau_eclair', lines: [
          "Un coup de feu derrière le rideau de fer. Puis plus rien. Le standard sonne dans le vide.",
        ] },
      ] },
    ],
  },

  hopital: {
    intro: [
      { art: 'chu_facade', lines: [
        "CHU de Nantes, 09h14.",
        "Au quatrième étage, les portes du sas de réanimation ne s'ouvrent plus.",
      ] },
      { art: 'couloir_lit', lines: [
        "Marc Delaunay a poussé un lit contre les portes.",
        "Onze jours plus tôt, sa femme mourait derrière.",
      ] },
      { art: 'respirateurs', lines: [
        "Derrière lui, deux patients respirent grâce à des machines.",
        "Et grâce aux soignants qu'il retient.",
      ] },
    ],
    mid: [
      { key: 'alarme', trigger: { turn: 3 }, panels: [
        { art: 'ecg_alarme', lines: [
          "Une alarme de monitoring traverse la porte. Personne ne bouge sans son autorisation.",
        ] },
      ] },
      { key: 'helene', trigger: { turn: 6 }, panels: [
        { art: 'hautbois', lines: [
          "Sur une chaise du sas, un étui de hautbois et une photo de mariage. Il ne les quitte pas des yeux.",
        ] },
      ] },
      { key: 'menace', trigger: { threatGte: 5 }, panels: [
        { art: 'yeux', lines: [
          "Delaunay ne crie plus. Sa voix est devenue plate. C'est pire.",
        ] },
      ] },
      { key: 'libere', trigger: { freed: true }, panels: [
        { art: 'porte_lumiere', lines: [
          "Une infirmière sort, les mains encore gantées. Elle se retourne vers le sas avant de s'effondrer.",
        ] },
      ] },
    ],
  },

  secte: {
    intro: [
      { art: 'vercors_neige', lines: [
        "Plateau du Vercors, 22h40. Il a neigé sur la ferme des Ancres.",
        "Les fenêtres brillent d'une lumière qui n'est pas électrique : des bougies.",
      ] },
      { art: 'guru_foule', lines: [
        "Sabine Vellut parle. Devant elle, quarante-deux personnes écoutent sans un bruit.",
        "Douze sont des enfants.",
      ] },
      { art: 'dortoir_enfants', lines: [
        "Au mur du dortoir, un dessin d'enfant : le soleil, une maison, et la phrase « le Grand Passage ».",
        "La gendarmerie a encerclé le plateau. Votre téléphone sonne.",
      ] },
    ],
    mid: [
      { key: 'rituel', trigger: { counterGte: { id: 'rituel', v: 3 } }, panels: [
        { art: 'rituel_coupes', lines: [
          "Sur les images thermiques : un cercle de silhouettes autour des bougies.",
          "On remplit des coupes. Le rituel avance.",
        ] },
      ] },
      { key: 'aube', trigger: { act: 1, actTurn: 1 }, panels: [
        { art: 'aube_elie', lines: [
          "L'aube se lève sur le plateau. Ce n'est plus Sabine qui décroche.",
          "« Je m'appelle Élie. Elle m'a laissé le téléphone. »",
        ] },
      ] },
      { key: 'matin', trigger: { act: 2, actTurn: 1 }, panels: [
        { art: 'dernier_matin', lines: [
          "Le soleil que Vellut annonçait se lève pour de vrai.",
          "Derrière les fenêtres, personne ne dort plus.",
        ] },
      ] },
      { key: 'portail', trigger: { freed: true }, panels: [
        { art: 'portail_neige', lines: [
          "Le portail grince. Un enfant traverse la neige, seul, les bras levés.",
          "Personne ne respire sur la fréquence.",
        ] },
      ] },
    ],
  },

  prison: {
    intro: [
      { art: 'centrale_mur', lines: [
        "Maison centrale de Clairmont, 19h03.",
        "Le projecteur de la tour ouest balaie la cour. Il ne s'arrête plus.",
      ] },
      { art: 'couloir_feu', lines: [
        "Dans le quartier disciplinaire, des matelas brûlent entre les barreaux.",
        "L'administration pénitentiaire vous a déjà passé le combiné.",
      ] },
      { art: 'gardien_porte', lines: [
        "Le gardien Marc Bellac est retenu contre une porte de cellule.",
        "Keraudren parle pour tout le bâtiment B. Et il compte ses otages à voix haute.",
      ] },
    ],
    mid: [
      { key: 'toit', trigger: { counterGte: { id: 'emeute', v: 4 } }, panels: [
        { art: 'emeute_toit', lines: [
          "Les flammes ont atteint la toiture. Le vent rabat la fumée sur le mur d'enceinte.",
          "À l'intérieur, on entend frapper sur du métal.",
        ] },
      ] },
      { key: 'sorel', trigger: { act: 1, actTurn: 1 }, panels: [
        { art: 'sorel_combine', lines: [
          "Un bruit de lutte, le combiné qui tombe.",
          "« Ici Sorel. Keraudren a fini de parler. Maintenant on négocie avec moi. »",
        ] },
      ] },
      { key: 'fumee', trigger: { act: 2, actTurn: 1 }, panels: [
        { art: 'fumee_coursive', lines: [
          "La fumée sort par les grilles d'aération de la coursive.",
          "Le temps joue contre les otages autant que contre vous.",
        ] },
      ] },
      { key: 'mort', trigger: { death: true }, panels: [
        { art: 'cellule_sombre', lines: [
          "La coursive s'est tue d'un coup. Le silence d'une prison vient d'empirer.",
        ] },
      ] },
    ],
  },

  ferry: {
    intro: [
      { art: 'ferry_quai', lines: [
        "Quai de la Joliette, Marseille, 21h18.",
        "Le Méridional devait appareiller à minuit. Il ne partira pas.",
      ] },
      { art: 'pont_voitures', lines: [
        "Sur le pont garage, des silhouettes armées circulent entre les voitures.",
        "Vingt personnes sont retenues à bord. Équipage compris.",
      ] },
      { art: 'mira_radio', lines: [
        "À la passerelle, une voix de femme prend la radio du navire.",
        "« Ici Mira. Vous allez parler avec moi. Pas d'hélicoptère, pas de drones. »",
      ] },
    ],
    mid: [
      { key: 'explosifs', trigger: { counterGte: { id: 'explosifs', v: 2 } }, panels: [
        { art: 'minuteur', lines: [
          "Les démineurs confirment : charges disposées le long de la coque.",
          "Sur une image floue, un minuteur. Les chiffres avancent.",
        ] },
      ] },
      { key: 'houle', trigger: { act: 1, actTurn: 1 }, panels: [
        { art: 'houle_pont', lines: [
          "La houle se lève dans la rade. Le navire tire sur ses amarres.",
          "À bord, tout le monde a compris que ça se jouera dehors.",
        ] },
      ] },
      { key: 'ansel', trigger: { act: 2, actTurn: 1 }, panels: [
        { art: 'ansel_combine', lines: [
          "Une nouvelle voix, plus froide, reprend le combiné.",
          "« Mira t'a assez écoutée. Maintenant c'est moi qui fixe les règles. »",
        ] },
      ] },
      { key: 'passerelle', trigger: { freed: true }, panels: [
        { art: 'passerelle', lines: [
          "La porte latérale s'ouvre. Un premier passager descend la passerelle, mains sur la tête.",
          "La nuit avale chaque silhouette une à une.",
        ] },
      ] },
    ],
  },
};

export function getIntro(missionId) {
  return (CUTSCENES[missionId] && CUTSCENES[missionId].intro) || null;
}

export function hasCutscenes(missionId) {
  return !!CUTSCENES[missionId];
}

// Sélection pure de la prochaine cinématique de milieu de partie.
// `seen` = game.cutsSeen (clés déjà jouées). Ne mute rien.
// Toutes les conditions d'un trigger doivent être vraies (ET) ; au moins
// une condition requise. `act` = indice d'acte 0-based ; `actTurn: n` =
// n-ième tour de l'acte courant ; `counterGte` lit game.counters[id].
function triggerMatch(game, t, fog) {
  let any = false;
  if (t.act != null) { any = true; if (game.act !== t.act) return false; }
  if (t.actTurn != null) { any = true; if (game.turn !== (game.actStartTurn || 1) + t.actTurn - 1) return false; }
  if (t.turn != null) { any = true; if (game.turn < t.turn) return false; }
  if (t.threatGte != null) { any = true; if (fog || game.threat < t.threatGte) return false; }
  if (t.pressureGte != null) { any = true; if (game.pressure < t.pressureGte) return false; }
  if (t.counterGte != null) {
    any = true;
    const c = game.counters && game.counters[t.counterGte.id];
    if (!c || c.value < t.counterGte.v) return false;
  }
  if (t.freed) { any = true; if (!(game.hostages.freed > 0)) return false; }
  if (t.death) { any = true; if (!(game.hostages.killed > 0)) return false; }
  return any;
}

export function pickCutscene(game, seen) {
  if (!game || game.result || game.phase === 'choice') return null;
  const def = CUTSCENES[game.missionId];
  if (!def || !def.mid) return null;
  const fog = !!(game.options && game.options.brouillard);
  for (const c of def.mid) {
    if (seen.includes(c.key)) continue;
    if (triggerMatch(game, c.trigger, fog)) return c;
  }
  return null;
}
