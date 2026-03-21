import { HomeBackground } from "@/features/home/HomeBackground";
import { useHomeBackgroundPalette } from "@/features/home/useHomeBackgroundPalette";
import { StyleSheet, View } from "react-native";

export function GlobalHomeBackground() {
  const { palette } = useHomeBackgroundPalette();
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <HomeBackground palette={palette} />
    </View>
  );
}
