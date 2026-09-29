import { QuoteMomentCardMedia } from "@/features/quotes/QuoteMomentCardMedia";
import { useQuoteMomentShare } from "@/features/quotes/useQuoteMomentShare";
import { QuotePhotoCard } from "@/services/media/userPhotosApi";
import type { ReactNode } from "react";
import { QUOTE_DISPLAY_ASPECT } from "@/constants/quoteImageSize";
import { getQuoteFrameSize } from "@/features/quotes/feedCardSizing";
import { getHomeBackgroundPaletteByKey } from "@/theme/homeBackgrounds";
import { getHomeVibeFeedChrome } from "@/theme/homeVibeFeedFrame";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useUserStore } from "@/appState";

export interface QuoteMomentCardProps {
  item: QuotePhotoCard;
  screenHeight: number;
  authorName: string;
  authorAvatarUrl: string | null;
  counterLabel?: string | null;
  dotsContent?: ReactNode;
  stackNavigation?: {
    index: number;
    count: number;
    onNext: () => void;
    onPrevious: () => void;
  };
}

export const QuoteMomentCard = ({
  item,
  screenHeight,
  authorName,
  authorAvatarUrl,
  counterLabel,
  dotsContent,
  stackNavigation,
}: QuoteMomentCardProps) => {
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const frame = getQuoteFrameSize(windowWidth, screenHeight - 48);
  const authUserId = useUserStore((s) => s.authUserId);
  const guestId = useUserStore((s) => s.guestId);
  const { captureRefView, watermarkForExport, shareMoment } =
    useQuoteMomentShare();
  const bgPalette = item.homeVibeKey
    ? getHomeBackgroundPaletteByKey(item.homeVibeKey)
    : null;
  const chrome = bgPalette ? getHomeVibeFeedChrome(bgPalette) : null;
  const baseDisplayName = item.authorDisplayName ?? authorName;
  const isMine =
    (authUserId && item.userId && item.userId === authUserId) ||
    (guestId && item.guestId && item.guestId === guestId);
  const displayName = isMine ? "Me" : baseDisplayName;
  const displayAvatar = item.authorAvatarUrl ?? authorAvatarUrl;

  const createdTimeLabel = new Date(item.createdAt).toLocaleTimeString(
    undefined,
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
  const createdDateLabel = new Date(item.createdAt).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric" },
  );

  const fontSize =
    item.styleFontId === "small" ? 16 : item.styleFontId === "large" ? 24 : 18;
  const textColor =
    item.styleColorSchemeId === "amber"
      ? "#FBBF24"
      : item.styleColorSchemeId === "pink"
        ? "#F9A8D4"
        : "#FFFFFF";

  const mediaBlock = (
    <QuoteMomentCardMedia
      item={item}
      chrome={chrome}
      aspectRatio={QUOTE_DISPLAY_ASPECT}
      watermarkForExport={watermarkForExport}
      displayName={displayName}
      avatarFallbackName={baseDisplayName}
      displayAvatar={displayAvatar}
      createdTimeLabel={createdTimeLabel}
      createdDateLabel={createdDateLabel}
      fontSize={fontSize}
      textColor={textColor}
    />
  );

  const cardInner =
    chrome && bgPalette ? (
      <View
        className="w-full overflow-hidden rounded-[28px]"
        style={[chrome.outerShell, { width: frame.width }]}
      >
        <View className="relative overflow-hidden rounded-[28px] bg-black">
          <View pointerEvents="none" style={chrome.hairline} />
          {mediaBlock}
        </View>
      </View>
    ) : (
      <View style={{ width: frame.width }} className="overflow-hidden rounded-3xl border border-white/10 bg-black/50 shadow-lg shadow-black/50">
        {mediaBlock}
      </View>
    );

  return (
    <View
      style={{ height: screenHeight }}
      className="items-center justify-center py-6"
    >
      <View className="relative items-center" style={{ width: frame.width }}>
        <View
          ref={captureRefView}
          collapsable={false}
          className="w-full"
          accessible={Boolean(stackNavigation)}
          accessibilityRole={stackNavigation ? "adjustable" : undefined}
          accessibilityLabel={
            stackNavigation
              ? t("home.momentsFeed.stackPhotoA11y", {
                  current: stackNavigation.index + 1,
                  total: stackNavigation.count,
                  author: displayName,
                  quote: item.quote,
                })
              : undefined
          }
          accessibilityValue={
            stackNavigation
              ? { min: 1, max: stackNavigation.count, now: stackNavigation.index + 1 }
              : undefined
          }
          accessibilityActions={
            stackNavigation
              ? [
                  ...(stackNavigation.index > 0
                    ? [{ name: "decrement", label: t("home.momentsFeed.previousPhotoA11y") }]
                    : []),
                  ...(stackNavigation.index < stackNavigation.count - 1
                    ? [{ name: "increment", label: t("home.momentsFeed.nextPhotoA11y") }]
                    : []),
                ]
              : undefined
          }
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === "increment") stackNavigation?.onNext();
            if (event.nativeEvent.actionName === "decrement") stackNavigation?.onPrevious();
          }}
        >
          {cardInner}
        </View>
        {watermarkForExport || !counterLabel ? null : (
          <View pointerEvents="none" className="absolute left-3 top-3 z-50">
            <View className="flex-row items-center rounded-full border border-white/15 bg-black/45 px-3 py-1">
              <Text className="text-[11px] font-semibold text-white/90">
                {counterLabel}
              </Text>
            </View>
          </View>
        )}
        {watermarkForExport ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("home.momentsFeed.shareMomentA11y")}
            onPress={() => {
              void shareMoment(item.id);
            }}
            className="absolute right-2 top-2 z-50 h-12 w-12 items-center justify-center rounded-full bg-black/55"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <Ionicons name="share-outline" size={22} color="#ffffff" />
          </Pressable>
        )}
        {dotsContent ? (
          <View
            pointerEvents="none"
            className="absolute bottom-3 self-center z-50"
          >
            {dotsContent}
          </View>
        ) : null}
      </View>
    </View>
  );
};
