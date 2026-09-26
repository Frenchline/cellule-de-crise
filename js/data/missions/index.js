// ============================================================
// Registre des missions
// ============================================================

import { MISSION_TUTORIEL } from './tutoriel.js';
import { MISSION_BRAQUAGE } from './braquage.js';
import { MISSION_HOPITAL } from './hopital.js';
import { MISSION_SECTE } from './secte.js';
import { MISSION_PRISON } from './prison.js';
import { MISSION_FERRY } from './ferry.js';

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

export function getMission(id) {
  return MISSIONS[id] || null;
}
