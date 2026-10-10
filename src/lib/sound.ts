// Electric sounds made with the browser's Web Audio API (no audio files needed).
let ctx: AudioContext | null = null;
let noiseBuf: AudioBuffer | null = null;
let unlocked = false;
let enabled = true;
try { enabled = localStorage.getItem("jaymba-sound") !== "off"; } catch { /* ignore */ }

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

export function unlock() { unlocked = true; audio(); }

function noise(c: AudioContext): AudioBuffer {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

function tick(c: AudioContext, at: number, vol: number, len: number, freq: number) {
  const s = c.createBufferSource();
  s.buffer = noise(c);
  const hp = c.createBiquadFilter();
  hp.type = "highpass"; hp.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, at);
  g.gain.exponentialRampToValueAtTime(0.001, at + len);
  s.connect(hp).connect(g).connect(c.destination);
  s.start(at, Math.random() * 0.5); s.stop(at + len + 0.02);
}

// Sharp electric zap: used when something is clicked
export function zap(strength = 1) {
  if (!enabled) return;
  const c = audio(); if (!c) return;
  const t = c.currentTime;
  tick(c, t, 0.22 * strength, 0.18, 1800);
  tick(c, t + 0.05, 0.12 * strength, 0.1, 3000);
  const o = c.createOscillator();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(2200, t);
  o.frequency.exponentialRampToValueAtTime(180, t + 0.14);
  const g = c.createGain();
  g.gain.setValueAtTime(0.05 * strength, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + 0.18);
}

// Quiet crackle: plays when an arc jumps between bulbs
export function crackle() {
  if (!enabled) return;
  const c = audio(); if (!c) return;
  const t = c.currentTime;
  const n = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < n; i++) tick(c, t + Math.random() * 0.22, 0.04 + Math.random() * 0.04, 0.03 + Math.random() * 0.04, 2500);
}
