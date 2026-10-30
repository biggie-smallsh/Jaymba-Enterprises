import { useMemo, useState } from "react";
import { makeQR, qrSvg } from "../lib/qr";

function save(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Makes a QR code of your website address, ready to print on cards or post on social media.
export default function QrCard() {
  const [url, setUrl] = useState(window.location.origin);
  const grid = useMemo(() => { try { return url.trim() ? makeQR(url.trim()) : null; } catch { return null; } }, [url]);
  const local = /localhost|127\.0\.0\.1/.test(url);

  function downloadPng() {
    if (!grid) return;
    const border = 4, n = grid.length + border * 2, scale = Math.max(1, Math.floor(1600 / n));
    const c = document.createElement("canvas");
    c.width = c.height = n * scale;
    const g = c.getContext("2d")!;
    g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = "#000";
    grid.forEach((row, y) => row.forEach((dark, x) => { if (dark) g.fillRect((x + border) * scale, (y + border) * scale, scale, scale); }));
    c.toBlob((b) => { if (b) save(b, "jaymba-qr-code.png"); }, "image/png");
  }
  function downloadSvg() {
    if (grid) save(new Blob([qrSvg(grid)], { type: "image/svg+xml" }), "jaymba-qr-code.svg");
  }

  return (
    <section className="mb-6 rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="mb-1 font-bold">QR code for your website</h2>
      <p className="mb-3 text-sm text-neutral-600">Print it on your business cards, signboard and social media pictures. When a customer scans it with their phone camera, your website opens.</p>
      <label className="mb-1 block text-xs font-semibold">Website address in the QR code</label>
      <input className="input mb-2" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-website-address" />
      {local && <p className="mb-2 rounded bg-yellow-100 p-2 text-xs">This is a test address that only works on your own computer. Open this admin page on your live website, or type your real website address above, before you print.</p>}
      {grid ? (
        <div className="flex flex-wrap items-center gap-4">
          <img alt="QR code of your website" className="h-44 w-44 rounded border border-neutral-200" src={"data:image/svg+xml;utf8," + encodeURIComponent(qrSvg(grid))} />
          <div className="space-y-2">
            <button className="btn block" onClick={downloadPng}>⬇ Download picture (PNG)</button>
            <button className="btn-ghost block" onClick={downloadSvg}>⬇ Download for printing (SVG)</button>
            <p className="max-w-xs text-xs text-neutral-500">Print it at least 2.5 cm wide, keep the white border around it, and scan it with a phone before you print many copies.</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-red-700">Type a web address that starts with https:// (up to about 200 characters).</p>
      )}
    </section>
  );
}
