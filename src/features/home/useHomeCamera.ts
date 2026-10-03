import { formatLocalDateKey } from "@/utils/dateKey";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Crypto from "expo-crypto";
import { CameraView, type CameraMountError } from "expo-camera";
import { useFocusEffect } from "@react-navigation/native";
import { Gesture } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import { useAIStore } from "@/features/ai/aiStore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { useCameraPermission } from "@/hooks/useCameraPermission";
import { useGenerateQuote } from "@/features/ai/useGenerateQuote";
import { useQuoteStore } from "@/appState/quoteStore";
import { useStreakStore } from "@/appState/streakStore";
import { useUIStore } from "@/appState/uiStore";
import { analyticsEvents } from "@/services/analytics/events";
import { useUserStore } from "@/appState/userStore";
import { useMemoryStore } from "@/appState";
import { useSubscriptionStore } from "@/appState/subscriptionStore";
import { useReminderStore } from "@/appState/reminderStore";
import { createSubscriptionGuards } from "@/domain/subscription/subscriptionGuards";
import type { QuoteOrientation } from "@/constants/quoteImageSize";
import { DEFAULT_QUOTE_POSITION, type QuotePosition } from "@/features/quotes/quotePosition";
import { saveUserPhoto } from "@/services/media/saveUserPhoto";
import {
  getQuoteValidationMessageKey,
  validateEditableQuote,
} from "@/services/ai/rewriteReview";
import { compressImageForUpload } from "@/utils/imageProcessor";
import { pickPhotoForQuote } from "@/utils/pickPhotoForQuote";
import { isStreakMilestone } from "@/utils/streakMilestones";
import {
  getGenerationResultStage,
  type GenerationStage,
} from "@/features/home/generationStage";
import i18n from "@/i18n";
import type { HomeVibeKey } from "@/types/homeBackground";
import { parseHomeVibeKey } from "@/domain/home/activeHomeMoment";

const EXPO_ZOOM_MIN = 0;
const EXPO_ZOOM_MAX = 0.5;
const ZOOM_SENSITIVITY = 0.25;
type ZoomPreset = 0.5 | 1 | 2;
const DISPLAY_FACTOR_MIN = 0.5;
const DISPLAY_FACTOR_MAX = 2;
const INK_BLOOM_SETTLE_MS = 650;

function zoomToFactor(expoZoom: number): number {
  const t = (expoZoom - EXPO_ZOOM_MIN) / (EXPO_ZOOM_MAX - EXPO_ZOOM_MIN);
  return DISPLAY_FACTOR_MIN + t * (DISPLAY_FACTOR_MAX - DISPLAY_FACTOR_MIN);
}

function factorToZoom(factor: number): number {
  const clamped = Math.min(
    DISPLAY_FACTOR_MAX,
    Math.max(DISPLAY_FACTOR_MIN, factor),
  );
  const t =
    (clamped - DISPLAY_FACTOR_MIN) / (DISPLAY_FACTOR_MAX - DISPLAY_FACTOR_MIN);
  return EXPO_ZOOM_MIN + t * (EXPO_ZOOM_MAX - EXPO_ZOOM_MIN);
}

function activePresetForFactor(factor: number): ZoomPreset {
  if (factor < 0.75) return 0.5;
  if (factor < 1.25) return 1;
  return 2;
}

type CameraFacing = "back" | "front";

function orientationForImage(width?: number, height?: number): QuoteOrientation {
  return width != null && height != null && width > height
    ? "landscape"
    : "portrait";
}

export type PinchGesture = ReturnType<typeof Gesture.Pinch>;

type UseHomeCameraOptions = {
  onPhotoSaved?: () => void;
  onMilestoneReached?: (streak: number) => void;
  homeVibeKey?: string;
  cameraEnabled?: boolean;
};

export const useHomeCamera = (options?: UseHomeCameraOptions) => {
  const onPhotoSaved = options?.onPhotoSaved;
  const onMilestoneReached = options?.onMilestoneReached;
  const homeVibeKey = options?.homeVibeKey;
  const [draftVibeKey, setDraftVibeKey] = useState<HomeVibeKey | null>(null);
  const draftVibeRef = useRef<HomeVibeKey | null>(null);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const isPickingImageRef = useRef(false);
  function commitDraftVibe(key: HomeVibeKey | null) {
    draftVibeRef.current = key;
    setDraftVibeKey(key);
  }
  const { isLoading, isGranted, requestPermission } = useCameraPermission();
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraSessionKey, setCameraSessionKey] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [photoOrientation, setPhotoOrientation] =
    useState<QuoteOrientation>("portrait");
  const [quotePosition, setQuotePosition] = useState<QuotePosition>(
    DEFAULT_QUOTE_POSITION,
  );
  const [hideQuote, setHideQuote] = useState(false);
  const [hasSavedCurrentPhoto, setHasSavedCurrentPhoto] = useState(false);
  const [photoStackCount, setPhotoStackCount] = useState(0);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [facing, setFacing] = useState<CameraFacing>("back");
  const [zoom, setZoom] = useState(() => factorToZoom(1));
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] =
    useState<GenerationStage>("idle");
  const [quoteFontSize, setQuoteFontSize] = useState<
    "small" | "medium" | "large"
  >("medium");
  const [quoteColorScheme, setQuoteColorScheme] = useState<
    "light" | "amber" | "pink"
  >("light");
  const cameraRef = useRef<CameraView | null>(null);
  const isCapturingRef = useRef(false);
  const isSavingPhotoRef = useRef(false);
  const photoStackIdRef = useRef<string | null>(null);
  const zoomRef = useRef(factorToZoom(1));
  const zoomStartRef = useRef(factorToZoom(1));
  const generationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const generationStageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const generationRequestIdRef = useRef(0);
  const { dailyQuote, clearDailyQuote } = useQuoteStore();
  const { profile, authUserId, persona, ensureGuestId } = useUserStore();
  const { showToast } = useUIStore();
  const { generate, cancelGeneration } = useGenerateQuote();
  const { isGenerating } = useAIStore();
  const addMemory = useMemoryStore((state) => state.addMemory);
  const customerInfo = useSubscriptionStore((state) => state.customerInfo);
  const canCreatePhotoStack = useMemo(() => {
    const snapshot = customerInfo
      ? { activeEntitlementIds: customerInfo.activeEntitlementIds }
      : null;
    return createSubscriptionGuards(snapshot).canCreatePhotoStack().allowed;
  }, [customerInfo]);

  zoomRef.current = zoom;

  useEffect(() => {
    return () => {
      generationRequestIdRef.current += 1;
      cancelGeneration();
      if (generationIntervalRef.current) {
        clearInterval(generationIntervalRef.current);
        generationIntervalRef.current = null;
      }
      if (generationStageTimeoutRef.current) {
        clearTimeout(generationStageTimeoutRef.current);
        generationStageTimeoutRef.current = null;
      }
    };
  }, [cancelGeneration]);

  useEffect(() => {
    if (!canCreatePhotoStack) {
      photoStackIdRef.current = null;
      setPhotoStackCount(0);
    }
  }, [canCreatePhotoStack]);

  useFocusEffect(
    useCallback(() => {
      setCameraReady(false);
      setCameraSessionKey((current) => current + 1);
      setIsCameraActive(true);
      setCameraError(null);

      return () => {
        setIsCameraActive(false);
        setCameraReady(false);
      };
    }, []),
  );

  useEffect(() => {
    setCameraReady(false);
  }, [options?.cameraEnabled, selectedImageUri, isPickingImage]);

  const captureZoomStart = useCallback(() => {
    zoomStartRef.current = zoomRef.current;
  }, []);

  const applyZoom = useCallback((scale: number) => {
    const next = Math.min(
      EXPO_ZOOM_MAX,
      Math.max(
        EXPO_ZOOM_MIN,
        zoomStartRef.current + (scale - 1) * ZOOM_SENSITIVITY,
      ),
    );
    setZoom(next);
  }, []);

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .enabled(selectedImageUri === null)
        .onStart(() => {
          scheduleOnRN(captureZoomStart);
        })
        .onUpdate((event) => {
          scheduleOnRN(applyZoom, event.scale);
        }),
    [captureZoomStart, applyZoom, selectedImageUri],
  );

  function handleZoomPreset(preset: ZoomPreset) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setZoom(factorToZoom(preset));
  }

  function handleToggleFacing() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCameraReady(false);
    setCameraError(null);
    setFacing((previous) => (previous === "back" ? "front" : "back"));
  }

  function handleCameraReady() {
    setCameraError(null);
    setCameraReady(true);
  }

  function handleCameraMountError(event: CameraMountError) {
    console.error("Failed to start camera preview", event);
    setCameraReady(false);
    setCameraError(i18n.t("camera.errors.failedToStartPreview"));
    showToast(i18n.t("camera.errors.failedToStartPreview"), "error");
  }

  function clearGenerationTimers() {
    if (generationIntervalRef.current) {
      clearInterval(generationIntervalRef.current);
      generationIntervalRef.current = null;
    }
    if (generationStageTimeoutRef.current) {
      clearTimeout(generationStageTimeoutRef.current);
      generationStageTimeoutRef.current = null;
    }
  }

  function invalidateGeneration() {
    generationRequestIdRef.current += 1;
    cancelGeneration();
    clearGenerationTimers();
    setGenerationProgress(0);
    setGenerationStage("idle");
  }

  function clearSelectedImage() {
    if (isSavingPhotoRef.current) {
      showToast(i18n.t("camera.info.photoSaveInProgress"), "info");
      return;
    }
    invalidateGeneration();
    commitDraftVibe(null);
    setSelectedImageUri(null);
    setPhotoOrientation("portrait");
    setQuotePosition(DEFAULT_QUOTE_POSITION);
    setHideQuote(true);
    setHasSavedCurrentPhoto(false);
    setGenerationProgress(0);
    setGenerationStage("idle");
    clearDailyQuote();
  }

  function finishPhotoStack() {
    photoStackIdRef.current = null;
    setPhotoStackCount(0);
  }

  async function generateForImage(
    sourceUri: string | null,
    enforceCooldown: boolean,
  ) {
    const requestId = ++generationRequestIdRef.current;
    const isCurrentRequest = () =>
      generationRequestIdRef.current === requestId;
    cancelGeneration();
    clearGenerationTimers();
    setGenerationStage("preparing");
    setGenerationProgress(0.08);
    generationIntervalRef.current = setInterval(() => {
      if (!isCurrentRequest()) return;
      setGenerationProgress((current) => {
        if (current >= 0.92) {
          return current;
        }
        return current + 0.04;
      });
    }, 180);
    let base64: string | undefined;
    if (!base64 && sourceUri) {
      try {
        base64 = await compressImageForUpload(sourceUri);
      } catch (err) {
        if (!isCurrentRequest()) return;
        clearGenerationTimers();
        setGenerationProgress(0);
        setGenerationStage("idle");
        console.error("Failed to process photo before quote generation", err);
        showToast(i18n.t("camera.errors.failedToProcessImage"), "error");
        return;
      }
    }
    if (!isCurrentRequest()) return;
    setGenerationStage("matching");
    generationStageTimeoutRef.current = setTimeout(() => {
      if (isCurrentRequest()) setGenerationStage("writing");
    }, 550);
    const quote = await generate(
      base64,
      enforceCooldown,
      undefined,
      isCurrentRequest,
    );
    if (!isCurrentRequest()) return;
    clearGenerationTimers();
    const resultStage = getGenerationResultStage(Boolean(quote));
    setGenerationStage(resultStage);
    if (!quote) {
      setGenerationProgress(0);
      return;
    }
    setHideQuote(false);
    setGenerationProgress(1);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, INK_BLOOM_SETTLE_MS);
    });
    if (!isCurrentRequest()) return;
    setGenerationProgress(0);
    setGenerationStage("idle");
    showToast(i18n.t("camera.success.quoteGenerated"), "success");
  }

  async function handleCapture() {
    if (isCapturingRef.current || isSavingPhotoRef.current || isPickingImageRef.current || options?.cameraEnabled === false) {
      return;
    }

    if (!isGranted) {
      isCapturingRef.current = true;
      try {
        const permissionResult = await requestPermission();
        if (!permissionResult.granted) {
          showToast(i18n.t("camera.errors.permissionRequired"), "error");
        }
      } catch (error) {
        console.error("Failed to request camera permission", error);
        showToast(i18n.t("camera.errors.permissionRequired"), "error");
      } finally {
        isCapturingRef.current = false;
      }
      return;
    }

    if (!cameraRef.current || !cameraReady) {
      return;
    }

    const captureVibe = parseHomeVibeKey(homeVibeKey);
    isCapturingRef.current = true;
    setIsCapturing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
      });
      if (!photo?.uri) {
        showToast(i18n.t("camera.errors.failedToSavePhoto"), "error");
        return;
      }
      invalidateGeneration();
      commitDraftVibe(captureVibe);
      setSelectedImageUri(photo.uri);
      setPhotoOrientation("portrait");
      setQuotePosition(DEFAULT_QUOTE_POSITION);
      clearDailyQuote();
      setHideQuote(true);
      setHasSavedCurrentPhoto(false);
      void generateForImage(photo.uri, true);
    } catch (error) {
      console.error("Failed to capture image", error);
      showToast(i18n.t("camera.errors.failedToSavePhoto"), "error");
    } finally {
      isCapturingRef.current = false;
      setIsCapturing(false);
    }
  }

  async function handleRetryGeneration() {
    if (isSavingPhotoRef.current) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await generateForImage(selectedImageUri ?? null, true);
  }

  async function handleSavePhoto(quoteDraft?: string | null) {
    if (!selectedImageUri) {
      showToast(i18n.t("camera.errors.noPhotoToSave"), "error");
      return;
    }
    if (isSavingPhotoRef.current) {
      return;
    }
    if (hasSavedCurrentPhoto) {
      showToast(i18n.t("camera.info.photoAlreadySaved"), "info");
      return;
    }
    let quoteText = useQuoteStore.getState().dailyQuote?.text?.trim() ?? "";
    if (quoteDraft != null) {
      const validation = validateEditableQuote(quoteDraft);
      if (!validation.isValid) {
        const messageKey = getQuoteValidationMessageKey(validation.reason ?? "");
        showToast(
          messageKey
            ? i18n.t(messageKey)
            : i18n.t("camera.errors.quoteRequiredToSave"),
          "error",
        );
        return;
      }
      quoteText = validation.sanitizedQuote;
      const currentQuote = useQuoteStore.getState().dailyQuote;
      if (currentQuote && currentQuote.text.trim() !== quoteText) {
        useQuoteStore.getState().setDailyQuote({
          ...currentQuote,
          text: quoteText,
        });
      }
    }
    if (!quoteText) {
      showToast(i18n.t("camera.errors.quoteRequiredToSave"), "info");
      return;
    }
    invalidateGeneration();
    isSavingPhotoRef.current = true;
    setIsSavingPhoto(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const userId = profile?.user_id ?? authUserId;
      const guestId = profile?.user_id ? null : ensureGuestId();
      const photoStackId = canCreatePhotoStack
        ? (photoStackIdRef.current ?? Crypto.randomUUID())
        : null;
      const result = await saveUserPhoto({
        localUri: selectedImageUri,
        userId,
        guestId,
        quote: quoteText,
        orientation: photoOrientation,
        quotePosition,
        styleFontId: quoteFontSize,
        styleColorSchemeId: quoteColorScheme,
        homeVibeKey: draftVibeRef.current,
        photoStackId,
      });
      if (!result) {
        showToast(i18n.t("camera.errors.failedToSavePhoto"), "error");
        return;
      }
      clearDailyQuote();
      const nowDate = new Date();
      const today = formatLocalDateKey(nowDate);
      const now = nowDate.toISOString();
      if (quoteText) {
        addMemory({
          id: result.photoId,
          photoId: result.photoId,
          ownerUserId: userId,
          ownerGuestId: guestId,
          date: today,
          quoteText,
          author: profile?.display_name ?? profile?.username ?? null,
          personaId: persona?.id ?? null,
          photoBackgroundUri: result.publicUrl,
          photoStoragePath: result.storagePath,
          photoOrientation: result.orientation,
          quotePosition,
          styleFontId: quoteFontSize,
          styleColorSchemeId: quoteColorScheme,
          createdAt: now,
          visibility: "private",
          isFavorite: false,
        });
      }
      const streakIncremented = useStreakStore.getState().incrementStreak();
      const newStreak = useStreakStore.getState().currentStreak;
      if (streakIncremented && newStreak > 0) {
        analyticsEvents.streakIncremented(newStreak);
      }
      if (streakIncremented && isStreakMilestone(newStreak)) {
        onMilestoneReached?.(newStreak);
      }
      if (photoStackId) {
        photoStackIdRef.current = photoStackId;
        setPhotoStackCount((count) => count + 1);
      }
      commitDraftVibe(null);
      setSelectedImageUri(null);
      setPhotoOrientation("portrait");
      setQuotePosition(DEFAULT_QUOTE_POSITION);
      setHideQuote(true);
      setHasSavedCurrentPhoto(false);
      setGenerationProgress(0);
      setGenerationStage("idle");
      showToast(i18n.t("camera.success.photoSaved"), "success");
      onPhotoSaved?.();

      const reminderState = useReminderStore.getState();
      if (
        !reminderState.reminderEnabled &&
        !reminderState.hasPromptedAfterFirstSave
      ) {
        reminderState.markReminderPromptShown();
        Alert.alert(
          i18n.t("camera.firstSaveReminder.title"),
          i18n.t("camera.firstSaveReminder.body"),
          [
            {
              text: i18n.t("camera.firstSaveReminder.notNow"),
              style: "cancel",
            },
            {
              text: i18n.t("camera.firstSaveReminder.enable"),
              onPress: () => {
                void reminderState.enableReminder().then((enabled) => {
                  if (!enabled) {
                    showToast(
                      i18n.t("camera.firstSaveReminder.permissionDenied"),
                      "info",
                    );
                  }
                });
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error("Failed to save photo", error);
      showToast(i18n.t("camera.errors.failedToSavePhoto"), "error");
    } finally {
      isSavingPhotoRef.current = false;
      setIsSavingPhoto(false);
    }
  }

  async function handleOpenGallery() {
    if (isPickingImageRef.current || isCapturingRef.current) return;
    if (isSavingPhotoRef.current) {
      showToast(i18n.t("camera.info.photoSaveInProgress"), "info");
      return;
    }
    const importVibe = parseHomeVibeKey(homeVibeKey);
    isPickingImageRef.current = true;
    setIsPickingImage(true);
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showToast(i18n.t("camera.errors.galleryPermissionRequired"), "error");
        return;
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const picked = await pickPhotoForQuote();
      if (!picked) {
        return;
      }
      invalidateGeneration();
      commitDraftVibe(importVibe);
      setSelectedImageUri(picked.uri);
      setPhotoOrientation(orientationForImage(picked.width, picked.height));
      setQuotePosition(DEFAULT_QUOTE_POSITION);
      clearDailyQuote();
      setHideQuote(true);
      setHasSavedCurrentPhoto(false);
      void generateForImage(picked.uri, true);
      return true;
    } catch (error) {
      console.error("Failed to pick image from gallery", error);
      showToast(i18n.t("camera.errors.failedToSavePhoto"), "error");
    } finally {
      isPickingImageRef.current = false;
      setIsPickingImage(false);
    }
  }

  function handleSubmitQuoteEdit(text: string) {
    const currentQuote = useQuoteStore.getState().dailyQuote;
    if (!currentQuote) {
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    useQuoteStore.getState().setDailyQuote({
      ...currentQuote,
      text: trimmed,
    });
  }

  function handleInvalidQuoteEdit(message: string) {
    showToast(message, "error");
  }

  const zoomFactor = zoomToFactor(zoom);
  const activePreset = activePresetForFactor(zoomFactor);

  return {
    isLoading,
    isGranted,
    requestPermission,
    cameraRef,
    cameraReady,
    cameraSessionKey,
    cameraError,
    isCameraActive: isCameraActive && isGranted && options?.cameraEnabled !== false && !selectedImageUri && !isPickingImage,
    draftVibeKey,
    isPickingImage,
    handleCameraReady,
    handleCameraMountError,
    isCapturing,
    isSavingPhoto,
    selectedImageUri,
    photoOrientation,
    quotePosition,
    setQuotePosition,
    hideQuote,
    hasSavedCurrentPhoto,
    canCreatePhotoStack,
    photoStackCount,
    zoom,
    zoomFactor,
    activePreset,
    pinchGesture,
    handleZoomPreset,
    handleToggleFacing,
    handleCapture,
    handleRetryGeneration,
    handleSavePhoto,
    handleOpenGallery,
    clearSelectedImage,
    finishPhotoStack,
    isGenerating,
    generationProgress,
    generationStage,
    quoteFontSize,
    quoteColorScheme,
    setQuoteFontSize,
    setQuoteColorScheme,
    handleSubmitQuoteEdit,
    handleInvalidQuoteEdit,
    dailyQuoteText: dailyQuote?.text ?? null,
    facing,
  };
};
