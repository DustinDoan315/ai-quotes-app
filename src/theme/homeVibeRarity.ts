import type { HomeVibeRarity } from "@/types/homeBackground";

export const HOME_VIBE_RARITY_STYLE: Record<
  HomeVibeRarity,
  { dot: string; text: string }
> = {
  common: { dot: "bg-slate-200", text: "text-slate-100" },
  uncommon: { dot: "bg-emerald-300", text: "text-emerald-200" },
  rare: { dot: "bg-sky-300", text: "text-sky-200" },
  superRare: { dot: "bg-fuchsia-400", text: "text-fuchsia-200" },
  superLegend: { dot: "bg-amber-300", text: "text-amber-200" },
};
