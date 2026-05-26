import React, { useEffect, useRef, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
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

const { width: SCREEN_W } = Dimensions.get("window");
const RING_BASE = Math.min(Math.round(SCREEN_W * 0.2), 90);
const DROP_SIZE = 26;
const DROP_R = DROP_SIZE / 2;
const PARTICLE_SIZE = 6;

// 4 particles at cardinal directions — dx/dy pre-computed (dist = 52)
const PARTICLES = [
  { dx: 52, dy: 0 },
  { dx: 0, dy: 52 },
  { dx: -52, dy: 0 },
  { dx: 0, dy: -52 },
];

export function QuoteInkBloom({
  accentColor,
  progress,
  isComplete,
  quoteText,
}: QuoteInkBloomProps) {
  // ── Phase 1: drop ──────────────────────────────────────────────────────────
  const dropY = useSharedValue(-80);
  const dropOpacity = useSharedValue(1);
  const dropScaleX = useSharedValue(1);
  const dropScaleY = useSharedValue(1);

  // ── Phase 2: rings (4 rings for depth) ─────────────────────────────────────
  const ring1Scale = useSharedValue(0);
  const ring1Opacity = useSharedValue(0);
  const ring2Scale = useSharedValue(0);
  const ring2Opacity = useSharedValue(0);
  const ring3Scale = useSharedValue(0);
  const ring3Opacity = useSharedValue(0);
  const ring4Scale = useSharedValue(0);
  const ring4Opacity = useSharedValue(0);

  // ── Impact particles (4 dots that burst outward) ────────────────────────────
  const p1x = useSharedValue(0);
  const p1y = useSharedValue(0);
  const p1op = useSharedValue(0);
  const p2x = useSharedValue(0);
  const p2y = useSharedValue(0);
  const p2op = useSharedValue(0);
  const p3x = useSharedValue(0);
  const p3y = useSharedValue(0);
  const p3op = useSharedValue(0);
  const p4x = useSharedValue(0);
  const p4y = useSharedValue(0);
  const p4op = useSharedValue(0);

  // ── Phase 3: glow + progress ───────────────────────────────────────────────
  const glowOpacity = useSharedValue(0.45);
  const glowScale = useSharedValue(1);
  const trackWidthSV = useSharedValue(0);
  const barWidth = useSharedValue(0);

  // ── Phase 4: quote reveal + backdrop exit ──────────────────────────────────
  const quoteOpacity = useSharedValue(0);
  const quoteTranslateY = useSharedValue(20);
  const quoteScale = useSharedValue(0.94);
  const backdropOpacity = useSharedValue(1);

  const [cycleKey, setCycleKey] = useState(0);
  const isCompleteRef = useRef(isComplete);
  isCompleteRef.current = isComplete;

  // Glow pulse — both opacity and scale breathe together
  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 850, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.45, { duration: 850, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.14, { duration: 850, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.94, { duration: 850, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    return () => {
      cancelAnimation(glowOpacity);
      cancelAnimation(glowScale);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drop cycle — one iteration; restarts via cycleKey
  useEffect(() => {
    if (isCompleteRef.current) return;

    // Reset all values for a clean cycle
    dropY.value = -80;
    dropOpacity.value = 1;
    dropScaleX.value = 1;
    dropScaleY.value = 1;
    ring1Scale.value = 0;
    ring1Opacity.value = 0;
    ring2Scale.value = 0;
    ring2Opacity.value = 0;
    ring3Scale.value = 0;
    ring3Opacity.value = 0;
    ring4Scale.value = 0;
    ring4Opacity.value = 0;
    p1x.value = 0;
    p1y.value = 0;
    p1op.value = 0;
    p2x.value = 0;
    p2y.value = 0;
    p2op.value = 0;
    p3x.value = 0;
    p3y.value = 0;
    p3op.value = 0;
    p4x.value = 0;
    p4y.value = 0;
    p4op.value = 0;

    // Phase 1: drop falls — cubic easing = heavier, more weighted feel
    dropY.value = withTiming(
      0,
      { duration: 480, easing: Easing.out(Easing.cubic) },
      (finished) => {
        "worklet";
        if (!finished) return;

        // Squash on impact — scaleX expands, scaleY compresses, spring back
        dropScaleX.value = withSequence(
          withTiming(1.45, { duration: 75, easing: Easing.out(Easing.quad) }),
          withSpring(1, { damping: 10, stiffness: 280 })
        );
        dropScaleY.value = withSequence(
          withTiming(0.6, { duration: 75, easing: Easing.out(Easing.quad) }),
          withSpring(1, { damping: 10, stiffness: 280 })
        );

        // Impact particles burst outward
        p1x.value = 0;
        p1y.value = 0;
        p1op.value = 1;
        p1x.value = withTiming(PARTICLES[0]!.dx, { duration: 380, easing: Easing.out(Easing.cubic) });
        p1y.value = withTiming(PARTICLES[0]!.dy, { duration: 380, easing: Easing.out(Easing.cubic) });
        p1op.value = withDelay(60, withTiming(0, { duration: 300 }));

        p2x.value = 0;
        p2y.value = 0;
        p2op.value = 1;
        p2x.value = withTiming(PARTICLES[1]!.dx, { duration: 380, easing: Easing.out(Easing.cubic) });
        p2y.value = withTiming(PARTICLES[1]!.dy, { duration: 380, easing: Easing.out(Easing.cubic) });
        p2op.value = withDelay(60, withTiming(0, { duration: 300 }));

        p3x.value = 0;
        p3y.value = 0;
        p3op.value = 1;
        p3x.value = withTiming(PARTICLES[2]!.dx, { duration: 380, easing: Easing.out(Easing.cubic) });
        p3y.value = withTiming(PARTICLES[2]!.dy, { duration: 380, easing: Easing.out(Easing.cubic) });
        p3op.value = withDelay(60, withTiming(0, { duration: 300 }));

        p4x.value = 0;
        p4y.value = 0;
        p4op.value = 1;
        p4x.value = withTiming(PARTICLES[3]!.dx, { duration: 380, easing: Easing.out(Easing.cubic) });
        p4y.value = withTiming(PARTICLES[3]!.dy, { duration: 380, easing: Easing.out(Easing.cubic) });
        p4op.value = withDelay(60, withTiming(0, { duration: 300 }));

        // Phase 2: 4 rings bloom with staggered delays, cubic easing = more organic spread
        ring1Scale.value = withTiming(1.7, { duration: 920, easing: Easing.out(Easing.cubic) });
        ring1Opacity.value = withSequence(
          withTiming(0.75, { duration: 1 }),
          withTiming(0, { duration: 900 })
        );

        ring2Scale.value = withDelay(
          140,
          withTiming(2.15, { duration: 960, easing: Easing.out(Easing.cubic) })
        );
        ring2Opacity.value = withDelay(
          140,
          withSequence(withTiming(0.6, { duration: 1 }), withTiming(0, { duration: 940 }))
        );

        ring3Scale.value = withDelay(
          280,
          withTiming(2.6, { duration: 1000, easing: Easing.out(Easing.cubic) })
        );
        ring3Opacity.value = withDelay(
          280,
          withSequence(withTiming(0.45, { duration: 1 }), withTiming(0, { duration: 980 }))
        );

        ring4Scale.value = withDelay(
          420,
          withTiming(3.1, { duration: 1040, easing: Easing.out(Easing.cubic) })
        );
        ring4Opacity.value = withDelay(
          420,
          withSequence(withTiming(0.3, { duration: 1 }), withTiming(0, { duration: 1020 }))
        );

        // Droplet fades after rings settle; restart cycle after full fade
        dropOpacity.value = withDelay(
          900,
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
      cancelAnimation(dropScaleX);
      cancelAnimation(dropScaleY);
      cancelAnimation(ring1Scale);
      cancelAnimation(ring1Opacity);
      cancelAnimation(ring2Scale);
      cancelAnimation(ring2Opacity);
      cancelAnimation(ring3Scale);
      cancelAnimation(ring3Opacity);
      cancelAnimation(ring4Scale);
      cancelAnimation(ring4Opacity);
      cancelAnimation(p1x);
      cancelAnimation(p1y);
      cancelAnimation(p1op);
      cancelAnimation(p2x);
      cancelAnimation(p2y);
      cancelAnimation(p2op);
      cancelAnimation(p3x);
      cancelAnimation(p3y);
      cancelAnimation(p3op);
      cancelAnimation(p4x);
      cancelAnimation(p4y);
      cancelAnimation(p4op);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleKey]);

  // Progress bar — updates whenever progress prop changes
  useEffect(() => {
    barWidth.value = withTiming(progress, { duration: 350 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  // Phase 4: settle when isComplete flips true
  useEffect(() => {
    if (!isComplete) return;

    cancelAnimation(dropY);
    cancelAnimation(dropOpacity);
    cancelAnimation(dropScaleX);
    cancelAnimation(dropScaleY);
    cancelAnimation(ring1Scale);
    cancelAnimation(ring1Opacity);
    cancelAnimation(ring2Scale);
    cancelAnimation(ring2Opacity);
    cancelAnimation(ring3Scale);
    cancelAnimation(ring3Opacity);
    cancelAnimation(ring4Scale);
    cancelAnimation(ring4Opacity);

    // Final big bloom — expo easing = explosive fast start that gracefully decelerates
    ring1Scale.value = 0;
    ring1Opacity.value = 0.7;
    ring1Scale.value = withTiming(5.5, {
      duration: 720,
      easing: Easing.out(Easing.exp),
    });
    ring1Opacity.value = withTiming(0, { duration: 700 });

    // Second final bloom — softer, larger, slight delay
    ring2Scale.value = 0;
    ring2Opacity.value = 0.4;
    ring2Scale.value = withDelay(
      80,
      withTiming(7.5, { duration: 800, easing: Easing.out(Easing.exp) })
    );
    ring2Opacity.value = withDelay(80, withTiming(0, { duration: 760 }));

    // Drop dissolves with squash
    dropScaleX.value = withTiming(0, { duration: 280 });
    dropScaleY.value = withTiming(0, { duration: 280 });
    dropOpacity.value = withTiming(0, { duration: 260 });

    // Quote reveals: float up + scale spring + fade in
    quoteOpacity.value = withDelay(240, withTiming(1, { duration: 540 }));
    quoteTranslateY.value = withDelay(
      240,
      withTiming(0, { duration: 540, easing: Easing.out(Easing.cubic) })
    );
    quoteScale.value = withDelay(
      240,
      withSpring(1, { damping: 15, stiffness: 160 })
    );

    // Backdrop fades last
    backdropOpacity.value = withDelay(440, withTiming(0, { duration: 680 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  // ── Animated styles ────────────────────────────────────────────────────────
  const dropStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: dropY.value },
      { scaleX: dropScaleX.value },
      { scaleY: dropScaleY.value },
    ],
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
  const ring4Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring4Scale.value }],
    opacity: ring4Opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: barWidth.value * trackWidthSV.value,
  }));

  const quoteStyle = useAnimatedStyle(() => ({
    opacity: quoteOpacity.value,
    transform: [
      { translateY: quoteTranslateY.value },
      { scale: quoteScale.value },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const p1Style = useAnimatedStyle(() => ({
    opacity: p1op.value,
    transform: [{ translateX: p1x.value }, { translateY: p1y.value }],
  }));
  const p2Style = useAnimatedStyle(() => ({
    opacity: p2op.value,
    transform: [{ translateX: p2x.value }, { translateY: p2y.value }],
  }));
  const p3Style = useAnimatedStyle(() => ({
    opacity: p3op.value,
    transform: [{ translateX: p3x.value }, { translateY: p3y.value }],
  }));
  const p4Style = useAnimatedStyle(() => ({
    opacity: p4op.value,
    transform: [{ translateX: p4x.value }, { translateY: p4y.value }],
  }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.container, backdropStyle]}
    >
      {/* Dark backdrop */}
      <View style={[StyleSheet.absoluteFill, styles.backdrop]} />

      {/* Center animation stage */}
      <View style={styles.center}>
        {/* Phase 3: glow — larger radius, breathing scale */}
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: accentColor,
              shadowColor: accentColor,
            },
            glowStyle,
          ]}
        />

        {/* Phase 2: rings — largest renders first (underneath) */}
        <Animated.View
          style={[
            styles.ring,
            { borderColor: accentColor, shadowColor: accentColor },
            ring4Style,
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            { borderColor: accentColor, shadowColor: accentColor },
            ring3Style,
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            { borderColor: accentColor, shadowColor: accentColor },
            ring2Style,
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            { borderColor: accentColor, shadowColor: accentColor },
            ring1Style,
          ]}
        />

        {/* Impact particles */}
        <Animated.View
          style={[
            styles.particle,
            { backgroundColor: accentColor },
            p1Style,
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            { backgroundColor: accentColor },
            p2Style,
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            { backgroundColor: accentColor },
            p3Style,
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            { backgroundColor: accentColor },
            p4Style,
          ]}
        />

        {/* Phase 1: droplet — larger, with shadow depth + squash/stretch */}
        <Animated.View
          style={[
            styles.drop,
            {
              backgroundColor: accentColor,
              shadowColor: accentColor,
            },
            dropStyle,
          ]}
        />

        {/* Phase 4: quote text */}
        {quoteText ? (
          <Animated.View style={[styles.quoteContainer, quoteStyle]}>
            <Text style={styles.quoteText}>{quoteText}</Text>
          </Animated.View>
        ) : null}
      </View>

      {/* Phase 3: progress bar with glowing tip */}
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
        >
          <View
            style={[
              styles.progressTip,
              { backgroundColor: accentColor, shadowColor: accentColor },
            ]}
          />
        </Animated.View>
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
    backgroundColor: "rgba(0,0,0,0.78)",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 28,
    shadowOpacity: 0.9,
    elevation: 10,
  },
  ring: {
    position: "absolute",
    width: RING_BASE,
    height: RING_BASE,
    borderRadius: RING_BASE / 2,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 7,
    shadowOpacity: 0.75,
    elevation: 4,
  },
  particle: {
    position: "absolute",
    width: PARTICLE_SIZE,
    height: PARTICLE_SIZE,
    borderRadius: PARTICLE_SIZE / 2,
  },
  drop: {
    width: DROP_SIZE,
    height: DROP_SIZE,
    borderRadius: DROP_R,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    shadowOpacity: 1,
    elevation: 8,
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
    overflow: "visible",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    overflow: "visible",
  },
  progressTip: {
    position: "absolute",
    right: -3,
    top: -2,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 5,
    shadowOpacity: 1,
    elevation: 4,
  },
});
