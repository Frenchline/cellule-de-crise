// ============================================================
// Réputation de campagne — deux jauges 0–10 (défaut 5).
//   presse     → Inès Morvan, journaliste (soutien ou traque médiatique)
//   hierarchie → Commissaire Hervé Castagne (confiance du préfet)
// Module pur : aucun DOM, aucun effet de bord. Le moteur lit les
// modificateurs via l'option `rep` de createGame ; la campagne applique
// les deltas après chaque mission (sauf tutoriel).
// ============================================================

export const REP_DEFAULT = { presse: 5, hierarchie: 5 };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------------- Personnages récurrents ----------------
export const REP_CHARS = {
  hierarchie: {
    id: 'castagne',
    name: 'Cme Hervé Castagne',
    role: 'votre hiérarchie',
    portrait: {
      skin: 'clair', hair: 'court', hairColor: 'gris', beard: 'courte',
      clothes: 'uniforme', age: 'âgé',
    },
    lines: {
      up: [
        'Le préfet a dit « bon travail ». Croyez-moi, ça ne lui arrive pas souvent.',
        'Propre, net, sans bavure. Continuez comme ça.',
      ],
      flat: [
        'Le rapport est bouclé. Rentrez dormir, demain sera un autre jour.',
        'Ni gloire ni scandale. On fera mieux la prochaine fois.',
      ],
      down: [
        'Le préfet m\'a appelé. Deux fois. Je n\'aime pas quand il appelle deux fois.',
        'On va devoir s\'expliquer en haut lieu. Préparez vos arguments.',
      ],
    },
  },
  presse: {
    id: 'morvan',
    name: 'Inès Morvan',
    role: 'journaliste, « 20 heures »',
    portrait: {
      skin: 'clair', hair: 'long', hairColor: 'noir',
      clothes: 'robe', age: 'adulte', sex: 'f', accessory: 'pendentif',
    },
    lines: {
      up: [
        'Ma une de demain s\'intitule « Le calme qui a sauvé des vies ». Merci pour le boulot.',
        'Les téléspectateurs vous adorent. Profitez-en, ça ne dure jamais.',
      ],
      flat: [
        'J\'ai assez pour un papier de vingt lignes. Ni plus, ni moins.',
        'Une nuit ordinaire, pour une fois. Le public préfère le drame — tant mieux pour vous.',
      ],
      down: [
        'On me demande une une sur « l\'échec des négociateurs ». Défendez-vous, ou alors… non.',
        'Mes caméras tournent encore. La prochaine fois, donnez-moi autre chose à filmer.',
      ],
    },
  },
};

// ---------------- Modificateurs de départ ----------------
// rep → ce que le moteur applique en createGame (option `rep`) et ce que
// le briefing affiche dans l'encart « Contexte ».
export function repModifiers(rep = REP_DEFAULT) {
  const mods = { mediaGrace: 0, pressureStart: 0, prepBonus: 0, assaultAt: 10, contexts: [] };
  if (rep.presse >= 8) {
    mods.mediaGrace = 2;
    mods.contexts.push({ who: 'morvan', label: 'La presse vous soutient', text: 'les deux premières montées de pression automatiques sont sautées.' });
  } else if (rep.presse <= 2) {
    mods.pressureStart = 2;
    mods.contexts.push({ who: 'morvan', label: 'La presse vous attend au tournant', text: 'la pression médiatique démarre à 2.' });
  }
  if (rep.hierarchie >= 8) {
    mods.prepBonus = 1;
    mods.contexts.push({ who: 'castagne', label: 'Le préfet vous fait confiance', text: 'préparation +1 en début de mission.' });
  } else if (rep.hierarchie <= 2) {
    mods.assaultAt = 9;
    mods.contexts.push({ who: 'castagne', label: 'Le préfet s\'impatiente', text: 'l\'assaut sera ordonné dès la pression 9.' });
  }
  return mods;
}

// ---------------- Deltas après mission ----------------
// outcome : 'surrender'|'liberation'|'assault'|'escape'|'defeat'
// state   : l'état de fin de partie (pressure, hostages, flags…)
export function repDeltas(outcome, state) {
  const killed = state.hostages ? state.hostages.killed : 0;
  const majors = (state.flags && state.flags.majorConcessions) || 0;

  let presse = 0;
  if (state.pressure <= 5) presse += 1;
  if (state.pressure >= 8) presse -= 1;
  if (majors > 0) presse -= 1;
  if (outcome === 'surrender') presse += 1;
  if (killed >= 1) presse -= 1;

  let hierarchie = 0;
  if (outcome === 'surrender' || (outcome === 'liberation' && killed === 0)) hierarchie += 1;
  hierarchie -= Math.min(2, majors);
  if (outcome === 'defeat') hierarchie -= 2;
  if (outcome === 'escape') hierarchie -= 1;
  if (outcome === 'assault' && state.flags && state.flags.assaultKind === 'volontaire' && killed === 0) hierarchie += 1;

  return {
    presse: clamp(presse, -2, 2),
    hierarchie: clamp(hierarchie, -2, 2),
  };
}

// ---------------- Réactions de débrief ----------------
const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];

// Ligne d'un personnage selon le signe de son delta (déterministe).
export function repLine(gauge, delta, seed = 0) {
  const c = REP_CHARS[gauge];
  const pool = delta > 0 ? c.lines.up : delta < 0 ? c.lines.down : c.lines.flat;
  return pick(pool, seed);
}

// Remarque de la psy (Dr Anselme) — ton débrief selon stress/pertes.
export function psyDebriefLine(state, stress = 0) {
  const killed = state.hostages ? state.hostages.killed : 0;
  const outcome = state.result ? state.result.outcome : null;
  if (outcome === 'defeat') {
    return 'On ne « gagne » pas contre une telle nuit. Venez me voir avant de rouvrir le dossier.';
  }
  if (killed >= 2 || stress >= 4) {
    return 'Dormez peu si vous devez, mais parlez-en. Les noms restent, c\'est normal.';
  }
  if (killed === 1) {
    return 'Un nom de plus sur votre liste. Ne le portez pas seul.';
  }
  if (outcome === 'surrender' || outcome === 'liberation') {
    return 'Tout le monde est rentré. Savourez — ces soirs-là sont rares.';
  }
  return 'Ni tout à fait une victoire, ni tout à fait une défaite. Respirez, puis écrivez le rapport.';
}

// Rapport complet pour la section « RÉACTIONS » du débrief.
// before = jauges avant mission, deltas appliqués → after.
export function repReport(before, deltas, state, stress = 0) {
  const r = {
    presse: {
      ...REP_CHARS.presse,
      before: clamp(before.presse, 0, 10),
      delta: deltas.presse,
      after: clamp(before.presse + deltas.presse, 0, 10),
    },
    hierarchie: {
      ...REP_CHARS.hierarchie,
      before: clamp(before.hierarchie, 0, 10),
      delta: deltas.hierarchie,
      after: clamp(before.hierarchie + deltas.hierarchie, 0, 10),
    },
  };
  r.presse.line = repLine('presse', r.presse.delta, state.turn || 0);
  r.hierarchie.line = repLine('hierarchie', r.hierarchie.delta, (state.turn || 0) + 1);
  r.psy = { name: 'Dr Claire Anselme', role: 'psychologue de la cellule', line: psyDebriefLine(state, stress) };
  return r;
}
