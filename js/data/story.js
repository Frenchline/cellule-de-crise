// ============================================================
// Fil narratif entre missions — lignes de « journal » de campagne,
// ajoutées à campaign.storyLog à chaque recordResult.
// Interlocuteurs récurrents : Castagne (hiérarchie), Morvan (presse),
// Dr Anselme (psy de la cellule). Données pures, aucun DOM.
// ============================================================

import { REP_CHARS } from '../reputation.js';
import { PSY_PORTRAIT } from '../pixel.js';

export const STORY_CHARS = {
  castagne: { name: REP_CHARS.hierarchie.name, portrait: REP_CHARS.hierarchie.portrait },
  morvan: { name: REP_CHARS.presse.name, portrait: REP_CHARS.presse.portrait },
  anselme: { name: 'Dr Claire Anselme', portrait: PSY_PORTRAIT },
};

// variantes : 'win' (reddition/libération/assaut/fuite) et 'defeat'
const STORY = {
  tutoriel: {
    win: [
      { from: 'castagne', text: 'Premier appel, premier rapport propre. Le préfet a noté votre nom.' },
      { from: 'anselme', text: 'Vous avez fait taire la nuit sans lever la voix. Dormez quand même.' },
    ],
    defeat: [
      { from: 'anselme', text: 'La pharmacie restera ouverte la nuit dans votre tête. Venez me voir avant le prochain appel.' },
      { from: 'castagne', text: 'On débriefera demain. Ce soir, vous rentrez chez vous.' },
    ],
  },
  braquage: {
    win: [
      { from: 'morvan', text: 'Le Crédit Rhodanien a fermé ses volets à l\'aube. Ma une est écrite : « La voix a gagné ».' },
      { from: 'castagne', text: 'Morel s\'est rendu avec son arme déchargée. Vous l\'avez convaincu, pas désarmé. C\'est la différence.' },
    ],
    defeat: [
      { from: 'morvan', text: 'On tourne en boucle le sang devant l\'agence. Ce que vous direz demain comptera.' },
      { from: 'anselme', text: 'Le coffre, les cris, puis le silence — je connais cet ordre-là. Parlez-en, ne le rangez pas.' },
    ],
  },
  hopital: {
    win: [
      { from: 'anselme', text: 'Réanimation, quatrième étage : vous avez négocié là où on ne négocie plus. Bien joué, docteur.' },
      { from: 'castagne', text: 'Le couloir était propre, le bilan l\'est presque. La direction de l\'hôpital vous remercie.' },
    ],
    defeat: [
      { from: 'anselme', text: 'Un hôpital la nuit, des écrans qui sonnent faux. Certains échecs laissent une marque particulière.' },
      { from: 'morvan', text: '« Drame au quatrième étage » — le titre tenait tout seul. Je n\'ai rien eu à inventer.' },
    ],
  },
  secte: {
    win: [
      { from: 'castagne', text: 'La ferme de l\'Aube a ouvert son portail sans un coup de feu. Le procureur parle de « miracle froid ».' },
      { from: 'anselme', text: 'Ils se croyaient immortels, vous leur avez rendu leur fragilité. C\'est du travail.' },
    ],
    defeat: [
      { from: 'morvan', text: 'La ferme a brûlé jusqu\'au matin. Les gens demandent qui a laissé faire. Moi aussi.' },
      { from: 'anselme', text: 'Quand la liturgie a pris le pas sur vos mots, il n\'y avait plus personne pour écouter. Reposez-vous.' },
    ],
  },
  prison: {
    win: [
      { from: 'castagne', text: 'Le quartier B s\'est rendu en ordre. Même la direction n\'y croit pas. Keraudren a tenu parole — vous aussi.' },
      { from: 'anselme', text: 'Seize ans de cellule, une nuit de franche négociation. Il vous en parlera encore dans dix ans.' },
    ],
    defeat: [
      { from: 'castagne', text: 'L\'aile a cramé, les otages avec. Le ministre veut des têtes — la vôtre est sur la liste.' },
      { from: 'anselme', text: 'La barricade, le feu, les noms. On ne « classe » pas une nuit comme celle-là. On la traverse.' },
    ],
  },
  ferry: {
    win: [
      { from: 'morvan', text: '« L\'Étoile du Levant rend ses passagers » — vingt noms, vingt familles. Je garde ce sujet-là précieusement.' },
      { from: 'castagne', text: 'La cellule a posé les armes sur le pont. Éco-radicalisme ou pas, zéro mort, c\'est votre méthode.' },
    ],
    defeat: [
      { from: 'morvan', text: 'La mer était calme, le bateau non. Demain on dira « tragédie en rade ». Vous direz autre chose.' },
      { from: 'anselme', text: 'Vingt cabines, un détonateur. Votre voix n\'a pas suffi — personne ne vous en veut à part vous.' },
    ],
  },
};

const GENERIC = {
  win: [
    { from: 'castagne', text: 'Une alerte de plus dans la colonne « résolu ». On prend.' },
    { from: 'anselme', text: 'Une nuit blanche, des otages rentrés. Notez-le quelque part : ce fut un bon soir.' },
  ],
  defeat: [
    { from: 'castagne', text: 'Le rapport fera trois lignes. La nuit, elle, en fera plus.' },
    { from: 'anselme', text: 'Une opération perdue n\'est pas un procès. Venez en parler quand même.' },
  ],
};

// Lignes de journal ajoutées après une mission terminée.
export function missionStoryEntries(missionId, outcome) {
  const v = outcome === 'defeat' || outcome === 'escape' ? 'defeat' : 'win';
  const m = STORY[missionId];
  return (m ? m[v] : GENERIC[v]) || [];
}

// Drapeaux de campagne dérivés des missions terminées.
//   story.complice — braquage gagné sans défaite → Morel est connu
//   story.levant   — ferry terminé → la cellule du Levant a inspiré d'autres
export function updateStoryFlags(c, missionId, outcome) {
  c.story = c.story || { complice: false, levant: false };
  if (missionId === 'braquage' && (outcome === 'surrender' || outcome === 'liberation')) c.story.complice = true;
  if (missionId === 'ferry' && outcome !== 'defeat') c.story.levant = true;
}

// Lignes de « Contexte » du briefing, même forme que repModifiers().contexts.
export function storyContexts(c, missionId) {
  const s = (c && c.story) || {};
  const out = [];
  if (missionId === 'prison' && s.complice) {
    out.push({ who: 'castagne', label: 'Vieille connaissance', text: 'un mutin de Saint-Aubin est l\'homme du Crédit Rhodanien — il vous a déjà entendu négocier.' });
  }
  if (missionId === 'secte' && s.levant) {
    out.push({ who: 'anselme', label: 'Même signature', text: 'la cellule du Levant les a inspirés : ils la citent comme un évangile.' });
  }
  return out;
}

// Ajoute les entrées au journal de campagne (cap 20, plus récentes en fin).
export function appendStoryLog(c, missionId, outcome) {
  if (!Array.isArray(c.storyLog)) c.storyLog = [];
  const entries = missionStoryEntries(missionId, outcome)
    .map(e => ({ day: c.day, mission: missionId, from: e.from, text: e.text }));
  if (entries.length) c.storyLog = c.storyLog.concat(entries).slice(-20);
}
