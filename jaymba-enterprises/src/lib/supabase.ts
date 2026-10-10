import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Treat empty or placeholder values (copied from .env.example) as "not connected"
const missing = (v?: string) => !v || /your[-_ ]|missing/i.test(v);

export const configured = !missing(url) && !missing(key);
export const supabase = createClient(configured ? (url as string) : "http://localhost:54321", configured ? (key as string) : "missing-key");
export const BUCKET = "product-images";
