// Single core cables come in three colours. Any product whose name or description
// contains "single core" automatically gets the colour picker.
export const CABLE_COLOURS = [
  { label: "Black (Neutral)", hex: "#111111" },
  { label: "Green (Earth)", hex: "#1e9e4a" },
  { label: "Red (Live)", hex: "#d62828" },
];

export const hasColours = (p: { name: string; description: string }) => /single[\s-]*core/i.test(`${p.name} ${p.description}`);
