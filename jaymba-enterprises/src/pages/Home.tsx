import { Link } from "react-router-dom";
import { Logo } from "../components/Brand";
import { HERO_PHOTO } from "../lib/config";

export default function Home() {
  return (
    <section className="relative py-10 sm:py-14 md:min-h-[600px]">
      {HERO_PHOTO && (
        <div className="pointer-events-none absolute bottom-0 right-0 h-[88%] opacity-20 md:right-4 md:opacity-90">
          <img src={HERO_PHOTO} alt="" className="h-full w-auto rounded-2xl object-cover" />
        </div>
      )}

      <div className="relative z-10 max-w-xl">
        <Logo size={120} />
        <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-wide text-white sm:text-5xl">
          JAYMBA <span className="text-brand">ENTERPRISES</span>
        </h1>
        <div className="mt-1 text-lg text-neutral-300">Electrical &amp; solar supplies shop</div>

        <p className="mt-5 text-neutral-200">
          Welcome to Jaymba Enterprises. We sell everything you need to power your home, shop or project: light bulbs and LED lighting,
          sockets, switches, wires and cables, pipes, solar panels and solar accessories, and many other electrical items. Whether you
          are wiring a new house, repairing a shop or going solar, you will find quality products at fair prices. Order online and pay
          with M-Pesa, or visit us in the shop.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Link to="/products" className="item-glow rounded-xl border border-neutral-200 bg-white p-4">
            <div className="text-2xl">🛒</div>
            <div className="font-extrabold">Our products</div>
            <div className="text-sm text-neutral-600">Browse, add to cart and pay.</div>
          </Link>
          <Link to="/about" className="item-glow rounded-xl border border-neutral-200 bg-white p-4">
            <div className="text-2xl">ℹ️</div>
            <div className="font-extrabold">About us</div>
            <div className="text-sm text-neutral-600">Location, payment, hours and contacts.</div>
          </Link>
        </div>

        <p className="mt-6 text-sm text-neutral-400">Need a hand? Tap <b className="text-brand">💬 Need help?</b> at the bottom-left and a guide will pop up.</p>
      </div>
    </section>
  );
}
