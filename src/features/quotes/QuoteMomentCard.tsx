import { FeedCardVibeGradientShell } from "@/features/quotes/FeedCardVibeGradientShell";
import { QuoteMomentCardMedia } from "@/features/quotes/QuoteMomentCardMedia";
import { useQuoteMomentShare } from "@/features/quotes/useQuoteMomentShare";
import { QuotePhotoCard } from "@/services/media/userPhotosApi";
import type { ReactNode } from "react";
import { getQuoteAspectRatio } from "@/constants/quoteImageSize";
import { getHomeBackgroundPaletteByKey } from "@/theme/homeBackgrounds";
import { getHomeVibeFeedChrome } from "@/theme/homeVibeFeedFrame";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useUserStore } from "@/appState";

export interface QuoteMomentCardProps {
  item: QuotePhotoCard;
  screenHeight: number;
  authorName: string;
  authorAvatarUrl: string | null;
  counterLabel?: string | null;
  dotsContent?: ReactNode;
}

const PORTRAIT_CARD_ASPECT = getQuoteAspectRatio("portrait");

export const QuoteMomentCard = ({
  item,
  screenHeight,
  authorName,
  authorAvatarUrl,
  counterLabel,
  dotsContent,
}: QuoteMomentCardProps) => {
  const { t } = useTranslation();
  const profile = useUserStore((s) => s.profile);
  const guestId = useUserStore((s) => s.guestId);
  const { captureRefView, watermarkForExport, shareMoment } =
    useQuoteMomentShare();
  const [bgLayout, setBgLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [shellSize, setShellSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const bgPalette = item.homeVibeKey
    ? getHomeBackgroundPaletteByKey(item.homeVibeKey)
    : null;
  const chrome = bgPalette ? getHomeVibeFeedChrome(bgPalette) : null;
  const baseDisplayName = item.authorDisplayName ?? authorName;
  const isMine =
    (profile?.user_id && item.userId && item.userId === profile.user_id) ||
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
      bgPalette={bgPalette}
      chrome={chrome}
      aspectRatio={PORTRAIT_CARD_ASPECT}
      bgLayout={bgLayout}
      onBgLayout={(width, height) => setBgLayout({ width, height })}
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
        className="w-full max-w-md overflow-hidden rounded-[28px]"
        style={chrome.outerShell}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width > 0 && height > 0) {
            setShellSize({ width, height });
          }
        }}>
        {shellSize ? (
          <FeedCardVibeGradientShell
            palette={bgPalette}
            width={shellSize.width}
            height={shellSize.height}
          />
        ) : null}
        <View className="relative z-[1] m-[3px] overflow-hidden rounded-[25px] bg-black">
          <View pointerEvents="none" style={chrome.hairline} />
          {mediaBlock}
        </View>
      </View>
    ) : (
      <View className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-black/50 shadow-lg shadow-black/50">
        {mediaBlock}
      </View>
    );

  return (
    <View
      style={{ height: screenHeight }}
      className="items-center justify-center py-6">
      <View className="relative w-full max-w-md items-center">
        <View ref={captureRefView} collapsable={false} className="w-full">
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
            accessibilityLabel={t("home.momentsFeed.shareMomentA11y")}
            onPress={shareMoment}
            className="absolute right-2 top-2 z-50 rounded-full bg-black/55 p-2.5"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <Ionicons name="share-outline" size={22} color="#ffffff" />
          </Pressable>
        )}
        {dotsContent ? (
          <View pointerEvents="none" className="absolute bottom-3 self-center z-50">
            {dotsContent}
          </View>
        ) : null}
      </View>
    </View>
  );
};
