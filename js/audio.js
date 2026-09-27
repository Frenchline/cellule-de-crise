// ============================================================
// Audio — 100 % Web Audio généré, aucun fichier.
// Démarre au premier geste utilisateur (ctx.resume).
// ============================================================

import { loadSettings, saveSettings } from './campaign.js';

let ctx = null;
let master = null;
let sirenTimer = null;
let settings = loadSettings();
let started = false;

export function audioSettings() { return { ...settings }; }

// Debug uniquement (tests/audiocheck.html) : sonde le bus maître.
export function attachAnalyser() {
  if (!ctx) return null;
  const an = ctx.createAnalyser();
  an.fftSize = 2048;
  master.connect(an);
  return an;
}
export function audioCtxState() { return ctx ? ctx.state : 'none'; }

function persist() { saveSettings(settings); }

export function setMuted(m) { settings.mute = m; if (master) master.gain.value = m ? 0 : settings.volume; persist(); }
export function setVolume(v) { settings.volume = v; if (master && !settings.mute) master.gain.value = v; persist(); }
// « Ambiance sonore » (clé music des réglages) : nappes + radio.
// Les SFX, stingers et le tic-tac suivent le mute général seul.
export function setAmbienceEnabled(m) { settings.music = m; if (ambGain) ambGain.gain.value = m !== false ? 1 : 0.0001; persist(); }

// Démarrage — à appeler sur un geste utilisateur
export function initAudio() {
  if (started) { if (ctx && ctx.state === 'suspended') ctx.resume(); return; }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch { return; }
  master = ctx.createGain();
  master.gain.value = settings.mute ? 0 : settings.volume;
  master.connect(ctx.destination);
  started = true;
  ambGain = ctx.createGain();
  ambGain.gain.value = settings.music !== false ? 1 : 0.0001;
  ambGain.connect(master);
  noiseBuf = noiseBuffer(1);
  buildBed();
  updateBed();
  if (!tickTimer) tickTock();
  if (!radioTimer) radioTick();
  scheduleSiren();
}

// ---------------- utilitaires ----------------
function noiseBuffer(seconds = 1) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function env(node, t0, a, peak, d, sustain = 0.0001) {
  node.gain.cancelScheduledValues(t0);
  node.gain.setValueAtTime(0.0001, t0);
  node.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), t0 + a);
  node.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t0 + a + d);
}

// Conservée pour les appelants existants : écrit tension.threat.
export function setThreat(t) { tension.threat = t; updateBed(); }

// ---------------- sirène lointaine ----------------
function scheduleSiren() {
  sirenTimer = setTimeout(() => {
    playSiren();
    scheduleSiren();
  }, 25000 + Math.random() * 40000);
}

export function playSiren() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = 'triangle';
  const g = ctx.createGain(); g.gain.value = 0;
  o.connect(g); g.connect(master);
  for (let i = 0; i < 6; i++) {
    o.frequency.setValueAtTime(660, t + i * 0.8);
    o.frequency.linearRampToValueAtTime(880, t + i * 0.8 + 0.4);
    o.frequency.linearRampToValueAtTime(660, t + i * 0.8 + 0.8);
  }
  g.gain.linearRampToValueAtTime(0.012, t + 1);
  g.gain.linearRampToValueAtTime(0.0001, t + 5);
  o.start(t); o.stop(t + 5);
}

// ---------------- effets ponctuels ----------------
export function playSquelch() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(0.08);
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 2;
  const g = ctx.createGain();
  src.connect(f); f.connect(g); g.connect(master);
  env(g, t, 0.005, 0.06, 0.06);
  src.start(t);
}

export function playRing() {
  if (!ctx) return;
  const t = ctx.currentTime;
  for (let i = 0; i < 2; i++) {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 1400;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 1100;
    const g = ctx.createGain();
    o.connect(g); o2.connect(g); g.connect(master);
    const t0 = t + i * 1.6;
    env(g, t0, 0.01, 0.07, 1.0);
    o.start(t0); o.stop(t0 + 1.1);
    o2.start(t0); o2.stop(t0 + 1.1);
  }
}

export function playDice() {
  if (!ctx) return;
  const t = ctx.currentTime;
  for (let i = 0; i < 5; i++) {
    const t0 = t + i * 0.06 + Math.random() * 0.04;
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer(0.05);
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3000;
    const g = ctx.createGain();
    src.connect(f); f.connect(g); g.connect(master);
    env(g, t0, 0.002, 0.09, 0.05);
    src.start(t0);
  }
}

export function playGunshot() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(0.5);
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(6000, t);
  f.frequency.exponentialRampToValueAtTime(300, t + 0.3);
  const g = ctx.createGain();
  src.connect(f); f.connect(g);
  // réverb courte via delay feedback léger
  const dly = ctx.createDelay(); dly.delayTime.value = 0.09;
  const fb = ctx.createGain(); fb.gain.value = 0.25;
  const wet = ctx.createGain(); wet.gain.value = 0.4;
  g.connect(master);
  g.connect(dly); dly.connect(fb); fb.connect(dly); dly.connect(wet); wet.connect(master);
  env(g, t, 0.002, 0.5, 0.35);
  src.start(t);
}

export function playChime() {
  if (!ctx) return;
  const t = ctx.currentTime;
  [880, 1320].forEach((fr, i) => {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = fr;
    const g = ctx.createGain();
    o.connect(g); g.connect(master);
    env(g, t + i * 0.12, 0.01, 0.08, 0.6);
    o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.7);
  });
}

export function playTerrorStinger() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(55, t + 0.8);
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
  const g = ctx.createGain();
  o.connect(f); f.connect(g); g.connect(master);
  env(g, t, 0.02, 0.16, 0.9);
  o.start(t); o.stop(t + 1);
}

export function playJingle(win) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const seq = win ? [523, 659, 784, 1046] : [392, 330, 262, 196];
  seq.forEach((fr, i) => {
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = fr;
    const g = ctx.createGain();
    o.connect(g); g.connect(master);
    env(g, t + i * 0.18, 0.01, 0.1, 0.5);
    o.start(t + i * 0.18); o.stop(t + i * 0.18 + 0.6);
  });
}

// Menace +1 : boom grave 80→50 Hz + corps 200-400 Hz + claquement.
export function playThreatUp() {
  if (!ctx || !noiseBuf) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(80, t);
  o.frequency.exponentialRampToValueAtTime(50, t + 0.3);
  const g = ctx.createGain();
  o.connect(g); g.connect(master);
  env(g, t, 0.005, 0.14, 0.45);
  o.start(t); o.stop(t + 0.55);
  const o2 = ctx.createOscillator(); o2.type = 'triangle';
  o2.frequency.setValueAtTime(340, t);
  o2.frequency.exponentialRampToValueAtTime(210, t + 0.22);
  const g2 = ctx.createGain();
  o2.connect(g2); g2.connect(master);
  env(g2, t, 0.004, 0.1, 0.28);
  o2.start(t); o2.stop(t + 0.38);
  const src = ctx.createBufferSource(); src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 1.2;
  const ng = ctx.createGain();
  src.connect(f); f.connect(ng); ng.connect(master);
  env(ng, t, 0.001, 0.1, 0.08);
  src.start(t); src.stop(t + 0.12);
}

// Menace −1 : deux notes descendantes, soulagement discret.
export function playThreatDown() {
  if (!ctx) return;
  const t = ctx.currentTime;
  [[392, 'sine'], [311, 'triangle']].forEach(([fr, ty], i) => {
    const t0 = t + i * 0.16;
    const o = ctx.createOscillator(); o.type = ty; o.frequency.value = fr;
    const g = ctx.createGain();
    o.connect(g); g.connect(master);
    env(g, t0, 0.01, 0.07, 0.35);
    o.start(t0); o.stop(t0 + 0.45);
  });
}

// Mort d'un otage : après le coup de feu, un bourdon dissonant
// (deux sines à une seconde mineure) qui s'éteint en ~3 s.
export function playDeathTone() {
  if (!ctx) return;
  const t = ctx.currentTime + 0.35;
  for (const fr of [110, 116.5]) {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = fr;
    const o2 = ctx.createOscillator(); o2.type = 'triangle';
    o2.frequency.value = fr * 2; o2.detune.value = 5;
    const g = ctx.createGain();
    o.connect(g); o2.connect(g); g.connect(master);
    env(g, t, 0.25, 0.09, 2.7);
    o.start(t); o.stop(t + 3.1);
    o2.start(t); o2.stop(t + 3.1);
  }
}

// ============================================================
// Design sonore procédural — pas de musique. Tout est calibré
// pour les haut-parleurs de téléphone (~150 Hz – 3 kHz,
// aucune couche purement sub-grave).
// ============================================================
let ambGain = null;            // bus ambiance (réglage « Ambiance sonore »)
let noiseBuf = null;
let ambMode = null;            // 'menu' | 'cinematique' | 'game' | null
const tension = { threat: 1, deckLeft: 99, fog: false, over: false, chronoLeft: null, cut: false };

export function setAmbience(mode) { ambMode = mode; updateBed(); }

export function setTension(o = {}) {
  if (o.threat != null) tension.threat = o.threat;
  if (o.deckLeft != null) tension.deckLeft = o.deckLeft;
  if (o.fog != null) tension.fog = !!o.fog;
  if ('chronoLeft' in o) tension.chronoLeft = o.chronoLeft;
  if ('over' in o) tension.over = !!o.over;
  if ('cut' in o) tension.cut = !!o.cut;
  updateBed();
}

// ---------------- nappe de tension ----------------
// 3 voix désaccordées ~A2-E3 (sciées + triangle) dans un passe-bas
// dont la coupure monte avec la menace ; LFO lent = respiration.
// Menace ≥ 6 : voix dissonante (seconde mineure) ; à 7 : trémolo.
// Transitions douces (~1,5 s). Brouillard : niveau fixe médian.
let bedFilter = null, bedGain = null, bedVoices = [], bedDiss = null;
let lfoDepth = null, tremDepth = null;

function buildBed() {
  bedFilter = ctx.createBiquadFilter();
  bedFilter.type = 'lowpass'; bedFilter.frequency.value = 300; bedFilter.Q.value = 1.1;
  bedGain = ctx.createGain(); bedGain.gain.value = 0;
  bedFilter.connect(bedGain); bedGain.connect(ambGain);

  const mk = (type, fr, det) => {
    const o = ctx.createOscillator();
    o.type = type; o.frequency.value = fr; o.detune.value = det;
    const g = ctx.createGain(); g.gain.value = 0;
    o.connect(g); g.connect(bedFilter); o.start();
    return { o, g };
  };
  bedVoices = [
    mk('sawtooth', 110, -9),     // A2
    mk('sawtooth', 110, 8),      // A2 désaccordé
    mk('triangle', 164.8, 0),    // E3
  ];
  bedDiss = mk('sawtooth', 116.5, 0);   // A#2 : seconde mineure

  const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.13;
  lfoDepth = ctx.createGain(); lfoDepth.gain.value = 0;
  lfo.connect(lfoDepth); lfoDepth.connect(bedFilter.frequency); lfo.start();

  const tr = ctx.createOscillator(); tr.type = 'sine'; tr.frequency.value = 4.6;
  tremDepth = ctx.createGain(); tremDepth.gain.value = 0;
  tr.connect(tremDepth); tremDepth.connect(bedGain.gain); tr.start();
}

function bedGate() {
  if (ambMode === 'menu' || ambMode === 'cinematique') return 0.5;
  if (ambMode === 'game' && !tension.over) return 1;
  return 0;
}

function updateBed() {
  if (!ctx || !bedGain) return;
  const t = ctx.currentTime;
  const gate = bedGate();
  const menuish = ambMode !== 'game';
  const th = tension.fog ? 4 : tension.threat;
  const cut = menuish ? 260 : 300 + (th - 1) * 250;        // 300 → 1800 Hz
  const vv = menuish ? 0.02 : 0.018 + (th - 1) * 0.0055;   // ~0.018 → 0.051
  bedGain.gain.setTargetAtTime(gate, t, 1.5);
  bedFilter.frequency.setTargetAtTime(cut, t, 1.5);
  lfoDepth.gain.setTargetAtTime(menuish ? 50 : cut * 0.3, t, 1.5);
  for (const v of bedVoices) v.g.gain.setTargetAtTime(vv, t, 1.5);
  bedDiss.g.gain.setTargetAtTime(!menuish && th >= 6 ? vv * 0.8 : 0, t, 1.5);
  tremDepth.gain.setTargetAtTime(!menuish && th >= 7 ? 0.3 : 0, t, 1.5);
}

// Renflement bref de la nappe au changement de panneau (cinématique).
export function swell() {
  if (!ctx || !bedGain || ambMode !== 'cinematique') return;
  const t = ctx.currentTime;
  bedGain.gain.cancelScheduledValues(t);
  bedGain.gain.setTargetAtTime(bedGate() * 1.9, t, 0.08);
  bedGain.gain.setTargetAtTime(bedGate(), t + 0.55, 0.4);
}

// ---------------- radio de la cellule ----------------
// Toutes les ~18-45 s (plus souvent menace ≥ 5) : squelch, puis bruit
// passe-bande découpé en « syllabes » irrégulières, squelch de fin.
let radioTimer = null;

export function playRadioChatter() {
  if (!ctx || !noiseBuf) return;
  const t = ctx.currentTime;
  const dur = 1 + Math.random() * 1.5;
  const squelch = (t0, fr) => {
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = fr;
    const g = ctx.createGain();
    o.connect(g); g.connect(ambGain);
    env(g, t0, 0.002, 0.045, 0.03);
    o.start(t0); o.stop(t0 + 0.06);
  };
  squelch(t, 2600);
  const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4;
  f.frequency.setValueAtTime(900 + Math.random() * 350, t);
  f.frequency.linearRampToValueAtTime(1900 + Math.random() * 600, t + dur);
  const am = ctx.createGain(); am.gain.value = 0;
  src.connect(f); f.connect(am); am.connect(ambGain);
  // portes « syllabiques » ~4-9 par seconde, amplitude irrégulière
  let tt = t + 0.07;
  const end = t + dur;
  while (tt < end - 0.1) {
    am.gain.setTargetAtTime(0.03 + Math.random() * 0.2, tt, 0.015);
    tt += 0.11 + Math.random() * 0.14;
  }
  am.gain.setTargetAtTime(0.0001, end - 0.12, 0.03);
  src.start(t + 0.05); src.stop(end);
  squelch(end + 0.03, 2100);
}

function radioTick() {
  if (!ctx) return;
  const th = tension.fog ? 4 : tension.threat;
  if (ambMode === 'game' && !tension.over && !tension.cut) playRadioChatter();
  const wait = th >= 5 ? 10000 + Math.random() * 14000 : 18000 + Math.random() * 27000;
  radioTimer = setTimeout(radioTick, wait);
}
// ---------------- tic-tac (horloge murale) ----------------
// Bloc de bois, deux hauteurs. Seulement quand la pioche Terreur
// devient courte : ≤4 cartes → 1/s ; ≤2 ou chrono ≤10 s → 2/s,
// plus fort. Muet hors écran de jeu, après le résultat et pendant
// une cinématique.
let tickTimer = null, tickHigh = false;

function tickSound(hi, vol = 0.06) {
  if (!ctx || !noiseBuf) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.value = hi ? 1700 : 1200;
  const g = ctx.createGain();
  o.connect(g); g.connect(master);
  env(g, t, 0.002, vol, 0.05);
  o.start(t); o.stop(t + 0.08);
  const src = ctx.createBufferSource(); src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass';
  f.frequency.value = hi ? 3600 : 2400; f.Q.value = 4;
  const ng = ctx.createGain();
  src.connect(f); f.connect(ng); ng.connect(master);
  env(ng, t, 0.001, vol * 0.9, 0.045);
  src.start(t); src.stop(t + 0.07);
}

function tickTock() {
  if (!ctx) return;
  let interval = 0, vol = 0;
  if (ambMode === 'game' && !tension.over && !tension.cut) {
    const cl = tension.chronoLeft, dl = tension.deckLeft;
    if ((cl != null && cl <= 10) || dl <= 2) { interval = 500; vol = 0.16; }
    else if (dl <= 4) { interval = 1000; vol = 0.12; }
  }
  if (interval) tickSound(tickHigh = !tickHigh, vol);
  tickTimer = setTimeout(tickTock, interval || 500);
}
