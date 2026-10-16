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
  const [method, setMethod] = useState<"collect" | "send">("collect");
  const [dest, setDest] = useState("");
  const [who, setWho] = useState<"me" | "other">("me");
  const [rName, setRName] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  // Delivery text saved with the order, shown to you in the admin area and on the receipt
  const sendTo = () => `${dest.trim()} | Receiver: ${who === "me" ? `${name.trim()} (${phone.trim()})` : `${rName.trim()} (${rPhone.trim()})`}`;

  async function confirm() {
    const c = code.trim().toUpperCase();
    if (!name.trim() || digits(phone).length < 9) return setErr("Enter your name and phone number.");
    if (!/^[A-Z0-9]{10}$/.test(c)) return setErr("Enter the 10-character M-Pesa confirmation code from your payment message.");
    if (method === "send") {
      if (dest.trim().length < 3) return setErr("Enter where we should send your items.");
      if (who === "other" && (!rName.trim() || digits(rPhone).length < 9)) return setErr("Enter the name and phone number of the person who will receive the items.");
      if (!agree) return setErr("Please tick the box to confirm that you will pay the shipping fee.");
    }
    setBusy(true); setErr("");
    const r: ReceiptData = {
      receiptNo: makeReceiptNo(), date: new Date().toLocaleString(), name: name.trim(), phone: phone.trim(), mpesaCode: c,
      items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
      total, location: settings.location, shopPhone: settings.phone,
      deliveryText: method === "send" ? sendTo() : "Collect from the shop", shipping: method === "send",
    };
    if (configured) {
      const { error } = await supabase.from("orders").insert({ receipt_no: r.receiptNo, customer_name: r.name, phone: r.phone, items: r.items, total: r.total, mpesa_code: r.mpesaCode, delivery_method: method, delivery_address: method === "send" ? sendTo() : "", notes: notes.trim() });
      if (error) {
        setBusy(false);
        if (error.code === "23505") return setErr("This M-Pesa code has already been used for another order. Please check the code, or contact us on WhatsApp.");
        if (error.code === "23514") return setErr("Please check your details and try again.");
        return setErr("Could not place your order: " + error.message);
      }
    }
    setBusy(false); setReceipt(r); clear(); // receipt is released after the shop approves the order
  }

  if (receipt) {
    const msg = encodeURIComponent(`Hello Jaymba Enterprises, I have placed order ${receipt.receiptNo} for ${kes(receipt.total)} (M-Pesa code ${receipt.mpesaCode}). Name: ${receipt.name}.`);
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="text-5xl">⏳</div>
          <h1 className="mt-2 text-2xl font-extrabold">Thank you, {receipt.name}!</h1>
          <p className="mt-1 text-sm text-neutral-600">Your order <b>{receipt.receiptNo}</b> for <b>{kes(receipt.total)}</b> is <b>pending approval</b>. We will check your M-Pesa payment and approve it shortly.</p>
          {receipt.shipping && <p className="mt-2 text-sm text-neutral-600">After your payment is approved we will send your items to: <b>{receipt.deliveryText}</b>. You pay the shipping fee, because we do not offer transport at the moment.</p>}
          <p className="mt-2 text-sm text-neutral-600">Once it is approved, open <b>Track my order</b> to download your receipt. Please save your order number.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link to={`/order?no=${encodeURIComponent(receipt.receiptNo)}&phone=${encodeURIComponent(receipt.phone)}`} className="btn">📦 Track my order</Link>
            <a className="btn-ghost" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${digits(settings.phone)}?text=${msg}`}>Tell us on WhatsApp</a>
            <Link to="/products" className="btn-ghost">Keep shopping</Link>
          </div>
          {!configured && <button className="btn-ghost mt-3" onClick={() => downloadReceipt(receipt)}>Demo mode: download a sample receipt</button>}
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
        <div className="mt-3"><Link to="/order" className="underline">Track an order</Link></div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="mb-1 text-3xl font-extrabold text-white">Your cart</h1>
      <p className="mb-4 text-sm"><Link to="/order" className="text-brand underline">Already ordered? Track your order</Link></p>
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

          <div className="mt-3 rounded-lg bg-paper p-3 text-sm">
            <div className="mb-1 font-bold">How do you want to get your items?</div>
            <label className="flex items-start gap-2 py-0.5">
              <input type="radio" name="method" className="mt-1" checked={method === "collect"} onChange={() => setMethod("collect")} />
              <span>I will collect from the shop</span>
            </label>
            <label className="flex items-start gap-2 py-0.5">
              <input type="radio" name="method" className="mt-1" checked={method === "send"} onChange={() => setMethod("send")} />
              <span>Send my items to me</span>
            </label>
            {method === "send" && (
              <div className="mt-2 space-y-2">
                <div className="text-xs font-semibold">Send to (destination)</div>
                <input className="input" placeholder="Town or area, and the bus or courier office" value={dest} onChange={(e) => setDest(e.target.value)} />
                <div className="text-xs font-semibold">Who will receive the items?</div>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="who" checked={who === "me"} onChange={() => setWho("me")} /> Me</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="who" checked={who === "other"} onChange={() => setWho("other")} /> Another person</label>
                {who === "other" && (
                  <div className="space-y-2">
                    <input className="input" placeholder="Receiver's full name" value={rName} onChange={(e) => setRName(e.target.value)} />
                    <input className="input" placeholder="Receiver's phone number" inputMode="tel" value={rPhone} onChange={(e) => setRPhone(e.target.value)} />
                  </div>
                )}
                <label className="flex items-start gap-2 text-xs">
                  <input type="checkbox" className="mt-0.5" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                  <span>I understand that Jaymba Enterprises does not offer transport at the moment, and that I will pay the shipping fee myself.</span>
                </label>
              </div>
            )}
            <p className="mt-2 rounded bg-yellow-100 p-2 text-xs">🚚 We do not offer transport at the moment. If you want your items sent, the shipping fee is paid by you. Your items are sent only after your payment is approved.</p>
          </div>
          <textarea className="input mt-2" rows={2} placeholder="Anything else we should know? (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          {err && <p className="mt-2 text-sm text-red-700">{err}</p>}
          {!configured && <p className="mt-2 rounded bg-yellow-100 p-2 text-xs">Demo mode: Supabase isn't connected, so the order won't be saved.</p>}
          <button className="btn mt-3 w-full" onClick={confirm} disabled={busy}>{busy ? "Placing order..." : "I've paid: confirm order"}</button>
          <p className="mt-2 text-xs text-neutral-500">{PAYMENT.note}</p>
        </div>
      </div>
    </div>
  );
}
