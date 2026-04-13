import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { CameraView } from "expo-camera";
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
import { saveUserPhoto } from "@/services/media/saveUserPhoto";
import { compressImageForUpload } from "@/utils/imageProcessor";
import { centerCropToAspect, getImageDimensions } from "@/utils/imageCrop";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { getQuoteAspectRatio } from "@/constants/quoteImageSize";
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
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(
    null,
  );
  const [hideQuote, setHideQuote] = useState(false);
  const [hasSavedCurrentPhoto, setHasSavedCurrentPhoto] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [facing, setFacing] = useState<CameraFacing>("back");
  const [zoom, setZoom] = useState(() => factorToZoom(1));
  const [generationProgress, setGenerationProgress] = useState(0);
  const [quoteFontSize, setQuoteFontSize] = useState<"small" | "medium" | "large">("medium");
  const [quoteColorScheme, setQuoteColorScheme] = useState<"light" | "amber" | "pink">("light");
  const cameraRef = useRef<CameraView | null>(null);
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

  zoomRef.current = zoom;

  useEffect(() => {
    return () => {
      if (generationIntervalRef.current) {
        clearInterval(generationIntervalRef.current);
        generationIntervalRef.current = null;
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsCameraActive(true);

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
    setFacing((previous) => (previous === "back" ? "front" : "back"));
  }

  function handleCameraReady() {
    setCameraReady(true);
  }

  function clearSelectedImage() {
    setSelectedImageUri(null);
    setSelectedImageBase64(null);
    setHideQuote(true);
    setHasSavedCurrentPhoto(false);
    setGenerationProgress(0);
    clearDailyQuote();
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
    setGenerationProgress(0);
    showToast("Quote generated", "success");
  }

  async function handleCapture() {
    if (!cameraRef.current || !cameraReady || isCapturing) {
      return;
    }
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
      let previewUri = photo.uri;
      try {
        const targetAspect = getQuoteAspectRatio("portrait");
        const { width: srcW, height: srcH } = await getImageDimensions(photo.uri);
        const cropRect = centerCropToAspect(srcW, srcH, targetAspect);
        const ctx = ImageManipulator.manipulate(photo.uri);
        ctx.crop(cropRect);
        const rendered = await ctx.renderAsync();
        const cropped = await rendered.saveAsync({ compress: 1, format: SaveFormat.JPEG });
        previewUri = cropped.uri;
      } catch {
        // fall back to raw URI if crop fails
      }
      setSelectedImageUri(previewUri);
      setSelectedImageBase64(null);
      setHideQuote(true);
      await generateForImage(photo.uri, false);
      setHasSavedCurrentPhoto(false);
      showToast(i18n.t("camera.info.photoCaptured"), "success");
    } catch (error) {
      console.error("Failed to capture image", error);
      showToast(i18n.t("camera.errors.failedToSavePhoto"), "error");
    } finally {
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
    if (isSavingPhoto) {
      return;
    }
    if (hasSavedCurrentPhoto) {
      showToast(i18n.t("camera.info.photoAlreadySaved"), "info");
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSavingPhoto(true);
    try {
      const userId = profile?.user_id ?? null;
      const guestId = userId ? null : ensureGuestId();
      const quoteText = dailyQuote?.text ?? null;
      const result = await saveUserPhoto({
        localUri: selectedImageUri,
        userId,
        guestId,
        quote: quoteText,
        orientation: "portrait",
        styleFontId: quoteFontSize,
        styleColorSchemeId: quoteColorScheme,
        homeVibeKey: homeVibeKey ?? null,
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
          ownerUserId: userId,
          ownerGuestId: guestId,
          date: today,
          quoteText,
          author: profile?.display_name ?? profile?.username ?? null,
          personaId: persona?.id ?? null,
          photoBackgroundUri: result.publicUrl,
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
      setSelectedImageUri(null);
      setSelectedImageBase64(null);
      setHideQuote(true);
      setHasSavedCurrentPhoto(false);
      setGenerationProgress(0);
      showToast(i18n.t("camera.success.photoSaved"), "success");
      onPhotoSaved?.();
    } finally {
      setIsSavingPhoto(false);
    }
  }

  async function handleOpenGallery() {
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
    showToast(i18n.t("camera.info.photoSelected"), "success");
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
    isCameraActive,
    handleCameraReady,
    isCapturing,
    isSavingPhoto,
    selectedImageUri,
    hideQuote,
    hasSavedCurrentPhoto,
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
