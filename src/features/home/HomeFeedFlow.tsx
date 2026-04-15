import { QuoteCardSkeleton } from "@/features/quotes/QuoteCardSkeleton";
import { QuoteMomentsFeed } from "@/features/quotes/QuoteMomentsFeed";
import { QuoteStackEntry } from "@/features/quotes/quoteStack/QuoteStackEntry";
import type { QuoteStack } from "@/features/quotes/quoteStack/types";
import { MotiView } from "moti";
import type { ComponentProps, ReactElement, RefObject } from "react";
import {
  Dimensions,
  FlatList,
  RefreshControl,
  View,
} from "react-native";

type Props = {
  listRef: RefObject<FlatList<QuoteStack> | null>;
  quoteStacks: QuoteStack[];
  isCaptureFlowActive: boolean;
  flatListExtraData: string;
  snapOffsets: number[];
  getItemLayout: ComponentProps<typeof FlatList<QuoteStack>>["getItemLayout"];
  isFeedRefreshing: boolean;
  isFeedLoading: boolean;
  refreshFeed: () => Promise<void>;
  viewabilityConfig: ComponentProps<typeof FlatList<QuoteStack>>["viewabilityConfig"];
  onViewableItemsChanged: ComponentProps<typeof FlatList<QuoteStack>>["onViewableItemsChanged"];
  header: ReactElement;
  viewportHeight: number;
  authorName: string;
  authorAvatarUrl: string | null;
  currentFeedIndex: number;
  isOnFeed: boolean;
  onActiveQuoteIdChange: (quoteId: string | null) => void;
  onGeneratePress?: () => void;
};

const SCREEN_HEIGHT = Dimensions.get("window").height;

export function HomeFeedFlow({
  listRef,
  quoteStacks,
  isCaptureFlowActive,
  flatListExtraData,
  snapOffsets,
  getItemLayout,
  isFeedRefreshing,
  isFeedLoading,
  refreshFeed,
  viewabilityConfig,
  onViewableItemsChanged,
  header,
  viewportHeight,
  authorName,
  authorAvatarUrl,
  currentFeedIndex,
  isOnFeed,
  onActiveQuoteIdChange,
  onGeneratePress,
}: Props) {
  return (
    <FlatList
      ref={listRef}
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
      ListHeaderComponent={header}
      ListEmptyComponent={
        isFeedLoading ? (
          <View>
            <QuoteCardSkeleton screenHeight={viewportHeight} />
            <QuoteCardSkeleton screenHeight={viewportHeight} />
          </View>
        ) : (
          <QuoteMomentsFeed
            items={[]}
            screenHeight={SCREEN_HEIGHT}
            onFeedLayoutYChange={() => {}}
            authorName={authorName}
            authorAvatarUrl={authorAvatarUrl}
            onGeneratePress={onGeneratePress}
          />
        )
      }
      renderItem={({ item, index }) => (
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={{ alignItems: 'center' }}
          transition={{ type: "timing", duration: 300, delay: index === 0 ? 0 : 60 }}>
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
