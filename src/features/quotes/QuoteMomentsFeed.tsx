import { HomeBackground } from "@/features/home/HomeBackground";
import { QuotePhotoCard } from "@/services/media/userPhotosApi";
import { getHomeBackgroundPaletteByKey } from "@/theme/homeBackgrounds";
import { Image } from "expo-image";
import { useState } from "react";
import { LayoutChangeEvent, Text, View } from "react-native";

type Props = {
  items: QuotePhotoCard[];
  screenHeight: number;
  onFeedLayoutYChange: (y: number) => void;
  authorName: string;
  authorAvatarUrl: string | null;
};

type QuoteMomentCardProps = {
  item: QuotePhotoCard;
  screenHeight: number;
  authorName: string;
  authorAvatarUrl: string | null;
};

const FALLBACK_ASPECT = 3 / 4;

const QuoteMomentCard = ({
  item,
  screenHeight,
  authorName,
  authorAvatarUrl,
}: QuoteMomentCardProps) => {
  const [aspectRatio, setAspectRatio] = useState<number>(FALLBACK_ASPECT);
  const [bgLayout, setBgLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const bgPalette = item.homeVibeKey
    ? getHomeBackgroundPaletteByKey(item.homeVibeKey)
    : null;
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

  return (
    <View
      style={{ height: screenHeight }}
      className="items-center justify-center py-6"
    >
      <View className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-black/50 shadow-lg shadow-black/50">
        <View
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (width > 0 && height > 0) {
              setBgLayout({ width, height });
            }
          }}
          style={{ aspectRatio }}
          className="relative overflow-hidden bg-black"
        >
          {bgLayout && bgPalette ? (
            <HomeBackground
              palette={bgPalette}
              width={bgLayout.width}
              height={bgLayout.height}
            />
          ) : null}
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            onLoad={(event) => {
              const source = event.source;
              if (!source || !source.width || !source.height) {
                return;
              }
              setAspectRatio(source.width / source.height);
            }}
          />
          <View className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          <View className="absolute inset-x-0 bottom-0 px-5 pb-4 pt-3">
            <View className="mb-2 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="h-8 w-8 overflow-hidden rounded-full bg-white/15">
                  {displayAvatar ? (
                    <Image
                      source={{ uri: displayAvatar }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="h-full w-full items-center justify-center">
                      <Text className="text-xs font-semibold text-white/85">
                        {displayName.trim().slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <View className="ml-2">
                  <Text
                    className="text-xs font-semibold text-white"
                    numberOfLines={1}
                  >
                    {displayName}
                  </Text>
                  <Text className="text-[11px] text-white/70">
                    {createdTimeLabel}
                  </Text>
                </View>
              </View>
              <View className="rounded-full bg-white/15 px-2.5 py-1">
                <Text className="text-[11px] font-medium text-white/85">
                  Moment
                </Text>
              </View>
            </View>
            {item.quote ? (
              <Text
                className="mt-1 font-semibold leading-snug"
                style={{ fontSize, color: textColor }}
                numberOfLines={4}
              >
                {item.quote}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
};

export const QuoteMomentsFeed = ({
  items,
  screenHeight,
  onFeedLayoutYChange,
  authorName,
  authorAvatarUrl,
}: Props) => {
  function handleLayout(event: LayoutChangeEvent) {
    onFeedLayoutYChange(event.nativeEvent.layout.y);
  }

  return (
    <View className="px-4" onLayout={handleLayout}>
      {items.length === 0 ? (
        <View className="py-8">
          <Text className="mb-2 text-xs font-medium text-white/70">
            Your moments feed
          </Text>
          <Text className="text-xs text-white/60">
            Save a photo with a quote to see it here.
          </Text>
        </View>
      ) : (
        <>
          {items.map((item) => (
            <QuoteMomentCard
              key={item.id}
              item={item}
              screenHeight={screenHeight}
              authorName={authorName}
              authorAvatarUrl={authorAvatarUrl}
            />
          ))}
        </>
      )}
    </View>
  );
};

