import { QuoteMomentsFeed } from "@/features/quotes/QuoteMomentsFeed";
import { QuoteStackEntry } from "@/features/quotes/quoteStack/QuoteStackEntry";
import type { QuoteStack } from "@/features/quotes/quoteStack/types";
import type { ComponentProps, ReactElement, RefObject } from "react";
import {
  Dimensions,
  FlatList,
  RefreshControl,
} from "react-native";

type Props = {
  listRef: RefObject<FlatList<QuoteStack> | null>;
  quoteStacks: QuoteStack[];
  isCaptureFlowActive: boolean;
  flatListExtraData: string;
  snapOffsets: number[];
  getItemLayout: ComponentProps<typeof FlatList<QuoteStack>>["getItemLayout"];
  isFeedRefreshing: boolean;
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
        <QuoteMomentsFeed
          items={[]}
          screenHeight={SCREEN_HEIGHT}
          onFeedLayoutYChange={() => {}}
          authorName={authorName}
          authorAvatarUrl={authorAvatarUrl}
        />
      }
      renderItem={({ item, index }) => (
        <QuoteStackEntry
          stack={item}
          screenHeight={viewportHeight}
          authorName={authorName}
          authorAvatarUrl={authorAvatarUrl}
          isActive={isOnFeed && index === currentFeedIndex}
          onActiveQuoteIdChange={onActiveQuoteIdChange}
        />
      )}
    />
  );
}
