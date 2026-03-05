import {
  getDisplayStreak,
  useStreakStore,
} from "@/appState/streakStore";
import { useUserStore } from "@/appState/userStore";
import { CameraActionsBar } from "@/components/CameraActionsBar";
import { HomeHeader } from "@/components/HomeHeader";
import { MilestoneCelebration } from "@/components/MilestoneCelebration";
import { HomeCameraSection } from "@/features/home/HomeCameraSection";
import { useHomeCamera } from "@/features/home/useHomeCamera";
import { QuoteMomentsFeed } from "@/features/quotes/QuoteMomentsFeed";
import { useQuotePhotoFeed } from "@/features/quotes/useQuotePhotoFeed";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function HomeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);
  const [feedOffsetY, setFeedOffsetY] = useState(0);
  const [milestone, setMilestone] = useState<number | null>(null);
  const scrollStartOffsetRef = useRef(0);
  const insets = useSafeAreaInsets();
  const displayStreak = useStreakStore((s) => getDisplayStreak(s));
  const profile = useUserStore((s) => s.profile);
  const persona = useUserStore((s) => s.persona);
  const inviteNudgeDismissed = useUserStore((s) => s.inviteNudgeDismissed);
  const setInviteNudgeDismissed = useUserStore(
    (s) => s.setInviteNudgeDismissed,
  );
  const showInviteNudge = Boolean(profile && persona && !inviteNudgeDismissed);
  const {
    items: feedItems,
    isRefreshing: isFeedRefreshing,
    refresh: refreshFeed,
    refreshSilently,
  } = useQuotePhotoFeed();
  const {
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
    dailyQuoteText,
  } = useHomeCamera({
    onPhotoSaved: refreshSilently,
    onMilestoneReached: setMilestone,
  });

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

  return (
    <View className="flex-1 bg-gray-500">
      <MilestoneCelebration
        milestone={milestone}
        onDismiss={() => setMilestone(null)}
      />
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        refreshControl={
          <RefreshControl
            refreshing={isFeedRefreshing}
            onRefresh={refreshFeed}
            tintColor="#ffffff"
          />
        }
        contentContainerStyle={{
          paddingBottom: 24,
        }}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}>
        <View
          style={{
            height: SCREEN_HEIGHT,
            paddingTop: insets.top,
            paddingBottom: 100,
          }}>
          <HomeHeader
            currentStreak={displayStreak}
            onPressProfile={() => router.push("/(tabs)/friends" as never)}
          />
          {showInviteNudge && (
            <View className="mx-4 mb-2 flex-row items-center justify-between rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              <Text className="flex-1 text-sm text-white" numberOfLines={2}>
                Invite friends to share quotes with
              </Text>
              <View className="ml-2 flex-row gap-2">
                <Pressable
                  onPress={() => setInviteNudgeDismissed(true)}
                  className="rounded-lg bg-white/20 px-3 py-2"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                  <Text className="text-xs font-medium text-white">Skip</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setInviteNudgeDismissed(true);
                    router.push("/(tabs)/friends" as never);
                  }}
                  className="rounded-lg bg-amber-400 px-3 py-2"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                  <Text className="text-xs font-semibold text-black">
                    Invite
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
          <View className="flex-1 w-full">
            <HomeCameraSection
              cameraRef={cameraRef}
              pinchGesture={pinchGesture}
              isPortrait={isPortrait}
              orientationTransitioning={orientationTransitioning}
              selectedImageUri={selectedImageUri}
              canDeleteImage={!hasSavedCurrentPhoto}
              zoom={zoom}
              zoomFactor={zoomFactor}
              activePreset={activePreset}
              hideQuote={hideQuote}
              dailyQuoteText={dailyQuoteText}
              onCameraReady={handleCameraReady}
              onZoomPresetPress={handleZoomPreset}
              onToggleOrientation={handleToggleOrientation}
              onClearImage={clearSelectedImage}
            />
          </View>
        </View>

        <QuoteMomentsFeed
          items={feedItems}
          screenHeight={SCREEN_HEIGHT}
          onFeedLayoutYChange={setFeedOffsetY}
        />
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
