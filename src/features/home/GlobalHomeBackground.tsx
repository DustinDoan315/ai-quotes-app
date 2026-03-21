import { colors } from "@/theme/colors";
import { StyleSheet, View } from "react-native";

export function GlobalHomeBackground() {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.screenBackground }]}
    />
  );
}
