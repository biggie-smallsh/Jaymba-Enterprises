export const CATEGORIES = ["Wires & Cables", "Sockets", "Switches", "Bulbs & Lighting", "Pipes", "Solar Panels", "Other"] as const;

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image_url: string | null;
  in_stock: boolean;
  created_at?: string;
}

export interface Settings {
  id: number;
  phone: string;
  location: string;
  hours: string;
  announcement: string;
}

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  phone: "254740253121",
  location: "Nairobi, Nyamakima. New Nyamakima Electrical Point building, next to Mololine. Ground floor, shop number G11.",
  hours: "6:30am - 6:00pm",
  announcement: "",
};

export const kes = (n: number) => "KES " + Number(n || 0).toLocaleString();
export const digits = (s: string) => s.replace(/\D/g, "");
