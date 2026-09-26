// Diagnostic : causes de fin de partie par mission (usage : node tools/diag.js <missionId> [n])
import * as E from '../js/engine.js';
import { botPlay } from './simulate.js';

const missionId = process.argv[2];
const n = parseInt(process.argv[3] || '500', 10);
const causes = {};
const byOutcome = {};
const causesOfDeath = {};
const actReach = {};
let turns = 0;
for (let i = 0; i < n; i++) {
  const s = E.createGame({ missionId, seed: (i * 2654435761) | 0 });
  botPlay(s);
  const res = s.result || { outcome: 'stuck', turn: s.turn };
  turns += s.turn;
  byOutcome[res.outcome] = (byOutcome[res.outcome] || 0) + 1;
  actReach[s.act] = (actReach[s.act] || 0) + 1;
  // dernier log significatif
  const tail = s.log.filter(l => /assaut|Heure H|pression|rupture|épuis|pioche|Fumée|explos|r[iy]tuel/i.test(l.text || '')).slice(-2).map(l => l.text);
  const key = `${res.outcome} | acte ${s.act} | tour ${s.turn} | P${s.pressure} T${s.threat} R${s.hostages.remaining}`;
  if (['defeat', 'assault', 'escape'].includes(res.outcome)) causes[key] = (causes[key] || 0) + 1;
  for (const d of (s.deaths || [])) causesOfDeath[d.cause] = (causesOfDeath[d.cause] || 0) + (d.n || 1);
}
console.log(`=== ${missionId} (${n} parties, tours moy. ${(turns / n).toFixed(1)}) ===`);
console.log('issues:', byOutcome);
console.log('acte atteint:', actReach);
console.log('morts par cause:', causesOfDeath);
console.log('top fins brutales:');
Object.entries(causes).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => console.log(` ${String(v).padStart(4)}  ${k}`));
