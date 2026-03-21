import type { HomeBackgroundPalette, HomeVibeRarity } from "@/types/homeBackground";
import { Platform, ViewStyle } from "react-native";

const RARITY_SHADOW: Record<HomeVibeRarity, { op: number; radius: number }> = {
  common: { op: 0.38, radius: 22 },
  uncommon: { op: 0.48, radius: 28 },
  rare: { op: 0.55, radius: 34 },
  superRare: { op: 0.65, radius: 42 },
  superLegend: { op: 0.82, radius: 52 },
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: Number.parseInt(h.slice(0, 2), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    b: Number.parseInt(h.slice(4, 6), 16),
  };
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function pickAccent(palette: HomeBackgroundPalette): {
  primary: string;
  edge: string;
  bright: string;
} {
  const { colors } = palette;
  const n = colors.length;
  return {
    edge: colors[0],
    primary: n >= 2 ? colors[1] : colors[0],
    bright: colors[n - 1],
  };
}

export type HomeVibeFeedChrome = ReturnType<typeof getHomeVibeFeedChrome>;

export function getHomeVibeFeedChrome(palette: HomeBackgroundPalette): {
  hairline: ViewStyle;
  imageWash: ViewStyle;
  photoBorder: ViewStyle;
  cornerColor: string;
  brandShell: ViewStyle;
  momentWrap: ViewStyle;
  momentInner: ViewStyle;
  outerShell: ViewStyle;
} {
  const { primary, edge, bright } = pickAccent(palette);
  const { op, radius } = RARITY_SHADOW[palette.rarity];

  const outerShell: ViewStyle =
    Platform.select<ViewStyle>({
      ios: {
        shadowColor: bright,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: op,
        shadowRadius: radius,
      },
      android: {
        elevation: Math.min(18, 6 + radius / 6),
      },
      default: {},
    }) ?? {};

  return {
    hairline: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 12,
      height: 6,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      backgroundColor: primary,
      opacity: 0.95,
    },
    imageWash: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1,
      height: 208,
      backgroundColor: hexToRgba(primary, 0.42),
    },
    photoBorder: {
      position: "absolute",
      top: 8,
      left: 8,
      right: 8,
      bottom: 8,
      zIndex: 3,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: hexToRgba(primary, 0.78),
    },
    cornerColor: hexToRgba(bright, 0.92),
    brandShell: {
      borderWidth: 2,
      borderColor: hexToRgba(primary, 0.78),
      backgroundColor: "rgba(0,0,0,0.55)",
      borderRadius: 16,
      overflow: "hidden",
      ...Platform.select<ViewStyle>({
        ios: {
          shadowColor: bright,
          shadowOpacity: op * 0.55,
          shadowRadius: radius * 0.45,
          shadowOffset: { width: 0, height: 2 },
        },
        android: { elevation: 6 },
        default: {},
      }),
    },
    momentWrap: {
      borderWidth: 2,
      borderColor: hexToRgba(primary, 0.88),
      borderRadius: 16,
      overflow: "hidden",
      ...Platform.select<ViewStyle>({
        ios: {
          shadowColor: bright,
          shadowOpacity: op * 0.5,
          shadowRadius: radius * 0.42,
          shadowOffset: { width: 0, height: 2 },
        },
        android: { elevation: 5 },
        default: {},
      }),
    },
    momentInner: {
      backgroundColor: hexToRgba(edge, 0.52),
    },
    outerShell,
  };
}
