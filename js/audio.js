// ============================================================
// Audio — 100 % Web Audio généré, aucun fichier.
// Démarre au premier geste utilisateur (ctx.resume).
// ============================================================

import { loadSettings, saveSettings } from './campaign.js';

let ctx = null;
let master = null;
let ambientNodes = null;
let heartTimer = null;
let sirenTimer = null;
let settings = loadSettings();
let started = false;
let threat = 4;

export function audioSettings() { return settings; }

function persist() { saveSettings(settings); }

export function setMuted(m) { settings.mute = m; if (master) master.gain.value = m ? 0 : settings.volume; persist(); }
export function setVolume(v) { settings.volume = v; if (master && !settings.mute) master.gain.value = v; persist(); }
export function setMusicEnabled(m) { settings.music = m; if (musicGain) musicGain.gain.value = m ? MUSIC_VOL : 0.0001; persist(); }

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
  musicGain = ctx.createGain();
  musicGain.gain.value = settings.music ? MUSIC_VOL : 0.0001;
  musicGain.connect(master);
  noiseBuf = noiseBuffer(1);
  if (!seqTimer) seqTimer = setInterval(seqTick, 25);
  if (!tickTimer) tickTock();
  startAmbience();
  startHeartbeat();
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

// ---------------- nappe d'ambiance ----------------
function startAmbience() {
  const g = ctx.createGain();
  g.gain.value = 0.05;
  g.connect(master);

  // drone grave
  const o1 = ctx.createOscillator();
  o1.type = 'sine'; o1.frequency.value = 55;
  const o2 = ctx.createOscillator();
  o2.type = 'sine'; o2.frequency.value = 55.7;
  const og = ctx.createGain(); og.gain.value = 0.5;
  o1.connect(og); o2.connect(og); og.connect(g);
  o1.start(); o2.start();

  // pluie = bruit filtré
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(2); src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 1600; bp.Q.value = 0.4;
  const ng = ctx.createGain(); ng.gain.value = 0.35;
  src.connect(bp); bp.connect(ng); ng.connect(g);
  src.start();

  ambientNodes = g;
}

// ---------------- battement de coeur ----------------
// Audible à partir de la menace 4 ; sous brouillard, rythme fixe
// (la menace réelle ne doit pas fuiter via l'audio).
export function setThreat(t) { threat = t; }

function heartbeat() {
  if (!ctx) return;
  const eff = tension.fog ? 4.6 : threat;
  const interval = Math.max(450, 1500 - eff * 140); // ms
  const amp = Math.min(0.5, 0.1 + eff * 0.05);
  const beat = (t0, vol) => {
    const o = ctx.createOscillator();
    o.type = 'sine'; o.frequency.setValueAtTime(70, t0);
    o.frequency.exponentialRampToValueAtTime(40, t0 + 0.15);
    const g = ctx.createGain();
    o.connect(g); g.connect(master);
    env(g, t0, 0.01, vol, 0.18);
    o.start(t0); o.stop(t0 + 0.3);
  };
  const t = ctx.currentTime;
  if (eff >= 4) { beat(t, amp); beat(t + interval * 0.32 / 1000, amp * 0.7); }
  heartTimer = setTimeout(heartbeat, interval);
}
function startHeartbeat() { if (!heartTimer) heartbeat(); }

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

// ============================================================
// Musique procédurale — séquenceur lookahead (~25 ms, fenêtre
// 120 ms), voix chiptune sombres : lead carré + passe-bas,
// basse triangle, hats/snare en bruit filtré, nappes sciées.
// ============================================================
const MUSIC_VOL = 0.055;
const MIDI = (m) => 440 * Math.pow(2, (m - 69) / 12);

let musicGain = null;
let seqTimer = null;
let noiseBuf = null;
let musicMode = null;          // 'menu' | 'cinematique' | 'game' | null
let curTrack = null, pendingTrack = null;
let seqStep = 0, nextT = 0;
const tension = { threat: 1, deckLeft: 99, fog: false, over: false, chronoLeft: null };

// helper de patterns : { stepIndex: valeur } → tableau épars
function pat(map, len) {
  const a = new Array(len).fill(null);
  for (const k in map) a[+k] = map[k];
  return a;
}

const TRACKS = {
  // lent, mélancolique, épars — accueil / QG / débrief
  menu: {
    bpm: 60, len: 64,
    pad: { 0: [45, 57, 60, 64], 16: [41, 53, 57, 60], 32: [36, 48, 55, 60], 48: [40, 52, 56, 59] },
    bass: pat({ 0: 33, 16: 29, 32: 36, 48: 28 }, 64),
    lead: pat({ 8: 76, 24: 74, 44: 72, 56: 69 }, 64),
  },
  // nappe sombre + arpège grave — cinématiques / briefing
  cinematique: {
    bpm: 56, len: 32,
    pad: { 0: [33, 45, 52, 57], 16: [31, 43, 50, 55] },
    bass: pat({ 0: 21, 4: 28, 8: 33, 12: 28, 16: 21, 20: 28, 24: 31, 28: 28 }, 32),
    lead: pat({ 0: 69 }, 32),
  },
  // ~70 bpm, arpège La mineur épars
  calme: {
    bpm: 70, len: 32,
    bass: pat({ 0: 33, 16: 33 }, 32),
    lead: pat({ 0: 57, 6: 60, 12: 64, 22: 60, 28: 64 }, 32),
  },
  // ~90 bpm, ostinato de basse + motif en demi-tons
  tendu: {
    bpm: 90, len: 16,
    bass: pat({ 0: 33, 4: 33, 8: 33, 12: 33, 14: 34 }, 16),
    lead: pat({ 0: 64, 2: 65, 8: 64, 10: 65 }, 16),
    hat: pat({ 8: 1, 12: 1 }, 16),
  },
  // ~112 bpm, basse en croches, lead triton, caisse
  danger: {
    bpm: 112, len: 32,
    bass: pat({ 0: 33, 2: 33, 4: 33, 6: 33, 8: 33, 10: 33, 12: 33, 14: 33, 16: 33, 18: 33, 20: 33, 22: 33, 24: 33, 26: 33, 28: 33, 30: 31 }, 32),
    lead: pat({ 0: 69, 8: 63, 16: 69, 24: 63 }, 32),
    snare: pat({ 8: 1, 24: 1 }, 32),
    hat: pat({ 4: 1, 12: 1, 20: 1, 28: 1 }, 32),
  },
  // ~135 bpm, arpège diminué + hats rapides
  panique: {
    bpm: 135, len: 16,
    bass: pat({ 0: 33, 4: 33, 8: 33, 12: 33 }, 16),
    lead: pat({ 0: 57, 2: 60, 4: 63, 6: 66, 8: 69, 10: 66, 12: 63, 14: 60 }, 16),
    snare: pat({ 4: 1, 12: 1 }, 16),
    hat: pat({ 0: 1, 2: 1, 4: 1, 6: 1, 8: 1, 10: 1, 12: 1, 14: 1 }, 16),
  },
};

export function tensionLevel(threatLvl, fog) {
  if (fog) return 'tendu';
  if (threatLvl >= 7) return 'panique';
  if (threatLvl >= 5) return 'danger';
  if (threatLvl >= 3) return 'tendu';
  return 'calme';
}

export function setMusic(mode) { musicMode = mode; }

export function setTension(o = {}) {
  if (o.threat != null) tension.threat = o.threat;
  if (o.deckLeft != null) tension.deckLeft = o.deckLeft;
  if (o.fog != null) tension.fog = !!o.fog;
  if ('chronoLeft' in o) tension.chronoLeft = o.chronoLeft;
  if ('over' in o) tension.over = !!o.over;
}

function desiredTrack() {
  if (musicMode === 'menu') return 'menu';
  if (musicMode === 'cinematique') return 'cinematique';
  if (musicMode === 'game') return tensionLevel(tension.threat, tension.fog);
  return null;
}

// ---------------- voix ----------------
function vNote(type, midi, t0, dur, vol, lp) {
  const o = ctx.createOscillator();
  o.type = type; o.frequency.value = MIDI(midi);
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp;
  const g = ctx.createGain();
  o.connect(f); f.connect(g); g.connect(musicGain);
  env(g, t0, 0.008, vol, dur);
  o.start(t0); o.stop(t0 + dur + 0.1);
}
function vPad(midis, t0, dur) {
  for (const m of midis) for (const det of [-4, 3]) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth'; o.frequency.value = MIDI(m); o.detune.value = det;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 460;
    const g = ctx.createGain();
    o.connect(f); f.connect(g); g.connect(musicGain);
    env(g, t0, dur * 0.35, 0.012, dur * 0.6);
    o.start(t0); o.stop(t0 + dur + 0.15);
  }
}
function vHat(t0, vol = 0.028) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000;
  const g = ctx.createGain();
  src.connect(f); f.connect(g); g.connect(musicGain);
  env(g, t0, 0.002, vol, 0.04);
  src.start(t0); src.stop(t0 + 0.08);
}
function vSnare(t0) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8;
  const g = ctx.createGain();
  src.connect(f); f.connect(g); g.connect(musicGain);
  env(g, t0, 0.003, 0.05, 0.12);
  src.start(t0); src.stop(t0 + 0.16);
}

// ---------------- boucle du séquenceur ----------------
function scheduleStep(s, t0) {
  const tr = TRACKS[curTrack];
  if (!tr) return;
  const i = s % tr.len;
  const stepDur = 60 / tr.bpm / 4;
  if (tr.pad && tr.pad[i]) vPad(tr.pad[i], t0, stepDur * 16);
  if (tr.bass && tr.bass[i] != null) vNote('triangle', tr.bass[i], t0, stepDur * 3.2, 0.07, 900);
  if (tr.lead && tr.lead[i] != null) vNote('square', tr.lead[i], t0, stepDur * 2.6, 0.038, 1300);
  if (tr.hat && tr.hat[i]) vHat(t0);
  if (tr.snare && tr.snare[i]) vSnare(t0);
}

function seqTick() {
  if (!ctx || !musicGain) return;
  const want = desiredTrack();
  if (want !== curTrack && want !== pendingTrack) pendingTrack = want;
  if (nextT < ctx.currentTime - 0.3) nextT = ctx.currentTime + 0.03;
  const horizon = ctx.currentTime + 0.12;
  while (nextT < horizon) {
    // bascule à la prochaine barre avec courte fondu
    if (seqStep % 16 === 0 && pendingTrack != null) {
      const sw = Math.max(nextT, ctx.currentTime);
      musicGain.gain.cancelScheduledValues(ctx.currentTime);
      musicGain.gain.setTargetAtTime(0.0001, Math.max(sw - 0.07, ctx.currentTime), 0.03);
      musicGain.gain.setTargetAtTime(settings.music ? MUSIC_VOL : 0.0001, sw, 0.09);
      curTrack = pendingTrack;
      pendingTrack = null;
    }
    if (curTrack) scheduleStep(seqStep, nextT);
    const bpm = curTrack ? TRACKS[curTrack].bpm : 90;
    nextT += 60 / bpm / 4;
    seqStep++;
  }
}

// ---------------- tic-tac (fin de pioche / chrono) ----------------
// Bloc de bois : deux hauteurs alternées. ≤4 cartes Terreur → 1/s,
// ≤2 ou chrono ≤10 s → ~2/s. Muet hors partie ou après le résultat.
let tickTimer = null, tickHigh = false;

function tickSound(hi) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = hi ? 1500 : 980;
  const g = ctx.createGain();
  o.connect(g); g.connect(master);
  env(g, t, 0.002, 0.11, 0.05);
  o.start(t); o.stop(t + 0.08);
  const src = ctx.createBufferSource(); src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass';
  f.frequency.value = hi ? 3200 : 2200; f.Q.value = 5;
  const ng = ctx.createGain();
  src.connect(f); f.connect(ng); ng.connect(master);
  env(ng, t, 0.001, 0.08, 0.035);
  src.start(t); src.stop(t + 0.06);
}

function tickTock() {
  if (!ctx) return;
  let interval = 0;
  if (musicMode === 'game' && !tension.over) {
    const cl = tension.chronoLeft;
    if (cl != null && cl <= 10) interval = 500;
    else if (tension.deckLeft <= 2) interval = 500;
    else if (tension.deckLeft <= 4) interval = 1000;
  }
  if (interval) tickSound(tickHigh = !tickHigh);
  tickTimer = setTimeout(tickTock, interval || 500);
}
