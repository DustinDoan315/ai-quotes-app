import { useEffect, useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import Animated, { cancelAnimation, Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { HOME_AMBIENT_LAYOUT } from "@/theme/homeAmbient";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
type Props = { active: boolean; accentColor: string; width: number; height: number };
/** Presentation sits outside the image capture so exports contain only the moment. */
export function QuoteGenerationGlow({ active, accentColor, width, height }: Props) {
  const reduceMotion = useReducedMotionPreference();
  const gradientId = `quote-edge-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const opacity = useSharedValue(0.7);
  const offset = useSharedValue(0);
  const radius = HOME_AMBIENT_LAYOUT.radius - 2;
  const perimeter = Math.max(1, 2 * (width - 4 + height - 4) - 8 * radius + 2 * Math.PI * radius);
  useEffect(() => {
    cancelAnimation(opacity);
    cancelAnimation(offset);
    opacity.value = 0.7;
    offset.value = 0;
    if (active && !reduceMotion) {
      opacity.value = withRepeat(withTiming(1, { duration: 1400 }), -1, true);
      offset.value = withRepeat(withTiming(-perimeter, { duration: 3200, easing: Easing.linear }), -1, false);
    }
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(offset);
    };
  }, [active, reduceMotion, opacity, offset, perimeter]);
  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const sweep = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));
  if (!active) return null;
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.overlay, { width, height }]}>
    <View style={styles.dim} />
    <Animated.View style={[styles.halo, { borderColor: accentColor, shadowColor: accentColor }, pulse]} />
    <View style={[styles.edge, { borderColor: accentColor }]} />
    {!reduceMotion && <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs><LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0" stopColor={accentColor} /><Stop offset="0.5" stopColor="#ffffff" /><Stop offset="1" stopColor={accentColor} />
      </LinearGradient></Defs>
      <AnimatedRect animatedProps={sweep} x={2} y={2} width={Math.max(0, width - 4)} height={Math.max(0, height - 4)} rx={radius} fill="none" stroke={`url(#${gradientId})`} strokeWidth={3} strokeLinecap="round" strokeDasharray={[perimeter * 0.22, perimeter * 0.78]} />
    </Svg>}
  </View>;
}
const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, alignSelf: "center", zIndex: 10, borderRadius: HOME_AMBIENT_LAYOUT.radius },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.04)", borderRadius: HOME_AMBIENT_LAYOUT.radius },
  halo: { ...StyleSheet.absoluteFillObject, shadowOpacity: 0.8, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, borderWidth: 5, borderRadius: HOME_AMBIENT_LAYOUT.radius },
  edge: { ...StyleSheet.absoluteFillObject, opacity: 0.7, borderWidth: 2, borderRadius: HOME_AMBIENT_LAYOUT.radius },
});
