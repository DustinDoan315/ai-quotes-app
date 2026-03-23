import { isPremiumHomeBackgroundPalette } from "@/domain/subscription/homeVibePremium";
import { HOME_BACKGROUNDS } from "@/theme/homeBackgrounds";
import type { HomeBackgroundPalette, HomeVibeRarity } from "@/types/homeBackground";

const WEIGHTS = [1420, 1420, 1420, 1420, 1420, 900, 900, 450, 450, 200] as const;

const RARITY_BASE_LUCK: Record<HomeVibeRarity, number> = {
  common: 36,
  uncommon: 52,
  rare: 66,
  superRare: 82,
  superLegend: 94,
};

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    const code = input.codePointAt(i) ?? 0;
    h ^= code;
    h = Math.imul(h, 16777619);
    if (code > 0xffff) {
      i += 1;
    }
  }
  return h >>> 0;
}

function pickVariantIndex(seed: number): number {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let r = seed % total;
  for (let i = 0; i < WEIGHTS.length; i += 1) {
    const w = WEIGHTS[i];
    if (r < w) {
      return i;
    }
    r -= w;
  }
  return WEIGHTS.length - 1;
}

export type DailyHomeBackground = {
  palette: HomeBackgroundPalette;
  luckPercent: number;
};

export function getDailyHomeBackground(
  identityKey: string,
  calendarDate: string,
): DailyHomeBackground {
  const seed = hashString(`${identityKey}|${calendarDate}|v1`);
  const variantIndex = pickVariantIndex(seed);
  const palette = HOME_BACKGROUNDS[variantIndex];
  const jitter = seed % 7;
  const base = RARITY_BASE_LUCK[palette.rarity];
  const luckPercent = Math.min(99, base + jitter);
  return { palette, luckPercent };
}

export function getDailyHomeBackgroundWithoutPremium(
  identityKey: string,
  calendarDate: string,
): DailyHomeBackground {
  let salt = 0;
  for (;;) {
    const seed = hashString(`${identityKey}|${calendarDate}|v1|np|${salt}`);
    const variantIndex = pickVariantIndex(seed);
    const palette = HOME_BACKGROUNDS[variantIndex];
    if (!isPremiumHomeBackgroundPalette(palette)) {
      const jitter = seed % 7;
      const base = RARITY_BASE_LUCK[palette.rarity];
      const luckPercent = Math.min(99, base + jitter);
      return { palette, luckPercent };
    }
    salt += 1;
    if (salt > 64) {
      const palette = HOME_BACKGROUNDS[0];
      return {
        palette,
        luckPercent: Math.min(99, RARITY_BASE_LUCK[palette.rarity]),
      };
    }
  }
}
