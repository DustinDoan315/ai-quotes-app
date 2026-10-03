import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { HomeBackgroundPalette } from '@/types/homeBackground';
import { getHomeAmbientColors, HOME_AMBIENT_LAYOUT } from '@/theme/homeAmbient';

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

type Layers = {
  palettes: [HomeBackgroundPalette, HomeBackgroundPalette];
  front: 0 | 1;
  animating: boolean;
  revision: number;
};

export function HomeAmbientBackground({ palette, reduceMotion }: { palette: HomeBackgroundPalette; reduceMotion: boolean }) {
  const [layers, setLayers] = useState<Layers>(() => ({ palettes: [palette, palette], front: 0, animating: false, revision: 0 }));
  const latest = useRef({ palette, reduceMotion });
  const opacities = useRef([new Animated.Value(1), new Animated.Value(0)]).current;
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  latest.current = { palette, reduceMotion };

  useEffect(() => {
    if (reduceMotion) animation.current?.stop();
    setLayers(current => {
      if (reduceMotion) return { palettes: [palette, palette], front: current.front, animating: false, revision: current.revision + 1 };
      // Finish the visible blend before adopting the latest requested palette.
      if (current.animating || current.palettes[current.front] === palette) return current;
      const incoming = current.front === 0 ? 1 : 0;
      const palettes: Layers['palettes'] = [...current.palettes];
      palettes[incoming] = palette;
      return { ...current, palettes, animating: true, revision: current.revision + 1 };
    });
  }, [palette, reduceMotion]);

  useLayoutEffect(() => {
    const incoming = layers.front === 0 ? 1 : 0;
    opacities[layers.front].setValue(1);
    // Reset only after the hidden slot's new palette has been committed.
    opacities[incoming].setValue(0);
    if (!layers.animating) return;
    const blend = Animated.timing(opacities[incoming], { toValue: 1, duration: HOME_AMBIENT_LAYOUT.crossfadeDuration, useNativeDriver: true });
    animation.current = blend;
    blend.start(({ finished }) => {
      if (!finished) return;
      setLayers(current => {
        if (current.revision !== layers.revision) return current;
        const requested = latest.current;
        const settled = current.palettes[incoming];
        const palettes: Layers['palettes'] = [...current.palettes];
        const queued = !requested.reduceMotion && requested.palette !== settled;
        if (queued) palettes[current.front] = requested.palette;
        return { palettes, front: incoming, animating: queued, revision: current.revision + 1 };
      });
    });
  }, [layers, opacities]);

  useEffect(() => () => animation.current?.stop(), []);
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    {layers.palettes.map((color, slot) => <Animated.View key={slot} style={[StyleSheet.absoluteFill, { opacity: opacities[slot], zIndex: slot === layers.front ? 0 : 1 }]}><Atmosphere palette={color} /></Animated.View>)}
  </View>;
}
