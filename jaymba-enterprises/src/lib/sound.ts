// Soft click sounds made with the browser's Web Audio API (no audio files needed).
let ctx: AudioContext | null = null;
let noiseBuf: AudioBuffer | null = null;
let unlocked = false;
let enabled = true;   // click sounds and the guide's voice
const FX_VOL = 1.2;     // loudness of click sounds (raise for louder, lower for softer)
try {
  enabled = localStorage.getItem("jaymba-sound") !== "off";
} catch { /* ignore */ }

export const isSoundOn = () => enabled;

export function setSound(on: boolean) {
  enabled = on;
  try { localStorage.setItem("jaymba-sound", on ? "on" : "off"); } catch { /* ignore */ }
}
function audio(): AudioContext | null {
  if (!unlocked) return null; // browsers only allow sound after a click or tap
  if (!ctx) {
    const C = window.AudioContext || (window as any).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// Call on the visitor's first click or tap (browsers only allow sound after that).
export function unlock() { unlocked = true; audio(); }

// Pause audio when the tab is hidden
document.addEventListener("visibilitychange", () => {
  if (!ctx) return;
  if (document.hidden) void ctx.suspend(); else if (unlocked) void ctx.resume();
});

function note(c: AudioContext, type: OscillatorType, f0: number, f1: number, at: number, dur: number, vol: number, dest: AudioNode = c.destination) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, at);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, at + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(vol, at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(dest);
  o.start(at); o.stop(at + dur + 0.05);
}

function softNoise(c: AudioContext, at: number, vol: number, len: number, freq: number) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = c.createBufferSource(); s.buffer = noiseBuf;
  const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(vol, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + len);
  s.connect(lp).connect(g).connect(c.destination);
  s.start(at, Math.random() * 0.5); s.stop(at + len + 0.02);
}

// Notes of a calm pentatonic scale
const PENT = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
const pick = () => PENT[Math.floor(Math.random() * PENT.length)];

const SOFT: ((c: AudioContext, t: number, s: number) => void)[] = [
  (c, t, s) => note(c, "sine", 620, 420, t, 0.1, 0.12 * s),                                           // soft pop
  (c, t, s) => { const f = pick(); note(c, "sine", f, f, t, 0.6, 0.1 * s); note(c, "sine", f * 2, f * 2, t, 0.35, 0.04 * s); }, // chime
  (c, t, s) => { note(c, "triangle", 330, 260, t, 0.14, 0.14 * s); softNoise(c, t, 0.05 * s, 0.05, 1500); }, // wooden tap
  (c, t, s) => { const f = pick(); note(c, "triangle", f, f, t, 0.4, 0.09 * s); note(c, "sine", f * 3, f * 3, t, 0.15, 0.03 * s); }, // marimba
  (c, t, s) => note(c, "sine", 380, 820, t, 0.14, 0.1 * s),                                           // bubble
  (c, t, s) => { note(c, "sine", 700, 700, t, 0.25, 0.08 * s); note(c, "sine", 990, 990, t + 0.07, 0.3, 0.06 * s); }, // two-note ding
];
let last = -1;

// Plays a random soft sound (never the same one twice in a row)
export function zap(strength = 1) {
  if (!enabled) return;
  const c = audio(); if (!c) return;
  let i = Math.floor(Math.random() * SOFT.length);
  if (i === last) i = (i + 1) % SOFT.length;
  last = i;
  SOFT[i](c, c.currentTime, strength * FX_VOL);
}

// The background crackle is switched off in the soft sound mode
export function crackle() { /* silent */ }
