import type { HomeBackgroundPalette } from "@/types/homeBackground";

export const HOME_BACKGROUNDS = [
  {
    vibeKey: "dawn",
    rarity: "common",
    colors: ["#1e1b4b", "#7c3aed", "#fb923c"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    vibeKey: "mist",
    rarity: "common",
    colors: ["#0f172a", "#334155", "#94a3b8"],
    start: { x: 0, y: 1 },
    end: { x: 1, y: 0 },
  },
  {
    vibeKey: "coral",
    rarity: "common",
    colors: ["#4c0519", "#be123c", "#fda4af"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0.6 },
  },
  {
    vibeKey: "indigo",
    rarity: "common",
    colors: ["#172554", "#3730a3", "#a5b4fc"],
    start: { x: 0.2, y: 0 },
    end: { x: 0.9, y: 1 },
  },
  {
    vibeKey: "forest",
    rarity: "common",
    colors: ["#052e16", "#166534", "#86efac"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    vibeKey: "ember",
    rarity: "uncommon",
    colors: ["#431407", "#c2410c", "#fcd34d"],
    start: { x: 0, y: 1 },
    end: { x: 1, y: 0.2 },
  },
  {
    vibeKey: "sage",
    rarity: "uncommon",
    colors: ["#134e4a", "#0d9488", "#ccfbf1"],
    start: { x: 1, y: 0 },
    end: { x: 0, y: 1 },
  },
  {
    vibeKey: "midnight",
    rarity: "rare",
    colors: ["#020617", "#1e293b", "#38bdf8"],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  {
    vibeKey: "aurora",
    rarity: "superRare",
    colors: ["#312e81", "#059669", "#a78bfa", "#f472b6"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    vibeKey: "prism",
    rarity: "superLegend",
    colors: ["#581c87", "#db2777", "#f59e0b", "#22d3ee"],
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  },
] as const satisfies readonly HomeBackgroundPalette[];
