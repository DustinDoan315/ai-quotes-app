import { getDisplayStreak, useStreakStore } from "@/appState/streakStore";
import { useUserStore } from "@/appState/userStore";
import { CameraActionsBar } from "@/components/CameraActionsBar";
import { HomeHeader } from "@/components/HomeHeader";
import { MilestoneCelebration } from "@/components/MilestoneCelebration";
import { HomeCameraSection } from "@/features/home/HomeCameraSection";
import { useHomeCamera } from "@/features/home/useHomeCamera";
import { QuoteMomentsFeed } from "@/features/quotes/QuoteMomentsFeed";
import { useQuotePhotoFeed } from "@/features/quotes/useQuotePhotoFeed";
import { sendUserPhotoReaction } from "@/services/media/userPhotoReactions";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_HEIGHT = Dimensions.get("window").height;

type EmojiBurst = {
  id: string;
  emoji: string;
  x: number;
  delay: number;
};

export default function HomeScreen() {
  const router = useRouter();
  const [milestone, setMilestone] = useState<number | null>(null);
  const insets = useSafeAreaInsets();
  const displayStreak = useStreakStore((s) => getDisplayStreak(s));
  const profile = useUserStore((s) => s.profile);
  const persona = useUserStore((s) => s.persona);
  const guestDisplayName = useUserStore((s) => s.guestDisplayName);
  const guestId = useUserStore((s) => s.guestId);
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
  const [emojiBursts, setEmojiBursts] = useState<EmojiBurst[]>([]);

  const authorName =
    profile?.display_name ?? profile?.username ?? guestDisplayName ?? "You";
  const authorAvatarUrl = profile?.avatar_url ?? null;
  const actionBarBottomPadding = Math.max(insets.bottom, 24);
  const actionBarHeight = 56 + actionBarBottomPadding + 12;

  async function handleReact(photoId: string, type: "love" | "clap" | "fire") {
    const userId = profile?.user_id ?? null;
    const success = await sendUserPhotoReaction({
      photoId,
      userId,
      guestId: userId ? null : (guestId ?? null),
      type,
    });
    if (!success) {
      return;
    }
    const emoji = type === "love" ? "❤️" : type === "clap" ? "👏" : "🔥";
    const bursts: EmojiBurst[] = [];
    const count = 24;
    const baseId = Date.now().toString();
    const durationMs = 2500;
    const delayStepMs = 40;
    for (let i = 0; i < count; i += 1) {
      bursts.push({
        id: `${baseId}-${i}`,
        emoji,
        x: 10 + Math.random() * 80,
        delay: i * delayStepMs,
      });
    }
    const idsToRemove = bursts.map((b) => b.id);
    setEmojiBursts((prev) => [...prev, ...bursts]);
    const maxDelay = (count - 1) * delayStepMs;
    const removeAfter = durationMs + maxDelay + 100;
    setTimeout(() => {
      setEmojiBursts((prev) => prev.filter((b) => !idsToRemove.includes(b.id)));
    }, removeAfter);
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
      <FlatList
        className="flex-1"
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="center"
        decelerationRate="fast"
        data={feedItems}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isFeedRefreshing}
            onRefresh={refreshFeed}
            tintColor="#ffffff"
          />
        }
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={9}
        ListHeaderComponent={
          <View
            style={{
              height: SCREEN_HEIGHT,
              paddingTop: insets.top,
              paddingBottom: actionBarHeight,
            }}>
            <HomeHeader
              currentStreak={displayStreak}
              onPressProfile={() => router.push("/(tabs)/profile" as never)}
              onPressFriends={() => router.push("/(tabs)/friends" as never)}
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
        }
        ListEmptyComponent={
          <QuoteMomentsFeed
            items={[]}
            screenHeight={SCREEN_HEIGHT}
            onFeedLayoutYChange={() => {}}
            authorName={authorName}
            authorAvatarUrl={authorAvatarUrl}
            currentUserId={profile?.user_id ?? null}
            currentGuestId={guestId ?? null}
            onReact={handleReact}
          />
        }
        renderItem={({ item }) => (
          <QuoteMomentsFeed
            items={[item]}
            screenHeight={SCREEN_HEIGHT}
            onFeedLayoutYChange={() => {}}
            authorName={authorName}
            authorAvatarUrl={authorAvatarUrl}
            currentUserId={profile?.user_id ?? null}
            currentGuestId={guestId ?? null}
            onReact={handleReact}
          />
        )}
        contentContainerStyle={{ paddingBottom: actionBarHeight }}
      />

      <View
        className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/20 px-4 pt-3"
        style={{ paddingBottom: actionBarBottomPadding }}
        pointerEvents="box-none">
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
      <View className="pointer-events-none absolute inset-0">
        {emojiBursts.map((burst) => (
          <MotiView
            key={burst.id}
            from={{ opacity: 1, translateY: SCREEN_HEIGHT * 0.1, scale: 0.9 }}
            animate={{
              opacity: 1,
              translateY: -SCREEN_HEIGHT * 1.2,
              scale: 1.6,
            }}
            exit={{
              opacity: 0,
              translateY: -SCREEN_HEIGHT * 1.6,
              scale: 1.4,
            }}
            transition={{
              type: "timing",
              duration: 2500,
              delay: burst.delay,
            }}
            style={{
              position: "absolute",
              bottom: 60,
              left: `${burst.x}%`,
            }}>
            <Text className="text-5xl">{burst.emoji}</Text>
          </MotiView>
        ))}
      </View>
    </View>
  );
}
