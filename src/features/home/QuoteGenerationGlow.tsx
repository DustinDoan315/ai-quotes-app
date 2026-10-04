import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { HOME_AMBIENT_LAYOUT } from "@/theme/homeAmbient";

type Props = { active: boolean; accentColor: string; width: number; height: number };
/** Presentation sits outside the image capture so exports contain only the moment. */
export function QuoteGenerationGlow({ active, accentColor, width, height }: Props) {
  const reduceMotion = useReducedMotionPreference();
  const opacity = useSharedValue(0.35);
  useEffect(() => {
    cancelAnimation(opacity);
    opacity.value = 0.35;
    if (active && !reduceMotion) opacity.value = withRepeat(withTiming(0.7, { duration: 1700 }), -1, true);
    return () => cancelAnimation(opacity);
  }, [active, reduceMotion, opacity]);
  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));
  if (!active) return null;
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.overlay, { width, height }]}>
    <View style={styles.dim} />
    <Animated.View style={[styles.edge, { borderColor: accentColor, shadowColor: accentColor }, pulse]} />
  </View>;
}
const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, alignSelf: "center", zIndex: 10, borderRadius: HOME_AMBIENT_LAYOUT.radius },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.08)", borderRadius: HOME_AMBIENT_LAYOUT.radius },
  edge: { ...StyleSheet.absoluteFillObject, shadowOpacity: 0.65, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, borderWidth: 2, borderRadius: HOME_AMBIENT_LAYOUT.radius },
});
