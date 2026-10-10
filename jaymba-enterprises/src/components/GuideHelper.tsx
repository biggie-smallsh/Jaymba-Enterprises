import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Electrician3D, { GuidePicker } from "./Electrician3D";
import { PAYMENT } from "../lib/config";

const say = (text: string) => window.dispatchEvent(new CustomEvent("jaymba-say", { detail: text }));

export default function GuideHelper() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin") || pathname.startsWith("/login")) return null;

  const chip = "btn-ghost !px-2 !py-1.5 text-left text-xs";
  return (
    <>
      {open && (
        <div className="fixed bottom-20 left-4 z-50 w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-white/20 bg-ink/95 p-3 shadow-2xl backdrop-blur">
          <div className="mb-1 flex items-center justify-between text-white">
            <b>Your Jaymba guide</b>
            <button data-nofx className="rounded-full px-2 text-lg leading-none hover:text-brand" onClick={() => setOpen(false)} aria-label="Close guide">✕</button>
          </div>
          <div className="h-[min(300px,38vh)] w-full"><Electrician3D panel /></div>
          <GuidePicker compact />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button className={chip} onClick={() => { nav("/products"); say("Here are our products. Add what you need to your cart."); }}>🛒 Show me products</button>
            <button className={chip} onClick={() => say(`You can pay through ${PAYMENT.bank} Paybill number ${PAYMENT.paybill}, account number ${PAYMENT.account}. Add items to your cart, pay, then enter your M-Pesa code to get your receipt.`)}>💳 How do I pay?</button>
            <button className={chip} onClick={() => { nav("/about"); say("Open the about page to see our location, opening hours and contacts."); }}>📍 Where are you?</button>
            <button className={chip} onClick={() => { nav("/cart"); say("This is your cart. Check your items, then pay with M-Pesa."); }}>🧾 My cart</button>
          </div>
        </div>
      )}
      <button
        data-nofx
        onClick={() => setOpen(!open)}
        className="btn fixed bottom-4 left-4 z-50 shadow-lg"
        aria-label={open ? "Close the guide" : "Open the guide"}
      >
        {open ? "✕ Close guide" : "💬 Need help?"}
      </button>
    </>
  );
}
