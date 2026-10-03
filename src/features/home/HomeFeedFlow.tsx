import { QuoteStackEntry } from "@/features/quotes/quoteStack/QuoteStackEntry";
import type { QuoteStack } from "@/features/quotes/quoteStack/types";
import type { ComponentProps, ReactElement, RefObject } from "react";
import { FlatList, RefreshControl, View } from "react-native";

type Props = {
  frameWidth: number;
  contentTop: number;
  contentHeight: number;
  viewerUserId: string | null;
  viewerGuestId: string | null;
  activeQuoteId: string | null;
  interactionLocked: boolean;
  horizontalLocked: boolean;
  onBeginDrag: () => void;
  onCommitPage: (page: number) => void;
  onSelectQuote: (id: string) => void;
  onRegisterShare: (id: string, share: () => Promise<void>) => () => void;
  listRef: RefObject<FlatList<QuoteStack> | null>;
  quoteStacks: QuoteStack[];
  isCaptureFlowActive: boolean;
  flatListExtraData: string;
  snapOffsets: number[];
  getItemLayout: ComponentProps<typeof FlatList<QuoteStack>>["getItemLayout"];
  isFeedRefreshing: boolean;
  refreshFeed: () => Promise<void>;
  header: ReactElement;
  viewportHeight: number;
  authorName: string;
  authorAvatarUrl: string | null;
  currentFeedIndex: number;
  isOnFeed: boolean;
};

export function HomeFeedFlow({
  frameWidth, contentTop, contentHeight, viewerUserId, viewerGuestId, activeQuoteId, interactionLocked, horizontalLocked, onBeginDrag, onCommitPage, onSelectQuote, onRegisterShare,
  listRef,
  quoteStacks,
  isCaptureFlowActive,
  flatListExtraData,
  snapOffsets,
  getItemLayout,
  isFeedRefreshing,
  refreshFeed,
  header,
  viewportHeight,
  authorName,
  authorAvatarUrl,
  currentFeedIndex,
  isOnFeed,
}: Props) {

  return (
    <FlatList
      ref={listRef}
      style={{ flex: 1, backgroundColor: "transparent" }}
      showsVerticalScrollIndicator={false}
      scrollEnabled={!isCaptureFlowActive && !interactionLocked}
      onScrollBeginDrag={onBeginDrag}
      onMomentumScrollEnd={e => onCommitPage(e.nativeEvent.contentOffset.y / viewportHeight)}
      onScrollEndDrag={e => {
        const page = e.nativeEvent.contentOffset.y / viewportHeight;
        if (Math.abs(page - Math.round(page)) < 0.015) onCommitPage(page);
      }}
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
          onRefresh={interactionLocked ? undefined : refreshFeed}
          tintColor="#ffffff"
        />
      }
      removeClippedSubviews={false}
      initialNumToRender={3}
      maxToRenderPerBatch={4}
      windowSize={9}
      ListHeaderComponent={header}
      renderItem={({ item, index }) => (
        <View style={{ alignItems: "center" }}>
          <QuoteStackEntry
            stack={item}
            presentation="home"
            frameWidth={frameWidth}
            contentTop={contentTop}
            contentHeight={contentHeight}
            viewerUserId={viewerUserId}
            viewerGuestId={viewerGuestId}
            activeQuoteId={isOnFeed && index === currentFeedIndex ? activeQuoteId : null}
            interactionLocked={interactionLocked || horizontalLocked}
            onSelectQuote={onSelectQuote}
            onRegisterShare={onRegisterShare}
            screenHeight={viewportHeight}
            authorName={authorName}
            authorAvatarUrl={authorAvatarUrl}
            isActive={isOnFeed && index === currentFeedIndex}
          />
        </View>
      )}
    />
  );
}
