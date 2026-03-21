import type { HomeVibeRarity } from "@/types/homeBackground";

export const HOME_VIBE_RARITY_STYLE: Record<
  HomeVibeRarity,
  { dot: string; text: string }
> = {
  common: { dot: "bg-slate-400", text: "text-slate-300" },
  uncommon: { dot: "bg-emerald-400", text: "text-emerald-400" },
  rare: { dot: "bg-sky-400", text: "text-sky-400" },
  superRare: { dot: "bg-fuchsia-500", text: "text-fuchsia-400" },
  superLegend: { dot: "bg-amber-400", text: "text-amber-400" },
};
