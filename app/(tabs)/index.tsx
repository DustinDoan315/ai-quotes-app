import * as Haptics from 'expo-haptics';
import { CameraView } from 'expo-camera';
import { Easing } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { scheduleOnRN } from 'react-native-worklets';
import {
  useCallback,
  useMemo,
  useRef,
  useState
  } from 'react';
import { useCameraPermission } from '../../hooks/useCameraPermission';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ActivityIndicator,
  LayoutAnimation,
  Pressable,
  Text,
  View,
} from "react-native";


const EXPO_ZOOM_MIN = 0;
const EXPO_ZOOM_MAX = 0.3;
const ZOOM_SENSITIVITY = 0.7;
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

type CameraOrientation = "portrait" | "landscape";

export default function HomeScreen() {
  const { isLoading, isGranted, requestPermission } = useCameraPermission();
  const [cameraReady, setCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [orientation, setOrientation] = useState<CameraOrientation>("portrait");
  const [orientationTransitioning, setOrientationTransitioning] =
    useState(false);
  const [zoom, setZoom] = useState(() => factorToZoom(1));
  const cameraRef = useRef<CameraView>(null);
  const zoomRef = useRef(factorToZoom(1));
  const zoomStartRef = useRef(factorToZoom(1));
  const insets = useSafeAreaInsets();

  const orientationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

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
        .onUpdate((e) => {
          scheduleOnRN(applyZoom, e.scale);
        }),
    [captureZoomStart, applyZoom],
  );

  function handleZoomPreset(preset: (typeof ZOOM_PRESETS)[number]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setZoom(factorToZoom(preset));
  }

  function handleToggleOrientation() {
    if (orientationTimeoutRef.current)
      clearTimeout(orientationTimeoutRef.current);
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        300,
        LayoutAnimation.Types.linear,
        LayoutAnimation.Properties.opacity,
      ),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOrientationTransitioning(true);
    setOrientation((prev) => (prev === "portrait" ? "landscape" : "portrait"));
    orientationTimeoutRef.current = setTimeout(() => {
      setOrientationTransitioning(false);
      orientationTimeoutRef.current = null;
    }, 300);
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!isGranted) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-8">
        <Text className="mb-4 text-center text-white">
          We need camera access to take photos.
        </Text>
        <Pressable
          onPress={requestPermission}
          className="rounded-full bg-white px-6 py-3">
          <Text className="font-semibold text-black">Allow camera</Text>
        </Pressable>
      </View>
    );
  }

  async function handleCapture() {
    if (!cameraRef.current || !cameraReady || isCapturing) return;
    setIsCapturing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await cameraRef.current.takePictureAsync({
        quality: 0.9,
      });
    } finally {
      setIsCapturing(false);
    }
  }

  const isPortrait = orientation === "portrait";
  const zoomFactor = zoomToFactor(zoom);
  const activePreset = activePresetForFactor(zoomFactor);

  return (
    <View className="flex-1 bg-gray-500" style={{ paddingTop: insets.top }}>
      <View className="flex-1 items-center justify-center px-4 py-6">
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
                ? "aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl bg-black"
                : "aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-2xl bg-black"
            }>
            <CameraView
              ref={cameraRef}
              style={{ flex: 1 }}
              facing="back"
              zoom={zoom}
              onCameraReady={() => setCameraReady(true)}
            />
          </MotiView>
        </GestureDetector>
      </View>
      <View
        className="absolute right-4 top-0 flex-row items-center gap-3"
        style={{ paddingTop: insets.top + 12 }}>
        <Pressable
          onPress={handleToggleOrientation}
          className="h-12 w-12 items-center justify-center rounded-full border-2 border-white/60 bg-white/15"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Ionicons
            name={
              isPortrait ? "phone-portrait-outline" : "phone-landscape-outline"
            }
            size={24}
            color="#fff"
          />
        </Pressable>
      </View>
      <View
        className="items-center pb-8"
        style={{ paddingBottom: Math.max(insets.bottom, 32) }}>
        <View className="mb-4 items-center gap-2">
          <Text
            className="text-sm font-medium text-white"
            style={{ opacity: 0.9 }}>
            {zoomFactor % 1 === 0
              ? `${zoomFactor}×`
              : `${zoomFactor.toFixed(1)}×`}
          </Text>
          <View className="flex-row items-center gap-1 rounded-full border border-white/40 bg-black/40 px-2 py-1">
            {ZOOM_PRESETS.map((preset) => {
              const isActive = activePreset === preset;
              return (
                <Pressable
                  key={preset}
                  onPress={() => handleZoomPreset(preset)}
                  className="min-w-[44px] items-center justify-center rounded-full px-3 py-2"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.8 : 1,
                    backgroundColor: isActive
                      ? "rgba(255, 204, 0, 0.35)"
                      : "transparent",
                  })}>
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: isActive ? "#FFCC00" : "#fff" }}>
                    {preset}×
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Pressable
          onPress={handleCapture}
          disabled={!cameraReady || isCapturing}
          className="h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/20"
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
          })}>
          {isCapturing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View className="h-14 w-14 rounded-full bg-white" />
          )}
        </Pressable>
      </View>
    </View>
  );
}
