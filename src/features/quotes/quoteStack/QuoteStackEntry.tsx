import type { QuoteStack } from "./types";
import { QuoteMomentCard } from "@/features/quotes/QuoteMomentCard";
import { useMemo, useEffect, useState, useCallback } from "react";
import { useWindowDimensions, View, StyleSheet } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { QuotePhotoCard } from "@/services/media/userPhotosApi";

type DotProps = { isActive: boolean };

function AnimatedDot({ isActive }: DotProps) {
  const dotWidth = useSharedValue(isActive ? 18 : 6);

  useEffect(() => {
    dotWidth.value = withSpring(isActive ? 18 : 6, {
      damping: 18,
      stiffness: 220,
      mass: 0.6,
    });
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const dotStyle = useAnimatedStyle(() => ({ width: dotWidth.value }));

  return (
    <Animated.View
      style={[
        styles.dot,
        isActive ? styles.dotActiveColor : styles.dotInactiveColor,
        dotStyle,
      ]}
    />
  );
}

const SWIPE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 800;
const SWIPE_OFF_DISTANCE = 500;
const SNAP_BACK_SPRING = { damping: 20, stiffness: 320, mass: 0.8 };
const PROMOTION_SPRING = { damping: 18, stiffness: 200 };

type Props = {
  readonly stack: QuoteStack;
  readonly screenHeight: number;
  readonly authorName: string;
  readonly authorAvatarUrl: string | null;
  readonly isActive: boolean;
  readonly onActiveQuoteIdChange: (quoteId: string) => void;
};

export function QuoteStackEntry({
  stack,
  screenHeight,
  authorName,
  authorAvatarUrl,
  isActive,
  onActiveQuoteIdChange,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();

  const itemWidth = useMemo(() => {
    const ideal = windowWidth - 32;
    const capped = Math.min(448, ideal);
    return Math.max(280, capped);
  }, [windowWidth]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const quoteCount = stack.quotes.length;

  // Shared values for top card gesture
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardRotation = useSharedValue(0);
  const promotionProgress = useSharedValue(0);
  const isAnimatingOut = useSharedValue(false);
  const newTopScale = useSharedValue(1);
  const newTopOpacity = useSharedValue(1);

  const notifyActive = useCallback(
    (index: number) => {
      const quote = stack.quotes[index];
      if (!quote) return;
      onActiveQuoteIdChange(quote.id);
    },
    [onActiveQuoteIdChange, stack.quotes],
  );

  useEffect(() => {
    if (!isActive) return;
    setCurrentIndex(0);
    translateX.value = 0;
    translateY.value = 0;
    cardRotation.value = 0;
    promotionProgress.value = 0;
    isAnimatingOut.value = false;
    notifyActive(0);
  }, [isActive, stack.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isActive) return;
    const quote = stack.quotes[currentIndex];
    if (!quote) return;
    onActiveQuoteIdChange(quote.id);
  }, [currentIndex, isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const advanceIndex = useCallback(() => {
    const next = currentIndex + 1;
    setCurrentIndex(next);
    notifyActive(next);
    translateX.value = 0;
    translateY.value = 0;
    cardRotation.value = 0;
    promotionProgress.value = 0;
    isAnimatingOut.value = false;
    newTopScale.value = 0.95;
    newTopOpacity.value = 0.8;
    newTopScale.value = withSpring(1, { damping: 16, stiffness: 200, mass: 0.7 });
    newTopOpacity.value = withTiming(1, { duration: 220 });
  }, [currentIndex, notifyActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isActive)
        .activeOffsetX([-10, 10])
        .failOffsetY([-20, 20])
        .onUpdate((e) => {
          "worklet";
          if (isAnimatingOut.value) return;
          translateX.value = e.translationX;
          translateY.value = e.translationY * 0.12;
          cardRotation.value = interpolate(
            e.translationX,
            [-SWIPE_OFF_DISTANCE, SWIPE_OFF_DISTANCE],
            [-22, 22],
            Extrapolation.CLAMP,
          );
        })
        .onEnd((e) => {
          "worklet";
          if (isAnimatingOut.value) return;
          const shouldDismiss =
            (Math.abs(e.translationX) > SWIPE_THRESHOLD ||
              Math.abs(e.velocityX) > VELOCITY_THRESHOLD) &&
            currentIndex < quoteCount - 1;

          if (shouldDismiss) {
            isAnimatingOut.value = true;
            const dir = Math.sign(e.translationX);
            translateX.value = withTiming(dir * SWIPE_OFF_DISTANCE, {
              duration: 260,
            });
            cardRotation.value = withTiming(dir * 28, { duration: 260 });
            promotionProgress.value = withSpring(1, PROMOTION_SPRING, () => {
              runOnJS(advanceIndex)();
            });
          } else {
            translateX.value = withSpring(0, SNAP_BACK_SPRING);
            translateY.value = withSpring(0, SNAP_BACK_SPRING);
            cardRotation.value = withSpring(0, SNAP_BACK_SPRING);
          }
        }),
    [isActive, currentIndex, quoteCount, advanceIndex], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const topCardEntranceStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${cardRotation.value}deg` },
      { scale: newTopScale.value },
    ],
    opacity: newTopOpacity.value,
  }));

  const secondCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(promotionProgress.value, [0, 1], [0.93, 1.0]) },
      { translateY: interpolate(promotionProgress.value, [0, 1], [14, 0]) },
    ],
    opacity: interpolate(promotionProgress.value, [0, 1], [0.82, 1.0]),
  }));

  const thirdCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(promotionProgress.value, [0, 1], [0.86, 0.93]) },
      { translateY: interpolate(promotionProgress.value, [0, 1], [28, 14]) },
    ],
    opacity: interpolate(promotionProgress.value, [0, 1], [0.6, 0.82]),
  }));

  const topItem: QuotePhotoCard | undefined = stack.quotes[currentIndex];
  const secondItem: QuotePhotoCard | undefined = stack.quotes[currentIndex + 1];
  const thirdItem: QuotePhotoCard | undefined = stack.quotes[currentIndex + 2];

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: itemWidth, height: screenHeight }}>
        {thirdItem ? (
          <Animated.View
            style={[StyleSheet.absoluteFill, thirdCardStyle]}
            pointerEvents="none">
            <QuoteMomentCard
              item={thirdItem}
              screenHeight={screenHeight}
              authorName={authorName}
              authorAvatarUrl={authorAvatarUrl}
              counterLabel={null}
            />
          </Animated.View>
        ) : null}

        {secondItem ? (
          <Animated.View
            style={[StyleSheet.absoluteFill, secondCardStyle]}
            pointerEvents="none">
            <QuoteMomentCard
              item={secondItem}
              screenHeight={screenHeight}
              authorName={authorName}
              authorAvatarUrl={authorAvatarUrl}
              counterLabel={null}
            />
          </Animated.View>
        ) : null}

        {topItem ? (
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[StyleSheet.absoluteFill, topCardEntranceStyle]}>
              <QuoteMomentCard
                item={topItem}
                screenHeight={screenHeight}
                authorName={authorName}
                authorAvatarUrl={authorAvatarUrl}
                counterLabel={quoteCount > 1 ? `${currentIndex + 1}/${quoteCount}` : null}
              />
            </Animated.View>
          </GestureDetector>
        ) : null}
      </View>

      {quoteCount > 1 ? (
        <View style={styles.dotsRow}>
          {stack.quotes.map((_, i) => (
            <AnimatedDot key={i} isActive={i === currentIndex} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActiveColor: {
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  dotInactiveColor: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
});
