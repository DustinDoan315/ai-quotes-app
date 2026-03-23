import type { HomeBackgroundPalette } from "@/types/homeBackground";

export const isPremiumHomeBackgroundPalette = (
  palette: HomeBackgroundPalette,
): boolean =>
  palette.rarity === "superRare" || palette.rarity === "superLegend";
