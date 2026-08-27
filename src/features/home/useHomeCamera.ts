import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Crypto from "expo-crypto";
import { CameraView, type CameraMountError } from "expo-camera";
import { useFocusEffect } from "@react-navigation/native";
import { Gesture } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import { useAIStore } from "@/features/ai/aiStore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCameraPermission } from "@/hooks/useCameraPermission";
import { useGenerateQuote } from "@/features/ai/useGenerateQuote";
import { useQuoteStore } from "@/appState/quoteStore";
import { useStreakStore } from "@/appState/streakStore";
import { useUIStore } from "@/appState/uiStore";
import { analyticsEvents } from "@/services/analytics/events";
import { useUserStore } from "@/appState/userStore";
import { useMemoryStore } from "@/appState";
import { useSubscriptionStore } from "@/appState/subscriptionStore";
import { createSubscriptionGuards } from "@/domain/subscription/subscriptionGuards";
import { saveUserPhoto } from "@/services/media/saveUserPhoto";
import { compressImageForUpload } from "@/utils/imageProcessor";
import { formatLocalDateKey } from "@/utils/dateKey";
import { pickPhotoForQuote } from "@/utils/pickPhotoForQuote";
import { isStreakMilestone } from "@/utils/streakMilestones";
import i18n from "@/i18n";

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

export type PinchGesture = ReturnType<typeof Gesture.Pinch>;

type UseHomeCameraOptions = {
  onPhotoSaved?: () => void;
  onMilestoneReached?: (streak: number) => void;
  homeVibeKey?: string;
};

export const useHomeCamera = (options?: UseHomeCameraOptions) => {
  const onPhotoSaved = options?.onPhotoSaved;
  const onMilestoneReached = options?.onMilestoneReached;
  const homeVibeKey = options?.homeVibeKey;
  const { isLoading, isGranted, requestPermission } = useCameraPermission();
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(
    null,
  );
  const [hideQuote, setHideQuote] = useState(false);
  const [hasSavedCurrentPhoto, setHasSavedCurrentPhoto] = useState(false);
  const [photoStackCount, setPhotoStackCount] = useState(0);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [facing, setFacing] = useState<CameraFacing>("back");
  const [zoom, setZoom] = useState(() => factorToZoom(1));
  const [generationProgress, setGenerationProgress] = useState(0);
  const [quoteFontSize, setQuoteFontSize] = useState<"small" | "medium" | "large">("medium");
  const [quoteColorScheme, setQuoteColorScheme] = useState<"light" | "amber" | "pink">("light");
  const cameraRef = useRef<CameraView | null>(null);
  const isCapturingRef = useRef(false);
  const isSavingPhotoRef = useRef(false);
  const photoStackIdRef = useRef<string | null>(null);
  const zoomRef = useRef(factorToZoom(1));
  const zoomStartRef = useRef(factorToZoom(1));
  const generationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const { dailyQuote, clearDailyQuote } = useQuoteStore();
  const { profile, persona, ensureGuestId } = useUserStore();
  const { showToast } = useUIStore();
  const { generate } = useGenerateQuote();
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
      if (generationIntervalRef.current) {
        clearInterval(generationIntervalRef.current);
        generationIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!canCreatePhotoStack) {
      photoStackIdRef.current = null;
      setPhotoStackCount(0);
    }
  }, [canCreatePhotoStack]);

  useFocusEffect(
    useCallback(() => {
      setIsCameraActive(true);
      setCameraError(null);

      return () => {
        setIsCameraActive(false);
        setCameraReady(false);
      };
    }, []),
  );

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
        .onStart(() => {
          scheduleOnRN(captureZoomStart);
        })
        .onUpdate((event) => {
          scheduleOnRN(applyZoom, event.scale);
        }),
    [captureZoomStart, applyZoom],
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
    setCameraError(event.message || i18n.t("camera.errors.failedToStartPreview"));
    showToast(i18n.t("camera.errors.failedToStartPreview"), "error");
  }

  function clearSelectedImage() {
    setSelectedImageUri(null);
    setSelectedImageBase64(null);
    setHideQuote(true);
    setHasSavedCurrentPhoto(false);
    setGenerationProgress(0);
    clearDailyQuote();
  }

  function finishPhotoStack() {
    photoStackIdRef.current = null;
    setPhotoStackCount(0);
  }

  async function generateForImage(
    sourceUri: string | null,
    enforceCooldown: boolean,
    sourceBase64?: string | null,
  ) {
    if (generationIntervalRef.current) {
      clearInterval(generationIntervalRef.current);
      generationIntervalRef.current = null;
    }
    setGenerationProgress(0.08);
    generationIntervalRef.current = setInterval(() => {
      setGenerationProgress((current) => {
        if (current >= 0.92) {
          return current;
        }
        return current + 0.04;
      });
    }, 180);
    let base64 = sourceBase64?.trim() || undefined;
    if (!base64 && sourceUri) {
      try {
        base64 = await compressImageForUpload(sourceUri);
      } catch (err) {
        if (generationIntervalRef.current) {
          clearInterval(generationIntervalRef.current);
          generationIntervalRef.current = null;
        }
        setGenerationProgress(0);
        showToast(
          err instanceof Error ? err.message : "Failed to process image",
          "error",
        );
        return;
      }
    }
    const quote = await generate(base64, enforceCooldown);
    if (generationIntervalRef.current) {
      clearInterval(generationIntervalRef.current);
      generationIntervalRef.current = null;
    }
    if (!quote) {
      setGenerationProgress(0);
      return;
    }
    setHideQuote(false);
    setGenerationProgress(1);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, INK_BLOOM_SETTLE_MS);
    });
    setGenerationProgress(0);
    showToast("Quote generated", "success");
  }

  async function handleCapture() {
    if (!cameraRef.current || !cameraReady || isCapturingRef.current) {
      return;
    }
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
      setSelectedImageUri(photo.uri);
      setSelectedImageBase64(null);
      setHideQuote(true);
      await generateForImage(photo.uri, false);
      setHasSavedCurrentPhoto(false);
    } catch (error) {
      console.error("Failed to capture image", error);
      showToast(i18n.t("camera.errors.failedToSavePhoto"), "error");
    } finally {
      isCapturingRef.current = false;
      setIsCapturing(false);
    }
  }

  async function handleGenerateAI() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await generateForImage(
      selectedImageUri ?? null,
      true,
      selectedImageBase64,
    );
  }

  function handleClearQuote() {
    clearDailyQuote();
    setHideQuote(true);
    setGenerationProgress(0);
  }

  async function handleSavePhoto() {
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
    const quoteText = dailyQuote?.text?.trim() ?? "";
    if (!quoteText) {
      showToast(i18n.t("camera.errors.quoteRequiredToSave"), "info");
      return;
    }
    isSavingPhotoRef.current = true;
    setIsSavingPhoto(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const userId = profile?.user_id ?? null;
      const guestId = userId ? null : ensureGuestId();
      const photoStackId = canCreatePhotoStack
        ? photoStackIdRef.current ?? Crypto.randomUUID()
        : null;
      const result = await saveUserPhoto({
        localUri: selectedImageUri,
        userId,
        guestId,
        quote: quoteText,
        orientation: "portrait",
        styleFontId: quoteFontSize,
        styleColorSchemeId: quoteColorScheme,
        homeVibeKey: homeVibeKey ?? null,
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
          id: `${today}-${Date.now().toString(36)}`,
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
      setSelectedImageUri(null);
      setSelectedImageBase64(null);
      setHideQuote(true);
      setHasSavedCurrentPhoto(false);
      setGenerationProgress(0);
      showToast(i18n.t("camera.success.photoSaved"), "success");
      onPhotoSaved?.();
    } catch (error) {
      console.error("Failed to save photo", error);
      showToast(i18n.t("camera.errors.failedToSavePhoto"), "error");
    } finally {
      isSavingPhotoRef.current = false;
      setIsSavingPhoto(false);
    }
  }

  async function handleOpenGallery() {
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
      setSelectedImageUri(picked.uri);
      const pickedBase64 = picked.base64 || null;
      setSelectedImageBase64(pickedBase64);
      setHideQuote(true);
      setHasSavedCurrentPhoto(false);
      await generateForImage(picked.uri, false, pickedBase64);
    } catch (error) {
      console.error("Failed to pick image from gallery", error);
      showToast(i18n.t("camera.errors.failedToSavePhoto"), "error");
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
    cameraError,
    isCameraActive: isCameraActive && isGranted,
    handleCameraReady,
    handleCameraMountError,
    isCapturing,
    isSavingPhoto,
    selectedImageUri,
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
    handleGenerateAI,
    handleClearQuote,
    handleSavePhoto,
    handleOpenGallery,
    clearSelectedImage,
    finishPhotoStack,
    isGenerating,
    generationProgress,
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
