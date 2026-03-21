import type { HomeBackgroundPalette } from "@/types/homeBackground";

export const HOME_BACKGROUNDS = [
  {
    vibeKey: "dawn",
    rarity: "common",
    colors: ["#1e1b4b", "#6d28d9", "#c2410c"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    vibeKey: "mist",
    rarity: "common",
    colors: ["#0f172a", "#334155", "#64748b"],
    start: { x: 0, y: 1 },
    end: { x: 1, y: 0 },
  },
  {
    vibeKey: "coral",
    rarity: "common",
    colors: ["#4c0519", "#be123c", "#e11d48"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0.6 },
  },
  {
    vibeKey: "indigo",
    rarity: "common",
    colors: ["#172554", "#3730a3", "#6366f1"],
    start: { x: 0.2, y: 0 },
    end: { x: 0.9, y: 1 },
  },
  {
    vibeKey: "forest",
    rarity: "common",
    colors: ["#052e16", "#166534", "#15803d"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    vibeKey: "ember",
    rarity: "uncommon",
    colors: ["#431407", "#c2410c", "#b45309"],
    start: { x: 0, y: 1 },
    end: { x: 1, y: 0.2 },
  },
  {
    vibeKey: "sage",
    rarity: "uncommon",
    colors: ["#134e4a", "#0d9488", "#14b8a6"],
    start: { x: 1, y: 0 },
    end: { x: 0, y: 1 },
  },
  {
    vibeKey: "midnight",
    rarity: "rare",
    colors: ["#020617", "#1e293b", "#0284c7"],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  {
    vibeKey: "aurora",
    rarity: "superRare",
    colors: ["#312e81", "#047857", "#6d28d9", "#be185d"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    vibeKey: "prism",
    rarity: "superLegend",
    colors: ["#581c87", "#be185d", "#d97706", "#0891b2"],
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  },
] as const satisfies readonly HomeBackgroundPalette[];

export function getHomeBackgroundPaletteByKey(
  vibeKey: string,
): HomeBackgroundPalette {
  const match = HOME_BACKGROUNDS.find((p) => p.vibeKey === vibeKey);
  return match ?? HOME_BACKGROUNDS[0];
}
