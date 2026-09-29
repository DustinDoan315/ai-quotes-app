import { QuoteCardSkeleton } from "@/features/quotes/QuoteCardSkeleton";
import { QuoteMomentsFeed } from "@/features/quotes/QuoteMomentsFeed";
import { QuoteStackEntry } from "@/features/quotes/quoteStack/QuoteStackEntry";
import type { QuoteStack } from "@/features/quotes/quoteStack/types";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { MotiView } from "moti";
import type { ComponentProps, ReactElement, RefObject } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, Text, View } from "react-native";

type Props = {
  listRef: RefObject<FlatList<QuoteStack> | null>;
  quoteStacks: QuoteStack[];
  isCaptureFlowActive: boolean;
  flatListExtraData: string;
  snapOffsets: number[];
  getItemLayout: ComponentProps<typeof FlatList<QuoteStack>>["getItemLayout"];
  isFeedRefreshing: boolean;
  isFeedLoading: boolean;
  showEmptyFeedCue: boolean;
  emptyFeedCueTop: number;
  refreshFeed: () => Promise<void>;
  viewabilityConfig: ComponentProps<
    typeof FlatList<QuoteStack>
  >["viewabilityConfig"];
  onViewableItemsChanged: ComponentProps<
    typeof FlatList<QuoteStack>
  >["onViewableItemsChanged"];
  onViewportHeightChange: (height: number) => void;
  header: ReactElement;
  viewportHeight: number;
  authorName: string;
  authorAvatarUrl: string | null;
  currentFeedIndex: number;
  isOnFeed: boolean;
  onActiveQuoteIdChange: (quoteId: string | null) => void;
};

export function HomeFeedFlow({
  listRef,
  quoteStacks,
  isCaptureFlowActive,
  flatListExtraData,
  snapOffsets,
  getItemLayout,
  isFeedRefreshing,
  isFeedLoading,
  showEmptyFeedCue,
  emptyFeedCueTop,
  refreshFeed,
  viewabilityConfig,
  onViewableItemsChanged,
  onViewportHeightChange,
  header,
  viewportHeight,
  authorName,
  authorAvatarUrl,
  currentFeedIndex,
  isOnFeed,
  onActiveQuoteIdChange,
}: Props) {
  const reduceMotion = useReducedMotionPreference();
  const { t } = useTranslation();

  return (
    <FlatList
      ref={listRef}
      onLayout={(event) =>
        onViewportHeightChange(event.nativeEvent.layout.height)
      }
      className="flex-1 bg-transparent"
      showsVerticalScrollIndicator={false}
      scrollEnabled={!isCaptureFlowActive}
      snapToAlignment="start"
      snapToOffsets={snapOffsets}
      decelerationRate="fast"
      data={quoteStacks}
      extraData={flatListExtraData}
      keyExtractor={(item) => item.id}
      getItemLayout={getItemLayout}
      refreshControl={
        <RefreshControl
          refreshing={isFeedRefreshing}
          onRefresh={refreshFeed}
          tintColor="#ffffff"
        />
      }
      initialNumToRender={3}
      maxToRenderPerBatch={4}
      windowSize={9}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      ListHeaderComponent={
        <View style={{ height: viewportHeight }}>
          {header}
          {showEmptyFeedCue ? (
            <View
              pointerEvents="none"
              className="absolute inset-x-0 items-center"
              style={{ top: emptyFeedCueTop }}
            >
              <Text className="rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-medium text-white">
                {t("home.momentsFeed.swipeCue")}
              </Text>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        isFeedLoading ? (
          <View>
            <QuoteCardSkeleton screenHeight={viewportHeight} />
            <QuoteCardSkeleton screenHeight={viewportHeight} />
          </View>
        ) : (
          <QuoteMomentsFeed
            items={[]}
            screenHeight={viewportHeight}
            onFeedLayoutYChange={() => {}}
            authorName={authorName}
            authorAvatarUrl={authorAvatarUrl}
          />
        )
      }
      renderItem={({ item, index }) => (
        <MotiView
          from={reduceMotion ? { opacity: 1 } : { opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={{ alignItems: "center" }}
          transition={{
            type: "timing",
            duration: reduceMotion ? 0 : 240,
            delay: reduceMotion || index === 0 ? 0 : 50,
          }}
        >
          <QuoteStackEntry
            stack={item}
            screenHeight={viewportHeight}
            authorName={authorName}
            authorAvatarUrl={authorAvatarUrl}
            isActive={isOnFeed && index === currentFeedIndex}
            onActiveQuoteIdChange={onActiveQuoteIdChange}
          />
        </MotiView>
      )}
    />
  );
}
