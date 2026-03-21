import { HomeVibeWatermark } from "@/features/home/HomeVibeWatermark";
import { PinchGesture } from "@/features/home/useHomeCamera";
import type { HomeVibeHintParts } from "@/types/homeBackground";
import { Ionicons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import { Image } from "expo-image";
import { MotiView } from "moti";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { Easing } from "react-native-reanimated";

type QuoteFontSize = "small" | "medium" | "large";
type QuoteColor = "light" | "amber" | "pink";

type Props = {
  cameraRef: React.RefObject<CameraView | null>;
  pinchGesture: PinchGesture;
  isPortrait: boolean;
  orientationTransitioning: boolean;
  selectedImageUri: string | null;
  canDeleteImage: boolean;
  facing: "back" | "front";
  zoom: number;
  zoomFactor: number;
  activePreset: number;
  hideQuote: boolean;
  dailyQuoteText: string | null;
  isGenerating: boolean;
  generationProgress: number;
  quoteFontSize: QuoteFontSize;
  quoteColorScheme: QuoteColor;
  onChangeQuoteFontSize: (size: QuoteFontSize) => void;
  onChangeQuoteColorScheme: (color: QuoteColor) => void;
  authorName: string;
  authorAvatarUrl: string | null;
  onCameraReady: () => void;
  onZoomPresetPress: (preset: 0.5 | 1 | 2) => void;
  onToggleOrientation: () => void;
  onToggleFacing: () => void;
  onClearImage: () => void;
  onClearQuote: () => void;
  onRegenerateQuote: () => void;
  vibeHint: HomeVibeHintParts | null;
};

export const HomeCameraSection = ({
  cameraRef,
  pinchGesture,
  isPortrait,
  orientationTransitioning,
  selectedImageUri,
  canDeleteImage,
  facing,
  zoom,
  zoomFactor,
  activePreset,
  hideQuote,
  dailyQuoteText,
  isGenerating,
  generationProgress,
  quoteFontSize,
  quoteColorScheme,
  onChangeQuoteFontSize,
  onChangeQuoteColorScheme,
  authorName,
  authorAvatarUrl,
  onCameraReady,
  onZoomPresetPress,
  onToggleOrientation,
  onToggleFacing,
  onClearImage,
  onClearQuote,
  onRegenerateQuote,
  vibeHint,
}: Props) => {
  const fontSizeValue = useMemo(() => {
    if (quoteFontSize === "small") {
      return 16;
    }
    if (quoteFontSize === "large") {
      return 24;
    }
    return 18;
  }, [quoteFontSize]);

  const quoteColorValue = useMemo(() => {
    if (quoteColorScheme === "amber") {
      return "#FBBF24";
    }
    if (quoteColorScheme === "pink") {
      return "#F9A8D4";
    }
    return "#FFFFFF";
  }, [quoteColorScheme]);

  const createdTimeLabel = useMemo(
    () =>
      new Date().toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [],
  );

  const showQuoteOverlay = Boolean(!hideQuote && dailyQuoteText && !isGenerating);

  return (
    <View className="flex-1 w-full flex-col px-2 py-6">
      <View className="min-h-0 flex-1 items-center justify-center">
        <GestureDetector gesture={pinchGesture}>
          <MotiView
            animate={{
              opacity: orientationTransitioning ? 0.6 : 1,
              scale: orientationTransitioning ? 0.96 : 1,
            }}
            transition={{
              type: "timing",
              duration: 300,
              easing: Easing.linear,
            }}
            className={
              isPortrait
                ? "aspect-[3/3.75] w-full max-w-md overflow-hidden rounded-3xl bg-black"
                : "aspect-[3.5/3] w-full max-w-2xl overflow-hidden rounded-3xl bg-black"
            }>
            {selectedImageUri ? (
              <View className="flex-1">
                <Image
                  source={{ uri: selectedImageUri }}
                  style={{ flex: 1 }}
                  contentFit="cover"
                />
                {canDeleteImage ? (
                  <Pressable
                    onPress={onClearImage}
                    className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-black/60"
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.8 : 1,
                    })}>
                    <Ionicons name="trash-outline" size={18} color="#ffffff" />
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <CameraView
                ref={cameraRef}
                style={{ flex: 1 }}
                facing={facing}
                zoom={zoom}
                onCameraReady={onCameraReady}
              />
            )}

            {showQuoteOverlay ? (
              <View className="pointer-events-none absolute inset-0">
                <View className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-3">
                  <View className="mb-2 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="h-8 w-8 overflow-hidden rounded-full bg-white/20">
                        {authorAvatarUrl ? (
                          <Image
                            source={{ uri: authorAvatarUrl }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                          />
                        ) : (
                          <View className="h-full w-full items-center justify-center">
                            <Text className="text-xs font-semibold text-white/85">
                              {authorName.trim().slice(0, 1).toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View className="ml-2">
                        <Text
                          className="text-xs font-semibold text-white"
                          numberOfLines={1}>
                          {authorName}
                        </Text>
                        <Text className="text-[11px] text-white/70">
                          {createdTimeLabel}
                        </Text>
                      </View>
                    </View>
                    <View className="rounded-full bg-white/15 px-2.5 py-1">
                      <Text className="text-[11px] font-medium text-white/85">
                        Today
                      </Text>
                    </View>
                  </View>
                  <View className="rounded-2xl bg-black/40 px-3 py-2">
                    <Text
                      className="text-center font-semibold"
                      style={{ fontSize: fontSizeValue, color: quoteColorValue }}
                      numberOfLines={4}>
                      {dailyQuoteText}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
            {vibeHint ? (
              <HomeVibeWatermark
                vibeHint={vibeHint}
                placement={showQuoteOverlay ? "top" : "bottom"}
                avoidTrash={Boolean(
                  showQuoteOverlay && selectedImageUri && canDeleteImage,
                )}
              />
            ) : null}
          </MotiView>
        </GestureDetector>
      </View>

      <View className="items-center">
        {isGenerating || generationProgress > 0 ? (
          <MotiView
            from={{ opacity: 0.6, scale: 0.98 }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              type: "timing",
              duration: 700,
            }}
            className="my-3 w-full max-w-md self-center rounded-2xl bg-white/10 px-5 py-4">
            <View className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <MotiView
                style={{
                  height: "100%",
                  borderRadius: 999,
                  backgroundColor: "#F97316",
                }}
                from={{ width: "0%" }}
                animate={{
                  width: `${Math.min(100, Math.max(8, generationProgress * 100))}%`,
                }}
                transition={{
                  type: "timing",
                  duration: 350,
                }}
              />
            </View>
            <View className="mt-2 space-y-2">
              <View className="h-3 w-full rounded-full bg-amber-400/40" />
              <View className="h-3 w-5/6 rounded-full bg-pink-400/40" />
              <View className="h-3 w-3/4 rounded-full bg-sky-400/40" />
            </View>
          </MotiView>
        ) : null}
        {dailyQuoteText && !hideQuote ? (
          <View className="my-3 w-full max-w-md self-center">
            <View className="flex-row items-center justify-between rounded-full bg-white/10 px-3 py-2">
              <View className="flex-row items-center gap-1.5">
                <Pressable
                  onPress={() => onChangeQuoteFontSize("small")}
                  className="h-8 px-3 items-center justify-center rounded-full"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.85 : 1,
                    backgroundColor:
                      quoteFontSize === "small" ? "rgba(255,255,255,0.95)" : "transparent",
                  })}>
                  <Text
                    className="font-semibold"
                    style={{
                      fontSize: 12,
                      color: quoteFontSize === "small" ? "#000000" : "#ffffff",
                    }}>
                    A
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => onChangeQuoteFontSize("medium")}
                  className="h-8 px-3 items-center justify-center rounded-full"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.85 : 1,
                    backgroundColor:
                      quoteFontSize === "medium" ? "rgba(255,255,255,0.95)" : "transparent",
                  })}>
                  <Text
                    className="font-semibold"
                    style={{
                      fontSize: 14,
                      color: quoteFontSize === "medium" ? "#000000" : "#ffffff",
                    }}>
                    A
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => onChangeQuoteFontSize("large")}
                  className="h-8 px-3 items-center justify-center rounded-full"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.85 : 1,
                    backgroundColor:
                      quoteFontSize === "large" ? "rgba(255,255,255,0.95)" : "transparent",
                  })}>
                  <Text
                    className="font-semibold"
                    style={{
                      fontSize: 16,
                      color: quoteFontSize === "large" ? "#000000" : "#ffffff",
                    }}>
                    A
                  </Text>
                </Pressable>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Pressable
                  onPress={() => onChangeQuoteColorScheme("light")}
                  className="h-7 w-7 items-center justify-center rounded-full"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.85 : 1,
                    backgroundColor:
                      quoteColorScheme === "light" ? "#ffffff" : "rgba(148,163,184,0.4)",
                  })}>
                  <View className="h-3.5 w-3.5 rounded-full bg-white" />
                </Pressable>
                <Pressable
                  onPress={() => onChangeQuoteColorScheme("amber")}
                  className="h-7 w-7 items-center justify-center rounded-full"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.85 : 1,
                    backgroundColor:
                      quoteColorScheme === "amber" ? "#ffffff" : "rgba(148,163,184,0.4)",
                  })}>
                  <View className="h-3.5 w-3.5 rounded-full bg-amber-400" />
                </Pressable>
                <Pressable
                  onPress={() => onChangeQuoteColorScheme("pink")}
                  className="h-7 w-7 items-center justify-center rounded-full"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.85 : 1,
                    backgroundColor:
                      quoteColorScheme === "pink" ? "#ffffff" : "rgba(148,163,184,0.4)",
                  })}>
                  <View className="h-3.5 w-3.5 rounded-full bg-pink-400" />
                </Pressable>
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={onClearQuote}
                  className="h-8 w-8 items-center justify-center rounded-full bg-white/10"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                  <Ionicons name="trash-outline" size={16} color="#ffffff" />
                </Pressable>
                <Pressable
                  onPress={onRegenerateQuote}
                  className="h-8 w-8 items-center justify-center rounded-full bg-amber-400"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                  <Ionicons name="refresh-outline" size={16} color="#000000" />
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
        {selectedImageUri === null ? (
          <View className="my-4 w-full max-w-md items-center gap-2 self-center">
            <Text
              className="text-sm font-medium text-white"
              style={{ opacity: 0.8 }}>
              {zoomFactor % 1 === 0
                ? `${zoomFactor}x`
                : `${zoomFactor.toFixed(1)}x`}
            </Text>
            <View
              className="mt-1 w-full flex-row items-center"
              style={{ justifyContent: "space-between" }}>
              <View className="flex-1" />
              <View className="flex-row items-center gap-1 rounded-full border border-white/40 bg-black/40 px-2 py-1">
                {[0.5, 1, 2].map((preset) => {
                  const isActive = activePreset === preset;
                  return (
                    <Pressable
                      key={preset}
                      onPress={() => onZoomPresetPress(preset as 0.5 | 1 | 2)}
                      className="min-w-[44px] items-center justify-center rounded-full px-3 py-2"
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.8 : 1,
                        backgroundColor: isActive
                          ? "rgba(255, 204, 0, 0.4)"
                          : "transparent",
                      })}>
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: isActive ? "#FFCC00" : "#fff" }}>
                        {preset}x
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View className="flex-1 items-end">
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={onToggleFacing}
                    className="h-10 w-10 items-center justify-center rounded-full border-2 border-white/60 bg-white/15"
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                    <Ionicons name="camera-reverse-outline" size={20} color="#fff" />
                  </Pressable>
                  <Pressable
                    onPress={onToggleOrientation}
                    className="h-10 w-10 items-center justify-center rounded-full border-2 border-white/60 bg-white/15"
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                    <Ionicons
                      name={
                        isPortrait
                          ? "phone-portrait-outline"
                          : "phone-landscape-outline"
                      }
                      size={20}
                      color="#fff"
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
};
