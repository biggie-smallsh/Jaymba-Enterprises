// Forgiving search: "evin cable", "evincable" and "EVIN" all find the same product.
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9.]/g, "");

export function matchesQuery(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = text.toLowerCase();
  const flat = squash(text);
  return q.split(/\s+/).every((t) => hay.includes(t) || flat.includes(squash(t)));
}
