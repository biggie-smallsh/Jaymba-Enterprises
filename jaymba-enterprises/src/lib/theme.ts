import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

export function getTheme(): Theme {
  try { return localStorage.getItem("jaymba-theme") === "light" ? "light" : "dark"; } catch { return "dark"; }
}

export function applyTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  window.dispatchEvent(new Event("jaymba-theme"));
}

export function useTheme(): [Theme, () => void] {
  const [t, setT] = useState<Theme>(getTheme);
  useEffect(() => {
    applyTheme(t);
    try { localStorage.setItem("jaymba-theme", t); } catch { /* ignore */ }
  }, [t]);
  return [t, () => setT(t === "dark" ? "light" : "dark")];
}
