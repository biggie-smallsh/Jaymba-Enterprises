import { useEffect, useState } from "react";
import { isSoundOn, setSound, unlock, zap } from "../lib/sound";

const SELECTOR = "a, button, select, [role='button'], .item-glow";

export default function InteractionFX() {
  const [on, setOn] = useState(isSoundOn());

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function down(e: PointerEvent) {
      unlock();
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

  function toggle() {
    const next = !on;
    setSound(next); setOn(next);
    if (next) { unlock(); zap(0.8); }
  }

  return (
    <button
      data-nofx
      onClick={toggle}
      aria-label={on ? "Turn sound off" : "Turn sound on"}
      title={on ? "Sound on" : "Sound off"}
      className="fixed bottom-4 right-4 z-50 h-11 w-11 rounded-full bg-ink text-xl text-white shadow-lg ring-1 ring-white/20 hover:ring-brand"
    >
      {on ? "🔊" : "🔇"}
    </button>
  );
}
