import { QUOTE_ASPECT } from "@/constants/quoteImageSize";
import { Image } from "expo-image";
import { Dimensions, Text, View } from "react-native";

import type { QuoteImageOrientation } from "@/types/memory";

type Props = {
  quote: string;
  author: string | null;
  photoBackgroundUri: string | null;
  photoOrientation?: QuoteImageOrientation;
  isFavorite?: boolean;
  createdAt: string;
  styleFontId?: "small" | "medium" | "large";
  styleColorSchemeId?: "light" | "amber" | "pink";
};

const MAX_WIDTH = Dimensions.get("window").width - 32;

function getCardAspect(orientation: QuoteImageOrientation): number {
  const a = QUOTE_ASPECT[orientation];
  return a.width / a.height;
}

export function MemoryCard({
  quote,
  author,
  photoBackgroundUri,
  photoOrientation = "portrait",
  isFavorite = false,
  createdAt,
  styleFontId = "medium",
  styleColorSchemeId = "light",
}: Props) {
  const aspect = getCardAspect(photoOrientation);
  const cardWidth = MAX_WIDTH;
  const cardHeight = cardWidth / aspect;
  const createdTimeLabel = new Date(createdAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const fontSize =
    styleFontId === "small" ? 16 : styleFontId === "large" ? 24 : 18;
  const textColor =
    styleColorSchemeId === "amber"
      ? "#FBBF24"
      : styleColorSchemeId === "pink"
      ? "#F9A8D4"
      : "#FFFFFF";

  return (
    <View
      className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-black/50"
      style={{ width: cardWidth, height: cardHeight }}>
      {photoBackgroundUri ? (
        <>
          <Image
            source={{ uri: photoBackgroundUri }}
            style={{
              position: "absolute",
              width: cardWidth,
              height: cardHeight,
            }}
            contentFit="cover"
          />
          <View className="absolute inset-x-0 bottom-0 z-10 bg-black/60 px-4 pb-3 pt-4">
            <Text
              className="font-semibold"
              style={{ fontSize, color: textColor }}
              numberOfLines={3}>
              {quote}
            </Text>
            <View className="mt-1 flex-row items-center justify-between">
              {author ? (
                <Text
                  className="text-[11px] text-white/80"
                  numberOfLines={1}>
                  — {author}
                </Text>
              ) : (
                <View />
              )}
              <Text className="text-[11px] font-medium text-white/80">
                {createdTimeLabel}
              </Text>
            </View>
          </View>
          {isFavorite ? (
            <View className="absolute right-2 top-2 z-20 rounded-full bg-amber-400/95 px-1.5 py-0.5">
              <Text className="text-[10px]">⭐</Text>
            </View>
          ) : null}
        </>
      ) : (
        <View className="h-full w-full justify-center bg-white/5 px-5">
          <Text
            className="font-semibold"
            style={{ fontSize, color: textColor }}
            numberOfLines={3}>
            {quote}
          </Text>
          <View className="mt-2 flex-row items-center justify-between">
            {author ? (
              <Text className="text-[11px] text-white/70" numberOfLines={1}>
                — {author}
              </Text>
            ) : (
              <View />
            )}
            <Text className="text-[11px] font-medium text-white/80">
              {createdTimeLabel}
            </Text>
          </View>
          {isFavorite ? (
            <View className="absolute right-2 top-2 rounded-full bg-amber-400/95 px-1.5 py-0.5">
              <Text className="text-[10px]">⭐</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}
