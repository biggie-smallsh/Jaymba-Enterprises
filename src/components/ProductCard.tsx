import { Product, Settings, digits, kes } from "../lib/types";

const ICONS: Record<string, string> = {
  "Wires & Cables": "🔌", Sockets: "🔲", Switches: "🎚️", "Bulbs & Lighting": "💡", Other: "🔧",
};

export default function ProductCard({ p, settings }: { p: Product; settings: Settings }) {
  const msg = encodeURIComponent(`Hello Jaymba Enterprises, I'd like to order: ${p.name} (${kes(p.price)})`);
  return (
    <div className="item-glow flex flex-col gap-1.5 rounded-xl border border-neutral-200 bg-white p-3">
      <div className="flex h-40 items-center justify-center overflow-hidden rounded-lg bg-paper text-5xl">
        {p.image_url ? <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover" /> : ICONS[p.category] ?? "🔧"}
      </div>
      <div className="text-xs text-neutral-500">{p.category}</div>
      <h3 className="font-semibold leading-snug">{p.name}</h3>
      <p className="flex-1 text-sm text-neutral-600">{p.description}</p>
      <div className="text-lg font-extrabold">{kes(p.price)}</div>
      <div className={`text-xs font-bold ${p.in_stock ? "text-green-700" : "text-red-700"}`}>
        {p.in_stock ? "In stock" : "Out of stock"}
      </div>
      {p.in_stock ? (
        <a className="btn text-center" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${digits(settings.phone)}?text=${msg}`}>
          Order on WhatsApp
        </a>
      ) : (
        <span className="btn-ghost text-center opacity-60">Unavailable</span>
      )}
    </div>
  );
}
