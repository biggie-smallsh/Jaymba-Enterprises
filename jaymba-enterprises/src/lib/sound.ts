// Soft click sounds and relaxing background music, all made with the browser's
// Web Audio API (no audio files needed).
let ctx: AudioContext | null = null;
let noiseBuf: AudioBuffer | null = null;
let unlocked = false;
let enabled = true;   // click sounds and the guide's voice
let musicOn = true;   // background music
const FX_VOL = 1.8;     // loudness of click sounds (raise for louder, lower for softer)
const MUSIC_VOL = 0.75; // loudness of the background music
try {
  enabled = localStorage.getItem("jaymba-sound") !== "off";
  musicOn = localStorage.getItem("jaymba-music") !== "off";
} catch { /* ignore */ }

export const isSoundOn = () => enabled;
export const isMusicOn = () => musicOn;

export function setSound(on: boolean) {
  enabled = on;
  try { localStorage.setItem("jaymba-sound", on ? "on" : "off"); } catch { /* ignore */ }
}
export function setMusic(on: boolean) {
  musicOn = on;
  try { localStorage.setItem("jaymba-music", on ? "on" : "off"); } catch { /* ignore */ }
  if (on) { unlocked = true; startMusic(); } else stopMusic();
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

// Call on the visitor's first click or tap. Also starts the music.
export function unlock() { unlocked = true; audio(); if (musicOn) startMusic(); }

// Pause audio when the tab is hidden
document.addEventListener("visibilitychange", () => {
  if (fileAudio && running) { if (document.hidden) fileAudio.pause(); else void fileAudio.play().catch(() => {}); }
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

// Notes of a calm pentatonic scale (they match the background music)
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

// ===== Background music =====
// If you put a music file at public/music/background.mp3 the site plays it (looping, softly).
// If that file is missing, it plays a gentle tune made by code instead.
const MUSIC_FILE = "/music/background.mp3";
const FILE_VOL = 0.4;
let fileAudio: HTMLAudioElement | null = null;
let fileFailed = false;

const CHORDS = [
  [130.81, 164.81, 196.0, 246.94], // C major 7
  [110.0, 130.81, 164.81, 196.0],  // A minor 7
  [87.31, 110.0, 130.81, 164.81],  // F major 7
  [98.0, 123.47, 146.83, 164.81],  // G6
];
let bus: GainNode | null = null;
let running = false, chordIdx = 0, chordTimer = 0, melodyTimer = 0;

function ensureBus(c: AudioContext): GainNode {
  if (bus) return bus;
  const b = c.createGain(); b.gain.value = 0;
  const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200;
  const delay = c.createDelay(1.5); delay.delayTime.value = 0.42;
  const fb = c.createGain(); fb.gain.value = 0.38;
  const wet = c.createGain(); wet.gain.value = 0.45;
  b.connect(lp); lp.connect(c.destination);
  lp.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(c.destination);
  bus = b; return b;
}

function pad(c: AudioContext, b: GainNode, f: number) {
  const t = c.currentTime;
  for (const [type, mult, vol] of [["sine", 1, 0.035], ["triangle", 1.003, 0.015]] as [OscillatorType, number, number][]) {
    const o = c.createOscillator(); o.type = type; o.frequency.value = f * mult;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 2.5);
    g.gain.setValueAtTime(vol, t + 6.5);
    g.gain.linearRampToValueAtTime(0.0001, t + 9.5);
    o.connect(g).connect(b); o.start(t); o.stop(t + 9.6);
  }
}

function bell(c: AudioContext, b: GainNode, f: number) {
  const t = c.currentTime;
  note(c, "sine", f, f, t, 3, 0.06, b);
  note(c, "sine", f * 2, f * 2, t, 1.5, 0.015, b);
}

function startGenerated() {
  const c = audio(); if (!c) return;
  const b = ensureBus(c);
  b.gain.cancelScheduledValues(c.currentTime);
  b.gain.setValueAtTime(b.gain.value, c.currentTime);
  b.gain.linearRampToValueAtTime(MUSIC_VOL, c.currentTime + 3); // gentle fade in
  const nextChord = () => {
    if (!running || !ctx) return;
    CHORDS[chordIdx % CHORDS.length].forEach((f) => pad(ctx!, b, f));
    chordIdx++;
    chordTimer = window.setTimeout(nextChord, 8000);
  };
  const nextNote = () => {
    if (!running || !ctx) return;
    if (Math.random() < 0.75) bell(ctx, b, pick());
    melodyTimer = window.setTimeout(nextNote, 1400 + Math.random() * 2800);
  };
  nextChord();
  melodyTimer = window.setTimeout(nextNote, 2500);
}

function startMusic() {
  if (running || !musicOn) return;
  running = true;
  if (!fileFailed) {
    if (!fileAudio) {
      const a = new Audio(MUSIC_FILE);
      a.loop = true; a.volume = FILE_VOL; a.preload = "auto";
      // no file there (or unreadable): fall back to the tune made by code
      a.addEventListener("error", () => { fileFailed = true; fileAudio = null; if (running) startGenerated(); }, { once: true });
      fileAudio = a;
    }
    void fileAudio.play().catch(() => { /* blocked, or file missing (handled above) */ });
    return;
  }
  startGenerated();
}

function stopMusic() {
  running = false;
  window.clearTimeout(chordTimer); window.clearTimeout(melodyTimer);
  fileAudio?.pause();
  if (bus && ctx) {
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setValueAtTime(bus.gain.value, ctx.currentTime);
    bus.gain.linearRampToValueAtTime(0, ctx.currentTime + 1); // gentle fade out
  }
}
