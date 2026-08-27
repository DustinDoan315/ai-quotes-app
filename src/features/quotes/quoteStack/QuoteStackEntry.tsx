import type { QuoteStack } from "./types";
import { QuoteMomentCard } from "@/features/quotes/QuoteMomentCard";
import { getFeedCardWidth } from "@/features/quotes/feedCardSizing";
import { useMemo, useEffect, useState, useCallback } from "react";
import { useWindowDimensions, View, StyleSheet } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Image } from "expo-image";
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
const SNAP_BACK_SPRING = { damping: 20, stiffness: 320, mass: 0.8 };

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
    return getFeedCardWidth(windowWidth);
  }, [windowWidth]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const quoteCount = stack.quotes.length;
  const previousItem: QuotePhotoCard | undefined = stack.quotes[currentIndex - 1];
  const topItem: QuotePhotoCard | undefined = stack.quotes[currentIndex];
  const nextItem: QuotePhotoCard | undefined = stack.quotes[currentIndex + 1];
  // Shared values mirror for worklet access — avoids gesture recreation on every swipe
  const currentIndexSV = useSharedValue(0);
  const quoteCountSV = useSharedValue(quoteCount);

  // The current card follows the finger while its already-mounted neighbor enters.
  const translateX = useSharedValue(0);
  const isAnimatingOut = useSharedValue(false);

  const notifyActive = useCallback(
    (index: number) => {
      const quote = stack.quotes[index];
      if (!quote) return;
      onActiveQuoteIdChange(quote.id);
    },
    [onActiveQuoteIdChange, stack.quotes],
  );

  useEffect(() => {
    quoteCountSV.value = quoteCount;
  }, [quoteCount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isActive) return;

    const adjacentImageUrls = [previousItem?.imageUrl, nextItem?.imageUrl].filter(
      (url): url is string => Boolean(url),
    );
    if (adjacentImageUrls.length === 0) return;

    void Image.prefetch(adjacentImageUrls, "memory-disk").catch(() => {
      // The visible Expo Image still retries normally if a speculative preload fails.
    });
  }, [isActive, previousItem?.imageUrl, nextItem?.imageUrl]);

  useEffect(() => {
    if (!isActive) return;
    currentIndexSV.value = 0;
    setCurrentIndex(0);
    translateX.value = 0;
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
    const next = currentIndexSV.value + 1;
    currentIndexSV.value = next;
    setCurrentIndex(next);
    notifyActive(next);
    translateX.value = 0;
    isAnimatingOut.value = false;
  }, [notifyActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const decrementIndex = useCallback(() => {
    const prev = currentIndexSV.value - 1;
    if (prev < 0) return;
    currentIndexSV.value = prev;
    setCurrentIndex(prev);
    notifyActive(prev);
    translateX.value = 0;
    isAnimatingOut.value = false;
  }, [notifyActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isActive)
        .activeOffsetX([-5, 5])
        .failOffsetY([-40, 40])
        .onUpdate((e) => {
          "worklet";
          if (isAnimatingOut.value) return;
          translateX.value = Math.max(
            -itemWidth,
            Math.min(itemWidth, e.translationX),
          );
        })
        .onEnd((e) => {
          "worklet";
          if (isAnimatingOut.value) return;

          const isStrong =
            Math.abs(e.translationX) > SWIPE_THRESHOLD ||
            Math.abs(e.velocityX) > VELOCITY_THRESHOLD;

          const shouldGoForward =
            isStrong && e.translationX < 0 && currentIndexSV.value < quoteCountSV.value - 1;
          const shouldGoBack = isStrong && e.translationX > 0 && currentIndexSV.value > 0;

          if (shouldGoForward) {
            isAnimatingOut.value = true;
            translateX.value = withTiming(-itemWidth, { duration: 220 }, (finished) => {
              if (finished) runOnJS(advanceIndex)();
            });
          } else if (shouldGoBack) {
            isAnimatingOut.value = true;
            translateX.value = withTiming(itemWidth, { duration: 220 }, (finished) => {
              if (finished) runOnJS(decrementIndex)();
            });
          } else {
            translateX.value = withSpring(0, SNAP_BACK_SPRING);
          }
        }),
    [isActive, itemWidth, advanceIndex, decrementIndex], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const topCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const previousCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value - itemWidth }],
  }));

  const nextCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value + itemWidth }],
  }));

  return (
    <View style={{ width: itemWidth, height: screenHeight, overflow: "hidden" }}>
      {previousItem ? (
        <Animated.View
          key={`previous-${previousItem.id}`}
          style={[StyleSheet.absoluteFill, previousCardStyle]}
          pointerEvents="none">
          <QuoteMomentCard
            item={previousItem}
            screenHeight={screenHeight}
            authorName={authorName}
            authorAvatarUrl={authorAvatarUrl}
            counterLabel={null}
          />
        </Animated.View>
      ) : null}

      {nextItem ? (
        <Animated.View
          key={`next-${nextItem.id}`}
          style={[StyleSheet.absoluteFill, nextCardStyle]}
          pointerEvents="none">
          <QuoteMomentCard
            item={nextItem}
            screenHeight={screenHeight}
            authorName={authorName}
            authorAvatarUrl={authorAvatarUrl}
            counterLabel={null}
          />
        </Animated.View>
      ) : null}

      {topItem ? (
        <GestureDetector key={`top-gesture-${topItem.id}`} gesture={panGesture}>
          <Animated.View
            key={`top-${topItem.id}`}
            style={[StyleSheet.absoluteFill, topCardStyle]}>
            <QuoteMomentCard
              item={topItem}
              screenHeight={screenHeight}
              authorName={authorName}
              authorAvatarUrl={authorAvatarUrl}
              counterLabel={quoteCount > 1 ? `${currentIndex + 1}/${quoteCount}` : null}
              dotsContent={
                quoteCount > 1 ? (
                  <View style={styles.dotsRow}>
                    {stack.quotes.map((_, i) => (
                      <AnimatedDot key={i} isActive={i === currentIndex} />
                    ))}
                  </View>
                ) : null
              }
            />
          </Animated.View>
        </GestureDetector>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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
