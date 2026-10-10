import { useEffect, useRef, useState } from "react";
import { digits } from "../lib/types";
import { CONTACT } from "../lib/contact";

// Shrinks big phone photos so they send quickly
async function shrink(file: File, max = 1280): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob: Blob | null = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.82));
    return blob ? new File([blob], "quotation-photo.jpg", { type: "image/jpeg" }) : file;
  } catch { return file; }
}

export default function QuoteRequest({ phone }: { phone: string }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [msg, setMsg] = useState("");
  const cam = useRef<HTMLInputElement>(null);
  const gal = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!photo) { setPreview(""); return; }
    const u = URL.createObjectURL(photo); setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [photo]);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (f) setPhoto(await shrink(f));
  }

  function body() {
    return `Quotation request from ${name.trim() || "a customer"}${contact.trim() ? ` (${contact.trim()})` : ""}:\n${text.trim() || "(see photo)"}${photo ? "\n(photo attached)" : ""}`;
  }
  function valid() {
    if (!text.trim() && !photo) { setMsg("Please write what you need or add a picture."); return false; }
    setMsg(""); return true;
  }

  async function sendWhatsApp() {
    if (!valid()) return;
    const t = body();
    try {
      if (photo && navigator.canShare && navigator.canShare({ files: [photo] })) {
        await navigator.share({ files: [photo], text: t, title: "Quotation request" }); // choose WhatsApp: the photo attaches
        return;
      }
    } catch (err) { if ((err as Error).name === "AbortError") return; }
    window.open(`https://wa.me/${digits(phone)}?text=${encodeURIComponent(t)}`, "_blank", "noopener");
    if (photo) setMsg("WhatsApp opened with your message. Please attach your picture in the chat.");
  }

  function sendEmail() {
    if (!valid()) return;
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent("Quotation request")}&body=${encodeURIComponent(body() + (photo ? "\n\nPlease attach your picture to this email." : ""))}`;
  }

  return (
    <div className="item-glow rounded-xl border border-neutral-200 bg-white p-4">
      <b>📝 Request a quotation</b>
      <p className="mb-3 mt-1 text-sm text-neutral-600">Write what you need, or take a picture of the item or your list, and send it to us. We will reply with a price.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Phone number" inputMode="tel" value={contact} onChange={(e) => setContact(e.target.value)} />
      </div>
      <textarea className="input mt-2" rows={4} placeholder="e.g. 10 rolls 2.5mm twin with earth, 20 double sockets, 15 LED bulbs 9W..." value={text} onChange={(e) => setText(e.target.value)} />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input ref={cam} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />
        <input ref={gal} type="file" accept="image/*" className="hidden" onChange={pick} />
        <button className="btn-ghost" onClick={() => cam.current?.click()}>📷 Take a picture</button>
        <button className="btn-ghost" onClick={() => gal.current?.click()}>🖼️ Choose from gallery</button>
        {preview && (
          <span className="flex items-center gap-2">
            <img src={preview} alt="Your picture" className="h-12 w-12 rounded-lg object-cover" />
            <button className="btn-ghost" onClick={() => setPhoto(null)} aria-label="Remove picture">✕</button>
          </span>
        )}
      </div>

      {msg && <p className="mt-2 text-sm text-red-700">{msg}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn" onClick={sendWhatsApp}>Send on WhatsApp</button>
        <button className="btn-ghost" onClick={sendEmail}>Send by email</button>
      </div>
    </div>
  );
}
