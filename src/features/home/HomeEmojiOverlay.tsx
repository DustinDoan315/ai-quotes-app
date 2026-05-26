import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import type { EmojiBurst } from "@/features/home/useHomeFeedState";

type Props = {
  bursts: EmojiBurst[];
  screenHeight: number;
};

const TOTAL_MS = 2600;
const FADE_IN_MS = 180;
const FADE_OUT_MS = 700;
const HOLD_MS = TOTAL_MS - FADE_IN_MS - FADE_OUT_MS;

// Each emoji is its own component so it can own its shared values
function EmojiParticle({
  burst,
  screenHeight,
}: {
  burst: EmojiBurst;
  screenHeight: number;
}) {
  const translateY = useSharedValue(screenHeight * 0.25);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(burst.scale * 0.75);
  const opacity = useSharedValue(0);
  const rotateZ = useSharedValue(0);

  useEffect(() => {
    // Horizontal drift distance — varies with scale so bigger emojis arc wider
    const driftDist = 30 + burst.scale * 22;

    // Opacity: quick fade in → hold → fade out
    opacity.value = withDelay(
      burst.delay,
      withSequence(
        withTiming(1, { duration: FADE_IN_MS }),
        withTiming(1, { duration: HOLD_MS }),
        withTiming(0, { duration: FADE_OUT_MS, easing: Easing.in(Easing.quad) })
      )
    );

    // Rise: accelerates upward like a released balloon
    translateY.value = withDelay(
      burst.delay,
      withTiming(-(screenHeight * 1.35), {
        duration: TOTAL_MS,
        easing: Easing.in(Easing.quad),
      })
    );

    // Sideways arc drift — decelerates as it rises (out easing = fast start, slow end)
    translateX.value = withDelay(
      burst.delay,
      withTiming(burst.driftDir * driftDist, {
        duration: TOTAL_MS,
        easing: Easing.out(Easing.sin),
      })
    );

    // Scale: pop in with overshoot → settle
    scale.value = withDelay(
      burst.delay,
      withSequence(
        withTiming(burst.scale * 1.55, {
          duration: 280,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(burst.scale * 1.2, {
          duration: 480,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(burst.scale * 1.05, {
          duration: TOTAL_MS - 760,
          easing: Easing.linear,
        })
      )
    );

    // Gentle tumble in the drift direction
    rotateZ.value = withDelay(
      burst.delay,
      withTiming(burst.driftDir * 24, {
        duration: TOTAL_MS,
        easing: Easing.inOut(Easing.sin),
      })
    );

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(translateX);
      cancelAnimation(scale);
      cancelAnimation(opacity);
      cancelAnimation(rotateZ);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
      { rotate: rotateZ.value + "deg" },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { left: `${burst.x}%` as any },
        animStyle,
      ]}
    >
      <Text style={styles.emoji}>{burst.emoji}</Text>
    </Animated.View>
  );
}

export function HomeEmojiOverlay({ bursts, screenHeight }: Props) {
  return (
    <View style={styles.overlay} pointerEvents="none">
      {bursts.map((burst) => (
        <EmojiParticle key={burst.id} burst={burst} screenHeight={screenHeight} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    inset: 0,
  } as any,
  particle: {
    position: "absolute",
    bottom: 60,
  },
  emoji: {
    fontSize: 48,
  },
});
