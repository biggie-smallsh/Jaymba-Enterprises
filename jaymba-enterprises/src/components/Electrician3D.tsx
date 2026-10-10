import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PersonWithCable } from "./Brand";
import { isSoundOn } from "../lib/sound";

// ===== Guide choice (man or woman), remembered on the customer's device =====
export type Guide = "male" | "female";
const KEY = "jaymba-guide";
export function getGuide(): Guide {
  try { return localStorage.getItem(KEY) === "female" ? "female" : "male"; } catch { return "male"; }
}
export function setGuide(g: Guide) {
  try { localStorage.setItem(KEY, g); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent("jaymba-guide", { detail: g }));
}
function useGuide(): Guide {
  const [g, setG] = useState<Guide>(getGuide);
  useEffect(() => {
    const h = (e: Event) => setG((e as CustomEvent<Guide>).detail);
    window.addEventListener("jaymba-guide", h);
    return () => window.removeEventListener("jaymba-guide", h);
  }, []);
  return g;
}

export function GuidePicker({ compact = false }: { compact?: boolean }) {
  const g = useGuide();
  const cls = (on: boolean) => `rounded-full border px-3 py-1 text-sm ${on ? "border-brand bg-brand font-bold text-ink" : "border-neutral-300 bg-white text-ink"}`;
  return (
    <div className={`${compact ? "mt-1" : "mt-6"} flex flex-wrap items-center gap-2 text-sm text-neutral-300`}>
      <span>Choose your guide:</span>
      <button className={cls(g === "male")} onClick={() => setGuide("male")}>👨 Man</button>
      <button className={cls(g === "female")} onClick={() => setGuide("female")}>👩 Woman</button>
    </div>
  );
}

// What the guide says. Edit or add your own lines.
const LINES = [
  "Welcome to Jaymba Enterprises!",
  "Need cables? We have them in all sizes.",
  "Switches, sockets and bulbs, all in stock.",
  "Thinking about solar? Ask us about solar panels.",
  "We also sell pipes and fittings.",
  "Pay easily with M-Pesa.",
  "Safety first. Always switch off the power before you fix anything.",
  "Add your items to the cart and get your receipt instantly.",
  "Quality electricals at fair prices.",
  "Click me for more tips!",
];
const NAME: Record<Guide, string> = { male: "Juma", female: "Amani" };

export default function Electrician3D({ panel = false }: { panel?: boolean }) {
  const guide = useGuide();
  const guideRef = useRef(guide);
  guideRef.current = guide;
  const mount = useRef<HTMLDivElement>(null);
  const speakUntil = useRef(0);
  const speakRef = useRef<(line?: string) => void>(() => {});
  const interacted = useRef(false);
  const firstGuide = useRef(true);
  const [bubble, setBubble] = useState("");
  const [fallback, setFallback] = useState(false);

  // Random speech and speech bubble
  useEffect(() => {
    let timer = 0, hide = 0, last = -1;
    const mark = () => { interacted.current = true; };
    window.addEventListener("pointerdown", mark);
    window.addEventListener("keydown", mark);

    function speak(forced?: string) {
      let i = Math.floor(Math.random() * LINES.length);
      if (i === last) i = (i + 1) % LINES.length;
      last = i;
      const line = forced ?? LINES[i];
      setBubble(line);
      const est = Math.max(2600, line.length * 75);
      speakUntil.current = performance.now() + est;
      window.clearTimeout(hide);
      hide = window.setTimeout(() => setBubble(""), est + 500);
      if (interacted.current && isSoundOn() && "speechSynthesis" in window) {
        try {
          const female = guideRef.current === "female";
          const u = new SpeechSynthesisUtterance(line);
          const voices = window.speechSynthesis.getVoices().filter((x) => x.lang.toLowerCase().startsWith("en"));
          const fRe = /female|zira|hazel|susan|samantha|karen|moira|tessa|victoria|fiona|jenny|aria|google us english/i;
          const mRe = /\bmale\b|david|mark|daniel|george|james|richard|guy/i;
          const v = voices.find((x) => (female ? fRe : mRe).test(x.name)) || voices.find((x) => /^en[-_](KE|GB|ZA|IN)/i.test(x.lang)) || voices[0];
          if (v) u.voice = v;
          u.pitch = female ? 1.2 : 0.8; u.rate = 1; u.volume = 0.9;
          u.onend = () => { speakUntil.current = performance.now() + 100; };
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        } catch { /* speech not available */ }
      }
    }
    speakRef.current = speak;
    const say = (e: Event) => speak((e as CustomEvent<string>).detail);
    window.addEventListener("jaymba-say", say);

    const schedule = () => {
      timer = window.setTimeout(() => { if (!document.hidden) speak(); schedule(); }, 7000 + Math.random() * 9000);
    };
    timer = window.setTimeout(() => { speak(panel ? `Hi, I'm ${NAME[guideRef.current]}, your Jaymba guide. How can I help?` : undefined); schedule(); }, panel ? 500 : 2500);

    return () => {
      window.clearTimeout(timer); window.clearTimeout(hide);
      window.removeEventListener("pointerdown", mark);
      window.removeEventListener("keydown", mark);
      window.removeEventListener("jaymba-say", say);
      try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    };
  }, []);

  // Greet when the customer switches guide
  useEffect(() => {
    if (firstGuide.current) { firstGuide.current = false; return; }
    speakRef.current(`Hi, I'm ${NAME[guide]}, your Jaymba guide. How can I help?`);
  }, [guide]);

  // 3D scene (rebuilt when the guide changes)
  useEffect(() => {
    const el = mount.current!;
    const female = guide === "female";
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { setFallback(true); return; }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = "block h-full w-full";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 0.75, 0.1, 50);
    camera.position.set(0, 1.7, 6.2);
    camera.lookAt(0, 1.55, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const key = new THREE.DirectionalLight(0xfff0d0, 1.6); key.position.set(3, 4, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0x6fb0ff, 1.1); rim.position.set(-4, 3, -3); scene.add(rim);

    const JACKET = female ? 0x5d6b3b : 0x2f363e, PANTS = female ? 0x3f5f86 : 0x242a31, AMBER = 0xf5a300, SKIN = female ? 0xb27a54 : 0xb9774f, HAIR = female ? 0x2a1a12 : 0x1f130d;
    let curls: THREE.Group | null = null;
    const mat = (c: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, metalness: 0.05, ...extra });
    const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
      const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
    };

    const man = new THREE.Group(); man.scale.setScalar(female ? 0.95 : 1); scene.add(man);
    const shadow = add(man, new THREE.CircleGeometry(0.95, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }), 0, 0.002, 0.2);
    shadow.rotation.x = -Math.PI / 2;

    // legs and shoes
    const lx = female ? 0.13 : 0.15;
    for (const x of [-lx, lx]) {
      add(man, new THREE.CapsuleGeometry(female ? 0.11 : 0.125, 0.62, 4, 14), mat(PANTS), x, 0.53, 0);
      const shoe = add(man, new THREE.CapsuleGeometry(0.08, 0.2, 4, 10), mat(female ? 0xeeeeee : 0x15181b), x, 0.07, 0.07);
      shoe.rotation.x = Math.PI / 2;
    }
    // pelvis
    const pelvis = add(man, new THREE.CylinderGeometry(female ? 0.31 : 0.29, female ? 0.34 : 0.3, 0.26, 28), mat(PANTS), 0, 1.02, 0);
    pelvis.scale.z = 0.66;

    // torso (smooth lathe shape) with hi-vis bands
    const torso = new THREE.Group(); torso.position.set(0, 1.5, 0); man.add(torso);
    const prof: [number, number][] = female
      ? [[0.33, -0.45], [0.29, -0.25], [0.25, -0.05], [0.29, 0.15], [0.31, 0.3], [0.3, 0.38], [0.22, 0.45]]
      : [[0.3, -0.45], [0.33, -0.3], [0.36, 0], [0.41, 0.25], [0.43, 0.38], [0.34, 0.45]];
    const rAt = (y: number) => {
      for (let i = 0; i < prof.length - 1; i++) {
        const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
        if (y >= y0 && y <= y1) return r0 + (r1 - r0) * ((y - y0) / (y1 - y0));
      }
      return prof[prof.length - 1][0];
    };
    const lathe = (pts: [number, number][], m: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 36), m);
      mesh.scale.z = 0.62; torso.add(mesh);
    };
    if (female) {
      lathe(prof.map(([r, y]) => [r * 0.985, y] as [number, number]), mat(0xf4f4f0, { side: THREE.DoubleSide })); // white top
      const card = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r * 1.035, y)), 36, 0.42, Math.PI * 2 - 0.84), mat(JACKET, { side: THREE.DoubleSide })); // open cardigan
      card.scale.z = 0.62; torso.add(card);
    } else lathe(prof, mat(JACKET, { side: THREE.DoubleSide }));
    if (!female) for (const [y0, y1] of [[-0.12, -0.03], [0.1, 0.19]]) {
      lathe([0, 1, 2, 3, 4].map((k) => { const y = y0 + ((y1 - y0) * k) / 4; return [rAt(y) * 1.025, y] as [number, number]; }), mat(AMBER, { emissive: 0x442b00, side: THREE.DoubleSide }));
    }
    add(man, new THREE.CylinderGeometry(0.075, 0.09, 0.2, 16), mat(SKIN), 0, 2.02, 0);

    // head
    const head = new THREE.Group(); head.position.set(0, 2.3, 0); man.add(head);
    add(head, new THREE.SphereGeometry(0.3, 32, 24), mat(SKIN)).scale.y = 1.1;
    for (const x of [-1, 1]) {
      add(head, new THREE.SphereGeometry(0.05, 12, 12), mat(0xa86a44), x * 0.3, 0, 0).scale.set(0.5, 1, 0.8);
    }
    const eyes = new THREE.Group(); head.add(eyes);
    for (const x of [-0.105, 0.105]) {
      add(eyes, new THREE.SphereGeometry(0.048, 14, 14), mat(0xffffff, { roughness: 0.3 }), x, 0.04, 0.262).scale.set(1, 0.85, 0.6);
      add(eyes, new THREE.SphereGeometry(0.026, 12, 12), mat(female ? 0x5a3a1c : 0x2a1a12), x, 0.04, 0.285);
      const brow = add(head, new THREE.BoxGeometry(female ? 0.095 : 0.115, female ? 0.014 : 0.026, 0.02), mat(HAIR), x, female ? 0.125 : 0.115, 0.27);
      brow.rotation.z = (x < 0 ? 1 : -1) * (female ? 0.18 : 0.08);
      if (female) add(head, new THREE.BoxGeometry(0.085, 0.012, 0.012), mat(0x000000), x, 0.082, 0.275);
    }
    add(head, new THREE.SphereGeometry(0.04, 12, 12), mat(0xa86a44), 0, -0.03, 0.29).scale.set(0.9, 1.1, 0.9);
    const mouth = add(head, new THREE.SphereGeometry(0.06, 14, 10), mat(female ? 0xb5403a : 0x6a2a24), 0, -0.13, 0.265);
    mouth.scale.set(female ? 1.5 : 1.4, 0.3, 0.5);
    if (female) {
      let fs = 11; const fr = () => { fs = (fs * 16807) % 2147483647; return fs / 2147483647; };
      const fm = mat(0x8b5232);
      for (let i = 0; i < 20; i++) { // freckles
        const x = (fr() * 2 - 1) * 0.15, y = -0.08 + fr() * 0.13;
        if (Math.abs(x) < 0.045) continue;
        const q = 1 - (x / 0.3) ** 2 - (y / 0.33) ** 2; if (q <= 0) continue;
        add(head, new THREE.SphereGeometry(0.008, 6, 6), fm, x, y, 0.3 * Math.sqrt(q) + 0.002);
      }
      const gold = mat(0xe6b800, { metalness: 0.8, roughness: 0.3 });
      for (const x of [-1, 1]) add(head, new THREE.TorusGeometry(0.05, 0.007, 8, 24), gold, x * 0.315, -0.1, 0.03); // hoop earrings
      add(man, new THREE.TorusGeometry(0.14, 0.008, 8, 32), gold, 0, 1.97, 0.01).rotation.x = Math.PI / 2; // necklace
      add(man, new THREE.SphereGeometry(0.025, 10, 10), gold, 0, 1.8, 0.2); // pendant
    }
    // hair under the hard hat
    const back = add(head, new THREE.SphereGeometry(0.31, 24, 18), mat(HAIR), 0, 0.03, -0.05); back.scale.set(1, 1.05, 0.88);
    const tail = new THREE.Group(); tail.position.set(0, 0.02, -0.33); head.add(tail);
    if (female) { // voluminous curly hair
      let seed = 7;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const cg = new THREE.SphereGeometry(1, 10, 8);
      const cm = [0x2a1a12, 0x4a2e1a, 0x7a4e24].map((c) => mat(c, { roughness: 0.9 }));
      const cg2 = new THREE.Group(); head.add(cg2); curls = cg2;
      for (let i = 0; i < 120; i++) {
        const u = rnd() * 2 - 1, an = rnd() * Math.PI * 2, rr = Math.sqrt(1 - u * u);
        const pt = new THREE.Vector3(rr * Math.cos(an) * 0.4, u * 0.5 - 0.03, rr * Math.sin(an) * 0.38 - 0.04);
        if (pt.z > 0.08 && Math.abs(pt.x) < 0.27 && pt.y < 0.2) continue;
        const c = new THREE.Mesh(cg, cm[Math.floor(rnd() * 3)]);
        c.scale.setScalar(0.065 + rnd() * 0.05); c.position.copy(pt); cg2.add(c);
      }
    }
    // hard hat (men only)
    if (!female) {
    add(head, new THREE.SphereGeometry(0.34, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat(AMBER, { roughness: 0.35 }), 0, 0.17, 0);
    add(head, new THREE.CylinderGeometry(0.39, 0.39, 0.03, 32), mat(0xd98f00), 0, 0.17, 0.03);
    add(head, new THREE.BoxGeometry(0.07, 0.05, 0.42), mat(0xd98f00), 0, 0.52, 0);
    }

    // arms: shoulder -> elbow -> hand
    const sx = female ? 0.37 : 0.47;
    function makeArm(side: number) {
      const upper = new THREE.Group(); upper.position.set(side * sx, 1.85, 0); man.add(upper);
      add(upper, new THREE.SphereGeometry(0.105, 16, 16), mat(JACKET));
      add(upper, new THREE.CapsuleGeometry(female ? 0.075 : 0.085, 0.34, 4, 12), mat(JACKET), 0, -0.27, 0);
      const fore = new THREE.Group(); fore.position.set(0, -0.54, 0); upper.add(fore);
      add(fore, new THREE.SphereGeometry(0.078, 12, 12), mat(SKIN));
      add(fore, new THREE.CapsuleGeometry(0.065, 0.26, 4, 12), mat(female ? JACKET : SKIN), 0, -0.24, 0);
      const hand = new THREE.Group(); hand.position.set(0, -0.52, 0); fore.add(hand);
      add(hand, new THREE.SphereGeometry(0.075, 14, 14), mat(SKIN));
      add(hand, new THREE.SphereGeometry(0.03, 8, 8), mat(SKIN), side * -0.06, 0.02, 0.04);
      return { upper, fore, hand };
    }
    const L = makeArm(-1), R = makeArm(1);
    R.upper.rotation.x = -0.35; R.fore.rotation.x = -1.1;

    // coil in the right hand + cable down to a plug that sparks
    man.updateMatrixWorld(true);
    const hp = new THREE.Vector3(); R.hand.getWorldPosition(hp); man.worldToLocal(hp);
    for (let i = 0; i < 3; i++) add(man, new THREE.TorusGeometry(0.19 - i * 0.015, 0.04, 10, 28), mat(AMBER, { roughness: 0.4 }), hp.x, hp.y - 0.1, hp.z - 0.05 + i * 0.05);
    const end = new THREE.Vector3(0.45, 0.05, 1.15);
    const curve = new THREE.CatmullRomCurve3([hp.clone().add(new THREE.Vector3(0, -0.12, 0.05)), new THREE.Vector3(hp.x + 0.3, hp.y - 0.5, hp.z + 0.2), new THREE.Vector3(0.8, 0.35, 1.05), end]);
    add(man, new THREE.TubeGeometry(curve, 28, 0.028, 8), mat(AMBER, { roughness: 0.4 }));
    add(man, new THREE.BoxGeometry(0.16, 0.1, 0.16), mat(0xd9dde1), 0.45, 0.06, 1.2);
    for (const dx of [-0.035, 0.035]) add(man, new THREE.BoxGeometry(0.02, 0.02, 0.1), mat(0xbfc5ca, { metalness: 0.8 }), 0.45 + dx, 0.06, 1.32);
    const spark = add(man, new THREE.SphereGeometry(0.05, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffe27a }), 0.45, 0.07, 1.4);
    const sparkLight = new THREE.PointLight(0xffc040, 2, 3); sparkLight.position.set(0.45, 0.2, 1.5); man.add(sparkLight);

    function resize() {
      const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(el);

    const mouse = { x: 0, y: 0 }; let tx = 0, ty = 0, nextBlink = 2000, blinkEnd = 0;
    const onMove = (e: PointerEvent) => { mouse.x = (e.clientX / window.innerWidth) * 2 - 1; mouse.y = (e.clientY / window.innerHeight) * 2 - 1; };
    if (!reduce) window.addEventListener("pointermove", onMove);

    let raf = 0;
    function loop(t: number) {
      raf = requestAnimationFrame(loop);
      const s = t / 1000, speaking = t < speakUntil.current;
      tx += (mouse.x - tx) * 0.05; ty += (mouse.y - ty) * 0.05;
      man.rotation.y = tx * 0.35 + Math.sin(s * 0.5) * 0.12;
      head.rotation.y = tx * 0.5;
      head.rotation.x = ty * 0.25 + (speaking ? Math.sin(s * 9) * 0.04 : 0);
      torso.scale.y = 1 + Math.sin(s * 1.6) * 0.012;
      if (curls) curls.rotation.z = Math.sin(s * 1.3) * 0.02 + (speaking ? Math.sin(s * 9) * 0.012 : 0);
      tail.rotation.x = Math.sin(s * 2) * 0.08 + (speaking ? Math.sin(s * 9) * 0.06 : 0);
      mouth.scale.y = speaking ? 0.3 + Math.abs(Math.sin(s * 16)) * 1.2 : 0.3;
      if (t > nextBlink) { blinkEnd = t + 130; nextBlink = t + 2500 + Math.random() * 3500; }
      eyes.scale.y = t < blinkEnd ? 0.1 : 1;
      // left arm waves while speaking
      const up = speaking ? -(2.2 + Math.sin(s * 3) * 0.1) : -0.1 + Math.sin(s * 1.2) * 0.03;
      const el2 = speaking ? -0.3 + Math.sin(s * 10) * 0.6 : -0.05;
      L.upper.rotation.z += (up - L.upper.rotation.z) * 0.12;
      L.fore.rotation.z += (el2 - L.fore.rotation.z) * 0.2;
      L.fore.rotation.x = -0.12;
      const f = Math.random() > 0.55 ? 1 : 0.15;
      spark.scale.setScalar(0.4 + f * 1.2); sparkLight.intensity = f * 2.2;
      renderer.render(scene, camera);
    }
    if (reduce) renderer.render(scene, camera); else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) { m.geometry.dispose(); const mm = m.material; if (Array.isArray(mm)) mm.forEach((x) => x.dispose()); else mm.dispose(); }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, [guide]);

  return (
    <div className={panel ? "relative h-full w-full" : "absolute bottom-0 right-0 z-0 h-[88%] w-[min(360px,80vw)] md:right-4"}>
      {bubble && (
        <div className={panel
          ? "absolute inset-x-2 bottom-2 z-10 rounded-2xl bg-white p-2.5 text-sm font-medium text-ink shadow-lg"
          : "absolute left-0 top-2 z-10 hidden max-w-[230px] rounded-2xl bg-white p-3 text-sm font-medium text-ink shadow-lg md:block"}>
          {bubble}
          {!panel && <span className="absolute -bottom-1.5 left-10 h-3 w-3 rotate-45 bg-white" />}
        </div>
      )}
      {fallback ? (
        <div className="h-full opacity-95"><PersonWithCable /></div>
      ) : (
        <div ref={mount} onClick={() => speakRef.current()} title="Click me!" className={`h-full w-full cursor-pointer ${panel ? "" : "opacity-30 md:opacity-100"}`} />
      )}
    </div>
  );
}
