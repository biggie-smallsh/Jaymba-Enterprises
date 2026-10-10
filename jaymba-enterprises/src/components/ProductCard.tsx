import { useState } from "react";
import { Product, kes } from "../lib/types";
import { useCart } from "../lib/cart";
import { CABLE_COLOURS, hasColours } from "../lib/variants";

const ICONS: Record<string, string> = {
  "Wires & Cables": "🔌", Sockets: "🔲", Switches: "🎚️", "Bulbs & Lighting": "💡", Pipes: "🔩", "Solar Panels": "☀️", Other: "🔧",
};
const clamp = (n: number, min = 0) => Math.max(min, Math.min(999, n));

export default function ProductCard({ p }: { p: Product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const [qtyText, setQtyText] = useState("1");                       // normal products
  const [byColour, setByColour] = useState<Record<string, number>>({}); // single core cables
  const needColour = hasColours(p);

  const qty = clamp(parseInt(qtyText) || 1, 1);
  const step = (d: number) => setQtyText(String(clamp(qty + d, 1)));
  const colourCount = CABLE_COLOURS.reduce((n, c) => n + (byColour[c.label] || 0), 0);
  const count = needColour ? colourCount : qty;
  const blocked = needColour && colourCount === 0;
  const setColourQty = (label: string, n: number) => setByColour((cur) => ({ ...cur, [label]: clamp(n) }));

  function addToCart() {
    if (blocked) return;
    if (needColour) {
      CABLE_COLOURS.forEach((c) => { const q = byColour[c.label] || 0; if (q > 0) add(p, q, c.label); });
      setByColour({});
    } else {
      add(p, qty); setQtyText("1");
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div className="item-glow flex flex-col gap-1.5 rounded-xl border border-neutral-200 bg-white p-3">
      <div className="flex h-40 items-center justify-center overflow-hidden rounded-lg bg-paper text-5xl">
        {p.image_url ? <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover" /> : ICONS[p.category] ?? "🔧"}
      </div>
      <div className="text-xs text-neutral-500">{p.category}</div>
      <h3 className="font-semibold leading-snug">{p.name}</h3>
      <p className="flex-1 text-sm text-neutral-600">{p.description}</p>
      <div className="text-lg font-extrabold">{kes(p.price)}</div>
      <div className={`text-xs font-bold ${p.in_stock ? "text-green-700" : "text-red-700"}`}>{p.in_stock ? "In stock" : "Out of stock"}</div>

      {!p.in_stock ? (
        <span className="btn-ghost text-center opacity-60">Unavailable</span>
      ) : needColour ? (
        <>
          <div className="text-xs text-neutral-500">How many of each colour?</div>
          <div className="rounded-lg bg-paper p-1.5">
            {CABLE_COLOURS.map((c) => (
              <div key={c.label} className="flex items-center gap-2 py-1">
                <span className="h-4 w-4 shrink-0 rounded-full border border-neutral-300" style={{ background: c.hex }} />
                <span className="flex-1 text-sm">{c.label}</span>
                <button className="btn-ghost !px-2.5 !py-1" onClick={() => setColourQty(c.label, (byColour[c.label] || 0) - 1)} aria-label={`Less ${c.label}`}>−</button>
                <input
                  type="number" min={0} max={999} inputMode="numeric" aria-label={`${c.label} quantity`}
                  className="input !w-14 !px-1 !py-1 text-center font-bold"
                  value={byColour[c.label] || 0} onChange={(e) => setColourQty(c.label, parseInt(e.target.value) || 0)}
                />
                <button className="btn-ghost !px-2.5 !py-1" onClick={() => setColourQty(c.label, (byColour[c.label] || 0) + 1)} aria-label={`More ${c.label}`}>+</button>
              </div>
            ))}
          </div>
          {colourCount > 0 && <div className="text-xs text-neutral-600">{colourCount} × {kes(p.price)} = <b>{kes(p.price * colourCount)}</b></div>}
          <button className="btn w-full" onClick={addToCart} disabled={blocked}>{blocked ? "Choose how many" : added ? "Added ✓" : "Add to cart"}</button>
        </>
      ) : (
        <>
          <div className="text-xs text-neutral-500">How many do you need?</div>
          <div className="flex items-center gap-2 rounded-lg bg-paper p-1.5">
            <button className="btn-ghost !px-3" onClick={() => step(-1)} aria-label="Less">−</button>
            <input
              type="number" min={1} max={999} inputMode="numeric" aria-label="Quantity"
              className="input !w-16 !px-1 text-center font-bold"
              value={qtyText} onChange={(e) => setQtyText(e.target.value)} onBlur={() => setQtyText(String(qty))}
            />
            <button className="btn-ghost !px-3" onClick={() => step(1)} aria-label="More">+</button>
            <button className="btn ml-auto" onClick={addToCart}>{added ? "Added ✓" : "Add to cart"}</button>
          </div>
          {count > 1 && <div className="text-xs text-neutral-600">{count} × {kes(p.price)} = <b>{kes(p.price * count)}</b></div>}
        </>
      )}
    </div>
  );
}
