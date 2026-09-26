// ============================================================
// Options de partie facultatives (multiplicateurs de score)
// ============================================================

export const OPTIONS = {
  chrono: {
    id: 'chrono', name: 'Chrono', mult: 1.2,
    desc: '60 secondes réelles par phase de conversation. À zéro : menace +1 et fin de la phase.',
  },
  media: {
    id: 'media', name: 'Médias déchaînés', mult: 1.2,
    desc: 'La pression médiatique monte deux fois plus vite.',
  },
  brouillard: {
    id: 'brouillard', name: 'Brouillard', mult: 1.1,
    desc: 'La menace exacte est cachée : seul un ressenti textuel est affiché.',
  },
  blesse: {
    id: 'blesse', name: 'Otage blessé', mult: 1.3,
    desc: 'Un otage est blessé : il doit être libéré avant le début du tour 5 ou il mourra.',
  },
  complice: {
    id: 'complice', name: 'Complice caché', mult: 1.3,
    desc: 'Une carte Terreur révélera un second preneur : menace +2, autorité −1 dé.',
  },
  epuise: {
    id: 'epuise', name: 'Négociateur épuisé', mult: 1.1,
    desc: '−1 PC à chaque tour à partir du tour 5.',
  },
  hardcore: {
    id: 'hardcore', name: 'Mode hardcore', mult: 1.5,
    desc: 'Pas de relance de dés. En cas de défaite, le stress passe à 5 (burn-out).',
  },
};

export const OPTION_LIST = Object.values(OPTIONS);

export function optionsMultiplier(opts) {
  let m = 1;
  for (const o of OPTION_LIST) if (opts[o.id]) m *= o.mult;
  return Math.round(m * 100) / 100;
}
