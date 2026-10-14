import { useEffect, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { ReceiptData, downloadReceipt } from "../lib/receipt";
import { configured, supabase } from "../lib/supabase";
import { Settings, digits, kes } from "../lib/types";

interface OrderRow {
  receipt_no: string; customer_name: string; phone: string;
  items: { name: string; qty: number; price: number }[];
  total: number; mpesa_code: string; status: string; created_at: string;
  delivery_method?: string; delivery_address?: string; notes?: string;
}

export default function TrackOrder() {
  const { settings } = useOutletContext<{ settings: Settings }>();
  const [params] = useSearchParams();
  const [no, setNo] = useState(params.get("no") || "");
  const [phone, setPhone] = useState(params.get("phone") || "");
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function check() {
    if (!no.trim() || digits(phone).length < 9) return setMsg("Enter your order number and the phone number you used.");
    setBusy(true); setMsg(""); setOrder(null);
    if (!configured) { setBusy(false); return setMsg("Order tracking works once the shop's database is connected."); }
    const { data, error } = await supabase.rpc("get_order", { p_receipt: no.trim(), p_phone: phone });
    setBusy(false);
    if (error) return setMsg("Could not check your order: " + error.message);
    const row = (data as OrderRow[] | null)?.[0];
    if (!row) return setMsg("We could not find that order. Check the order number and phone number.");
    setOrder(row);
  }

  useEffect(() => { if (params.get("no") && params.get("phone")) void check(); /* eslint-disable-next-line */ }, []);

  function receipt() {
    if (!order) return;
    const r: ReceiptData = {
      receiptNo: order.receipt_no, date: new Date(order.created_at).toLocaleString(), name: order.customer_name, phone: order.phone,
      mpesaCode: order.mpesa_code, items: order.items, total: order.total, location: settings.location, shopPhone: settings.phone, confirmed: true,
      deliveryText: order.delivery_method === "send" ? order.delivery_address || "" : "Collect from the shop", shipping: order.delivery_method === "send",
    };
    downloadReceipt(r);
  }

  const wa = `https://wa.me/${digits(settings.phone)}?text=${encodeURIComponent(`Hello Jaymba Enterprises, about my order ${no}.`)}`;

  return (
    <div className="mx-auto max-w-lg py-8">
      <h1 className="mb-1 text-3xl font-extrabold text-white">Track my order</h1>
      <p className="mb-4 text-neutral-300">Enter your order number and phone number to see if your payment is approved and to download your receipt.</p>
      <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
        <input className="input" placeholder="Order number e.g. JE-261014-1234" value={no} onChange={(e) => setNo(e.target.value)} />
        <input className="input" placeholder="Phone number you used (07...)" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button className="btn w-full" onClick={check} disabled={busy}>{busy ? "Checking..." : "Check my order"}</button>
        {msg && <p className="text-sm text-red-700">{msg}</p>}
      </div>

      {order && (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4 text-center">
          {order.status === "confirmed" ? (
            <>
              <div className="text-4xl">✅</div>
              <h2 className="mt-1 text-xl font-extrabold">Approved</h2>
              <p className="mt-1 text-sm text-neutral-600">Order <b>{order.receipt_no}</b> for <b>{kes(order.total)}</b> is confirmed. Thank you!</p>
              <button className="btn mt-3" onClick={receipt}>⬇ Download receipt</button>
            </>
          ) : order.status === "rejected" ? (
            <>
              <div className="text-4xl">❌</div>
              <h2 className="mt-1 text-xl font-extrabold">We could not confirm this payment</h2>
              <p className="mt-1 text-sm text-neutral-600">Please contact us so we can sort it out.</p>
              <a className="btn mt-3" href={wa} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
            </>
          ) : (
            <>
              <div className="text-4xl">⏳</div>
              <h2 className="mt-1 text-xl font-extrabold">Pending approval</h2>
              <p className="mt-1 text-sm text-neutral-600">Order <b>{order.receipt_no}</b> for <b>{kes(order.total)}</b>. We are checking your M-Pesa payment. Please check again in a little while.</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button className="btn" onClick={check}>Check again</button>
                <a className="btn-ghost" href={wa} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
              </div>
            </>
          )}
        </div>
      )}
      <p className="mt-4 text-center text-sm"><Link to="/products" className="text-brand underline">Back to products</Link></p>
    </div>
  );
}
