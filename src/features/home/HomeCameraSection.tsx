import { AiToolsRow } from "@/features/home/AiToolsRow";
import { QuoteStyleControls } from "@/features/home/QuoteStyleControls";
import { FeedCardVibeGradientShell } from "@/features/quotes/FeedCardVibeGradientShell";
import { getFeedCardWidth } from "@/features/quotes/feedCardSizing";
import { PinchGesture } from "@/features/home/useHomeCamera";
import {
  MAX_REWRITE_REVIEW_CHARACTERS,
  validateEditableQuote,
  validateRewriteReviewQuote,
} from "@/services/ai/rewriteReview";
import { getQuoteAspectRatio } from "@/constants/quoteImageSize";
import { getHomeVibeFeedChrome } from "@/theme/homeVibeFeedFrame";
import { useTranslation } from "react-i18next";
import type { HomeBackgroundPalette } from "@/types/homeBackground";
import type { RewriteTone } from "@/services/ai/types";
import type { HomeAiTool } from "@/features/home/useHomeAiReview";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, type CameraMountError } from "expo-camera";
import { Image } from "expo-image";
import { MotiView } from "moti";
import { useEffect, useMemo, useState } from "react";
import { QuoteInkBloom } from "@/components/QuoteInkBloom";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import type {
  QuoteColor,
  QuoteFontSize,
} from "@/features/home/QuoteStyleControls";
import type { QuoteOrientation } from "@/constants/quoteImageSize";

export type HomeCameraSectionProps = {
  cameraRef: React.RefObject<CameraView | null>;
  pinchGesture: PinchGesture;
  cameraError: string | null;
  isCameraActive: boolean;
  selectedImageUri: string | null;
  photoOrientation: QuoteOrientation;
  canDeleteImage: boolean;
  canCreatePhotoStack: boolean;
  photoStackCount: number;
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
  momentContext: string;
  onMomentContextChange: (value: string) => void;
  onGenerateReflection: () => void;
  captureRefView: React.RefObject<View | null>;
  watermarkForExport: boolean;
  onSubmitQuoteEdit: (text: string) => void;
  onInvalidQuoteEdit: (message: string) => void;
  authorName: string;
  authorAvatarUrl: string | null;
  onCameraReady: () => void;
  onCameraMountError: (event: CameraMountError) => void;
  onZoomPresetPress: (preset: 0.5 | 1 | 2) => void;
  onToggleFacing: () => void;
  onClearImage: () => void;
  onFinishPhotoStack: () => void;
  onRewriteQuote: (tone: RewriteTone) => void;
  onFutureQuotePress: () => void;
  selectedAiTool: HomeAiTool | null;
  pendingAiTool: HomeAiTool | null;
  aiResultTitle: string | null;
  aiResultBody: string | null;
  aiToolsLoading: boolean;
  aiToolsLoadingLabel: string | null;
  cardPalette: HomeBackgroundPalette;
  pendingQuoteText?: string | null;
  pendingQuoteTitle?: string | null;
  onApprovePendingQuote?: (text: string) => void;
  onCancelPendingQuote?: () => void;
};

export const HomeCameraSection = ({
  cameraRef,
  pinchGesture,
  cameraError,
  isCameraActive,
  selectedImageUri,
  photoOrientation,
  canDeleteImage,
  canCreatePhotoStack,
  photoStackCount,
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
  momentContext,
  onMomentContextChange,
  onGenerateReflection,
  captureRefView,
  watermarkForExport,
  onSubmitQuoteEdit,
  onInvalidQuoteEdit,
  authorName,
  authorAvatarUrl,
  onCameraReady,
  onCameraMountError,
  onZoomPresetPress,
  onToggleFacing,
  onClearImage,
  onFinishPhotoStack,
  onRewriteQuote,
  onFutureQuotePress,
  selectedAiTool,
  pendingAiTool,
  aiResultTitle,
  aiResultBody,
  aiToolsLoading,
  aiToolsLoadingLabel,
  cardPalette,
  pendingQuoteText = null,
  pendingQuoteTitle = null,
  onApprovePendingQuote,
  onCancelPendingQuote,
}: HomeCameraSectionProps) => {
  const { t } = useTranslation();
  const [shellSize, setShellSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const cardAspect = getQuoteAspectRatio(photoOrientation);
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = useMemo(() => getFeedCardWidth(windowWidth), [windowWidth]);
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState(dailyQuoteText ?? "");
  const chrome = useMemo(
    () => getHomeVibeFeedChrome(cardPalette),
    [cardPalette],
  );
  const contrastGradientId = useMemo(
    () => `home-quote-contrast-${Math.random().toString(36).slice(2)}`,
    [],
  );
  const flipIconRotation = useSharedValue(0);
  const flipIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${flipIconRotation.value}deg` }],
  }));
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
  const isRewriteLoading =
    aiToolsLoading && pendingAiTool !== null && pendingAiTool !== "future";

  const createdTimeLabel = useMemo(
    () =>
      new Date().toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [],
  );

  const showQuoteOverlay = Boolean(
    !hideQuote && dailyQuoteText && !isGenerating && selectedImageUri,
  );
  const quoteEditValidation = useMemo(
    () => validateEditableQuote(quoteDraft),
    [quoteDraft],
  );

  const [pendingDraft, setPendingDraft] = useState(pendingQuoteText ?? "");
  const pendingOpacity = useSharedValue(0);
  const pendingScale = useSharedValue(0.94);

  useEffect(() => {
    if (pendingQuoteText) {
      setPendingDraft(pendingQuoteText);
      pendingOpacity.value = withTiming(1, { duration: 300 });
      pendingScale.value = withSpring(1, { damping: 16, stiffness: 200 });
    } else {
      pendingOpacity.value = withTiming(0, { duration: 200 });
      pendingScale.value = withTiming(0.94, { duration: 200 });
    }
  }, [pendingQuoteText]); // eslint-disable-line react-hooks/exhaustive-deps

  const pendingAnimStyle = useAnimatedStyle(() => ({
    opacity: pendingOpacity.value,
    transform: [{ scale: pendingScale.value }],
  }));

  const pendingValidation = useMemo(
    () => validateRewriteReviewQuote(pendingDraft, dailyQuoteText ?? ""),
    [pendingDraft, dailyQuoteText],
  );
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

  return (
    <View className="flex-1 w-full flex-col px-2 py-6">
      <View className="min-h-0 flex-1 items-center justify-center">
        <View ref={captureRefView} collapsable={false}>
          <GestureDetector gesture={pinchGesture}>
            <View
              className="overflow-hidden rounded-[28px]"
              style={[
                chrome.outerShell,
                {
                  aspectRatio: cardAspect,
                  width: cardWidth,
                },
              ]}
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                if (width > 0 && height > 0) {
                  setShellSize({ width, height });
                }
              }}
            >
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
                  <View style={StyleSheet.absoluteFill}>
                    <Image
                      source={{ uri: selectedImageUri }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      transition={0}
                    />
                    {canDeleteImage ? (
                      <Pressable
                        onPress={onClearImage}
                        className="absolute right-3 top-3 z-20 h-9 w-9 items-center justify-center rounded-full bg-black/60"
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.8 : 1,
                        })}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#ffffff"
                        />
                      </Pressable>
                    ) : null}
                  </View>
                ) : (
                  <View style={StyleSheet.absoluteFill}>
                    {cameraError ? (
                      <View className="flex-1 items-center justify-center px-6">
                        <Text className="text-center text-sm font-semibold text-white">
                          {t("camera.errors.failedToStartPreview")}
                        </Text>
                        <Text className="mt-2 text-center text-xs text-white/60">
                          {cameraError}
                        </Text>
                      </View>
                    ) : isCameraActive ? (
                      <CameraView
                        ref={cameraRef}
                        style={StyleSheet.absoluteFill}
                        active={isCameraActive}
                        facing={facing}
                        zoom={zoom}
                        onCameraReady={onCameraReady}
                        onMountError={onCameraMountError}
                      />
                    ) : null}
                    {isCameraActive && !dailyQuoteText && !isGenerating ? (
                      <View
                        className="absolute inset-0 items-center justify-center"
                        pointerEvents="none"
                      >
                        <MotiView
                          from={{ opacity: 0, scale: 0.92 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: "timing", duration: 500 }}
                          style={{ alignItems: "center", gap: 8 }}
                        >
                          <Ionicons
                            name="sparkles"
                            size={28}
                            color="rgba(255,255,255,0.35)"
                          />
                          <Text
                            className="text-center text-sm font-medium"
                            style={{
                              color: "rgba(255,255,255,0.45)",
                              maxWidth: 180,
                            }}
                          >
                            {t("home.generating.takePhotoPrompt")}
                          </Text>
                        </MotiView>
                      </View>
                    ) : null}
                  </View>
                )}
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
                  <View pointerEvents="none" className="absolute inset-0 z-[4]">
                    <Svg width="100%" height="100%">
                      <Defs>
                        <LinearGradient
                          id={contrastGradientId}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <Stop
                            offset="0"
                            stopColor="#000000"
                            stopOpacity="0.04"
                          />
                          <Stop
                            offset="0.42"
                            stopColor="#000000"
                            stopOpacity="0.18"
                          />
                          <Stop
                            offset="1"
                            stopColor="#000000"
                            stopOpacity="0.9"
                          />
                        </LinearGradient>
                      </Defs>
                      <Rect
                        width="100%"
                        height="100%"
                        fill={`url(#${contrastGradientId})`}
                      />
                    </Svg>
                  </View>
                ) : null}
                {showQuoteOverlay ? (
                  <View className="absolute inset-0 z-[5]">
                    <View className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-3">
                      <View className="mb-2 flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <View
                            className="overflow-hidden rounded-full bg-white/20"
                            style={{
                              width: 36,
                              height: 36,
                              borderWidth: 1.5,
                              borderColor: "rgba(255,255,255,0.25)",
                            }}
                          >
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
                              numberOfLines={1}
                            >
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
                          backgroundColor: "rgba(0,0,0,0.58)",
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.34)",
                        }}
                        disabled={isEditingQuote || Boolean(pendingQuoteText)}
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
                              style={{
                                fontSize: fontSizeValue,
                                color: quoteTextColor,
                              }}
                            />
                            <View className="mt-3 flex-row items-center justify-between gap-3">
                              <Text
                                className="flex-1 text-xs leading-4"
                                style={{
                                  color: quoteEditValidation.isValid
                                    ? "rgba(255,255,255,0.7)"
                                    : "#FCA5A5",
                                }}
                              >
                                {quoteEditValidation.isValid
                                  ? t("home.aiTools.editQuoteReady")
                                  : quoteEditValidation.reason}
                              </Text>
                              <Text className="text-xs font-semibold text-white/70">
                                {quoteEditValidation.characterCount}/
                                {MAX_REWRITE_REVIEW_CHARACTERS}
                              </Text>
                            </View>
                            <View className="mt-3 flex-row justify-end gap-2">
                              <Pressable
                                onPress={handleCancelQuoteEdit}
                                className="rounded-full border border-white/20 px-3 py-2"
                                style={({ pressed }) => ({
                                  opacity: pressed ? 0.85 : 1,
                                })}
                              >
                                <Text className="text-xs font-semibold text-white">
                                  {t("home.aiTools.editQuoteCancel")}
                                </Text>
                              </Pressable>
                              <Pressable
                                onPress={handleSaveQuoteEdit}
                                className="rounded-full bg-amber-400 px-3 py-2"
                                style={({ pressed }) => ({
                                  opacity:
                                    quoteEditValidation.isValid ||
                                    quoteEditValidation.sanitizedQuote ===
                                      (dailyQuoteText ?? "").trim()
                                      ? pressed
                                        ? 0.88
                                        : 1
                                      : 0.5,
                                })}
                              >
                                <Text className="text-xs font-bold text-black">
                                  {t("home.aiTools.editQuoteSave")}
                                </Text>
                              </Pressable>
                            </View>
                          </View>
                        ) : pendingQuoteText ? (
                          <Animated.View style={pendingAnimStyle}>
                            <Text
                              className="mb-2 text-[10px] font-semibold uppercase tracking-wide"
                              style={{ color: chrome.cornerColor ?? "#F59E0B" }}
                              numberOfLines={1}
                            >
                              {pendingQuoteTitle ??
                                t("home.aiTools.rewriteReviewTitle")}
                            </Text>
                            <TextInput
                              value={pendingDraft}
                              onChangeText={setPendingDraft}
                              multiline
                              textAlignVertical="top"
                              style={{
                                fontSize: fontSizeValue,
                                color: quoteTextColor,
                                minHeight: 72,
                              }}
                            />
                            <View className="mt-2 flex-row items-center justify-between">
                              <Text
                                className="flex-1 text-[11px]"
                                style={{
                                  color: pendingValidation.isValid
                                    ? "rgba(255,255,255,0.6)"
                                    : "#FCA5A5",
                                }}
                              >
                                {pendingValidation.isValid
                                  ? t("home.aiTools.rewriteReady")
                                  : pendingValidation.reason}
                              </Text>
                              <Text className="text-[11px] font-semibold text-white/60">
                                {pendingValidation.characterCount}/
                                {MAX_REWRITE_REVIEW_CHARACTERS}
                              </Text>
                            </View>
                            <View className="mt-3 flex-row justify-end gap-2">
                              <Pressable
                                onPress={onCancelPendingQuote}
                                className="rounded-full border border-white/20 px-3 py-2"
                                style={({ pressed }) => ({
                                  opacity: pressed ? 0.85 : 1,
                                })}
                              >
                                <Text className="text-xs font-semibold text-white">
                                  {t("home.aiTools.rewriteCancel")}
                                </Text>
                              </Pressable>
                              <Pressable
                                disabled={!pendingValidation.isValid}
                                onPress={() =>
                                  onApprovePendingQuote?.(
                                    pendingValidation.sanitizedQuote,
                                  )
                                }
                                className="rounded-full bg-amber-400 px-3 py-2"
                                style={({ pressed }) => ({
                                  opacity: !pendingValidation.isValid
                                    ? 0.45
                                    : pressed
                                      ? 0.88
                                      : 1,
                                })}
                              >
                                <Text className="text-xs font-bold text-black">
                                  {t("home.aiTools.rewriteApprove")}
                                </Text>
                              </Pressable>
                            </View>
                          </Animated.View>
                        ) : (
                          <>
                            <Text
                              className="font-semibold"
                              style={{
                                fontSize: fontSizeValue,
                                color: quoteTextColor,
                              }}
                              numberOfLines={4}
                            >
                              {dailyQuoteText}
                            </Text>
                            <View className="mt-2 flex-row items-center gap-1">
                              <Ionicons
                                name="create-outline"
                                size={11}
                                color="rgba(255,255,255,0.55)"
                              />
                              <Text className="text-left text-[11px] font-medium text-white/55">
                                {t("home.aiTools.editQuoteHint")}
                              </Text>
                            </View>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ) : null}
                {(isGenerating || generationProgress > 0) &&
                !isFutureLoading ? (
                  <QuoteInkBloom
                    accentColor={chrome.cornerColor}
                    progress={generationProgress}
                    isComplete={!isGenerating && generationProgress >= 1}
                    quoteText={dailyQuoteText ?? undefined}
                  />
                ) : null}
                {selectedImageUri && !dailyQuoteText && !isGenerating ? (
                  <View className="absolute inset-x-0 bottom-0 z-[8] border-t border-white/15 bg-black/80 px-4 pb-4 pt-3">
                    <Text className="text-sm font-semibold text-white">
                      {t("home.captureFlow.contextTitle")}
                    </Text>
                    <Text className="mt-1 text-xs leading-4 text-white/75">
                      {t("home.captureFlow.contextSubtitle")}
                    </Text>
                    <TextInput
                      value={momentContext}
                      onChangeText={onMomentContextChange}
                      maxLength={180}
                      placeholder={t("home.captureFlow.contextPlaceholder")}
                      placeholderTextColor="rgba(255,255,255,0.52)"
                      className="mt-3 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white"
                      returnKeyType="done"
                    />
                    <View className="mt-2 flex-row flex-wrap gap-2">
                      {["peaceful", "joyful", "proud", "tender"].map((mood) => (
                        <Pressable
                          key={mood}
                          onPress={() =>
                            onMomentContextChange(
                              t(`home.captureFlow.moods.${mood}`),
                            )
                          }
                          className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5"
                          style={({ pressed }) => ({
                            opacity: pressed ? 0.75 : 1,
                          })}
                        >
                          <Text className="text-xs font-medium text-white">
                            {t(`home.captureFlow.moods.${mood}`)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <Pressable
                      onPress={onGenerateReflection}
                      className="mt-3 items-center rounded-xl bg-white px-4 py-3"
                      style={({ pressed }) => ({ opacity: pressed ? 0.86 : 1 })}
                    >
                      <Text className="text-sm font-bold text-black">
                        {t("home.captureFlow.generate")}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
                {isFutureLoading ? (
                  <View className="absolute inset-0 z-[8] items-center justify-center bg-black/75 px-8">
                    <MotiView
                      from={{ opacity: 0.6, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "timing", duration: 500 }}
                      className="w-full max-w-[280px] rounded-[28px] border border-white/15 bg-slate-950/90 px-6 py-7"
                    >
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
                {isRewriteLoading ? (
                  <View className="absolute inset-0 z-[8] items-center justify-center bg-black/60 px-8">
                    <MotiView
                      from={{ opacity: 0.6, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "timing", duration: 400 }}
                      className="w-full max-w-[280px] rounded-[28px] border border-white/15 bg-slate-950/90 px-6 py-7"
                    >
                      <View className="mb-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <MotiView
                          from={{ translateX: -180 }}
                          animate={{ translateX: 180 }}
                          transition={{
                            type: "timing",
                            duration: 900,
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
                        {aiToolsLoadingLabel ?? t("home.aiTools.loadingFuture")}
                      </Text>
                    </MotiView>
                  </View>
                ) : null}
                {watermarkForExport ? (
                  <View
                    pointerEvents="none"
                    className="absolute right-4 top-4 z-[10] rounded-full border border-white/25 bg-black/55 px-3 py-1.5"
                  >
                    <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                      Inkly
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </GestureDetector>
        </View>
      </View>

      <View className="items-center">
        {canCreatePhotoStack && photoStackCount > 0 && !selectedImageUri ? (
          <View className="mb-3 flex-row items-center rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-2">
            <Ionicons name="images-outline" size={16} color="#FCD34D" />
            <Text className="ml-2 text-xs font-semibold text-amber-100">
              {t("camera.photoStack.count", { count: photoStackCount })}
            </Text>
            <Pressable
              onPress={onFinishPhotoStack}
              className="ml-3 rounded-full bg-white/15 px-3 py-1"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Text className="text-[11px] font-bold text-white">
                {t("camera.photoStack.finish")}
              </Text>
            </Pressable>
          </View>
        ) : null}
        {dailyQuoteText && !hideQuote && selectedImageUri ? (
          <View className="my-3 w-full max-w-md self-center">
            <Pressable
              onPress={() => setShowAdvancedControls((visible) => !visible)}
              className="self-center rounded-full border border-white/20 bg-white/10 px-4 py-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Text className="text-xs font-semibold text-white">
                {showAdvancedControls
                  ? t("home.captureFlow.hideEditing")
                  : t("home.captureFlow.editAndStyle")}
              </Text>
            </Pressable>
            {showAdvancedControls ? (
              <View className="mt-4">
                <QuoteStyleControls
                  quoteFontSize={quoteFontSize}
                  quoteColorScheme={quoteColorScheme}
                  onChangeQuoteFontSize={onChangeQuoteFontSize}
                  onChangeQuoteColorScheme={onChangeQuoteColorScheme}
                />
                <View className="mt-5">
                  <AiToolsRow
                    selectedAiTool={selectedAiTool}
                    pendingAiTool={pendingAiTool}
                    aiToolsLoading={aiToolsLoading}
                    onRewriteQuote={onRewriteQuote}
                    onFutureQuotePress={onFutureQuotePress}
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
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
        {selectedImageUri === null ? (
          <View className="my-4 w-full max-w-md items-center gap-2 self-center">
            <Text
              className="text-sm font-medium text-white"
              style={{ opacity: 0.8 }}
            >
              {zoomFactor % 1 === 0
                ? `${zoomFactor}x`
                : `${zoomFactor.toFixed(1)}x`}
            </Text>
            <View
              className="mt-1 w-full flex-row items-center"
              style={{ justifyContent: "space-between" }}
            >
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
                      })}
                    >
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: isActive ? "#FFCC00" : "#fff" }}
                      >
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
                  })}
                >
                  <Animated.View style={flipIconStyle}>
                    <Ionicons
                      name="camera-reverse-outline"
                      size={22}
                      color="#fff"
                    />
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
