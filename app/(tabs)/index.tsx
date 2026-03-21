import { useMemoryStore } from "@/appState";
import type { MemoryState } from "@/appState/memoryStore";
import type { QuoteMemory } from "@/types/memory";
import { getDisplayStreak, useStreakStore } from "@/appState/streakStore";
import { useUserStore } from "@/appState/userStore";
import { CameraActionsBar } from "@/components/CameraActionsBar";
import { HomeHeader } from "@/components/HomeHeader";
import { MilestoneCelebration } from "@/components/MilestoneCelebration";
import { HomeCameraSection } from "@/features/home/HomeCameraSection";
import { useHomeBackgroundPalette } from "@/features/home/useHomeBackgroundPalette";
import { useHomeCamera } from "@/features/home/useHomeCamera";
import { QuoteMomentsFeed } from "@/features/quotes/QuoteMomentsFeed";
import { useQuotePhotoFeed } from "@/features/quotes/useQuotePhotoFeed";
import { sendUserPhotoReaction } from "@/services/media/userPhotoReactions";
import { useRouter } from "expo-router";
import { strings } from "@/theme/strings";
import { MotiView } from "moti";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
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
  const [currentFeedIndex, setCurrentFeedIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const displayStreak = useStreakStore((state) => getDisplayStreak(state));
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
  const { vibeHint, palette } = useHomeBackgroundPalette();
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
    facing,
    zoom,
    zoomFactor,
    activePreset,
    pinchGesture,
    handleZoomPreset,
    handleToggleOrientation,
    handleToggleFacing,
    handleCapture,
    handleSavePhoto,
    handleOpenGallery,
    clearSelectedImage,
    isGenerating,
    generationProgress,
    dailyQuoteText,
    handleClearQuote,
    handleGenerateAI,
    quoteFontSize,
    quoteColorScheme,
    setQuoteFontSize,
    setQuoteColorScheme,
  } = useHomeCamera({
    onPhotoSaved: () => {
      refreshSilently();
      setJustSavedMemory(true);
      setTimeout(() => {
        setJustSavedMemory(false);
      }, 1800);
    },
    onMilestoneReached: setMilestone,
    homeVibeKey: palette.vibeKey,
  });
  const [emojiBursts, setEmojiBursts] = useState<EmojiBurst[]>([]);
  const [isOnFeed, setIsOnFeed] = useState(false);
  const listRef = useRef<FlatList>(null);
  const today = new Date().toISOString().split("T")[0];
  const memories = useMemoryStore((s: MemoryState) => s.memories);
  const pastMemories = useMemo(() => {
    const target = new Date(today);
    const day = target.getDate();
    const month = target.getMonth();
    return memories
      .filter((m: QuoteMemory) => {
        const d = new Date(m.date);
        return (
          d.getDate() === day && d.getMonth() === month && m.date !== today
        );
      })
      .sort((a: QuoteMemory, b: QuoteMemory) =>
        a.createdAt > b.createdAt ? -1 : 1,
      );
  }, [memories, today]);

  const authorName =
    profile?.display_name ?? profile?.username ?? guestDisplayName ?? "You";
  const authorAvatarUrl = profile?.avatar_url ?? null;
  const currentPhotoId =
    feedItems.length > 0 ? (feedItems[currentFeedIndex]?.id ?? null) : null;
  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      const hasItems = viewableItems.length > 0;
      setIsOnFeed(hasItems);
      if (!hasItems) {
        return;
      }
      const first = viewableItems[0];
      if (first.index == null) {
        return;
      }
      setCurrentFeedIndex(first.index);
    },
  ).current;

  const [composerText, setComposerText] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [lastSentLabel, setLastSentLabel] = useState<string | null>(null);
  const [justSavedMemory, setJustSavedMemory] = useState(false);
  const shouldShowMessageBar = isOnFeed && currentPhotoId;
  const actionBarBottomPadding = insets.bottom;
  const viewportHeight = SCREEN_HEIGHT - insets.top - actionBarBottomPadding;
  const getItemLayout = useMemo(
    () =>
      (_: unknown, index: number) => ({
        length: viewportHeight,
        offset: viewportHeight + index * viewportHeight,
        index,
      }),
    [viewportHeight],
  );
  const snapOffsets = useMemo(
    () =>
      Array.from(
        { length: feedItems.length + 1 },
        (_, i) => i * viewportHeight,
      ),
    [feedItems.length, viewportHeight],
  );
  const isCaptureFlowActive =
    isCapturing ||
    isSavingPhoto ||
    isGenerating ||
    (!!selectedImageUri && !hasSavedCurrentPhoto);

  function handleOpenMemories() {
    router.push("/memories" as never);
  }

  function handleCameraButtonPress() {
    if (isOnFeed) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    } else {
      handleCapture();
    }
  }

  async function handleReact(type: "love" | "clap" | "fire") {
    if (!currentPhotoId) {
      return;
    }
    const userId = profile?.user_id ?? null;
    const success = await sendUserPhotoReaction({
      photoId: currentPhotoId,
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

  async function handleSendMessage() {
    const trimmed = composerText.trim();
    if (!currentPhotoId || !trimmed) {
      return;
    }
    if (isSendingMessage) {
      return;
    }
    setIsSendingMessage(true);
    const userId = profile?.user_id ?? null;
    const success = await sendUserPhotoReaction({
      photoId: currentPhotoId,
      userId,
      guestId: userId ? null : (guestId ?? null),
      type: "love",
      comment: trimmed,
    });
    setIsSendingMessage(false);
    if (!success) {
      return;
    }
    setComposerText("");
    setIsComposerOpen(false);
    setLastSentLabel(strings.home.messageSent);
    setTimeout(() => {
      setLastSentLabel((label) => (label === "Message sent" ? null : label));
    }, 1200);
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-transparent">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!isGranted) {
    return (
      <View className="flex-1 items-center justify-center bg-transparent px-8">
        <Text className="mb-4 text-center text-white">
          {strings.home.cameraPermissionRequired}
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
    <View className="flex-1">
      <MilestoneCelebration
        milestone={milestone}
        onDismiss={() => setMilestone(null)}
      />
      {justSavedMemory && (
        <View className="absolute left-0 right-0 top-10 z-10 items-center">
          <View className="rounded-full bg-black/85 px-4 py-2">
            <Text className="text-xs font-semibold text-white">
              {strings.home.savedToMemories}
            </Text>
          </View>
        </View>
      )}
      <FlatList
        ref={listRef}
        className="flex-1 bg-transparent"
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isCaptureFlowActive}
        snapToAlignment="start"
        snapToOffsets={snapOffsets}
        decelerationRate="fast"
        data={feedItems}
        keyExtractor={(item) => item.id}
        getItemLayout={getItemLayout}
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
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        ListHeaderComponent={
          <View
            style={{
              height: viewportHeight,
              paddingTop: insets.top,
            }}>
            <HomeHeader
              currentStreak={displayStreak}
              onPressProfile={() => router.push("/(tabs)/profile" as never)}
              onPressFriends={() => router.push("/(tabs)/friends" as never)}
              onPressSignIn={() =>
                router.push({
                  pathname: "/login",
                  params: { returnTo: "/(tabs)" },
                } as never)
              }
            />
            {pastMemories.length > 0 && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/memories/day",
                    params: { date: pastMemories[0].date },
                  } as never)
                }
                className="mx-4 mb-3 rounded-xl border border-white/15 bg-white/8 px-4 py-3"
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <Text className="text-xs font-semibold uppercase tracking-wide text-amber-300">
              {strings.memories.thisDayInMemoriesLabel}
            </Text>
                <Text
                  className="mt-1 text-sm font-medium text-white"
                  numberOfLines={2}>
                  {pastMemories[0].quoteText}
                </Text>
              </Pressable>
            )}
            {showInviteNudge && (
              <View className="mx-4 mb-2 flex-row items-center justify-between rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                <Text className="flex-1 text-sm text-white" numberOfLines={2}>
                  {strings.home.inviteFriendsTitle}
                </Text>
                <View className="ml-2 flex-row gap-2">
                  <Pressable
                    onPress={() => setInviteNudgeDismissed(true)}
                    className="rounded-lg bg-white/20 px-3 py-2"
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                    <Text className="text-xs font-medium text-white">
                      {strings.home.inviteSkip}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setInviteNudgeDismissed(true);
                      router.push("/(tabs)/friends" as never);
                    }}
                    className="rounded-lg bg-amber-400 px-3 py-2"
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                    <Text className="text-xs font-semibold text-black">
                      {strings.home.inviteCta}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
            {__DEV__ && (
              <View className="mx-4 mb-2">
                <Pressable
                  onPress={() =>
                    router.push("/modal/paywall?reason=ai_limit" as never)
                  }
                  className="items-center justify-center rounded-full bg-amber-400 px-4 py-2"
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                  <Text className="text-xs font-semibold text-black">
                    Open Paywall (Test)
                  </Text>
                </Pressable>
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
                facing={facing}
                zoom={zoom}
                zoomFactor={zoomFactor}
                activePreset={activePreset}
                hideQuote={hideQuote}
                dailyQuoteText={dailyQuoteText}
                isGenerating={isGenerating}
                generationProgress={generationProgress}
                quoteFontSize={quoteFontSize}
                quoteColorScheme={quoteColorScheme}
                onChangeQuoteFontSize={setQuoteFontSize}
                onChangeQuoteColorScheme={setQuoteColorScheme}
                authorName={authorName}
                authorAvatarUrl={authorAvatarUrl}
                onCameraReady={handleCameraReady}
                onZoomPresetPress={handleZoomPreset}
                onToggleOrientation={handleToggleOrientation}
                onToggleFacing={handleToggleFacing}
                onClearImage={clearSelectedImage}
                onClearQuote={handleClearQuote}
                onRegenerateQuote={handleGenerateAI}
                vibeHint={vibeHint}
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
          />
        }
        renderItem={({ item }) => (
          <QuoteMomentsFeed
            items={[item]}
            screenHeight={viewportHeight}
            onFeedLayoutYChange={() => {}}
            authorName={authorName}
            authorAvatarUrl={authorAvatarUrl}
          />
        )}
      />

      {!isComposerOpen && (
        <View
          className="border-t border-white/10 bg-black/20 px-4 pt-2"
          style={{ paddingBottom: actionBarBottomPadding }}
          pointerEvents="box-none">
          {shouldShowMessageBar && (
            <View className="mb-2 flex-row items-center justify-between rounded-full bg-white/10 px-3 py-2">
              <Pressable
                onPress={() => setIsComposerOpen(true)}
                className="flex-1">
                <Text className="text-xs text-white/70">
                  {strings.home.messagePlaceholder}
                </Text>
              </Pressable>
              <View className="ml-2 flex-row items-center gap-2">
                <Pressable
                  onPress={() => handleReact("love")}
                  className="rounded-full bg-white/15 px-3 py-1">
                  <Text className="text-base">❤️</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleReact("fire")}
                  className="rounded-full bg-white/15 px-3 py-1">
                  <Text className="text-base">🔥</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleReact("clap")}
                  className="rounded-full bg-white/15 px-3 py-1">
                  <Text className="text-base">😍</Text>
                </Pressable>
              </View>
            </View>
          )}
          <CameraActionsBar
            onGenerate={handleOpenMemories}
            onCapture={handleCameraButtonPress}
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
      )}
      {isComposerOpen && (
        <>
          <Pressable
            className="absolute inset-0 bg-black/60"
            onPress={() => setIsComposerOpen(false)}
          />
          <KeyboardAvoidingView
            behavior="padding"
            keyboardVerticalOffset={insets.bottom}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
            }}>
            <View
              className="px-4 pt-2"
              style={{ paddingBottom: insets.bottom }}
              pointerEvents="box-none">
              {isOnFeed && currentPhotoId && (
                <View className="flex-row items-center justify-between rounded-full bg-gray-500/90 px-3 py-2">
                  <TextInput
                    autoFocus
                    placeholder="Reply…"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={composerText}
                    onChangeText={setComposerText}
                    onSubmitEditing={handleSendMessage}
                    onBlur={() => setIsComposerOpen(false)}
                    className="flex-1 text-xs text-white"
                    returnKeyType="send"
                  />
                  <Pressable
                    onPress={handleSendMessage}
                    disabled={isSendingMessage}
                    className="ml-2 rounded-full bg-white px-3 py-1"
                    style={{ opacity: isSendingMessage ? 0.6 : 1 }}>
                    <Text className="text-xs font-semibold text-black">
                      {isSendingMessage ? "Sending…" : "Send"}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </>
      )}
      {lastSentLabel && !isComposerOpen && (
        <View className="absolute inset-x-0 bottom-[72px] items-center">
          <View className="rounded-full bg-black/80 px-3 py-1">
            <Text className="text-[10px] font-medium text-white/80">
              {lastSentLabel}
            </Text>
          </View>
        </View>
      )}
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
