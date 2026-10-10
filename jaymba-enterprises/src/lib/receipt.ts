import { jsPDF } from "jspdf";

export interface ReceiptData {
  receiptNo: string; date: string; name: string; phone: string; mpesaCode: string;
  items: { name: string; qty: number; price: number }[];
  total: number; location: string; shopPhone: string;
}

export function makeReceiptNo() {
  const d = new Date();
  const ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
  return `JE-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`;
}

const money = (n: number) => "KES " + n.toLocaleString();

export function downloadReceipt(r: ReceiptData) {
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const W = 148;
  doc.setFillColor(27, 31, 35); doc.rect(0, 0, W, 26, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(15);
  doc.text("JAYMBA ENTERPRISES", 10, 12);
  doc.setFontSize(8); doc.setTextColor(245, 163, 0);
  doc.text("Electrical supplies  |  Order receipt", 10, 19);

  doc.setTextColor(30, 30, 30); doc.setFontSize(9);
  let y = 35;
  const line = (k: string, v: string) => {
    doc.setFont("helvetica", "bold"); doc.text(k, 10, y);
    doc.setFont("helvetica", "normal"); doc.text(v, 48, y); y += 6;
  };
  line("Receipt no:", r.receiptNo); line("Date:", r.date); line("Customer:", r.name);
  line("Phone:", r.phone); line("M-Pesa code:", r.mpesaCode);

  y += 3;
  doc.setFillColor(245, 163, 0); doc.rect(10, y - 4.5, W - 20, 7, "F");
  doc.setFont("helvetica", "bold"); doc.setTextColor(27, 31, 35);
  doc.text("Item", 12, y); doc.text("Qty", 84, y); doc.text("Price", 98, y); doc.text("Total", 124, y);
  y += 8; doc.setFont("helvetica", "normal"); doc.setTextColor(30, 30, 30);

  for (const it of r.items) {
    const parts = doc.splitTextToSize(it.name, 68) as string[];
    if (y > 180) { doc.addPage(); y = 20; }
    doc.text(parts, 12, y);
    doc.text(String(it.qty), 84, y); doc.text(it.price.toLocaleString(), 98, y); doc.text((it.qty * it.price).toLocaleString(), 124, y);
    y += parts.length * 5 + 2;
  }
  doc.setDrawColor(200); doc.line(10, y, W - 10, y); y += 7;
  doc.setFont("helvetica", "bold"); doc.setFontSize(12);
  doc.text("TOTAL", 12, y); doc.text(money(r.total), W - 12, y, { align: "right" });

  y += 12; doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(90, 90, 90);
  const notes = [
    "Payment status: M-Pesa code submitted. The shop confirms it against its statement.",
    `Collect from: ${r.location}`,
    `Questions? WhatsApp +${r.shopPhone.replace(/\D/g, "")}`,
    "Thank you for shopping with Jaymba Enterprises.",
  ];
  for (const n of notes) { const p = doc.splitTextToSize(n, W - 24) as string[]; doc.text(p, 12, y); y += p.length * 4 + 1; }
  doc.save(`Receipt-${r.receiptNo}.pdf`);
}
