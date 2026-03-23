import { HomeBackground } from "@/features/home/HomeBackground";
import { QuotePhotoCard } from "@/services/media/userPhotosApi";
import { strings } from "@/theme/strings";
import { Image } from "expo-image";
import { Text, View } from "react-native";

import type { HomeVibeFeedChrome } from "@/theme/homeVibeFeedFrame";
import type { HomeBackgroundPalette } from "@/types/homeBackground";

interface QuoteMomentCardMediaProps {
  item: QuotePhotoCard;
  bgPalette: HomeBackgroundPalette | null;
  chrome: HomeVibeFeedChrome | null;
  aspectRatio: number;
  onAspectRatioSet: (value: number) => void;
  bgLayout: { width: number; height: number } | null;
  onBgLayout: (width: number, height: number) => void;
  watermarkForExport: boolean;
  displayName: string;
  displayAvatar: string | null;
  createdTimeLabel: string;
  createdDateLabel: string;
  fontSize: number;
  textColor: string;
}

export const QuoteMomentCardMedia = ({
  item,
  bgPalette,
  chrome,
  aspectRatio,
  onAspectRatioSet,
  bgLayout,
  onBgLayout,
  watermarkForExport,
  displayName,
  displayAvatar,
  createdTimeLabel,
  createdDateLabel,
  fontSize,
  textColor,
}: QuoteMomentCardMediaProps) => {
  return (
    <View
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) {
          onBgLayout(width, height);
        }
      }}
      style={{ aspectRatio }}
      className="relative overflow-hidden bg-black">
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
          if (!source?.width || !source?.height) {
            return;
          }
          onAspectRatioSet(source.width / source.height);
        }}
      />
      <View className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/85 via-black/15 to-black/25" />
      {chrome ? (
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
      {watermarkForExport ? (
        <View className="pointer-events-none absolute right-3 top-3 z-10 max-w-[46%]">
          <View
            style={chrome ? chrome.brandShell : undefined}
            className={
              chrome
                ? undefined
                : "overflow-hidden rounded-2xl border border-white/35 bg-black/45 shadow-lg shadow-black/40"
            }>
            <View className="absolute inset-0 bg-gradient-to-br from-amber-400/15 via-transparent to-fuchsia-500/10" />
            <View className="px-3 py-2.5">
              <View className="mb-1.5 h-px w-7 bg-gradient-to-r from-amber-200/90 to-transparent" />
              <Text
                className="text-[11px] font-bold uppercase tracking-[0.14em] text-white"
                numberOfLines={1}>
                {strings.home.momentsFeed.watermarkBrand}
              </Text>
              <Text
                className="mt-0.5 text-[10px] font-medium leading-tight text-white/75"
                numberOfLines={2}>
                {strings.home.momentsFeed.watermarkTagline}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
      <View
        className="absolute inset-x-0 bottom-0 z-10 rounded-t-2xl px-5 pb-4 pt-3"
        style={
          chrome?.imageWash.backgroundColor
            ? { backgroundColor: chrome.imageWash.backgroundColor }
            : undefined
        }>
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center pr-2">
            <View className="h-9 w-9 overflow-hidden rounded-full border border-white/25 bg-white/15">
              {displayAvatar ? (
                <Image
                  source={{ uri: displayAvatar }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <Text className="text-sm font-semibold text-white/90">
                    {displayName.trim().slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View className="ml-2.5 min-w-0 flex-1">
              <Text
                className="text-sm font-semibold text-white"
                numberOfLines={1}>
                {displayName}
              </Text>
              <View className="flex-row items-center">
                <Text
                  className="text-[10px] text-white/55"
                  numberOfLines={1}>
                  {createdDateLabel}
                </Text>
                <Text className="mx-1 text-[10px] text-white/35">/</Text>
                <Text
                  className="text-[11px] font-medium text-white/65"
                  numberOfLines={1}>
                  {createdTimeLabel}
                </Text>
              </View>
            </View>
          </View>
          {watermarkForExport ? (
            <View
              style={chrome ? chrome.momentWrap : undefined}
              className={
                chrome
                  ? "shrink-0 overflow-hidden bg-black/55"
                  : "shrink-0 overflow-hidden rounded-2xl border border-amber-300/45 bg-black/55 shadow-md shadow-black/30"
              }>
              <View
                style={
                  chrome
                    ? [
                        chrome.momentInner,
                        { paddingHorizontal: 12, paddingVertical: 8 },
                      ]
                    : undefined
                }
                className={
                  chrome
                    ? undefined
                    : "bg-gradient-to-r from-amber-400/25 via-fuchsia-400/15 to-transparent px-3 py-2"
                }>
                <Text className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-amber-100/95">
                  {strings.home.momentsFeed.momentEyebrow}
                </Text>
                <Text
                  className="mt-0.5 text-center text-[11px] font-semibold text-white"
                  numberOfLines={1}>
                  {strings.home.momentsFeed.watermarkBrand}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
        {item.quote ? (
          <Text
            className="mt-1 font-semibold leading-snug"
            style={{ fontSize, color: textColor }}
            numberOfLines={4}>
            {item.quote}
          </Text>
        ) : null}
      </View>
    </View>
  );
};
