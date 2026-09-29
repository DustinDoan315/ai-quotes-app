import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { useSignedStorageUrl } from "@/hooks/useSignedStorageUrl";
import { Ionicons } from "@expo/vector-icons";
import { useQuoteCardFrame } from "@/features/quotes/useQuoteCardFrame";
import { QuotePositionLayer } from "@/features/quotes/QuotePositionLayer";
import {
  DEFAULT_QUOTE_POSITION,
  type QuotePosition,
} from "@/features/quotes/quotePosition";

import type { QuoteVisibility } from "@/types/memory";

type Props = {
  quote: string;
  author: string | null;
  photoBackgroundUri: string | null;
  photoStoragePath?: string | null;
  quotePosition?: QuotePosition;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  visibility?: QuoteVisibility;
  onChangeVisibility?: () => void;
  isVisibilityUpdating?: boolean;
  createdAt: string;
  styleFontId?: "small" | "medium" | "large";
  styleColorSchemeId?: "light" | "amber" | "pink";
};

export function MemoryCard({
  quote,
  author,
  photoBackgroundUri,
  photoStoragePath,
  quotePosition = DEFAULT_QUOTE_POSITION,
  isFavorite = false,
  onToggleFavorite,
  visibility = "private",
  onChangeVisibility,
  isVisibilityUpdating = false,
  createdAt,
  styleFontId = "medium",
  styleColorSchemeId = "light",
}: Props) {
  const { i18n, t } = useTranslation();
  const resolvedPhotoUri = useSignedStorageUrl(
    "user-photos",
    photoStoragePath,
    photoBackgroundUri,
  );
  // The same canonical frame the camera, feed, and onboarding render.
  const { width: cardWidth, height: cardHeight } = useQuoteCardFrame();
  const createdDateLabel = new Date(createdAt).toLocaleDateString(
    i18n.language,
    { month: "short", day: "numeric" },
  );
  const createdTimeLabel = new Date(createdAt).toLocaleTimeString(i18n.language, {
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
      {resolvedPhotoUri ? (
        <Image
          source={{ uri: resolvedPhotoUri }}
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

      {quote ? (
        <QuotePositionLayer position={quotePosition}>
          <View
            className="rounded-2xl border border-white/25 bg-black/55 px-4 py-3"
            style={{ maxWidth: "88%" }}
          >
            <Text
              className="font-semibold leading-snug"
              style={{ fontSize, color: textColor }}
              numberOfLines={4}
            >
              {quote}
            </Text>
          </View>
        </QuotePositionLayer>
      ) : null}

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

      {onChangeVisibility ? (
        <Pressable
          onPress={onChangeVisibility}
          disabled={isVisibilityUpdating}
          accessibilityRole="button"
          accessibilityLabel={
            visibility === "private"
              ? t("memories.shareWithFriends")
              : t("memories.makePrivate")
          }
          className="absolute left-2 top-2 z-[20] flex-row items-center rounded-full bg-black/65 px-2.5 py-1.5"
          style={{ opacity: isVisibilityUpdating ? 0.5 : 1 }}>
          <Ionicons
            name={visibility === "private" ? "lock-closed-outline" : "people-outline"}
            size={12}
            color="#ffffff"
          />
          <Text className="ml-1 text-[10px] font-semibold text-white">
            {visibility === "private"
              ? t("memories.shareWithFriends")
              : t("memories.makePrivate")}
          </Text>
        </Pressable>
      ) : null}

      <View className="absolute inset-x-0 bottom-0 z-10 rounded-t-2xl bg-black/60 px-5 pb-4 pt-3">
        <View className="flex-row items-center justify-between">
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
