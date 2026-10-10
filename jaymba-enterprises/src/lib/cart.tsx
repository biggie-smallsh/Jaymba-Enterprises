import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "./types";

export interface CartItem { id: string; name: string; price: number; qty: number; image_url: string | null }
interface Ctx {
  items: CartItem[]; count: number; total: number;
  add: (p: Product, qty?: number, variant?: string) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}
const CartCtx = createContext<Ctx | null>(null);
const KEY = "jaymba-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]") as CartItem[]; } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ } }, [items]);

  const value = useMemo<Ctx>(() => ({
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    total: items.reduce((n, i) => n + i.qty * i.price, 0),
    add: (p, qty = 1, variant) => setItems((cur) => {
      const id = variant ? `${p.id}::${variant}` : p.id; // each colour is its own cart line
      const f = cur.find((i) => i.id === id);
      if (f) return cur.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i));
      return [...cur, { id, name: variant ? `${p.name} - ${variant}` : p.name, price: p.price, qty, image_url: p.image_url }];
    }),
    setQty: (id, qty) => setItems((cur) => (qty <= 0 ? cur.filter((i) => i.id !== id) : cur.map((i) => (i.id === id ? { ...i, qty } : i)))),
    remove: (id) => setItems((cur) => cur.filter((i) => i.id !== id)),
    clear: () => setItems([]),
  }), [items]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
