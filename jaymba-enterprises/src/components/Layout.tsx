import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import ElectricBackground from "./ElectricBackground";
import { Logo } from "./Brand";
import ThemeSwitch from "./ThemeSwitch";
import { useCart } from "../lib/cart";
import { configured, supabase } from "../lib/supabase";
import { DEFAULT_SETTINGS, Settings } from "../lib/types";

export default function Layout() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const { count } = useCart();
  const { pathname } = useLocation();

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => {
    if (!configured) return;
    supabase.from("settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => { if (data) {
        const d = data as Settings; // empty fields fall back to the defaults
        setSettings({ ...DEFAULT_SETTINGS, ...d, phone: d.phone || DEFAULT_SETTINGS.phone, location: d.location || DEFAULT_SETTINGS.location, hours: d.hours || DEFAULT_SETTINGS.hours });
      } });
  }, []);

  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? "font-bold text-brand" : "hover:text-brand");

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-ink">
      <ElectricBackground />
      <header className="sticky top-0 z-20 bg-ink/70 text-white backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={34} />
            <span className="hidden text-base font-extrabold tracking-wide min-[420px]:inline sm:text-lg">JAYMBA <span className="text-brand">ENTERPRISES</span></span>
          </Link>
          <nav className="flex items-center gap-3 text-[13px] sm:gap-6 sm:text-sm">
            <NavLink to="/" end className={cls}>Home</NavLink>
            <NavLink to="/products" className={cls}>Products</NavLink>
            <NavLink to="/about" className={cls}>About</NavLink>
            <NavLink to="/cart" className={cls}>🛒 Cart{count > 0 && <span className="ml-1 rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-ink">{count}</span>}</NavLink>
            <ThemeSwitch />
          </nav>
        </div>
      </header>
      {settings.announcement && <div className="bg-brand px-4 py-2 text-center text-sm font-semibold">{settings.announcement}</div>}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4"><Outlet context={{ settings }} /></main>
      <footer className="mt-10 border-t border-white/10 bg-ink/80 py-5 text-center text-sm text-neutral-300">
        © {new Date().getFullYear()} Jaymba Enterprises. <Link to="/login" className="ml-2 underline opacity-70">Admin</Link>
      </footer>
    </div>
  );
}
