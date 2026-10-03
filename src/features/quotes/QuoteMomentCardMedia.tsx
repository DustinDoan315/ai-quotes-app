import { InklyShareWatermark } from "@/components/InklyShareWatermark";
import { QuotePhotoCard } from "@/services/media/userPhotosApi";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { Text, View } from "react-native";
import { QuotePositionLayer } from "@/features/quotes/QuotePositionLayer";

import type { HomeVibeFeedChrome } from "@/theme/homeVibeFeedFrame";

interface QuoteMomentCardMediaProps {
  item: QuotePhotoCard;
  presentation?: "default" | "home";
  chrome: HomeVibeFeedChrome | null;
  aspectRatio: number;
  watermarkForExport: boolean;
  displayName: string;
  avatarFallbackName: string;
  displayAvatar: string | null;
  createdTimeLabel: string;
  createdDateLabel: string;
  fontSize: number;
  textColor: string;
}

export const QuoteMomentCardMedia = ({
  item,
  presentation = "default",
  chrome,
  aspectRatio,
  watermarkForExport,
  displayName,
  avatarFallbackName,
  displayAvatar,
  createdTimeLabel,
  createdDateLabel,
  fontSize,
  textColor,
}: QuoteMomentCardMediaProps) => {
  const { t } = useTranslation();
  return (
    <View style={{ width: "100%", aspectRatio }} className="relative overflow-hidden bg-black">
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          recyclingKey={item.id}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
        />
      ) : <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "white" }}>{t("home.ambient.photoUnavailable")}</Text></View>}
      <View className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/35 via-transparent to-black/10" />
      {chrome && presentation !== "home" ? (
        <>
          <View pointerEvents="none" style={chrome.photoBorder} />
          <View
            pointerEvents="none"
            className="absolute left-2.5 top-2.5 z-[4] h-11 w-11 rounded-tl-2xl border-l-[3px] border-t-[3px]"
            style={{ borderColor: chrome.cornerColor }}
          />
          <View
            pointerEvents="none"
            className="absolute right-2.5 top-2.5 z-[4] h-11 w-11 rounded-tr-2xl border-r-[3px] border-t-[3px]"
            style={{ borderColor: chrome.cornerColor }}
          />
          <View
            pointerEvents="none"
            className="absolute bottom-2.5 left-2.5 z-[4] h-11 w-11 rounded-bl-2xl border-b-[3px] border-l-[3px]"
            style={{ borderColor: chrome.cornerColor }}
          />
          <View
            pointerEvents="none"
            className="absolute bottom-2.5 right-2.5 z-[4] h-11 w-11 rounded-br-2xl border-b-[3px] border-r-[3px]"
            style={{ borderColor: chrome.cornerColor }}
          />
        </>
      ) : null}
      <InklyShareWatermark visible={watermarkForExport} />
      <View className="absolute inset-x-0 bottom-0 z-10 px-5 pb-4 pt-3">
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center pr-2">
            {presentation !== "home" ? <View className="h-9 w-9 overflow-hidden rounded-full border border-white/25 bg-white/15">
              {displayAvatar ? (
                <Image
                  source={{ uri: displayAvatar }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <Text className="text-sm font-semibold text-white/90">
                    {avatarFallbackName.trim().slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
            </View> : null}
            <View className={presentation === "home" ? "min-w-0 flex-1 flex-row items-center" : "ml-2.5 min-w-0 flex-1"}>
              <Text
                className="text-sm font-semibold text-white"
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <View className="flex-row items-center">
                {presentation === "home" ? <Text className="mx-1 text-sm text-white/65">·</Text> : null}
                <Text className="text-[10px] text-white/55" numberOfLines={1}>
                  {createdDateLabel}
                </Text>
                {presentation !== "home" ? <Text className="mx-1 text-[10px] text-white/35">/</Text> : null}
                {presentation !== "home" ? <Text
                  className="text-[11px] font-medium text-white/65"
                  numberOfLines={1}
                >
                  {createdTimeLabel}
                </Text> : null}
              </View>
            </View>
          </View>
        </View>
      </View>
      {item.quote ? (
        <QuotePositionLayer position={item.quotePosition}>
          <View
            className={presentation === "home" ? "rounded-2xl bg-black/45 px-4 py-3" : "rounded-2xl border border-white/25 bg-black/30 px-4 py-3"}
            style={{ maxWidth: "88%" }}
          >
            <Text
              className="font-semibold leading-snug"
              style={{
                fontSize,
                color: textColor,
                textShadowColor: "rgba(0,0,0,0.45)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
              numberOfLines={4}
            >
              {item.quote}
            </Text>
          </View>
        </QuotePositionLayer>
      ) : null}
    </View>
  );
};
