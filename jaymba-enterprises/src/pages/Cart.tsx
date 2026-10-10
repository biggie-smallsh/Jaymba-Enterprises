import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { PAYMENT } from "../lib/config";
import { useCart } from "../lib/cart";
import { ReceiptData, downloadReceipt, makeReceiptNo } from "../lib/receipt";
import { configured, supabase } from "../lib/supabase";
import { Settings, digits, kes } from "../lib/types";

export default function Cart() {
  const { settings } = useOutletContext<{ settings: Settings }>();
  const { items, total, setQty, remove, clear } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  async function confirm() {
    const c = code.trim().toUpperCase();
    if (!name.trim() || digits(phone).length < 9) return setErr("Enter your name and phone number.");
    if (!/^[A-Z0-9]{10}$/.test(c)) return setErr("Enter the 10-character M-Pesa confirmation code from your payment message.");
    setBusy(true); setErr("");
    const r: ReceiptData = {
      receiptNo: makeReceiptNo(), date: new Date().toLocaleString(), name: name.trim(), phone: phone.trim(), mpesaCode: c,
      items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
      total, location: settings.location, shopPhone: settings.phone,
    };
    if (configured) {
      const { error } = await supabase.from("orders").insert({ receipt_no: r.receiptNo, customer_name: r.name, phone: r.phone, items: r.items, total: r.total, mpesa_code: r.mpesaCode });
      if (error) { setBusy(false); return setErr("Could not place your order: " + error.message); }
    }
    setBusy(false); setReceipt(r); clear(); downloadReceipt(r);
  }

  if (receipt) {
    const msg = encodeURIComponent(`Hello Jaymba Enterprises, I have paid ${kes(receipt.total)} (M-Pesa code ${receipt.mpesaCode}). Receipt ${receipt.receiptNo}. Name: ${receipt.name}.`);
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="text-5xl">✅</div>
          <h1 className="mt-2 text-2xl font-extrabold">Thank you, {receipt.name}!</h1>
          <p className="mt-1 text-sm text-neutral-600">Your order <b>{receipt.receiptNo}</b> for <b>{kes(receipt.total)}</b> has been received. We'll confirm your M-Pesa payment shortly.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button className="btn" onClick={() => downloadReceipt(receipt)}>⬇ Download receipt again</button>
            <a className="btn-ghost" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${digits(settings.phone)}?text=${msg}`}>Tell us on WhatsApp</a>
            <Link to="/products" className="btn-ghost">Keep shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center text-white">
        <div className="text-5xl">🛒</div>
        <h1 className="mt-2 text-2xl font-bold">Your cart is empty</h1>
        <Link to="/products" className="btn mt-4">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="mb-4 text-3xl font-extrabold text-white">Your cart</h1>
      <div className="grid gap-6 md:grid-cols-5">
        <div className="space-y-3 md:col-span-3">
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3">
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{i.name}</div>
                <div className="text-sm text-neutral-600">{kes(i.price)} each</div>
              </div>
              <div className="flex items-center gap-1">
                <button className="btn-ghost !px-3" onClick={() => setQty(i.id, i.qty - 1)} aria-label="Less">−</button>
                <input type="number" min={1} aria-label="Quantity" className="input !w-16 !px-1 text-center font-bold" value={i.qty} onChange={(e) => setQty(i.id, Math.max(1, parseInt(e.target.value) || 1))} />
                <button className="btn-ghost !px-3" onClick={() => setQty(i.id, i.qty + 1)} aria-label="More">+</button>
              </div>
              <div className="w-24 text-right font-bold">{kes(i.qty * i.price)}</div>
              <button className="btn-ghost" onClick={() => remove(i.id)} aria-label="Remove">✕</button>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-xl bg-brand p-4 text-lg font-extrabold"><span>Total</span><span>{kes(total)}</span></div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 md:col-span-2">
          <h2 className="mb-2 font-bold">Pay with M-Pesa</h2>
          <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm text-neutral-700">
            <li>Open <b>M-Pesa</b> → Lipa na M-Pesa → <b>Pay Bill</b></li>
            <li>Business no: <b>{PAYMENT.paybill}</b> ({PAYMENT.bank})</li>
            <li>Account: <b>{PAYMENT.account}</b></li>
            {PAYMENT.till && <li>Or Buy Goods Till: <b>{PAYMENT.till}</b></li>}
            <li>Amount: <b>{kes(total)}</b></li>
            <li>Enter your PIN, then type the confirmation code below.</li>
          </ol>
          <div className="space-y-2">
            <input className="input" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input" placeholder="Phone number (07...)" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className="input uppercase" placeholder="M-Pesa code e.g. QJK3L9ABCD" maxLength={10} value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          {err && <p className="mt-2 text-sm text-red-700">{err}</p>}
          {!configured && <p className="mt-2 rounded bg-yellow-100 p-2 text-xs">Demo mode: Supabase isn't connected, so the order won't be saved.</p>}
          <button className="btn mt-3 w-full" onClick={confirm} disabled={busy}>{busy ? "Placing order..." : "I've paid: confirm order"}</button>
          <p className="mt-2 text-xs text-neutral-500">{PAYMENT.note}</p>
        </div>
      </div>
    </div>
  );
}
