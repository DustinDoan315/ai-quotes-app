import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { CameraActionsBar } from '@/components/CameraActionsBar';
import { CameraView } from 'expo-camera';
import { Easing } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { HomeHeader } from '@/components/HomeHeader';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { QuoteCard } from '@/components/QuoteCard';
import { saveUserPhoto } from '@/services/media/saveUserPhoto';
import { scheduleOnRN } from 'react-native-worklets';
import { useAIStore } from '@/features/ai/aiStore';
import {
  useCallback,
  useMemo,
  useRef,
  useState
  } from 'react';
import { useCameraPermission } from '../../hooks/useCameraPermission';
import { useGenerateQuote } from '@/features/ai/useGenerateQuote';
import { useQuotePhotoFeed } from '@/features/quotes/useQuotePhotoFeed';
import { useQuoteStore } from '@/appState/quoteStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStreakStore } from '@/appState/streakStore';
import { useUIStore } from '@/appState/uiStore';
import { useUserStore } from '@/appState/userStore';

import {
  ActivityIndicator,
  Dimensions,
  LayoutAnimation,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";


const EXPO_ZOOM_MIN = 0;
const EXPO_ZOOM_MAX = 0.5;
const ZOOM_SENSITIVITY = 0.25;
const ZOOM_PRESETS = [0.5, 1, 2] as const;
const DISPLAY_FACTOR_MIN = 0.5;
const DISPLAY_FACTOR_MAX = 2;
const SCREEN_HEIGHT = Dimensions.get("window").height;

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
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [imageContextUrl, setImageContextUrl] = useState<string | null>(null);
  const [hideQuote, setHideQuote] = useState(false);
  const [hasSavedCurrentPhoto, setHasSavedCurrentPhoto] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [orientation, setOrientation] = useState<CameraOrientation>("portrait");
  const [orientationTransitioning, setOrientationTransitioning] =
    useState(false);
  const [zoom, setZoom] = useState(() => factorToZoom(1));
  const cameraRef = useRef<CameraView>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const zoomRef = useRef(factorToZoom(1));
  const zoomStartRef = useRef(factorToZoom(1));
  const [feedOffsetY, setFeedOffsetY] = useState(0);
  const scrollStartOffsetRef = useRef(0);
  const insets = useSafeAreaInsets();
  const { currentStreak } = useStreakStore();
  const { showToast } = useUIStore();
  const { dailyQuote } = useQuoteStore();
  const { profile, ensureGuestId } = useUserStore();
  const { generate } = useGenerateQuote();
  const { isGenerating } = useAIStore();
  const {
    items: feedItems,
    isRefreshing: isFeedRefreshing,
    refresh: refreshFeed,
  } = useQuotePhotoFeed();

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

  function handleScrollBeginDrag(
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) {
    scrollStartOffsetRef.current = event.nativeEvent.contentOffset.y;
  }

  function handleScrollEndDrag(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const endOffsetY = event.nativeEvent.contentOffset.y;
    const startOffsetY = scrollStartOffsetRef.current;
    const delta = endOffsetY - startOffsetY;
    const threshold = SCREEN_HEIGHT * 0.2;

    if (Math.abs(delta) < threshold) {
      return;
    }

    if (!scrollRef.current || feedOffsetY <= 0) {
      return;
    }
    const target = delta > 0 ? feedOffsetY : 0;

    scrollRef.current.scrollTo({
      y: target,
      animated: true,
    });
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
    console.log("AI handleGenerateAI tapped", {
      selectedImageUri,
      imageContextUrl,
    });

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const quote = await generate(
      imageContextUrl ?? undefined,
      imageContextUrl ? undefined : (selectedImageUri ?? undefined),
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
      console.log("Saving photo with quote", {
        hasQuote: !!quoteText,
        quote: quoteText,
      });
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

      setImageContextUrl(result.publicUrl);
      setHasSavedCurrentPhoto(true);
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

    if (result.canceled || !result.assets.length) {
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

  return (
    <View className="flex-1 bg-gray-500">
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isFeedRefreshing}
            onRefresh={refreshFeed}
            tintColor="#ffffff"
          />
        }
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: 24,
        }}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}>
        <HomeHeader currentStreak={currentStreak} />

        <View className="items-center justify-center px-4 py-6">
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
              {selectedImageUri ? (
                <View className="flex-1">
                  <Image
                    source={{ uri: selectedImageUri }}
                    style={{ flex: 1 }}
                    contentFit="cover"
                  />
                  <Pressable
                    onPress={() => {
                      setSelectedImageUri(null);
                      setImageContextUrl(null);
                      setHideQuote(false);
                      setHasSavedCurrentPhoto(false);
                    }}
                    className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-black/60"
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.8 : 1,
                    })}>
                    <Ionicons name="trash-outline" size={18} color="#ffffff" />
                  </Pressable>
                </View>
              ) : (
                <CameraView
                  ref={cameraRef}
                  style={{ flex: 1 }}
                  facing="back"
                  zoom={zoom}
                  onCameraReady={() => setCameraReady(true)}
                />
              )}
            </MotiView>
          </GestureDetector>
        </View>

        <View className="items-center pb-4">
          <Text className="mb-3 text-xs font-medium text-white/70">
            Capture your moment
          </Text>
          {hideQuote
            ? null
            : dailyQuote && <QuoteCard text={dailyQuote.text} />}
          {!selectedImageUri ? (
            <View className="mb-4 w-full items-center gap-2">
              <Text
                className="text-sm font-medium text-white"
                style={{ opacity: 0.9 }}>
                `
                {zoomFactor % 1 === 0
                  ? `${zoomFactor}×`
                  : `${zoomFactor.toFixed(1)}×`}
                `
              </Text>
              <View className="mt-1 w-full justify-center items-center">
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
                <Pressable
                  onPress={handleToggleOrientation}
                  className="absolute right-10 h-10 w-10 items-center justify-center rounded-full border-2 border-white/60 bg-white/15"
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
          ) : null}
        </View>

        <View
          className="mt-2 px-4"
          onLayout={(event) => {
            setFeedOffsetY(event.nativeEvent.layout.y);
          }}>
          <Text className="mb-2 text-xs font-medium text-white/70">
            Your moments feed
          </Text>
          {feedItems.length === 0 ? (
            <Text className="text-xs text-white/60">
              Save a photo with a quote to see it here.
            </Text>
          ) : (
            <View className="gap-4">
              {feedItems.map((item) => (
                <View
                  key={item.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-lg shadow-black/40">
                  <View className="relative">
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{ width: "100%", aspectRatio: 3 / 4 }}
                      contentFit="cover"
                    />
                    <View className="absolute inset-x-0 bottom-0 px-4 py-3 bg-black/60">
                      <View className="mb-1 flex-row items-center">
                        <Ionicons
                          name="sparkles-outline"
                          size={14}
                          color="#FFCC00"
                        />
                        <Text className="ml-1 text-[10px] font-semibold text-white/70">
                          Shared moment
                        </Text>
                      </View>
                      <Text
                        className="text-xs font-medium text-white"
                        numberOfLines={3}>
                        {item.quote}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View
        className="border-t border-white/10 px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
        <CameraActionsBar
          onGenerate={handleGenerateAI}
          onCapture={handleCapture}
          onOpenGallery={handleOpenGallery}
          onSave={handleSavePhoto}
          isGenerating={isGenerating}
          isCapturing={isCapturing}
          cameraReady={cameraReady}
          hasImage={!!selectedImageUri}
          canSave={!hasSavedCurrentPhoto}
          isSaving={isSavingPhoto}
        />
      </View>
    </View>
  );
}
