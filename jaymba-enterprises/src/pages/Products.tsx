import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useCart } from "../lib/cart";
import { configured, supabase } from "../lib/supabase";
import { SAMPLE_PRODUCTS } from "../data/sampleProducts";
import { matchesQuery } from "../lib/search";
import { CATEGORIES, Product, kes } from "../lib/types";

export default function Products() {
  const [params, setParams] = useSearchParams();
  const cat = params.get("cat") || "All";
  const { count, total } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!configured) { setLoading(false); return; }
    supabase.from("products").select("*").order("created_at", { ascending: false }).then(({ data, error }) => {
      if (error) setError(error.message); else setProducts((data ?? []) as Product[]);
      setLoading(false);
    });
  }, []);

  const source = configured && !error ? products : SAMPLE_PRODUCTS;
  const list = useMemo(
    () => source.filter((p) => (cat === "All" || p.category === cat) && matchesQuery(`${p.name} ${p.description} ${p.category}`, q)),
    [source, cat, q]
  );

  return (
    <div className="py-8">
      <h1 className="mb-1 text-3xl font-extrabold text-white">Our products</h1>
      <p className="mb-4 text-neutral-300">Choose your items and add them to your cart.</p>
      <input className="input mb-3 max-w-sm" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mb-4 flex flex-wrap gap-2">
        {["All", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setParams(c === "All" ? {} : { cat: c })} className={`rounded-full border px-3 py-1 text-sm ${cat === c ? "border-brand bg-brand font-bold" : "border-neutral-300 bg-white"}`}>{c}</button>
        ))}
      </div>
      {!configured && <p className="rounded-lg bg-yellow-100 p-3 text-sm">Demo mode: Supabase isn't connected yet, so you're seeing sample products. Add your keys to <code>.env</code> to use your own.</p>}
      {error && <p className="rounded-lg bg-red-100 p-3 text-sm">Could not load products ({error}). Showing sample products instead.</p>}
      {loading && configured && <p className="py-8 text-center text-neutral-400">Loading products...</p>}
      {!loading && !error && list.length === 0 && <p className="py-8 text-center text-neutral-400">No products found.</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
      {count > 0 && (
        <div className="sticky bottom-3 mt-6 flex items-center justify-between rounded-xl bg-ink/90 p-3 text-white ring-1 ring-brand backdrop-blur">
          <span className="text-sm">🛒 {count} item{count > 1 ? "s" : ""} · <b>{kes(total)}</b></span>
          <Link to="/cart" className="btn">View cart and pay</Link>
        </div>
      )}
    </div>
  );
}
