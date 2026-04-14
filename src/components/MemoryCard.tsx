import { QUOTE_ASPECT } from "@/constants/quoteImageSize";
import { Image } from "expo-image";
import { Dimensions, Pressable, Text, View } from "react-native";

import type { QuoteImageOrientation } from "@/types/memory";

type Props = {
  quote: string;
  author: string | null;
  photoBackgroundUri: string | null;
  photoOrientation?: QuoteImageOrientation;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
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
  onToggleFavorite,
  createdAt,
  styleFontId = "medium",
  styleColorSchemeId = "light",
}: Props) {
  const aspect = getCardAspect(photoOrientation);
  const cardWidth = MAX_WIDTH;
  const cardHeight = cardWidth / aspect;
  const createdDateLabel = new Date(createdAt).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric" },
  );
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
      className="mb-4 overflow-hidden rounded-3xl border border-white/10 bg-black/50 shadow-lg shadow-black/50"
      style={{ width: cardWidth, height: cardHeight }}>
      {photoBackgroundUri ? (
        <Image
          source={{ uri: photoBackgroundUri }}
          style={{
            position: "absolute",
            width: cardWidth,
            height: cardHeight,
          }}
          contentFit="cover"
        />
      ) : null}

      <View
        pointerEvents="none"
        className="absolute inset-0 z-[2]"
        style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      />

      {onToggleFavorite ? (
        <Pressable
          onPress={onToggleFavorite}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          className="absolute right-2 top-2 z-[20] rounded-full bg-amber-400/95 px-1.5 py-0.5"
          style={{ opacity: isFavorite ? 1 : 0.35 }}>
          <Text className="text-[10px]">⭐</Text>
        </Pressable>
      ) : isFavorite ? (
        <View className="absolute right-2 top-2 z-[20] rounded-full bg-amber-400/95 px-1.5 py-0.5">
          <Text className="text-[10px]">⭐</Text>
        </View>
      ) : null}

      <View className="absolute inset-x-0 bottom-0 z-10 rounded-t-2xl bg-black/60 px-5 pb-4 pt-3">
        <Text
          className="mt-1 font-semibold leading-snug"
          style={{ fontSize, color: textColor }}
          numberOfLines={4}>
          {quote}
        </Text>
        <View className="mt-2 flex-row items-center justify-between">
          {author ? (
            <Text className="text-[11px] text-white/80" numberOfLines={1}>
              — {author}
            </Text>
          ) : (
            <View />
          )}
          <View className="items-end">
            <View className="flex-row items-center">
              <Text className="text-[10px] text-white/55" numberOfLines={1}>
                {createdDateLabel}
              </Text>
              <Text className="mx-1 text-[10px] text-white/35">/</Text>
              <Text
                className="text-[11px] font-medium text-white/80"
                numberOfLines={1}>
                {createdTimeLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
