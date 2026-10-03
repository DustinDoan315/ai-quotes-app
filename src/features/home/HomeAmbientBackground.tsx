import { useEffect, useId, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { HomeBackgroundPalette } from '@/types/homeBackground';
import { beginHomeAmbientTransition, completeHomeAmbientTransition, createHomeAmbientTransition, getHomeAmbientColors, HOME_AMBIENT_LAYOUT } from '@/theme/homeAmbient';

function Atmosphere({ palette }: { palette: HomeBackgroundPalette }) {
  const id = useId().replaceAll(':', '');
  const colors = getHomeAmbientColors(palette);
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.base }]}>
    <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id={`${id}-primary`} cx="0%" cy="25%" r="80%">
          <Stop offset="0" stopColor={colors.primaryWash} stopOpacity={0.75} />
          <Stop offset="1" stopColor={colors.primaryWash} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`${id}-secondary`} cx="100%" cy="72%" r="70%">
          <Stop offset="0" stopColor={colors.secondaryWash} stopOpacity={0.48} />
          <Stop offset="1" stopColor={colors.secondaryWash} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`${id}-scrim`} cx="50%" cy="48%" r="70%">
          <Stop offset="0" stopColor="#000000" stopOpacity={0.55} />
          <Stop offset="1" stopColor="#000000" stopOpacity={0.12} />
        </RadialGradient>
      </Defs>
      <Rect width="100" height="100" fill={`url(#${id}-primary)`} />
      <Rect width="100" height="100" fill={`url(#${id}-secondary)`} />
      <Rect width="100" height="100" fill={`url(#${id}-scrim)`} />
    </Svg>
  </View>;
}

export function HomeAmbientBackground({ palette, reduceMotion }: { palette: HomeBackgroundPalette; reduceMotion: boolean }) {
  const [layers, setLayers] = useState(() => createHomeAmbientTransition(palette));
  const state = useRef(layers);
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    opacity.stopAnimation();
    if (state.current.current === palette && !state.current.previous) return;
    const next = beginHomeAmbientTransition(state.current, palette, reduceMotion);
    state.current = next;
    setLayers(next);
    opacity.setValue(reduceMotion ? 1 : 0);
    if (reduceMotion) return;
    const animation = Animated.timing(opacity, { toValue: 1, duration: HOME_AMBIENT_LAYOUT.crossfadeDuration, useNativeDriver: true });
    animation.start(({ finished }) => {
      if (!finished || state.current.revision !== next.revision) return;
      state.current = completeHomeAmbientTransition(state.current, next.revision);
      setLayers(state.current);
    });
    return () => animation.stop();
  }, [palette, reduceMotion, opacity]);
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    {layers.previous ? <Atmosphere palette={layers.previous} /> : null}
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}><Atmosphere palette={layers.current} /></Animated.View>
  </View>;
}
