import { Link, useOutletContext } from "react-router-dom";
import { PAYMENT } from "../lib/config";
import QuoteRequest from "../components/QuoteRequest";
import { CONTACT } from "../lib/contact";
import { Settings, digits } from "../lib/types";

const toIntl = (n: string) => "+254" + n.replace(/\D/g, "").replace(/^0/, "");
const card = "item-glow rounded-xl border border-neutral-200 bg-white p-4";

export default function About() {
  const { settings } = useOutletContext<{ settings: Settings }>();
  const phone = digits(settings.phone);
  return (
    <div className="py-8">
      <h1 className="mb-2 text-3xl font-extrabold text-white">About Jaymba Enterprises</h1>
      <p className="mb-5 max-w-2xl text-neutral-300">Find us, contact us and see how to pay.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className={card}>
          <b>📍 Location</b>
          <a href={CONTACT.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm text-neutral-600 underline">{settings.location}</a>
          <a className="btn mt-2" href={CONTACT.mapUrl} target="_blank" rel="noopener noreferrer">🗺️ Open in Google Maps</a>
        </div>

        <div className={card}>
          <b>🕒 Opening and closing times</b>
          <p className="mt-1 text-sm text-neutral-600">{settings.hours}</p>
        </div>

        <div className={card}>
          <b>💳 Mode of payment</b>
          <p className="mt-1 text-sm text-neutral-600">{PAYMENT.bank} Paybill: <b className="text-ink">{PAYMENT.paybill}</b></p>
          <p className="text-sm text-neutral-600">Account: <b className="text-ink">{PAYMENT.account}</b></p>
          {PAYMENT.till && <p className="text-sm text-neutral-600">Buy Goods Till: <b className="text-ink">{PAYMENT.till}</b></p>}
          <p className="mt-1 text-sm text-neutral-600">{PAYMENT.note}</p>
        </div>

        <div className={card}>
          <b>✉️ Email and phone</b>
          <p className="mt-1 text-sm text-neutral-600"><a className="underline" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></p>
          <p className="mb-2 text-sm text-neutral-600">{CONTACT.phones.map((n, i) => <span key={n}>{i > 0 && " or "}<a className="underline" href={`tel:${toIntl(n)}`}>{n}</a></span>)}</p>
          <a className="btn" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${phone}`}>Chat on WhatsApp</a>
        </div>

        <div className={`${card} sm:col-span-2`}>
          <b>🌐 Follow us on social media</b>
          <div className="mt-2 flex flex-wrap gap-3">
            {CONTACT.social.map((s) => {
              const inner = <><span className="text-lg">{s.icon}</span> <span className="font-semibold">{s.name}</span> <span className="text-neutral-500">{s.handle}</span></>;
              return s.url
                ? <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="btn-ghost">{inner}</a>
                : <span key={s.name} className="btn-ghost">{inner}</span>;
            })}
          </div>
        </div>
      </div>

      <div className="mt-4"><QuoteRequest phone={settings.phone} /></div>

      <Link to="/products" className="btn mt-6">Shop our products</Link>
    </div>
  );
}
