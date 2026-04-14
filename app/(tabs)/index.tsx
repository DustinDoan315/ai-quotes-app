import { useMemoryStore } from "@/appState";
import { getDisplayStreak, useStreakStore } from "@/appState/streakStore";
import { useUIStore } from "@/appState/uiStore";
import { useUserStore } from "@/appState/userStore";
import { MilestoneCelebration } from "@/components/MilestoneCelebration";
import { HomeActionBar } from "@/features/home/HomeActionBar";
import { StreakModal } from "@/features/streak/StreakModal";
import { HomeCaptureFlow } from "@/features/home/HomeCaptureFlow";
import { HomeEmojiOverlay } from "@/features/home/HomeEmojiOverlay";
import { HomeFeedFlow } from "@/features/home/HomeFeedFlow";
import { RewriteQuoteReviewModal } from "@/features/home/RewriteQuoteReviewModal";
import { useHomeBackgroundPalette } from "@/features/home/useHomeBackgroundPalette";
import { useHomeAiReview } from "@/features/home/useHomeAiReview";
import { useHomeCamera } from "@/features/home/useHomeCamera";
import { useHomeFeedState } from "@/features/home/useHomeFeedState";
import { groupQuotePhotoCardsIntoStacks } from "@/features/quotes/quoteStack/groupQuotePhotoCardsIntoStacks";
import type { QuoteStack } from "@/features/quotes/quoteStack/types";
import { useQuotePhotoFeed } from "@/features/quotes/useQuotePhotoFeed";
import { useTranslation } from "react-i18next";
import { getTodayLocalDateKey } from "@/utils/dateKey";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { MemoryState } from "@/appState/memoryStore";
import type { QuoteMemory } from "@/types/memory";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function HomeScreen() {
  const router = useRouter();
  const [milestone, setMilestone] = useState<number | null>(null);
  const [streakModalVisible, setStreakModalVisible] = useState(false);
  const { t } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);
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
  const quoteStacks = useMemo(
    () => groupQuotePhotoCardsIntoStacks(feedItems),
    [feedItems],
  );
  const { vibeHint, palette } = useHomeBackgroundPalette();
  const {
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
    facing,
    zoom,
    zoomFactor,
    activePreset,
    pinchGesture,
    handleZoomPreset,
    handleToggleFacing,
    handleCapture,
    handleSavePhoto,
    handleOpenGallery,
    clearSelectedImage,
    isGenerating,
    generationProgress,
    dailyQuoteText,
    quoteFontSize,
    quoteColorScheme,
    setQuoteFontSize,
    setQuoteColorScheme,
    handleSubmitQuoteEdit,
    handleInvalidQuoteEdit,
  } = useHomeCamera({
    onPhotoSaved: () => {
      refreshSilently();
      showToast(t("home.savedToMemories"), "success", 3000);
    },
    onMilestoneReached: setMilestone,
    homeVibeKey: palette.vibeKey,
  });
  const listRef = useRef<FlatList<QuoteStack>>(null);
  const today = getTodayLocalDateKey();
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
  const actionBarBottomPadding = insets.bottom;
  const viewportHeight = SCREEN_HEIGHT - insets.top - actionBarBottomPadding;
  const getItemLayout = useMemo(
    () => (_: ArrayLike<QuoteStack> | null | undefined, index: number) => ({
      length: viewportHeight,
      offset: viewportHeight + index * viewportHeight,
      index,
    }),
    [viewportHeight],
  );
  const snapOffsets = useMemo(
    () =>
      Array.from(
        { length: quoteStacks.length + 1 },
        (_, i) => i * viewportHeight,
      ),
    [quoteStacks.length, viewportHeight],
  );
  const isCaptureFlowActive =
    isCapturing ||
    isSavingPhoto ||
    isGenerating ||
    (!!selectedImageUri && !hasSavedCurrentPhoto);
  const {
    aiResult,
    selectedAiTool,
    pendingAiTool,
    clearAiToolState,
    handleFutureQuotePress,
    handleApproveFutureQuote,
    handleCancelFutureQuote,
    futureReviewText,
    handleRewriteQuote,
    handleApproveRewrite,
    handleCancelRewrite,
    rewriteReviewText,
    isAiToolLoading,
    aiToolsLoadingLabel,
  } = useHomeAiReview(dailyQuoteText);
  const {
    currentFeedIndex,
    activeQuoteId,
    isOnFeed,
    emojiBursts,
    composerText,
    isComposerOpen,
    isSendingMessage,
    lastSentLabel,
    setActiveQuoteId,
    setComposerText,
    setIsComposerOpen,
    handleReact,
    handleSendMessage,
    viewabilityConfig,
    onViewableItemsChanged,
    shouldShowMessageBar,
  } = useHomeFeedState({
    quoteStacks,
    userId: profile?.user_id ?? null,
    guestId: guestId ?? null,
  });
  const flatListExtraData = useMemo(
    () =>
      `${selectedAiTool ?? ""}|${pendingAiTool ?? ""}|${aiResult?.title ?? ""}`,
    [selectedAiTool, pendingAiTool, aiResult?.title],
  );

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

  function handleClearCurrentImage() {
    clearAiToolState();
    clearSelectedImage();
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
          {t("home.cameraPermissionRequired")}
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
      <HomeFeedFlow
        listRef={listRef}
        quoteStacks={quoteStacks}
        isCaptureFlowActive={isCaptureFlowActive}
        flatListExtraData={flatListExtraData}
        snapOffsets={snapOffsets}
        getItemLayout={getItemLayout}
        isFeedRefreshing={isFeedRefreshing}
        refreshFeed={refreshFeed}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        viewportHeight={viewportHeight}
        authorName={authorName}
        authorAvatarUrl={authorAvatarUrl}
        currentFeedIndex={currentFeedIndex}
        isOnFeed={isOnFeed}
        onActiveQuoteIdChange={setActiveQuoteId}
        onGeneratePress={handleCameraButtonPress}
        header={
          <HomeCaptureFlow
            viewportHeight={viewportHeight}
            topInset={insets.top}
            displayStreak={displayStreak}
            pastMemory={pastMemories[0] ?? null}
            showInviteNudge={showInviteNudge}
            onPressProfile={() => router.push("/(tabs)/profile" as never)}
            onPressFriends={() => router.push("/(tabs)/friends" as never)}
            onPressSignIn={() =>
              router.push({
                pathname: "/login",
                params: { returnTo: "/(tabs)" },
              } as never)
            }
            onPressStreak={() => setStreakModalVisible(true)}
            onPressPastMemory={(date) =>
              router.push({
                pathname: "/memories/day",
                params: { date },
              } as never)
            }
            onDismissInviteNudge={() => setInviteNudgeDismissed(true)}
            onPressInviteNudge={() => {
              setInviteNudgeDismissed(true);
              router.push("/(tabs)/friends" as never);
            }}
            cameraSectionProps={{
              cameraRef,
              pinchGesture,
              isCameraActive,
              selectedImageUri,
              canDeleteImage: !hasSavedCurrentPhoto,
              facing,
              zoom,
              zoomFactor,
              activePreset,
              hideQuote,
              dailyQuoteText,
              isGenerating,
              generationProgress,
              quoteFontSize,
              quoteColorScheme,
              onChangeQuoteFontSize: setQuoteFontSize,
              onChangeQuoteColorScheme: setQuoteColorScheme,
              onSubmitQuoteEdit: handleSubmitQuoteEdit,
              onInvalidQuoteEdit: handleInvalidQuoteEdit,
              authorName,
              authorAvatarUrl,
              onCameraReady: handleCameraReady,
              onZoomPresetPress: handleZoomPreset,
              onToggleFacing: handleToggleFacing,
              onClearImage: handleClearCurrentImage,
              onRewriteQuote: handleRewriteQuote,
              onFutureQuotePress: handleFutureQuotePress,
              selectedAiTool,
              pendingAiTool,
              aiResultTitle: aiResult?.title ?? null,
              aiResultBody: aiResult?.body ?? null,
              aiToolsLoading: isAiToolLoading,
              aiToolsLoadingLabel,
              vibeHint,
              cardPalette: palette,
            }}
          />
        }
      />
      <HomeActionBar
        isComposerOpen={isComposerOpen}
        shouldShowMessageBar={shouldShowMessageBar}
        canSendMessage={isOnFeed && Boolean(activeQuoteId)}
        composerText={composerText}
        isSendingMessage={isSendingMessage}
        lastSentLabel={lastSentLabel}
        bottomInset={actionBarBottomPadding}
        onOpenComposer={() => setIsComposerOpen(true)}
        onCloseComposer={() => setIsComposerOpen(false)}
        onChangeComposerText={setComposerText}
        onSendMessage={handleSendMessage}
        onOpenMemories={handleOpenMemories}
        onCameraPress={handleCameraButtonPress}
        onOpenGallery={handleOpenGallery}
        onSavePhoto={handleSavePhoto}
        onReact={handleReact}
        isGenerating={isGenerating}
        isCapturing={isCapturing}
        cameraReady={cameraReady}
        hasImage={!!selectedImageUri}
        canSave={!hasSavedCurrentPhoto}
        isSaving={isSavingPhoto}
      />
      <HomeEmojiOverlay bursts={emojiBursts} screenHeight={SCREEN_HEIGHT} />
      <StreakModal
        visible={streakModalVisible}
        onClose={() => setStreakModalVisible(false)}
      />
      <RewriteQuoteReviewModal
        visible={rewriteReviewText !== null}
        initialText={rewriteReviewText ?? ""}
        sourceText={dailyQuoteText ?? ""}
        onApprove={handleApproveRewrite}
        onCancel={handleCancelRewrite}
      />
      <RewriteQuoteReviewModal
        visible={futureReviewText !== null}
        initialText={futureReviewText ?? ""}
        sourceText={dailyQuoteText ?? ""}
        title={t("home.aiTools.futureReviewTitle")}
        guidance={t("home.aiTools.futureReviewGuidance")}
        approveLabel={t("home.aiTools.futureReviewApprove")}
        onApprove={handleApproveFutureQuote}
        onCancel={handleCancelFutureQuote}
      />
    </View>
  );
}
