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
};

export function getIntro(missionId) {
  return (CUTSCENES[missionId] && CUTSCENES[missionId].intro) || null;
}

export function hasCutscenes(missionId) {
  return !!CUTSCENES[missionId];
}

// Sélection pure de la prochaine cinématique de milieu de partie.
// `seen` = game.cutsSeen (clés déjà jouées). Ne mute rien.
export function pickCutscene(game, seen) {
  if (!game || game.result || game.phase === 'choice') return null;
  const def = CUTSCENES[game.missionId];
  if (!def || !def.mid) return null;
  const fog = !!(game.options && game.options.brouillard);
  for (const c of def.mid) {
    if (seen.includes(c.key)) continue;
    const t = c.trigger;
    let fire = false;
    if (t.turn != null) fire = game.turn >= t.turn;
    else if (t.threatGte != null) fire = !fog && game.threat >= t.threatGte;
    else if (t.pressureGte != null) fire = game.pressure >= t.pressureGte;
    else if (t.freed) fire = game.hostages.freed > 0;
    else if (t.death) fire = game.hostages.killed > 0;
    if (fire) return c;
  }
  return null;
}
