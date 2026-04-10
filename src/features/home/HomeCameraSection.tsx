import { AiToolsRow } from "@/features/home/AiToolsRow";
import { ShareQuoteButton } from "@/features/share/ShareQuoteButton";
import { FeedCardVibeGradientShell } from "@/features/quotes/FeedCardVibeGradientShell";
import { HomeVibeWatermark } from "@/features/home/HomeVibeWatermark";
import { PinchGesture } from "@/features/home/useHomeCamera";
import {
  MAX_REWRITE_REVIEW_CHARACTERS,
  validateEditableQuote,
} from "@/services/ai/rewriteReview";
import { getQuoteAspectRatio } from "@/constants/quoteImageSize";
import { getHomeVibeFeedChrome } from "@/theme/homeVibeFeedFrame";
import { useTranslation } from "react-i18next";
import type {
  HomeBackgroundPalette,
  HomeVibeHintParts,
} from "@/types/homeBackground";
import type { RewriteTone } from "@/services/ai/types";
import { Ionicons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import { Image } from "expo-image";
import { MotiView } from "moti";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type QuoteFontSize = "small" | "medium" | "large";
type QuoteColor = "light" | "amber" | "pink";
type ActiveAiTool = "future" | RewriteTone;

const PANEL_HIGHLIGHT = "#FBBF24";

export type HomeCameraSectionProps = {
  cameraRef: React.RefObject<CameraView | null>;
  pinchGesture: PinchGesture;
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
  onSubmitQuoteEdit: (text: string) => void;
  onInvalidQuoteEdit: (message: string) => void;
  authorName: string;
  authorAvatarUrl: string | null;
  onCameraReady: () => void;
  onZoomPresetPress: (preset: 0.5 | 1 | 2) => void;
  onToggleFacing: () => void;
  onClearImage: () => void;
  onRewriteQuote: (tone: RewriteTone) => void;
  selectedAiTool: ActiveAiTool | null;
  pendingAiTool: ActiveAiTool | null;
  aiResultTitle: string | null;
  aiResultBody: string | null;
  aiToolsLoading: boolean;
  aiToolsLoadingLabel: string | null;
  vibeHint: HomeVibeHintParts | null;
  cardPalette: HomeBackgroundPalette;
};

export const HomeCameraSection = ({
  cameraRef,
  pinchGesture,
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
  onSubmitQuoteEdit,
  onInvalidQuoteEdit,
  authorName,
  authorAvatarUrl,
  onCameraReady,
  onZoomPresetPress,
  onToggleFacing,
  onClearImage,
  onRewriteQuote,
  selectedAiTool,
  pendingAiTool,
  aiResultTitle,
  aiResultBody,
  aiToolsLoading,
  aiToolsLoadingLabel,
  vibeHint,
  cardPalette,
}: HomeCameraSectionProps) => {
  const { t } = useTranslation();
  const [shellSize, setShellSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState(dailyQuoteText ?? "");
  const chrome = useMemo(
    () => getHomeVibeFeedChrome(cardPalette),
    [cardPalette],
  );
  const flipIconRotation = useSharedValue(0);
  const flipIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${flipIconRotation.value}deg` }],
  }));
  const cardAspect = getQuoteAspectRatio("portrait");
  const fontSizeValue = useMemo(() => {
    if (quoteFontSize === "small") {
      return 16;
    }
    if (quoteFontSize === "large") {
      return 24;
    }
    return 18;
  }, [quoteFontSize]);
  const quoteTextColor = useMemo(() => {
    if (quoteColorScheme === "amber") {
      return "#FBBF24";
    }
    if (quoteColorScheme === "pink") {
      return "#F9A8D4";
    }
    return "#FFFFFF";
  }, [quoteColorScheme]);
  const isFutureLoading = aiToolsLoading && pendingAiTool === "future";

  const createdTimeLabel = useMemo(
    () =>
      new Date().toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [],
  );

  const showQuoteOverlay = Boolean(!hideQuote && dailyQuoteText && !isGenerating);
  const quoteEditValidation = useMemo(
    () => validateEditableQuote(quoteDraft),
    [quoteDraft],
  );
  const selectedRewriteTool =
    selectedAiTool === "future" ? null : selectedAiTool;
  const pendingRewriteTool =
    pendingAiTool === "future" ? null : pendingAiTool;

  useEffect(() => {
    if (!isEditingQuote) {
      setQuoteDraft(dailyQuoteText ?? "");
    }
  }, [dailyQuoteText, isEditingQuote]);

  const openQuoteEditor = () => {
    if (!dailyQuoteText) {
      return;
    }
    setQuoteDraft(dailyQuoteText);
    setIsEditingQuote(true);
  };

  const handleCancelQuoteEdit = () => {
    setQuoteDraft(dailyQuoteText ?? "");
    setIsEditingQuote(false);
  };

  const handleSaveQuoteEdit = () => {
    if (!dailyQuoteText) {
      setIsEditingQuote(false);
      return;
    }
    if (quoteEditValidation.sanitizedQuote === dailyQuoteText.trim()) {
      setIsEditingQuote(false);
      return;
    }
    if (!quoteEditValidation.isValid) {
      onInvalidQuoteEdit(quoteEditValidation.reason ?? "Invalid quote");
      return;
    }
    onSubmitQuoteEdit(quoteEditValidation.sanitizedQuote);
    setIsEditingQuote(false);
  };

  const handleCameraFlipPress = () => {
    flipIconRotation.value = withTiming(flipIconRotation.value + 180, {
      duration: 320,
    });
    onToggleFacing();
  };

  const fontControls = [
    { key: "small" as const, label: "A", fontSize: 13 },
    { key: "medium" as const, label: "A", fontSize: 16 },
    { key: "large" as const, label: "A", fontSize: 19 },
  ];

  const colorControls = [
    { key: "light" as const, fill: "#FFFFFF", ring: "#F8FAFC" },
    { key: "amber" as const, fill: "#FBBF24", ring: "#FBBF24" },
    { key: "pink" as const, fill: "#F9A8D4", ring: "#F9A8D4" },
  ];

  return (
    <View className="flex-1 w-full flex-col px-2 py-6">
      <View className="min-h-0 flex-1 items-center justify-center">
        <GestureDetector gesture={pinchGesture}>
          <View
            className="w-full max-w-md overflow-hidden rounded-[28px]"
            style={[chrome.outerShell, { aspectRatio: cardAspect }]}
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              if (width > 0 && height > 0) {
                setShellSize({ width, height });
              }
            }}>
            {shellSize ? (
              <FeedCardVibeGradientShell
                palette={cardPalette}
                width={shellSize.width}
                height={shellSize.height}
              />
            ) : null}
            <View className="absolute inset-[3px] z-[1] flex flex-col overflow-hidden rounded-[25px] bg-black">
              <View pointerEvents="none" style={chrome.hairline} />
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
                      className="absolute right-3 top-3 z-20 h-9 w-9 items-center justify-center rounded-full bg-black/60"
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.8 : 1,
                      })}>
                      <Ionicons name="trash-outline" size={18} color="#ffffff" />
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <View className="flex-1 overflow-hidden">
                  <CameraView
                    ref={cameraRef}
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      bottom: 0,
                      left: 0,
                    }}
                    facing={facing}
                    zoom={zoom}
                    onCameraReady={onCameraReady}
                  />
                </View>
              )}
              <View className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/85 via-black/15 to-black/25" />
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
            {showQuoteOverlay ? (
              <View className="absolute inset-0">
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
                    <View className="rounded-full border border-white/25 px-2.5 py-1">
                      <Text className="text-[11px] font-medium text-white/85">
                        Today
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={openQuoteEditor}
                    className="rounded-2xl px-4 py-3"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.16)",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.28)",
                    }}
                    disabled={isEditingQuote}
                  >
                    {isEditingQuote ? (
                      <View>
                        <TextInput
                          autoFocus
                          value={quoteDraft}
                          onChangeText={setQuoteDraft}
                          multiline
                          textAlignVertical="top"
                          className="min-h-[96px] font-semibold text-white"
                          style={{ fontSize: fontSizeValue, color: quoteTextColor }}
                        />
                        <View className="mt-3 flex-row items-center justify-between gap-3">
                          <Text
                            className="flex-1 text-xs leading-4"
                            style={{
                              color: quoteEditValidation.isValid
                                ? "rgba(255,255,255,0.7)"
                                : "#FCA5A5",
                            }}>
                            {quoteEditValidation.isValid
                              ? t("home.aiTools.editQuoteReady")
                              : quoteEditValidation.reason}
                          </Text>
                          <Text className="text-xs font-semibold text-white/70">
                            {quoteEditValidation.characterCount}/{MAX_REWRITE_REVIEW_CHARACTERS}
                          </Text>
                        </View>
                        <View className="mt-3 flex-row justify-end gap-2">
                          <Pressable
                            onPress={handleCancelQuoteEdit}
                            className="rounded-full border border-white/20 px-3 py-2"
                            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                            <Text className="text-xs font-semibold text-white">
                              {t("home.aiTools.editQuoteCancel")}
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={handleSaveQuoteEdit}
                            className="rounded-full bg-amber-400 px-3 py-2"
                            style={({ pressed }) => ({
                              opacity:
                                quoteEditValidation.isValid || quoteEditValidation.sanitizedQuote === (dailyQuoteText ?? "").trim()
                                  ? pressed
                                    ? 0.88
                                    : 1
                                  : 0.5,
                            })}>
                            <Text className="text-xs font-bold text-black">
                              {t("home.aiTools.editQuoteSave")}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <>
                        <Text
                          className="font-semibold"
                          style={{ fontSize: fontSizeValue, color: quoteTextColor }}
                          numberOfLines={4}>
                          {dailyQuoteText}
                        </Text>
                        <Text className="mt-2 text-left text-[11px] font-medium text-white/60">
                          {t("home.aiTools.editQuoteHint")}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : null}
            {isFutureLoading ? (
              <View className="absolute inset-0 z-[8] items-center justify-center bg-black/75 px-8">
                <MotiView
                  from={{ opacity: 0.6, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "timing", duration: 500 }}
                  className="w-full max-w-[280px] rounded-[28px] border border-white/15 bg-slate-950/90 px-6 py-7">
                  <View className="mb-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <MotiView
                      from={{ translateX: -180 }}
                      animate={{ translateX: 180 }}
                      transition={{
                        type: "timing",
                        duration: 950,
                        loop: true,
                      }}
                      style={{
                        height: "100%",
                        width: "55%",
                        borderRadius: 999,
                        backgroundColor: "#F59E0B",
                      }}
                    />
                  </View>
                  <Text className="text-center text-lg font-semibold text-white">
                    {t("home.aiTools.futureResult")}
                  </Text>
                  <Text className="mt-2 text-center text-sm leading-5 text-white/70">
                    {aiToolsLoadingLabel ?? t("home.aiTools.loadingFuture")}
                  </Text>
                </MotiView>
              </View>
            ) : null}
            {vibeHint ? (
              <HomeVibeWatermark
                vibeHint={vibeHint}
                placement={showQuoteOverlay ? "top" : "bottom"}
                avoidTrash={Boolean(
                  showQuoteOverlay && selectedImageUri && canDeleteImage,
                )}
                borderOnly
              />
            ) : null}
            </View>
          </View>
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
            <View
              className="rounded-[20px] px-2 py-2"
              style={{
                backgroundColor: "rgba(12,14,20,0.62)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.06)",
              }}>
              <View className="flex-row items-start gap-2">
                <View
                  className="w-[42%] rounded-[16px] px-2 py-1.5"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                  <Text className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                    Size
                  </Text>
                  <View className="flex-row items-center gap-2">
                    {fontControls.map((control) => {
                      const isActive = quoteFontSize === control.key;
                      return (
                        <Pressable
                          key={control.key}
                          onPress={() => onChangeQuoteFontSize(control.key)}
                          className="h-8 min-w-[42px] flex-1 items-center justify-center rounded-2xl"
                          style={({ pressed }) => ({
                            opacity: pressed ? 0.88 : 1,
                            backgroundColor: isActive
                              ? "rgba(251,191,36,0.10)"
                              : "rgba(255,255,255,0.025)",
                            borderWidth: isActive ? 1.5 : 1,
                            borderColor: isActive
                              ? "rgba(251,191,36,0.68)"
                              : "rgba(255,255,255,0.045)",
                          })}>
                          <Text
                            className="font-bold"
                            style={{
                              fontSize: control.fontSize,
                              color: isActive ? PANEL_HIGHLIGHT : "rgba(255,255,255,0.82)",
                            }}>
                            {control.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                <View
                  className="flex-1 rounded-[16px] px-2 py-1.5"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                  <Text className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                    Color
                  </Text>
                  <View className="flex-row items-center justify-center gap-2.5">
                    {colorControls.map((control) => {
                      const isActive = quoteColorScheme === control.key;
                      return (
                        <Pressable
                          key={control.key}
                          onPress={() => onChangeQuoteColorScheme(control.key)}
                          className="h-10 w-10 items-center justify-center rounded-2xl"
                          style={({ pressed }) => ({
                            opacity: pressed ? 0.88 : 1,
                            backgroundColor: isActive
                              ? "rgba(255,255,255,0.18)"
                              : "rgba(255,255,255,0.025)",
                            borderWidth: isActive ? 2.5 : 1,
                            borderColor: isActive
                              ? control.ring
                              : "rgba(255,255,255,0.045)",
                          })}>
                          <View
                            style={{
                              width: isActive ? 20 : 18,
                              height: isActive ? 20 : 18,
                              borderRadius: 10,
                              backgroundColor: control.fill,
                              borderWidth: control.key === "light" ? 1 : 0,
                              borderColor: "rgba(15,23,42,0.18)",
                            }}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>
            <View className="mt-5">
              <AiToolsRow
                selectedAiTool={selectedRewriteTool}
                pendingAiTool={pendingRewriteTool}
                aiToolsLoading={aiToolsLoading}
                onRewriteQuote={onRewriteQuote}
              />
              {aiResultTitle && aiResultBody ? (
                <View className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-950/20 px-4 py-4">
                  <Text className="text-[11px] font-semibold uppercase tracking-wide text-amber-500">
                    {aiResultTitle}
                  </Text>
                  <Text className="mt-2 text-sm leading-5 text-white/90">
                    {aiResultBody}
                  </Text>
                </View>
              ) : null}
              <View className="mt-3 items-center">
                <ShareQuoteButton quoteText={dailyQuoteText} />
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
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Switch camera"
                  onPress={handleCameraFlipPress}
                  hitSlop={12}
                  className="h-11 w-11 items-center justify-center rounded-full border-2 border-white/60 bg-white/15"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.75 : 1,
                    transform: [{ scale: pressed ? 0.94 : 1 }],
                  })}>
                  <Animated.View style={flipIconStyle}>
                    <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
                  </Animated.View>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
};
