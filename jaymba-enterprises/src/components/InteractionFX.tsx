import { useEffect, useState } from "react";
import { isMusicOn, isSoundOn, setMusic, setSound, unlock, zap } from "../lib/sound";

const SELECTOR = "a, button, select, [role='button'], .item-glow";

export default function InteractionFX() {
  const [on, setOn] = useState(isSoundOn());
  const [music, setMusicState] = useState(isMusicOn());

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function down(e: PointerEvent) {
      unlock(); // first click or tap also starts the background music
      const el = (e.target as Element | null)?.closest?.(SELECTOR) as HTMLElement | null;
      if (!el || el.dataset.nofx !== undefined) return;
      zap(1);
      if (reduce) return;
      el.classList.remove("zapped");
      void el.offsetWidth; // restart the animation
      el.classList.add("zapped");
      setTimeout(() => el.classList.remove("zapped"), 600);
      const ring = document.createElement("div");
      ring.className = "zap-ring";
      ring.style.left = e.clientX + "px";
      ring.style.top = e.clientY + "px";
      document.body.appendChild(ring);
      setTimeout(() => ring.remove(), 600);
    }
    window.addEventListener("pointerdown", down);
    return () => window.removeEventListener("pointerdown", down);
  }, []);

  function toggleSound() {
    const next = !on;
    setSound(next); setOn(next);
    if (next) { unlock(); zap(0.8); }
  }
  function toggleMusic() {
    const next = !music;
    setMusic(next); setMusicState(next);
  }

  const btn = "fixed bottom-4 z-50 h-11 w-11 rounded-full bg-ink text-xl text-white shadow-lg ring-1 ring-white/20 hover:ring-brand";
  return (
    <>
      <button data-nofx onClick={toggleMusic} aria-label={music ? "Turn music off" : "Turn music on"} title={music ? "Music on" : "Music off"} className={`${btn} right-[4.25rem]`}>
        🎵
        {!music && <span className="absolute left-1/2 top-1/2 h-0.5 w-7 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded bg-red-500" />}
      </button>
      <button data-nofx onClick={toggleSound} aria-label={on ? "Turn sound off" : "Turn sound on"} title={on ? "Click sounds on" : "Click sounds off"} className={`${btn} right-4`}>
        {on ? "🔊" : "🔇"}
      </button>
    </>
  );
}
