import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { CameraView } from "expo-camera";
import { Gesture } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import { useAIStore } from "@/features/ai/aiStore";
import { useCallback, useMemo, useRef, useState } from "react";
import { useCameraPermission } from "@/hooks/useCameraPermission";
import { useGenerateQuote } from "@/features/ai/useGenerateQuote";
import { useQuoteStore } from "@/appState/quoteStore";
import { useUIStore } from "@/appState/uiStore";
import { useUserStore } from "@/appState/userStore";
import { saveUserPhoto } from "@/services/media/saveUserPhoto";

const EXPO_ZOOM_MIN = 0;
const EXPO_ZOOM_MAX = 0.5;
const ZOOM_SENSITIVITY = 0.25;
const ZOOM_PRESETS = [0.5, 1, 2] as const;
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

function activePresetForFactor(factor: number): (typeof ZOOM_PRESETS)[number] {
  if (factor < 0.75) return 0.5;
  if (factor < 1.25) return 1;
  return 2;
}

export type CameraOrientation = "portrait" | "landscape";

export type PinchGesture = ReturnType<typeof Gesture.Pinch>;

export const useHomeCamera = () => {
  const { isLoading, isGranted, requestPermission } = useCameraPermission();
  const [cameraReady, setCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [imageContextUrl, setImageContextUrl] = useState<string | null>(null);
  const [hideQuote, setHideQuote] = useState(false);
  const [hasSavedCurrentPhoto, setHasSavedCurrentPhoto] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [orientation, setOrientation] = useState<CameraOrientation>("portrait");
  const [orientationTransitioning, setOrientationTransitioning] =
    useState(false);
  const [zoom, setZoom] = useState(() => factorToZoom(1));
  const cameraRef = useRef<CameraView | null>(null);
  const zoomRef = useRef(factorToZoom(1));
  const zoomStartRef = useRef(factorToZoom(1));
  const orientationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const { dailyQuote } = useQuoteStore();
  const { profile, ensureGuestId } = useUserStore();
  const { showToast } = useUIStore();
  const { generate } = useGenerateQuote();
  const { isGenerating } = useAIStore();

  zoomRef.current = zoom;

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

  function handleZoomPreset(preset: (typeof ZOOM_PRESETS)[number]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setZoom(factorToZoom(preset));
  }

  function handleToggleOrientation() {
    if (orientationTimeoutRef.current) {
      clearTimeout(orientationTimeoutRef.current);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOrientationTransitioning(true);
    setOrientation((previous) =>
      previous === "portrait" ? "landscape" : "portrait",
    );
    orientationTimeoutRef.current = setTimeout(() => {
      setOrientationTransitioning(false);
      orientationTimeoutRef.current = null;
    }, 300);
  }

  function handleCameraReady() {
    setCameraReady(true);
  }

  function clearSelectedImage() {
    setSelectedImageUri(null);
    setImageContextUrl(null);
    setHideQuote(false);
    setHasSavedCurrentPhoto(false);
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
      setSelectedImageUri(photo.uri);
      setImageContextUrl(null);
      setHideQuote(true);
      setHasSavedCurrentPhoto(false);
      showToast("Photo captured", "success");
    } finally {
      setIsCapturing(false);
    }
  }

  async function handleGenerateAI() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const quote = await generate(
      imageContextUrl ?? undefined,
      imageContextUrl ? undefined : selectedImageUri ?? undefined,
    );
    if (!quote) {
      return;
    }
    setHideQuote(false);
    showToast("Quote generated", "success");
  }

  async function handleSavePhoto() {
    if (!selectedImageUri) {
      showToast("No photo to save", "error");
      return;
    }
    if (isSavingPhoto) {
      return;
    }
    if (hasSavedCurrentPhoto) {
      showToast("Photo already saved", "info");
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
      });
      if (!result) {
        showToast("Failed to save photo", "error");
        return;
      }
      setSelectedImageUri(null);
      setImageContextUrl(null);
      setHideQuote(false);
      setHasSavedCurrentPhoto(false);
      showToast("Photo saved", "success");
    } finally {
      setIsSavingPhoto(false);
    }
  }

  async function handleOpenGallery() {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showToast("We need gallery access to pick photos.", "error");
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.9,
      selectionLimit: 1,
    });
    if (result.canceled || result.assets.length === 0) {
      return;
    }
    const asset = result.assets[0];
    setSelectedImageUri(asset.uri);
    setImageContextUrl(null);
    setHideQuote(true);
    setHasSavedCurrentPhoto(false);
    showToast("Photo selected", "success");
  }

  const isPortrait = orientation === "portrait";
  const zoomFactor = zoomToFactor(zoom);
  const activePreset = activePresetForFactor(zoomFactor);

  return {
    isLoading,
    isGranted,
    requestPermission,
    cameraRef,
    cameraReady,
    handleCameraReady,
    isCapturing,
    isSavingPhoto,
    selectedImageUri,
    hideQuote,
    hasSavedCurrentPhoto,
    orientationTransitioning,
    isPortrait,
    zoom,
    zoomFactor,
    activePreset,
    pinchGesture,
    handleZoomPreset,
    handleToggleOrientation,
    handleCapture,
    handleGenerateAI,
    handleSavePhoto,
    handleOpenGallery,
    clearSelectedImage,
    isGenerating,
    dailyQuoteText: dailyQuote?.text ?? null,
  };
};
