import type { QuoteStack } from "./types";
import { QuoteMomentCard } from "@/features/quotes/QuoteMomentCard";
import { useMemo, useEffect, useState, useCallback } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import type { QuotePhotoCard } from "@/services/media/userPhotosApi";
import type { SharedValue } from "react-native-reanimated";

type Props = {
  readonly stack: QuoteStack;
  readonly screenHeight: number;
  readonly authorName: string;
  readonly authorAvatarUrl: string | null;
  readonly isActive: boolean;
  readonly onActiveQuoteIdChange: (quoteId: string) => void;
};

type QuoteStackPageProps = {
  readonly item: QuotePhotoCard;
  readonly index: number;
  readonly itemWidth: number;
  readonly screenHeight: number;
  readonly authorName: string;
  readonly authorAvatarUrl: string | null;
  readonly scrollX: SharedValue<number>;
};

function QuoteStackPage({
  item,
  index,
  itemWidth,
  screenHeight,
  authorName,
  authorAvatarUrl,
  scrollX,
}: QuoteStackPageProps) {
  const pageAnimatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * itemWidth,
      index * itemWidth,
      (index + 1) * itemWidth,
    ];
    const rotateYRaw = interpolate(scrollX.value, inputRange, [
      28,
      0,
      -28,
    ]);
    const rotateY = Math.max(-28, Math.min(28, rotateYRaw));

    const translateXRaw = interpolate(scrollX.value, inputRange, [
      24,
      0,
      -24,
    ]);
    const translateX = Math.max(-24, Math.min(24, translateXRaw));

    const opacityRaw = interpolate(scrollX.value, inputRange, [
      0.65,
      1,
      0.65,
    ]);
    const opacity = Math.max(0.65, Math.min(1, opacityRaw));

    return {
      opacity,
      transform: [
        { perspective: 1200 },
        { translateX },
        { rotateY: `${rotateY}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[{ width: itemWidth }, pageAnimatedStyle]}>
      <QuoteMomentCard
        item={item}
        screenHeight={screenHeight}
        authorName={authorName}
        authorAvatarUrl={authorAvatarUrl}
      />
    </Animated.View>
  );
}

export function QuoteStackEntry({
  stack,
  screenHeight,
  authorName,
  authorAvatarUrl,
  isActive,
  onActiveQuoteIdChange,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const scrollX = useSharedValue(0);

  const itemWidth = useMemo(() => {
    const ideal = windowWidth - 32;
    const capped = Math.min(448, ideal);
    return Math.max(280, capped);
  }, [windowWidth]);

  const [activeIndex, setActiveIndex] = useState(0);

  const activeQuote = stack.quotes[activeIndex];

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
    setActiveIndex(0);
    notifyActive(0);
  }, [isActive, notifyActive, stack.id]);

  useEffect(() => {
    if (!isActive) return;
    if (!activeQuote) return;
    onActiveQuoteIdChange(activeQuote.id);
  }, [activeIndex, activeQuote, isActive, onActiveQuoteIdChange]);

  const quoteCount = stack.quotes.length;
  const badgeLabel = `${Math.min(activeIndex + 1, quoteCount)}/${quoteCount}`;

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  return (
    <View style={{ width: itemWidth, height: screenHeight }} className="relative">
      <Animated.FlatList
        horizontal
        nestedScrollEnabled
        scrollEnabled={isActive}
        pagingEnabled
        snapToAlignment="start"
        snapToInterval={itemWidth}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        data={stack.quotes}
        keyExtractor={(q) => q.id}
        renderItem={({ item, index }) => (
          <QuoteStackPage
            item={item}
            index={index}
            itemWidth={itemWidth}
            screenHeight={screenHeight}
            authorName={authorName}
            authorAvatarUrl={authorAvatarUrl}
            scrollX={scrollX}
          />
        )}
        getItemLayout={(_, index) => ({
          length: itemWidth,
          offset: itemWidth * index,
          index,
        })}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          const next = Math.round(x / itemWidth);
          setActiveIndex(Math.max(0, Math.min(next, quoteCount - 1)));
        }}
      />

      {quoteCount > 0 && (
        <View pointerEvents="none" className="absolute left-4 top-4 z-50">
          <View className="flex-row items-center rounded-full border border-white/15 bg-black/45 px-3 py-1">
            <Text className="text-[11px] font-semibold text-white/90">
              {badgeLabel}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

