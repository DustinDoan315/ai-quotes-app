import { useEffect, useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import Animated, { cancelAnimation, Easing, useAnimatedProps, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { HOME_AMBIENT_LAYOUT } from "@/theme/homeAmbient";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
type Props = { active: boolean; accentColor: string; width: number; height: number };
/** Presentation sits outside the image capture so exports contain only the moment. */
export function QuoteGenerationGlow({ active, accentColor, width, height }: Props) {
  const reduceMotion = useReducedMotionPreference();
  const gradientId = `quote-edge-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const offset = useSharedValue(0);
  const radius = HOME_AMBIENT_LAYOUT.radius - 2;
  const perimeter = Math.max(1, 2 * (width - 4 + height - 4) - 8 * radius + 2 * Math.PI * radius);
  useEffect(() => {
    cancelAnimation(offset);
    offset.value = 0;
    if (active && !reduceMotion) {
      offset.value = withRepeat(withTiming(-perimeter, { duration: 4800, easing: Easing.linear }), -1, false);
    }
    return () => {
      cancelAnimation(offset);
    };
  }, [active, reduceMotion, offset, perimeter]);
  const sweep = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));
  if (!active) return null;
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.overlay, { width, height }]}>
    <View style={styles.dim} />
    <View style={[styles.halo, { borderColor: accentColor, shadowColor: accentColor }]} />
    <View style={[styles.edge, { borderColor: accentColor }]} />
    <Svg width={width + 40} height={height + 40} style={styles.glowCanvas}>
      <Defs><LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0" stopColor={accentColor} /><Stop offset="0.5" stopColor="#ffffff" /><Stop offset="1" stopColor={accentColor} />
      </LinearGradient></Defs>
      {/* Concentric translucent strokes soften the edge on both native platforms. */}
      {[{ width: 28, opacity: 0.04 }, { width: 18, opacity: 0.07 }, { width: 10, opacity: 0.1 }].map((layer) =>
        <Rect key={layer.width} x={22} y={22} width={Math.max(0, width - 4)} height={Math.max(0, height - 4)} rx={radius} fill="none" stroke={accentColor} strokeWidth={layer.width} opacity={layer.opacity} />
      )}
      {!reduceMotion && [{ width: 24, opacity: 0.08 }, { width: 16, opacity: 0.16 }, { width: 8, opacity: 0.28 }, { width: 4, opacity: 0.7 }].map((layer) =>
        <AnimatedRect key={layer.width} animatedProps={sweep} x={22} y={22} width={Math.max(0, width - 4)} height={Math.max(0, height - 4)} rx={radius} fill="none" stroke={`url(#${gradientId})`} strokeWidth={layer.width} opacity={layer.opacity} strokeLinecap="round" strokeDasharray={[perimeter * 0.3, perimeter * 0.7]} />
      )}
    </Svg>
  </View>;
}
const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, alignSelf: "center", zIndex: 10, borderRadius: HOME_AMBIENT_LAYOUT.radius },
  glowCanvas: { position: "absolute", top: -20, left: -20 },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.04)", borderRadius: HOME_AMBIENT_LAYOUT.radius },
  halo: { ...StyleSheet.absoluteFillObject, shadowOpacity: 0.6, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, borderWidth: 1, borderRadius: HOME_AMBIENT_LAYOUT.radius },
  edge: { ...StyleSheet.absoluteFillObject, opacity: 0.45, borderWidth: 1, borderRadius: HOME_AMBIENT_LAYOUT.radius },
});
