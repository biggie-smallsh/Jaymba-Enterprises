import { useTheme } from "../lib/theme";

// A 3D wall light switch: flip it to turn the site lights on (light mode) or off (dark mode).
export default function ThemeSwitch() {
  const [theme, toggle] = useTheme();
  const light = theme === "light";
  return (
    <button
      role="switch"
      aria-checked={light}
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      title={light ? "Lights on. Flip for dark" : "Lights off. Flip for light"}
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-md p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <span className="text-sm leading-none" aria-hidden="true">{light ? "☀️" : "🌙"}</span>
      <span
        style={{ perspective: 140 }}
        className="relative block h-[46px] w-8 rounded-md bg-gradient-to-b from-neutral-200 to-neutral-400 p-[5px] shadow-[inset_0_1px_1px_rgba(255,255,255,.8),0_2px_6px_rgba(0,0,0,.45)]"
      >
        <i className="absolute left-1/2 top-[1.5px] h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-neutral-500" />
        <i className="absolute bottom-[1.5px] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-neutral-500" />
        <span
          className="block h-full w-full rounded-[4px]"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${light ? -28 : 28}deg)`,
            transition: "transform .22s cubic-bezier(.3,1.7,.5,1), background .22s, box-shadow .22s",
            background: light ? "linear-gradient(#aeb4ba,#ffffff)" : "linear-gradient(#ffffff,#8d949b)",
            boxShadow: light ? "0 3px 4px rgba(0,0,0,.35)" : "0 -3px 4px rgba(0,0,0,.35)",
          }}
        />
      </span>
    </button>
  );
}
