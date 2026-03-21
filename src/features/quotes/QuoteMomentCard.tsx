import { FeedCardVibeGradientShell } from "@/features/quotes/FeedCardVibeGradientShell";
import { QuoteMomentCardMedia } from "@/features/quotes/QuoteMomentCardMedia";
import { useQuoteMomentShare } from "@/features/quotes/useQuoteMomentShare";
import { QuotePhotoCard } from "@/services/media/userPhotosApi";
import { getHomeVibeFeedChrome } from "@/theme/homeVibeFeedFrame";
import { strings } from "@/theme/strings";
import { getHomeBackgroundPaletteByKey } from "@/theme/homeBackgrounds";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, View } from "react-native";

export interface QuoteMomentCardProps {
  item: QuotePhotoCard;
  screenHeight: number;
  authorName: string;
  authorAvatarUrl: string | null;
}

const FALLBACK_ASPECT = 3 / 4;

export const QuoteMomentCard = ({
  item,
  screenHeight,
  authorName,
  authorAvatarUrl,
}: QuoteMomentCardProps) => {
  const { captureRefView, watermarkForExport, shareMoment } =
    useQuoteMomentShare();
  const [aspectRatio, setAspectRatio] = useState<number>(FALLBACK_ASPECT);
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
  const displayName = item.authorDisplayName ?? authorName;
  const displayAvatar = item.authorAvatarUrl ?? authorAvatarUrl;

  const createdTimeLabel = new Date(item.createdAt).toLocaleTimeString(
    undefined,
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  const fontSize =
    item.styleFontId === "small"
      ? 16
      : item.styleFontId === "large"
      ? 24
      : 18;
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
      aspectRatio={aspectRatio}
      onAspectRatioSet={setAspectRatio}
      bgLayout={bgLayout}
      onBgLayout={(width, height) => setBgLayout({ width, height })}
      watermarkForExport={watermarkForExport}
      displayName={displayName}
      displayAvatar={displayAvatar}
      createdTimeLabel={createdTimeLabel}
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
        {watermarkForExport ? null : (
          <Pressable
            accessibilityLabel={strings.home.momentsFeed.shareMomentA11y}
            onPress={shareMoment}
            className="absolute right-2 top-2 z-50 rounded-full bg-black/55 p-2.5"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <Ionicons name="share-outline" size={22} color="#ffffff" />
          </Pressable>
        )}
      </View>
    </View>
  );
};
