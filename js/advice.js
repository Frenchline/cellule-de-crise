// ============================================================
// Conseils de la psychologue — module pur, sans DOM.
// adviceFor(state, seen) → { key, text } | null
//   seen = { clé: tour de la dernière émission } (state.adviceSeen,
//   créé paresseusement par engine.addAdvice, sérialisable).
// Une règle déjà vue ne refire qu'au bout de 3 tours ; les règles
// moins prioritaires peuvent prendre le relais entre-temps.
// ============================================================

import { TAGS } from './data/cards.js';
import { pendingDemands, getDemandDef, getClueDef, getMissionDef, ensureHostageList } from './engine.js';

export function adviceFor(state, seen = {}) {
  if (!state || state.result) return null;
  const due = (key) => seen[key] == null || state.turn - seen[key] >= 3;

  const rules = [
    // 1. Point de rupture proche — jamais sous brouillard (menace cachée).
    {
      key: 'rupture',
      ok: !state.options.brouillard && state.threat >= 6,
      text: () => `Menace à ${state.threat}/7. Au prochain dérapage, il tue un otage. Évitez Pression et Autorité ; l'Empathie coûte moins cher en ce moment.`,
    },
    // 2. Assaut forcé proche.
    {
      key: 'presse',
      ok: state.pressure >= 8,
      text: () => `La presse est à ${state.pressure}/10. À ${state.assaultAt || 10}, le préfet ordonne l'assaut. Si ça doit arriver, préparez l'équipe (renseignement, tireur).`,
    },
    // 3. Demande majeure en attente (l'ultimatum Terreur donne menace +2
    //    tant qu'elle pend → « l'échauffe » est exact).
    {
      key: 'demande',
      ok: pendingDemands(state).some(d => {
        const def = getDemandDef(state, d.id);
        return def && def.major;
      }),
      text: () => {
        const d = pendingDemands(state).find(dd => {
          const def = getDemandDef(state, dd.id);
          return def && def.major;
        });
        const label = getDemandDef(state, d.id).label;
        return `Il attend une réponse sur « ${label} ». La neutraliser en négociant évite de lui céder, mais le laisser sans réponse l'échauffe.`;
      },
    },
    // 4. Indice révélé avec modificateur de dés.
    {
      key: null, // trait_<clueId>
      ok: state.clues.some(c => c.revealed && getClueDef(state, c.id) && getClueDef(state, c.id).trait && getClueDef(state, c.id).trait.tagMods && Object.keys(getClueDef(state, c.id).trait.tagMods).length),
      text: null,
    },
    // 5. Fin de pioche (dernier acte ou mission classique) → Heure H.
    {
      key: 'horloge',
      ok: (() => {
        const m = getMissionDef(state) || {};
        const finalAct = !m.acts || state.act == null || state.act >= m.acts.length - 1;
        return finalAct && state.terrorDeck.length <= 3;
      })(),
      text: () => `Plus que ${state.terrorDeck.length} carte${state.terrorDeck.length > 1 ? 's' : ''} Terreur avant l'Heure H. Il faut conclure : faites baisser la menace et tentez la reddition.`,
    },
    // 5b. Un otage fragile est encore retenu (à partir du tour 2).
    {
      key: 'vulnerable',
      ok: state.turn >= 2 && ensureHostageList(state).some(h => h.status === 'held' && h.trait === 'vulnerable'),
      text: () => {
        const v = ensureHostageList(state).find(h => h.status === 'held' && h.trait === 'vulnerable');
        return `${v.name} (${v.role}) est ${v.f ? 'la' : 'le'} plus fragile. Obtenez sa libération en priorité.`;
      },
    },
    // 6. Dossier incomplet + Écoute active en main.
    {
      key: 'indices',
      ok: state.clues.some(c => !c.revealed) && state.hand.includes('ecoute_active'),
      text: () => 'On ne sait pas encore tout de lui. Une Écoute active réussie peut révéler un indice.',
    },
    // 7. Ouverture (tour 1).
    {
      key: 'ouverture',
      ok: state.turn === 1,
      text: () => 'Il est à cran. Commencez par l\'écouter avant de demander quoi que ce soit.',
    },
  ];

  for (const r of rules) {
    if (!r.ok) continue;
    if (r.key === null) {
      // règle 4 : key dépend de l'indice
      const c = state.clues.find(cc => {
        const def = getClueDef(state, cc.id);
        return cc.revealed && def && def.trait && def.trait.tagMods && Object.keys(def.trait.tagMods).length;
      });
      const key = `trait_${c.id}`;
      if (!due(key)) continue;
      const def = getClueDef(state, c.id);
      const mods = def.trait.tagMods;
      const tag = Object.keys(mods).sort((a, b) => Math.abs(mods[b]) - Math.abs(mods[a]))[0];
      const label = TAGS[tag] || tag;
      const text = mods[tag] > 0
        ? `Son profil (${def.name}) : les cartes ${label} gagnent un dé.`
        : `Son profil (${def.name}) : les cartes ${label} perdent un dé, évitez-les.`;
      return { key, text };
    }
    if (r.key === 'vulnerable') {
      // règle 5b : key dépend de l'otage visé
      const v = ensureHostageList(state).find(h => h.status === 'held' && h.trait === 'vulnerable');
      const key = `vulnerable_${v.id}`;
      if (!due(key)) continue;
      return { key, text: r.text() };
    }
    if (!due(r.key)) continue;
    return { key: r.key, text: r.text() };
  }
  return null;
}
