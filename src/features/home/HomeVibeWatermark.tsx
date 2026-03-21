import { Text, View } from "react-native";
import { HOME_VIBE_RARITY_STYLE } from "@/theme/homeVibeRarity";
import { strings } from "@/theme/strings";
import type { HomeVibeHintParts } from "@/types/homeBackground";

interface HomeVibeWatermarkProps {
  readonly vibeHint: HomeVibeHintParts;
  readonly placement: "top" | "bottom";
  readonly avoidTrash?: boolean;
  readonly horizontalAlign?: "left" | "right";
  readonly rotated?: boolean;
}

export function HomeVibeWatermark({
  vibeHint,
  placement,
  avoidTrash,
  horizontalAlign = "right",
  rotated = true,
}: HomeVibeWatermarkProps) {
  const rarityStyle = HOME_VIBE_RARITY_STYLE[vibeHint.rarity];
  let positionClass = "bottom-3 right-3";
  if (placement === "top") {
    if (horizontalAlign === "left") {
      positionClass = avoidTrash ? "left-3 top-14" : "left-3 top-3";
    } else {
      positionClass = avoidTrash ? "right-3 top-14" : "right-3 top-3";
    }
  }
  return (
    <View
      accessible
      pointerEvents="none"
      className={`absolute z-30 ${positionClass}`}
      accessibilityLabel={`${vibeHint.vibeName}, ${vibeHint.rarityLabel}, ${strings.home.luckLabel} ${vibeHint.luckPercent}`}>
      <View
        className="rounded-md border border-white/15 bg-black/50 px-2.5 py-1.5"
        style={rotated ? { transform: [{ rotate: "-9deg" }] } : undefined}>
        <Text
          className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/75"
          numberOfLines={1}>
          {vibeHint.vibeName}
        </Text>
        <View className="mt-0.5 flex-row items-center gap-1.5">
          <View
            className={`h-1.5 w-1.5 rounded-full border border-white/30 ${rarityStyle.dot}`}
            accessibilityElementsHidden
          />
          <Text
            className={`text-[10px] font-bold tabular-nums ${rarityStyle.text}`}
            importantForAccessibility="no">
            {strings.home.vibeRarityShort[vibeHint.rarity]}
          </Text>
          <Text className="text-[9px] text-white/45">·</Text>
          <Text
            className="text-[9px] font-medium tabular-nums text-white/55"
            numberOfLines={1}>
            {strings.home.luckLabel} {vibeHint.luckPercent}
          </Text>
        </View>
      </View>
    </View>
  );
}
