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
export function setThreat(t) { threat = t; }

function heartbeat() {
  if (!ctx) return;
  const interval = Math.max(450, 1500 - threat * 140); // ms
  const amp = Math.min(0.5, 0.1 + threat * 0.05);
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
  beat(t, amp); beat(t + interval * 0.32 / 1000, amp * 0.7);
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
