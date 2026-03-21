export type HomeVibeKey =
  | "dawn"
  | "mist"
  | "coral"
  | "indigo"
  | "forest"
  | "ember"
  | "sage"
  | "midnight"
  | "aurora"
  | "prism";

export type HomeVibeRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "superRare"
  | "superLegend";

export type HomeBackgroundPalette = {
  vibeKey: HomeVibeKey;
  rarity: HomeVibeRarity;
  colors: readonly [string, string, ...string[]];
  start: { x: number; y: number };
  end: { x: number; y: number };
};

export type HomeVibeHintParts = {
  vibeName: string;
  rarityLabel: string;
  rarity: HomeVibeRarity;
  luckPercent: number;
};
