import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export interface QuoteInkBloomProps {
  accentColor: string;
  /** 0–1 float driven by generationProgress */
  progress: number;
  /** Flip to true when generation finishes to trigger the settle sequence */
  isComplete: boolean;
  /** Quote text shown after settle completes */
  quoteText?: string;
}

const RING_BASE = 72;
const DROP_SIZE = 18;

export function QuoteInkBloom({
  accentColor,
  progress,
  isComplete,
  quoteText,
}: QuoteInkBloomProps) {
  // ── Phase 1: drop ──────────────────────────────────────────────────────────
  const dropY = useSharedValue(-60);
  const dropOpacity = useSharedValue(1);
  const dropScale = useSharedValue(1);

  // ── Phase 2: rings ─────────────────────────────────────────────────────────
  const ring1Scale = useSharedValue(0);
  const ring1Opacity = useSharedValue(0);
  const ring2Scale = useSharedValue(0);
  const ring2Opacity = useSharedValue(0);
  const ring3Scale = useSharedValue(0);
  const ring3Opacity = useSharedValue(0);

  // ── Phase 3: glow + progress ───────────────────────────────────────────────
  const glowOpacity = useSharedValue(0.3);
  const trackWidthSV = useSharedValue(0); // set via onLayout
  const barWidth = useSharedValue(0);     // 0–1 fraction × trackWidthSV → px

  // ── Phase 4: quote reveal + backdrop exit ──────────────────────────────────
  const quoteOpacity = useSharedValue(0);
  const quoteTranslateY = useSharedValue(14);
  const backdropOpacity = useSharedValue(1);

  // cycleKey increments to restart the drop loop each cycle
  const [cycleKey, setCycleKey] = useState(0);
  const isCompleteRef = useRef(isComplete);
  isCompleteRef.current = isComplete;

  // Glow pulse — runs once, repeats indefinitely, cancelled on unmount
  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 900 }),
        withTiming(0.3, { duration: 900 })
      ),
      -1,
      false
    );
    return () => cancelAnimation(glowOpacity);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drop cycle — one iteration; restarts itself via cycleKey when not complete
  useEffect(() => {
    if (isCompleteRef.current) return;

    // Reset all loop values for a clean cycle
    dropY.value = -60;
    dropOpacity.value = 1;
    dropScale.value = 1;
    ring1Scale.value = 0;
    ring1Opacity.value = 0;
    ring2Scale.value = 0;
    ring2Opacity.value = 0;
    ring3Scale.value = 0;
    ring3Opacity.value = 0;

    // Phase 1: drop falls (400ms)
    dropY.value = withTiming(
      0,
      { duration: 400, easing: Easing.out(Easing.quad) },
      (finished) => {
        "worklet";
        if (!finished) return;

        // Spring overshoot on impact
        dropScale.value = withSpring(1, { damping: 14, stiffness: 180 });

        // Phase 2: three rings bloom with staggered delays
        ring1Scale.value = withTiming(1.6, {
          duration: 700,
          easing: Easing.out(Easing.quad),
        });
        ring1Opacity.value = withSequence(
          withTiming(0.7, { duration: 1 }),
          withTiming(0, { duration: 700 })
        );

        ring2Scale.value = withDelay(
          160,
          withTiming(2.0, { duration: 700, easing: Easing.out(Easing.quad) })
        );
        ring2Opacity.value = withDelay(
          160,
          withSequence(
            withTiming(0.6, { duration: 1 }),
            withTiming(0, { duration: 700 })
          )
        );

        ring3Scale.value = withDelay(
          320,
          withTiming(2.4, { duration: 700, easing: Easing.out(Easing.quad) })
        );
        ring3Opacity.value = withDelay(
          320,
          withSequence(
            withTiming(0.5, { duration: 1 }),
            withTiming(0, { duration: 700 })
          )
        );

        // Droplet fades 600ms after impact; on complete, restart cycle
        dropOpacity.value = withDelay(
          600,
          withTiming(0, { duration: 200 }, (f) => {
            "worklet";
            if (f && !isCompleteRef.current) {
              runOnJS(setCycleKey)((k: number) => k + 1);
            }
          })
        );
      }
    );

    return () => {
      cancelAnimation(dropY);
      cancelAnimation(dropOpacity);
      cancelAnimation(dropScale);
      cancelAnimation(ring1Scale);
      cancelAnimation(ring1Opacity);
      cancelAnimation(ring2Scale);
      cancelAnimation(ring2Opacity);
      cancelAnimation(ring3Scale);
      cancelAnimation(ring3Opacity);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleKey]);

  // Progress bar — updates whenever progress prop changes
  useEffect(() => {
    barWidth.value = withTiming(progress, { duration: 350 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  // Phase 4: settle when isComplete flips to true
  useEffect(() => {
    if (!isComplete) return;

    // Stop the loop
    cancelAnimation(dropY);
    cancelAnimation(dropOpacity);
    cancelAnimation(ring1Scale);
    cancelAnimation(ring1Opacity);
    cancelAnimation(ring2Scale);
    cancelAnimation(ring2Opacity);
    cancelAnimation(ring3Scale);
    cancelAnimation(ring3Opacity);

    // Final large bloom from ring1
    ring1Scale.value = 0;
    ring1Opacity.value = 0.6;
    ring1Scale.value = withTiming(4, {
      duration: 600,
      easing: Easing.out(Easing.quad),
    });
    ring1Opacity.value = withTiming(0, { duration: 600 });

    // Droplet dissolves
    dropOpacity.value = withTiming(0, { duration: 300 });
    dropScale.value = withTiming(0, { duration: 300 });

    // Quote fades in + floats up
    quoteOpacity.value = withDelay(200, withTiming(1, { duration: 480 }));
    quoteTranslateY.value = withDelay(
      200,
      withTiming(0, { duration: 480, easing: Easing.out(Easing.quad) })
    );

    // Backdrop exits last
    backdropOpacity.value = withDelay(400, withTiming(0, { duration: 600 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  // ── Animated styles ────────────────────────────────────────────────────────
  const dropStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dropY.value }, { scale: dropScale.value }],
    opacity: dropOpacity.value,
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring3Scale.value }],
    opacity: ring3Opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const barStyle = useAnimatedStyle(() => ({
    // Pixel width avoids percentage-string worklet issues
    width: barWidth.value * trackWidthSV.value,
  }));

  const quoteStyle = useAnimatedStyle(() => ({
    opacity: quoteOpacity.value,
    transform: [{ translateY: quoteTranslateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, backdropStyle]}>
      {/* Dark backdrop */}
      <View style={[StyleSheet.absoluteFill, styles.backdrop]} />

      {/* Center animation stage */}
      <View style={styles.center}>
        {/* Phase 3: glow */}
        <Animated.View
          style={[styles.glow, { backgroundColor: accentColor }, glowStyle]}
        />

        {/* Phase 2: rings (largest renders first = underneath) */}
        <Animated.View
          style={[styles.ring, { borderColor: accentColor }, ring3Style]}
        />
        <Animated.View
          style={[styles.ring, { borderColor: accentColor }, ring2Style]}
        />
        <Animated.View
          style={[styles.ring, { borderColor: accentColor }, ring1Style]}
        />

        {/* Phase 1: droplet */}
        <Animated.View
          style={[styles.drop, { backgroundColor: accentColor }, dropStyle]}
        />

        {/* Phase 4: quote text */}
        {quoteText ? (
          <Animated.View style={[styles.quoteContainer, quoteStyle]}>
            <Text style={styles.quoteText}>{quoteText}</Text>
          </Animated.View>
        ) : null}
      </View>

      {/* Phase 3: progress bar */}
      <View
        style={styles.progressTrack}
        onLayout={(e) => {
          trackWidthSV.value = e.nativeEvent.layout.width;
        }}
      >
        <Animated.View
          style={[
            styles.progressFill,
            { backgroundColor: accentColor },
            barStyle,
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 7,
    borderRadius: 25,
    overflow: "hidden",
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  ring: {
    position: "absolute",
    width: RING_BASE,
    height: RING_BASE,
    borderRadius: RING_BASE / 2,
    borderWidth: 1.5,
  },
  drop: {
    width: DROP_SIZE,
    height: DROP_SIZE,
    borderRadius: DROP_SIZE / 2,
  },
  quoteContainer: {
    position: "absolute",
    paddingHorizontal: 32,
  },
  quoteText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 28,
  },
  progressTrack: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    height: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
});
