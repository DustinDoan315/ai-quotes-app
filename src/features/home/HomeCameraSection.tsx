import { getHomeAmbientPillColors } from "@/theme/homeAmbient";
import { useCaptionEditHint } from "@/hooks/useCaptionEditHint";
import { InklyShareWatermark } from "@/components/InklyShareWatermark";
import { HomeDraftActions } from "@/features/home/HomeDraftActions";
import { QuoteGenerationGlow } from "@/features/home/QuoteGenerationGlow";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { FeedCardVibeGradientShell } from "@/features/quotes/FeedCardVibeGradientShell";
import { useQuoteCardFrame } from "@/features/quotes/useQuoteCardFrame";
import { QuotePositionLayer } from "@/features/quotes/QuotePositionLayer";
import type { QuotePosition } from "@/features/quotes/quotePosition";
import { PinchGesture } from "@/features/home/useHomeCamera";
import {
  type GenerationStage,
} from "@/features/home/generationStage";
import {
  MAX_REWRITE_REVIEW_CHARACTERS,
  getQuoteValidationMessageKey,
  validateEditableQuote,
  validateRewriteReviewQuote,
} from "@/services/ai/rewriteReview";
import { QUOTE_DISPLAY_ASPECT } from "@/constants/quoteImageSize";
import { getHomeVibeFeedChrome } from "@/theme/homeVibeFeedFrame";
import { useTranslation } from "react-i18next";
import type { HomeBackgroundPalette } from "@/types/homeBackground";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, type CameraMountError } from "expo-camera";
import { Image } from "expo-image";
import { MotiView } from "moti";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type {
  QuoteColor,
  QuoteFontSize,
} from "@/features/quotes/quoteStyle";

export type HomeCameraSectionProps = {
  frameWidth?: number;
  externalCameraControls?: boolean;
  interactionLocked?: boolean;
  cameraRef: React.RefObject<CameraView | null>;
  cameraSessionKey: number;
  pinchGesture: PinchGesture;
  cameraError: string | null;
  isCameraActive: boolean;
  cameraPermissionGranted: boolean;
  selectedImageUri: string | null;
  isSavingPhoto: boolean;
  onSavePhoto: () => void;
  onSharePhoto: () => void;
  canSavePhoto: boolean;
  canSharePhoto: boolean;
  hasSavedPhoto: boolean;
  isSharing: boolean;
  quotePosition: QuotePosition;
  onQuotePositionChange: (position: QuotePosition) => void;
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
  generationStage: GenerationStage;
  quoteFontSize: QuoteFontSize;
  quoteColorScheme: QuoteColor;
  onRetryGeneration: () => void;
  captureRefView: React.RefObject<View | null>;
  watermarkForExport: boolean;
  onSubmitQuoteEdit: (text: string) => void;
  onQuoteDraftChange: (draft: string | null) => void;
  onInvalidQuoteEdit: (message: string) => void;
  authorName: string;
  authorAvatarUrl: string | null;
  onCameraReady: () => void;
  onCameraMountError: (event: CameraMountError) => void;
  onZoomPresetPress: (preset: 0.5 | 1 | 2) => void;
  onToggleFacing: () => void;
  onClearImage: () => void;
  onFinishPhotoStack: () => void;
  onRewriteQuote: () => void;
  aiToolsLoading: boolean;
  aiToolsLoadingLabel: string | null;
  cardPalette: HomeBackgroundPalette;
  pendingQuoteText?: string | null;
  pendingQuoteTitle?: string | null;
  onApprovePendingQuote?: (text: string) => void;
  onCancelPendingQuote?: () => void;
};

export const HomeCameraSection = ({
  frameWidth,
  externalCameraControls = false,
  interactionLocked = false,
  cameraRef,
  cameraSessionKey,
  pinchGesture,
  cameraError,
  isCameraActive,
  cameraPermissionGranted,
  selectedImageUri,
  isSavingPhoto,
  onSavePhoto, onSharePhoto, canSavePhoto, canSharePhoto, hasSavedPhoto, isSharing,
  quotePosition,
  onQuotePositionChange,
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
  generationStage,
  quoteFontSize,
  quoteColorScheme,
  onRetryGeneration,
  captureRefView,
  watermarkForExport,
  onSubmitQuoteEdit,
  onQuoteDraftChange,
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
  aiToolsLoading,
  aiToolsLoadingLabel,
  cardPalette,
  pendingQuoteText = null,
  pendingQuoteTitle = null,
  onApprovePendingQuote,
  onCancelPendingQuote,
}: HomeCameraSectionProps) => {
  const { t, i18n } = useTranslation();
  const getValidationMessage = (reason?: string) => {
    if (!reason) {
      return undefined;
    }

    const messageKey = getQuoteValidationMessageKey(reason);
    return messageKey ? t(messageKey) : reason;
  };
  const reduceMotion = useReducedMotionPreference();
  const revealOpacity = useSharedValue(1);
  const revealY = useSharedValue(0);
  useEffect(() => {
    if (generationStage === "revealing" && !reduceMotion && !interactionLocked && !isSharing) {
      revealOpacity.value = 0;
      revealY.value = 6;
      revealOpacity.value = withTiming(1, { duration: 250 });
      revealY.value = withTiming(0, { duration: 250 });
    } else { revealOpacity.value = 1; revealY.value = 0; }
  }, [generationStage, reduceMotion, interactionLocked, isSharing, revealOpacity, revealY]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: revealOpacity.value, transform: [{ translateY: revealY.value }] }));
  const [shellSize, setShellSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const insets = useSafeAreaInsets();
  // The canonical frame shared by the feed, memories, and onboarding.
  const cardFrame = useQuoteCardFrame();
  // The Home header, memories banner, and bottom actions can shrink the camera
  // area below the canonical frame. Fit and center the card in the visible area.
  // The measured height is parent-driven, so mounting camera controls cannot
  // change it.
  const [cameraContentHeight, setCameraContentHeight] = useState(0);
  // Controls live below the photo canvas and share its available height.
  const controlsHeight = selectedImageUri === null && externalCameraControls ? 0 : selectedImageUri === null
    ? 104 + (canCreatePhotoStack && photoStackCount > 0 ? 52 : 0)
    : 56;
  // 80pt action row + 8pt top padding + 1pt border + the device's bottom inset.
  const availableCameraHeight = Math.max(
    0,
    cameraContentHeight - (frameWidth == null ? 89 + insets.bottom : 0),
  );
  const frame = useMemo(() => {
    const height =
      cameraContentHeight > 0
        ? Math.min(
            cardFrame.height,
            Math.max(
              0,
              availableCameraHeight - controlsHeight,
            ),
          )
        : cardFrame.height;
    const width = frameWidth ?? Math.min(cardFrame.width, height * QUOTE_DISPLAY_ASPECT);
    return { width, height: width / QUOTE_DISPLAY_ASPECT };
  }, [
    availableCameraHeight,
    cameraContentHeight,
    cardFrame,
    controlsHeight,
    frameWidth,
  ]);
  const cameraTopOffset = frameWidth != null ? 0 :
    availableCameraHeight > 0
      ? Math.max(
          0,
          (availableCameraHeight -
            frame.height -
            controlsHeight) /
            2,
        )
      : 0;
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const previousImageUriRef = useRef(selectedImageUri);
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

  const createdTimeLabel = useMemo(
    () =>
      new Date().toLocaleTimeString(i18n.language, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [i18n.language],
  );

  const showQuoteOverlay = Boolean(
    !hideQuote && dailyQuoteText && (!isGenerating || generationStage === "revealing") && selectedImageUri,
  );
  const canMoveQuote = !hasSavedPhoto && !interactionLocked && !watermarkForExport && !isEditingQuote && !pendingQuoteText && !isSavingPhoto && !aiToolsLoading;
  const captionControls = useCaptionEditHint(
    showQuoteOverlay && canMoveQuote && !watermarkForExport,
    selectedImageUri,
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
    if (previousImageUriRef.current !== selectedImageUri) {
      previousImageUriRef.current = selectedImageUri;
      setIsEditingQuote(false);
      setQuoteDraft(dailyQuoteText ?? "");
      onQuoteDraftChange(null);
      return;
    }
    if (!isEditingQuote) {
      setQuoteDraft(dailyQuoteText ?? "");
      onQuoteDraftChange(null);
    }
  }, [dailyQuoteText, isEditingQuote, onQuoteDraftChange, selectedImageUri]);

  const openQuoteEditor = () => {
    if (hasSavedPhoto || !dailyQuoteText || isSavingPhoto || interactionLocked || isGenerating || aiToolsLoading) {
      return;
    }
    captionControls.dismissControls();
    setQuoteDraft(dailyQuoteText);
    onQuoteDraftChange(dailyQuoteText);
    setIsEditingQuote(true);
  };

  const handleCancelQuoteEdit = () => {
    setQuoteDraft(dailyQuoteText ?? "");
    onQuoteDraftChange(null);
    setIsEditingQuote(false);
  };

  const handleSaveQuoteEdit = () => {
    if (!dailyQuoteText) {
      onQuoteDraftChange(null);
      setIsEditingQuote(false);
      return;
    }
    if (quoteEditValidation.sanitizedQuote === dailyQuoteText.trim()) {
      onQuoteDraftChange(null);
      setIsEditingQuote(false);
      return;
    }
    if (!quoteEditValidation.isValid) {
      onInvalidQuoteEdit(
        getValidationMessage(quoteEditValidation.reason) ??
          t("home.aiTools.validation.quoteEmpty"),
      );
      return;
    }
    onSubmitQuoteEdit(quoteEditValidation.sanitizedQuote);
    onQuoteDraftChange(null);
    setIsEditingQuote(false);
  };

  const handleCameraFlipPress = () => {
    flipIconRotation.value = withTiming(flipIconRotation.value + 180, {
      duration: 320,
    });
    onToggleFacing();
  };

  return (
    <View
      className="w-full flex-col"
      pointerEvents={interactionLocked ? "none" : "auto"}
      onLayout={({ nativeEvent }) => {
        const next = Math.max(0, nativeEvent.layout.height);
        setCameraContentHeight((current) =>
          Math.abs(current - next) < 1 ? current : next,
        );
      }}
    >
      <View
        className="w-full items-center justify-center"
        style={{ height: frame.height, marginTop: cameraTopOffset }}
      >
        <View ref={captureRefView} collapsable={false}>
          <GestureDetector gesture={pinchGesture}>
            <View
              className="overflow-hidden rounded-[24px]"
              style={[
                { ...chrome.outerShell, shadowOpacity: 0.22, shadowRadius: 14 },
                {
                  aspectRatio: QUOTE_DISPLAY_ASPECT,
                  width: frame.width,
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
              <View className="absolute inset-[1px] z-[1] flex flex-col overflow-hidden rounded-[23px] bg-black">

                {selectedImageUri ? (
                  <View style={StyleSheet.absoluteFill}>
                    <Image
                      source={{ uri: selectedImageUri }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      transition={0}
                    />

                  </View>
                ) : (
                  <View style={StyleSheet.absoluteFill}>
                    {cameraError ? (
                      <View className="flex-1 items-center justify-center px-6">
                        <Text className="text-center text-sm font-semibold text-white">
                          {t("camera.errors.failedToStartPreview")}
                        </Text>
                      </View>
                    ) : isCameraActive ? (
                      <CameraView
                        key={`${cameraSessionKey}-${facing}`}
                        ref={cameraRef}
                        style={StyleSheet.absoluteFill}
                        active={isCameraActive}
                        facing={facing}
                        zoom={zoom}
                        onCameraReady={onCameraReady}
                        onMountError={onCameraMountError}
                      />
                    ) : (
                      <View className="flex-1 items-center justify-center px-8">
                        <Ionicons
                          name="camera-outline"
                          size={30}
                          color="rgba(255,255,255,0.42)"
                        />
                        <Text className="mt-3 text-center text-sm font-semibold text-white/85">
                          {t("camera.permissionTitle")}
                        </Text>
                        <Text className="mt-2 text-center text-xs leading-4 text-white/60">
                          {cameraPermissionGranted
                            ? t("camera.errors.failedToStartPreview")
                            : t("camera.permissionHint")}
                        </Text>
                      </View>
                    )}
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
                            stopOpacity="0.06"
                          />
                          <Stop
                            offset="1"
                            stopColor="#000000"
                            stopOpacity="0.3"
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
                    <View className="absolute inset-0">
                      <View className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-3">
                        <View className="flex-row items-center justify-between">
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
                              {t("camera.todayLabel")}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, revealStyle]}>
                      <QuotePositionLayer
                        position={quotePosition}
                        controlsVisible={captionControls.controlsVisible && canMoveQuote && !watermarkForExport}
                        onInteraction={captionControls.activateControls}
                        onEditText={openQuoteEditor}
                        resizeAccessibilityLabel={t("home.aiTools.resizeCaption")}
                        editAccessibilityLabel={t("home.aiTools.editCaption")}
                        onPositionChange={
                          canMoveQuote ? onQuotePositionChange : undefined
                        }
                      >
                        <Pressable
                          onPress={captionControls.activateControls}
                          accessibilityRole="button"
                          accessibilityLabel={t("home.aiTools.adjustCaption")}
                          accessibilityHint={t("home.aiTools.adjustCaptionHint")}
                          className="rounded-2xl px-4 py-3"
                          style={{
                            backgroundColor: "rgba(0,0,0,0.45)",
                            borderWidth: 0,
                            maxWidth: "100%",
                            paddingTop: 12,
                          }}
                          disabled={
                            !canMoveQuote ||
                            isEditingQuote ||
                            Boolean(pendingQuoteText) ||
                            isSavingPhoto
                          }
                        >
                          {isEditingQuote ? (
                            <View>
                              <TextInput
                                autoFocus
                                value={quoteDraft}
                                editable={!isSavingPhoto}
                                onChangeText={(text) => {
                                  setQuoteDraft(text);
                                  onQuoteDraftChange(text);
                                }}
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
                                    : getValidationMessage(
                                        quoteEditValidation.reason,
                                      )}
                                </Text>
                                <Text className="text-xs font-semibold text-white/70">
                                  {quoteEditValidation.characterCount}/
                                  {MAX_REWRITE_REVIEW_CHARACTERS}
                                </Text>
                              </View>
                              <View className="mt-3 flex-row justify-end gap-2">
                                <Pressable
                                  onPress={handleCancelQuoteEdit}
                                  disabled={isSavingPhoto}
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
                                disabled={isSavingPhoto}
                                className="rounded-full bg-violet-500 px-3 py-2"
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
                                <Text className="text-xs font-bold text-white">
                                  {t("home.aiTools.editQuoteSave")}
                                </Text>
                              </Pressable>
                            </View>
                          </View>
                        ) : pendingQuoteText ? (
                          <Animated.View style={pendingAnimStyle}>
                            <Text
                              className="mb-2 text-[10px] font-semibold uppercase tracking-wide"
                              style={{ color: chrome.cornerColor ?? "#8B5CF6" }}
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
                                  : getValidationMessage(
                                      pendingValidation.reason,
                                    )}
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
                                className="rounded-full bg-violet-500 px-3 py-2"
                                style={({ pressed }) => ({
                                  opacity: !pendingValidation.isValid
                                    ? 0.45
                                    : pressed
                                      ? 0.88
                                      : 1,
                                })}
                              >
                                <Text className="text-xs font-bold text-white">
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
                                textShadowColor: "rgba(0,0,0,0.45)",
                                textShadowOffset: { width: 0, height: 1 },
                                textShadowRadius: 2,
                              }}
                              numberOfLines={4}
                            >
                              {dailyQuoteText}
                            </Text>

                          </>
                        )}
                      </Pressable>
                      </QuotePositionLayer>
                      </Animated.View>
                    </View>
                  </View>
                ) : null}
                {selectedImageUri &&
                !dailyQuoteText &&
                !isGenerating &&
                generationProgress === 0 ? (
                  <View className="absolute inset-x-0 bottom-0 z-[8] border-t border-white/15 bg-black/80 px-4 pb-4 pt-3">
                    <Text className="text-sm font-semibold text-white">
                      {t("home.captureFlow.retryTitle")}
                    </Text>
                    <Text className="mt-1 text-xs leading-4 text-white/75">
                      {t("home.captureFlow.retrySubtitle")}
                    </Text>
                    <Pressable
                      onPress={onRetryGeneration}
                      className="mt-3 items-center rounded-xl bg-white px-4 py-3"
                      style={({ pressed }) => ({ opacity: pressed ? 0.86 : 1 })}
                    >
                      <Text className="text-sm font-bold text-black">
                        {t("home.captureFlow.retry")}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
                <InklyShareWatermark visible={watermarkForExport} />
              </View>
            </View>
          </GestureDetector>
        </View>
        <QuoteGenerationGlow active={Boolean(selectedImageUri && (isGenerating || aiToolsLoading) && !interactionLocked && !isSharing && !watermarkForExport)} accentColor={getHomeAmbientPillColors(cardPalette).border} width={frame.width} height={frame.height} />
        {selectedImageUri && canDeleteImage && !interactionLocked && !isSharing ? <View pointerEvents="box-none" style={{ position: "absolute", top: 0, width: frame.width, height: frame.height, alignSelf: "center", zIndex: 20 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={t("home.ambient.discardPhoto")} onPress={onClearImage}
            style={({ pressed }) => ({ position: "absolute", top: 8, right: 8, width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.45)", opacity: pressed ? 0.75 : 1 })}>
            <Ionicons name="trash-outline" size={19} color="#FFFFFF" />
          </Pressable>
        </View> : null}
      </View>
        {selectedImageUri === null && !externalCameraControls ? (
          <View
            className="w-full items-center px-4"
            pointerEvents="box-none"
          >
            {canCreatePhotoStack && photoStackCount > 0 ? (
              <View className="mb-3 flex-row items-center rounded-full border border-violet-300/30 bg-violet-300/10 px-3 py-2">
                <Ionicons name="images-outline" size={16} color="#C4B5FD" />
                <Text className="ml-2 text-xs font-semibold text-violet-100">
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
            <View
              className="w-full max-w-md items-center gap-2 self-center py-3"
              pointerEvents="box-none"
            >
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
                pointerEvents="box-none"
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
                          style={{ color: isActive ? "#C4B5FD" : "#fff" }}
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
                    accessibilityLabel={t("camera.switchCamera")}
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
          </View>
        ) : null}

      {selectedImageUri ? <HomeDraftActions
        onRewrite={onRewriteQuote} onSave={onSavePhoto} onShare={onSharePhoto}
        canRewrite={Boolean(dailyQuoteText && !hideQuote && !hasSavedPhoto)} canSave={canSavePhoto} canShare={canSharePhoto}
        hasSavedPhoto={hasSavedPhoto} loading={isGenerating || aiToolsLoading} isSaving={isSavingPhoto} isSharing={isSharing}
        disabled={interactionLocked || isGenerating || aiToolsLoading || isSavingPhoto || isSharing || isEditingQuote || Boolean(pendingQuoteText)}
      /> : null}
    </View>
  );
};
