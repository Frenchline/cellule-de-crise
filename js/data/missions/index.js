// ============================================================
// Registre des missions
// ============================================================

import { MISSION_TUTORIEL } from './tutoriel.js';
import { MISSION_BRAQUAGE } from './braquage.js';
import { MISSION_HOPITAL } from './hopital.js';
import { MISSION_SECTE } from './secte.js';
import { MISSION_PRISON } from './prison.js';
import { MISSION_FERRY } from './ferry.js';
import { generateMission } from '../generator.js';

export const MISSIONS = {
  tutoriel: MISSION_TUTORIEL,
  braquage: MISSION_BRAQUAGE,
  hopital: MISSION_HOPITAL,
  secte: MISSION_SECTE,
  prison: MISSION_PRISON,
  ferry: MISSION_FERRY,
};

export const MISSION_LIST = [
  MISSION_TUTORIEL, MISSION_BRAQUAGE, MISSION_HOPITAL,
  MISSION_SECTE, MISSION_PRISON, MISSION_FERRY,
];

export const CLASSIC_IDS = ['braquage', 'hopital'];
export const ADVANCED_IDS = ['secte', 'prison', 'ferry'];

// Missions générées « Opérations spéciales » : id « gen:<seed> ».
// Régénérées de façon déterministe à la demande (sauvegardes, reprendre).
const generatedCache = new Map();

export function getMission(id) {
  if (MISSIONS[id]) return MISSIONS[id];
  if (typeof id === 'string' && id.startsWith('gen:')) {
    const seed = parseInt(id.slice(4), 10);
    if (!Number.isFinite(seed)) return null;
    if (!generatedCache.has(seed)) {
      generatedCache.set(seed, generateMission(seed));
      if (generatedCache.size > 20) generatedCache.delete(generatedCache.keys().next().value);
    }
    return generatedCache.get(seed);
  }
  return null;
}
