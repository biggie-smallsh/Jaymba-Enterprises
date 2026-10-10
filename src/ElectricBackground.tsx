import { useEffect, useRef } from "react";
import { crackle } from "../lib/sound";

type Pt = [number, number];
interface Bulb { x: number; len: number; r: number; phase: number; level: number; flickerUntil: number; nextFlicker: number; boost: number }
interface Bolt { pts: Pt[]; born: number; life: number; w: number; color: string }

// Jagged lightning path between two points (midpoint displacement)
function lightning(x1: number, y1: number, x2: number, y2: number, spread: number): Pt[] {
  let pts: Pt[] = [[x1, y1], [x2, y2]];
  let off = spread;
  for (let i = 0; i < 5; i++) {
    const next: Pt[] = [];
    for (let j = 0; j < pts.length - 1; j++) {
      const [ax, ay] = pts[j];
      const [bx, by] = pts[j + 1];
      const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1;
      const o = (Math.random() - 0.5) * off;
      next.push([ax, ay], [(ax + bx) / 2 - (dy / l) * o, (ay + by) / 2 + (dx / l) * o]);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
    off /= 2;
  }
  return pts;
}

export default function ElectricBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0, nextAmbient = 0;
    let bulbs: Bulb[] = [];
    let bolts: Bolt[] = [];
    let traces: { y: number; speed: number; off: number; len: number }[] = [];
    const mouse = { x: -999, y: -999, active: false, last: 0 };

    const pos = (b: Bulb, t: number): Pt => [b.x + Math.sin(t / 1200 + b.phase) * 5, b.len];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(3, Math.min(9, Math.round(w / 200)));
      const now = performance.now();
      bulbs = Array.from({ length: n }, (_, i) => ({
        x: ((i + 0.5) + (Math.random() - 0.5) * 0.5) * (w / n),
        len: 70 + Math.random() * h * 0.28,
        r: 9 + Math.random() * 5,
        phase: Math.random() * 6.28,
        level: 1, flickerUntil: 0, boost: 0,
        nextFlicker: now + 800 + Math.random() * 4000,
      }));
      traces = [0.22, 0.5, 0.74, 0.92].map((f) => ({ y: h * f, speed: 0.12 + Math.random() * 0.15, off: Math.random() * w, len: 140 + Math.random() * 120 }));
    }

    function spawn(a: Pt, b: Pt, color: string, life = 230, wd = 1.6) {
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      bolts.push({ pts: lightning(a[0], a[1], b[0], b[1], Math.max(30, d * 0.35)), born: performance.now(), life, w: wd, color });
    }

    function nearest(x: number, y: number, t: number, max: number): Bulb | null {
      let best: Bulb | null = null, bd = max;
      for (const b of bulbs) {
        const p = pos(b, t), d = Math.hypot(p[0] - x, p[1] - y);
        if (d < bd) { bd = d; best = b; }
      }
      return best;
    }

    function glow(x: number, y: number, r: number, c: string) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, c); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    function frame(t: number) {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      // current flowing along circuit traces
      for (const tr of traces) {
        ctx.strokeStyle = "rgba(90,160,255,0.07)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, tr.y); ctx.lineTo(w, tr.y); ctx.stroke();
        const x = ((t * tr.speed + tr.off) % (w + tr.len)) - tr.len;
        const g = ctx.createLinearGradient(x, 0, x + tr.len, 0);
        g.addColorStop(0, "rgba(120,190,255,0)"); g.addColorStop(1, "rgba(160,215,255,0.55)");
        ctx.strokeStyle = g; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, tr.y); ctx.lineTo(x + tr.len, tr.y); ctx.stroke();
      }

      // ambient arcs between bulbs
      if (!reduce && t > nextAmbient && bulbs.length > 1) {
        nextAmbient = t + 1200 + Math.random() * 2800;
        const a = bulbs[Math.floor(Math.random() * bulbs.length)];
        const b = bulbs[Math.floor(Math.random() * bulbs.length)];
        const pa = pos(a, t);
        if (a !== b && Math.random() < 0.7) { spawn(pa, pos(b, t), "130,190,255"); b.boost = 1; }
        else spawn(pa, [pa[0] + (Math.random() - 0.5) * 360, pa[1] + 80 + Math.random() * 200], "130,190,255");
        a.boost = 1;
        crackle();
      }

      // bulbs
      for (const b of bulbs) {
        if (!reduce) {
          if (t > b.nextFlicker) { b.flickerUntil = t + 250 + Math.random() * 600; b.nextFlicker = t + 2500 + Math.random() * 6000; }
          const flicker = t < b.flickerUntil;
          const base = flicker ? (Math.sin(t * 0.09 + b.phase) * Math.sin(t * 0.23) > 0 ? 1 : 0.12) : 0.8 + 0.08 * Math.sin(t / 300 + b.phase);
          b.boost *= 0.94;
          b.level = Math.min(1.3, base + b.boost * 0.5);
        } else b.level = 0.85;
        const [x, y] = pos(b, t);
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(b.x, 0); ctx.lineTo(x, y - b.r - 10); ctx.stroke();
        ctx.fillStyle = "#3a4048"; ctx.fillRect(x - 5, y - b.r - 10, 10, 10);
        ctx.fillStyle = `rgba(255,214,120,${0.12 + 0.75 * Math.min(1, b.level)})`;
        ctx.beginPath(); ctx.arc(x, y, b.r, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = `rgba(255,240,200,${0.3 + 0.5 * Math.min(1, b.level)})`;
        ctx.beginPath(); ctx.moveTo(x - 3, y + 2); ctx.lineTo(x, y - 3); ctx.lineTo(x + 3, y + 2); ctx.stroke();
        ctx.globalCompositeOperation = "lighter";
        glow(x, y, 70 + 110 * b.level, `rgba(255,190,70,${0.32 * b.level})`);
      }

      // lightning
      bolts = bolts.filter((b) => t - b.born < b.life);
      for (const b of bolts) {
        const a = (1 - (t - b.born) / b.life) * (Math.random() > 0.2 ? 1 : 0.4);
        ctx.lineJoin = "round";
        for (const [wd, col] of [[b.w * 5, `rgba(${b.color},${a * 0.2})`], [b.w, `rgba(255,255,255,${a})`]] as [number, string][]) {
          ctx.strokeStyle = col; ctx.lineWidth = wd;
          ctx.beginPath();
          b.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
          ctx.stroke();
        }
      }

      if (mouse.active) glow(mouse.x, mouse.y, 70, "rgba(120,190,255,0.16)");
      ctx.globalCompositeOperation = "source-over";
      if (!reduce) raf = requestAnimationFrame(frame);
    }

    function onMove(e: PointerEvent) {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
      const t = performance.now();
      if (reduce || t - mouse.last < 110) return;
      const b = nearest(mouse.x, mouse.y, t, 380);
      if (b) { mouse.last = t; spawn(pos(b, t), [mouse.x, mouse.y], "110,180,255", 200, 1.3); b.boost = 1; }
    }
    function onDown(e: PointerEvent) {
      if (reduce) return;
      const t = performance.now(), o: Pt = [e.clientX, e.clientY];
      for (let i = 0; i < 4; i++) {
        const ang = Math.random() * 6.28, d = 90 + Math.random() * 130;
        spawn(o, [o[0] + Math.cos(ang) * d, o[1] + Math.sin(ang) * d], "150,200,255", 260, 1.5);
      }
      const b = nearest(o[0], o[1], t, 500);
      if (b) b.boost = 1.4;
    }
    const onLeave = () => { mouse.active = false; };

    resize();
    window.addEventListener("resize", resize);
    if (reduce) { frame(performance.now()); }
    else {
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerdown", onDown);
      document.addEventListener("pointerleave", onLeave);
      raf = requestAnimationFrame(frame);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}
