import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { BUCKET, supabase } from "../lib/supabase";
import { CATEGORIES, DEFAULT_SETTINGS, Product, Settings, kes } from "../lib/types";

interface Form { id?: string; name: string; category: string; price: string; description: string; in_stock: boolean; image_url: string | null }
interface Order { id: string; receipt_no: string; customer_name: string; phone: string; items: { name: string; qty: number }[]; total: number; mpesa_code: string; status: string; created_at: string; delivery_method?: string; delivery_address?: string; notes?: string }
const EMPTY: Form = { name: "", category: CATEGORIES[0], price: "", description: "", in_stock: true, image_url: null };

export default function Admin() {
  const nav = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [form, setForm] = useState<Form>(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const { data: a } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (!a || a.currentLevel !== "aal2") { nav("/login"); return; } // the 6-digit code is required
      }
      setSession(data.session); setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (ready && !session) nav("/login"); }, [ready, session, nav]);
  useEffect(() => { if (session) load(); }, [session]);
  useEffect(() => { // live alert when a new order arrives while this page is open
    if (!session) return;
    const ch = supabase.channel("orders-admin")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, () => { load(); note("New order received! Check the Orders list."); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [session]);

  async function load() {
    const [p, s] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    if (p.error) setMsg("Could not load products: " + p.error.message);
    else setProducts((p.data ?? []) as Product[]);
    if (s.data) setSettings(s.data as Settings);
    const o = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (!o.error) setOrders((o.data ?? []) as Order[]);
  }

  const note = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  async function saveProduct() {
    const price = parseFloat(form.price);
    if (!form.name.trim() || isNaN(price)) return note("Enter a product name and a price.");
    setBusy(true);
    let image_url = form.image_url;
    if (file) {
      const path = `${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const up = await supabase.storage.from(BUCKET).upload(path, file);
      if (up.error) { setBusy(false); return note("Image upload failed: " + up.error.message); }
      image_url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }
    const row = { name: form.name.trim(), category: form.category, price, description: form.description.trim(), in_stock: form.in_stock, image_url };
    const res = form.id ? await supabase.from("products").update(row).eq("id", form.id) : await supabase.from("products").insert(row);
    setBusy(false);
    if (res.error) return note("Could not save: " + res.error.message);
    setForm(EMPTY); setFile(null);
    note(form.id ? "Product updated." : "Product added.");
    load();
  }

  async function toggleStock(p: Product) {
    const { error } = await supabase.from("products").update({ in_stock: !p.in_stock }).eq("id", p.id);
    if (error) note(error.message); else load();
  }

  async function remove(p: Product) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) note(error.message); else { note("Product deleted."); load(); }
  }

  async function saveSettings() {
    const { error } = await supabase.from("settings").upsert({ ...settings, id: 1 });
    note(error ? "Could not save: " + error.message : "Shop details saved.");
  }

  async function setOrderStatus(o: Order, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", o.id);
    if (error) note(error.message); else load();
  }

  const intl = (p: string) => { const d = p.replace(/\D/g, ""); return d.startsWith("0") ? "254" + d.slice(1) : d; };
  const receiptLink = (o: Order) =>
    `https://wa.me/${intl(o.phone)}?text=${encodeURIComponent(`Hello ${o.customer_name}, your order ${o.receipt_no} (${kes(o.total)}) has been approved. Thank you! Download your receipt here: ${window.location.origin}/order?no=${encodeURIComponent(o.receipt_no)}&phone=${encodeURIComponent(o.phone)}`)}`;

  async function logout() { await supabase.auth.signOut(); nav("/login"); }

  if (!ready || !session) return <p className="p-8 text-center">Loading...</p>;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      <div className="flex items-center justify-between py-4">
        <h1 className="text-xl font-extrabold">Admin area</h1>
        <div className="flex gap-2"><Link to="/" className="btn-ghost">View shop</Link><button onClick={logout} className="btn-ghost">Sign out</button></div>
      </div>
      {msg && <div className="mb-3 rounded-lg bg-ink p-3 text-sm text-white">{msg}</div>}

      <section className="mb-6 rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-bold">{form.id ? "Edit product" : "Add a product"}</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <input className="input" placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input className="input" type="number" placeholder="Price (KES)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
        <textarea className="input mt-2" rows={2} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.in_stock} onChange={(e) => setForm({ ...form, in_stock: e.target.checked })} /> In stock</label>
          <label className="flex items-center gap-2">Photo <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
          {form.image_url && !file && <img src={form.image_url} alt="" className="h-10 w-10 rounded object-cover" />}
        </div>
        <div className="mt-3 flex gap-2">
          <button className="btn" onClick={saveProduct} disabled={busy}>{busy ? "Saving..." : form.id ? "Update product" : "Add product"}</button>
          {form.id && <button className="btn-ghost" onClick={() => { setForm(EMPTY); setFile(null); }}>Cancel</button>}
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-bold">Products ({products.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b"><th className="p-2">Name</th><th className="p-2">Category</th><th className="p-2">Price</th><th className="p-2">Stock</th><th className="p-2"></th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-2">{p.name}</td><td className="p-2">{p.category}</td><td className="p-2">{kes(p.price)}</td>
                  <td className="p-2"><button className="btn-ghost" onClick={() => toggleStock(p)}>{p.in_stock ? "In stock" : "Out"}</button></td>
                  <td className="space-x-2 whitespace-nowrap p-2">
                    <button className="btn-ghost" onClick={() => { setForm({ id: p.id, name: p.name, category: p.category, price: String(p.price), description: p.description, in_stock: p.in_stock, image_url: p.image_url }); window.scrollTo(0, 0); }}>Edit</button>
                    <button className="btn-ghost" onClick={() => remove(p)}>Delete</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && <tr><td className="p-4 text-neutral-500" colSpan={5}>No products yet. Add your first one above.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-1 font-bold">Orders ({orders.length}) · {orders.filter((o) => o.status === "pending").length} pending approval</h2>
        <p className="mb-3 text-xs text-neutral-500">Check each M-Pesa code against your M-Pesa messages or statement, then Approve. The customer can then download their receipt, or you can send them the link with the receipt button.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b"><th className="p-2">Receipt</th><th className="p-2">Customer</th><th className="p-2">Items</th><th className="p-2">Total</th><th className="p-2">M-Pesa code</th><th className="p-2">Status</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b align-top last:border-0">
                  <td className="p-2 whitespace-nowrap">{o.receipt_no}<div className="text-xs text-neutral-500">{new Date(o.created_at).toLocaleString()}</div></td>
                  <td className="p-2 whitespace-nowrap">{o.customer_name}<div className="text-xs text-neutral-500">{o.phone}</div></td>
                  <td className="p-2">
                    {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                    <div className="mt-1 text-xs font-semibold text-neutral-700">{o.delivery_method === "send" ? `🚚 Send to: ${o.delivery_address || "(no address)"} (customer pays shipping)` : "🏬 Collect from shop"}</div>
                    {o.notes && <div className="text-xs text-neutral-600">📝 {o.notes}</div>}
                  </td>
                  <td className="p-2 whitespace-nowrap">{kes(o.total)}</td>
                  <td className="p-2 font-mono">{o.mpesa_code}</td>
                  <td className="space-x-1 whitespace-nowrap p-2">
                    {o.status === "pending" ? (
                      <>
                        <button className="btn" onClick={() => setOrderStatus(o, "confirmed")}>Approve</button>
                        <button className="btn-ghost" onClick={() => setOrderStatus(o, "rejected")}>Reject</button>
                      </>
                    ) : (
                      <>
                        <span className="mr-1 font-bold">{o.status === "confirmed" ? "Approved ✓" : "Rejected ✕"}</span>
                        {o.status === "confirmed" && <a className="btn" href={receiptLink(o)} target="_blank" rel="noopener noreferrer">📲 Send receipt</a>}
                        <button className="btn-ghost" onClick={() => setOrderStatus(o, "pending")}>Undo</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td className="p-4 text-neutral-500" colSpan={6}>No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-bold">Shop details and announcement</h2>
        <input className="input mb-2" placeholder="Announcement banner (leave empty to hide)" value={settings.announcement} onChange={(e) => setSettings({ ...settings, announcement: e.target.value })} />
        <div className="grid gap-2 sm:grid-cols-3">
          <input className="input" placeholder="WhatsApp number, e.g. 2547XXXXXXXX" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
          <input className="input" placeholder="Location" value={settings.location} onChange={(e) => setSettings({ ...settings, location: e.target.value })} />
          <input className="input" placeholder="Opening hours" value={settings.hours} onChange={(e) => setSettings({ ...settings, hours: e.target.value })} />
        </div>
        <button className="btn mt-3" onClick={saveSettings}>Save details</button>
      </section>
    </div>
  );
}
