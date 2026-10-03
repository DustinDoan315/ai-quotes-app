import { createHomeFriendFixture, HOME_DEMO_FRIEND_ID } from "@/features/home/homeFriendFixture";
import { HomeReactionRow } from "@/features/home/HomeReactionRow";
import { mergeMemories } from "@/domain/memories/mergeMemories";
import { useUIStore } from "@/appState/uiStore";
import { useMemoryStore } from "@/appState";
import {
  selectBootstrapReady,
  useBootstrapStore,
} from "@/appState/bootstrapStore";
import { getDisplayStreak, useStreakStore } from "@/appState/streakStore";
import { useUserStore } from "@/appState/userStore";
import { MilestoneCelebration } from "@/components/MilestoneCelebration";
import { ServiceUnavailableScreen } from "@/components/ServiceUnavailableScreen";
import { HomeAmbientHeader } from "@/features/home/HomeAmbientHeader";
import { HomeAmbientBackground } from "@/features/home/HomeAmbientBackground";
import { HomeMomentToolbar } from "@/features/home/HomeMomentToolbar";
import { HomeCameraControls } from "@/features/home/HomeCameraControls";
import { HomeAmbientDock } from "@/features/home/HomeAmbientDock";
import { useHomeAmbientController } from "@/features/home/useHomeAmbientController";
import { useHomeActiveShare } from "@/hooks/useHomeActiveShare";
import { useHomeMomentHeart } from "@/hooks/useHomeMomentHeart";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { getHomeViewportLayout } from "@/domain/home/homeViewportLayout";
import { getHomeBackgroundPaletteByKey } from "@/theme/homeBackgrounds";
import { HOME_AMBIENT_LAYOUT } from "@/theme/homeAmbient";
import { validateEditableQuote } from "@/services/ai/rewriteReview";
import { StreakModal } from "@/features/streak/StreakModal";
import { HomeCaptureFlow } from "@/features/home/HomeCaptureFlow";
import { HomeEmojiOverlay } from "@/features/home/HomeEmojiOverlay";
import { HomeFeedFlow } from "@/features/home/HomeFeedFlow";
import { useHomeBackgroundPalette } from "@/features/home/useHomeBackgroundPalette";
import { useHomeAiReview } from "@/features/home/useHomeAiReview";
import { useHomeCamera } from "@/features/home/useHomeCamera";
import { useHomeReactions } from "@/features/home/useHomeReactions";
import { groupQuotePhotoCardsIntoStacks } from "@/features/quotes/quoteStack/groupQuotePhotoCardsIntoStacks";
import type { QuoteStack } from "@/features/quotes/quoteStack/types";
import { useQuotePhotoFeed } from "@/features/quotes/useQuotePhotoFeed";
import { useQuoteMomentShare } from "@/features/quotes/useQuoteMomentShare";
import {
  listQuotePhotoCards,
  quotePhotoCardToMemory,
} from "@/services/media/userPhotosApi";
import { getTodayLocalDateKey, parseLocalDateKey } from "@/utils/dateKey";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  ScrollView,
  FlatList,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { MemoryState } from "@/appState/memoryStore";
import type { QuoteMemory } from "@/types/memory";

const MEMORY_PAGE_SIZE = 500;

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [milestone, setMilestone] = useState<number | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [demoFriendEnabled, setDemoFriendEnabled] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(56);
  const [footerHeight, setFooterHeight] = useState(188);
  const [streakModalVisible, setStreakModalVisible] = useState(false);
  const [quoteDraftForSave, setQuoteDraftForSave] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const [measuredFeedViewportHeight, setMeasuredFeedViewportHeight] = useState(0);
  const displayStreak = useStreakStore((state) => getDisplayStreak(state));
  const profile = useUserStore((s) => s.profile);
  const bootstrapReady = useBootstrapStore(selectBootstrapReady);
  const authError = useBootstrapStore((s) => s.authError);
  const authRetrying = useBootstrapStore((s) => s.authRetrying);
  const retryAuth = useBootstrapStore((s) => s.retryAuth);
  const guestDisplayName = useUserStore((s) => s.guestDisplayName);
  const authUserId = useUserStore((s) => s.authUserId);
  const guestId = useUserStore((s) => s.guestId);
  const ensureGuestId = useUserStore((s) => s.ensureGuestId);
  const {
    items: feedItems,
    isRefreshing: isFeedRefreshing,
    refresh: refreshFeed,
    refreshSilently,
    patchFavorite,
    setFavoritePending,
    hasError: feedHasError,
  } = useQuotePhotoFeed();
  const quoteStacks = useMemo(
    () => groupQuotePhotoCardsIntoStacks([...createHomeFriendFixture(feedItems[0], demoFriendEnabled, __DEV__), ...feedItems]),
    [feedItems, demoFriendEnabled],
  );
  const { palette } = useHomeBackgroundPalette();
  const activeShare = useHomeActiveShare();
  const { captureRefView, watermarkForExport, shareMoment, isSharing: draftSharing } = useQuoteMomentShare();
  const exportLocked = activeShare.isSharing || draftSharing;
  const identity = `${authUserId ?? ''}:${profile?.user_id ?? ''}:${guestId ?? ''}`;
  const identityRef = useRef(identity);
  const identityEpoch = useRef(0);
  if (identityRef.current !== identity) { identityRef.current = identity; identityEpoch.current += 1; }
  const ambient = useHomeAmbientController(quoteStacks, identity, exportLocked);
  const reduceMotion = useReducedMotionPreference();
  const {
    isLoading,
    isGranted: cameraPermissionGranted,
    cameraRef,
    cameraReady,
    cameraSessionKey,
    cameraError,
    isCameraActive,
    handleCameraReady,
    handleCameraMountError,
    isCapturing,
    isPickingImage,
    draftVibeKey,
    isSavingPhoto,
    selectedImageUri,
    quotePosition,
    setQuotePosition,
    hideQuote,
    hasSavedCurrentPhoto,
    canCreatePhotoStack,
    photoStackCount,
    facing,
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
    },
    onMilestoneReached: setMilestone,
    homeVibeKey: palette.vibeKey,
    cameraEnabled: !ambient.isOnFeed && !ambient.isDragging && !exportLocked && !menuVisible && !streakModalVisible,
  });

  const listRef = useRef<FlatList<QuoteStack>>(null);
  const today = getTodayLocalDateKey();
  const memories = useMemoryStore((s: MemoryState) => s.memories);
  const replaceMemories = useMemoryStore((s: MemoryState) => s.replaceMemories);

  useEffect(() => {
    const ownerUserId = profile?.user_id ?? authUserId;
    const ownerGuestId = ownerUserId ? null : (guestId ?? ensureGuestId());
    let cancelled = false;

    void (async () => {
      const memories: QuoteMemory[] = [];
      let offset = 0;
      try {
        while (!cancelled) {
          const cards = await listQuotePhotoCards({
            userId: ownerUserId,
            guestId: ownerGuestId,
            limit: MEMORY_PAGE_SIZE,
            offset,
            signPhotoUrls: false,
          });
          memories.push(
            ...cards
              .filter((card) => card.quote.trim().length > 0)
              .map(quotePhotoCardToMemory),
          );
          if (cards.length < MEMORY_PAGE_SIZE) break;
          offset += cards.length;
        }
        if (!cancelled) {
          const latestLocalMemories = useMemoryStore
            .getState()
            .memories.filter((memory) =>
              ownerUserId
                ? memory.ownerUserId === ownerUserId
                : memory.ownerGuestId === ownerGuestId,
            );
          replaceMemories(mergeMemories(memories, latestLocalMemories));
        }
      } catch (error) {
        // Keep the last local cache visible while offline; a failed cloud
        // refresh must never erase memories from the screen.
        console.error("Failed to sync cloud memories", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authUserId, ensureGuestId, guestId, profile?.user_id, replaceMemories]);
  useEffect(() => {
    setQuoteDraftForSave(null);
  }, [selectedImageUri]);
  const pastMemories = useMemo(() => {
    const target = parseLocalDateKey(today);
    const day = target.getDate();
    const month = target.getMonth();
    return memories
      .filter((m: QuoteMemory) => {
        const d = parseLocalDateKey(m.date);
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

  // The action bar overlays the list, so its first page uses the full root height.
  const liveViewportHeight = measuredFeedViewportHeight || screenHeight;
  const heldGeometry = useRef({ height: liveViewportHeight, width: screenWidth, top: insets.top, bottom: insets.bottom, headerHeight, footerHeight });
  if (!exportLocked) heldGeometry.current = { height: liveViewportHeight, width: screenWidth, top: insets.top, bottom: insets.bottom, headerHeight, footerHeight };
  const viewportHeight = heldGeometry.current.height;
  const layout = getHomeViewportLayout({ width: heldGeometry.current.width, height: viewportHeight, topInset: heldGeometry.current.top, bottomInset: heldGeometry.current.bottom, headerHeight: heldGeometry.current.headerHeight, footerHeight: heldGeometry.current.footerHeight });
  const feedLayout = getHomeViewportLayout({ width: heldGeometry.current.width, height: viewportHeight, topInset: heldGeometry.current.top, bottomInset: heldGeometry.current.bottom, headerHeight: heldGeometry.current.headerHeight, footerHeight: heldGeometry.current.footerHeight, presentation: 'feed' });
  const draftPalette = draftVibeKey ? getHomeBackgroundPaletteByKey(draftVibeKey) : palette;
  const activePalette = ambient.active?.palette ?? draftPalette;
  const patchMomentFavorite = useCallback((id: string, value: boolean) => {
    patchFavorite(id, value);
    useMemoryStore.getState().setPhotoFavorite(id, value);
  }, [patchFavorite]);
  const signIn = () => router.push({ pathname: '/login', params: { returnTo: '/(tabs)' } } as never);
  const heart = useHomeMomentHeart({ card: ambient.active?.card ?? null, authUserId, signedInUserId: profile?.user_id ?? null, identityEpoch: identityEpoch.current, patchFavorite: patchMomentFavorite, onSignIn: signIn, onFavoritePending: setFavoritePending, onReactionSuccess: () => useUIStore.getState().showToast(t("home.ambient.loveSent"), "success") });
  useEffect(() => {
    if (!exportLocked && !ambient.isDragging) listRef.current?.scrollToOffset({ offset: ambient.page * viewportHeight, animated: false });
  }, [ambient.page, viewportHeight, exportLocked, ambient.isDragging]);
  const onFeedViewportHeightChange = useCallback((height: number) => {
    setMeasuredFeedViewportHeight((current) =>
      Math.abs(current - height) < 1 ? current : height,
    );
  }, []);
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
        { length: ambient.visibleStacks.length + 1 },
        (_, i) => i * viewportHeight,
      ),
    [ambient.visibleStacks.length, viewportHeight],
  );
  const isCaptureFlowActive =
    isCapturing ||
    isPickingImage ||
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
    emojiBursts,
    handleReact,
    previewReaction,
    shouldShowReactions,
  } = useHomeReactions({
    activeQuote: ambient.active?.card ?? null,
    userId: profile?.user_id ?? null,
  });
  const isDemoFriend = __DEV__ && demoFriendEnabled && ambient.active?.card.userId === HOME_DEMO_FRIEND_ID;
  const isOnFeed = ambient.isOnFeed;
  const currentFeedIndex = Math.max(0, ambient.stackIndex);
  const busy = isCapturing || isPickingImage || isSavingPhoto || isGenerating || isAiToolLoading || Boolean(rewriteReviewText || futureReviewText) || exportLocked;
  const canSaveDraft = Boolean(selectedImageUri && !hasSavedCurrentPhoto && validateEditableQuote(quoteDraftForSave ?? dailyQuoteText ?? '').isValid);
  const isOwned = Boolean(ambient.active && ((authUserId && ambient.active.card.userId === authUserId) || (!ambient.active.card.userId && guestId && ambient.active.card.guestId === guestId)));
  function protectDraft(action: () => void, clear = true) {
    if (busy) return;
    if (selectedImageUri && !hasSavedCurrentPhoto) {
      Alert.alert(t('home.ambient.discardTitle'), t('home.ambient.discardBody'), [
        { text: t('home.ambient.cancel'), style: 'cancel' },
        { text: t('home.ambient.discard'), style: 'destructive', onPress: () => { if (clear) handleClearCurrentImage(); action(); } },
      ]);
    } else action();
  }
  const flatListExtraData = useMemo(
    () =>
      `${ambient.active?.card.id ?? ""}|${exportLocked}|${selectedAiTool ?? ""}|${pendingAiTool ?? ""}|${aiResult?.title ?? ""}`,
    [ambient.active?.card.id, exportLocked, selectedAiTool, pendingAiTool, aiResult?.title],
  );

  function handleOpenMemories() {
    protectDraft(() => router.push("/memories" as never));
  }

  function handleCameraButtonPress() {
    if (busy) return;
    if (isOnFeed) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    } else {
      void handleCapture();
    }
  }

  function handleOpenGalleryPress() {
    protectDraft(() => {
      if (isOnFeed) { ambient.returnToCapture(); listRef.current?.scrollToOffset({ offset: 0, animated: false }); }
      void handleOpenGallery().then(replaced => { if (replaced) clearAiToolState(); });
    }, false);
  }

  function handleClearCurrentImage() {
    clearAiToolState();
    clearSelectedImage();
  }

  if (!bootstrapReady || isLoading || authRetrying) {
    return (
      <View className="flex-1 items-center justify-center bg-transparent">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (authError) {
    return <ServiceUnavailableScreen isRetrying={authRetrying} onRetry={retryAuth} />;
  }

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(event) =>
        onFeedViewportHeightChange(event.nativeEvent.layout.height)
      }
    >
      <HomeAmbientBackground palette={activePalette} reduceMotion={reduceMotion} />
      <View style={{ position: 'absolute', top: insets.top, left: 0, right: 0, zIndex: 20 }} onLayout={e => setHeaderHeight(e.nativeEvent.layout.height)} pointerEvents={busy || ambient.isDragging ? 'none' : 'auto'}>
        <HomeAmbientHeader palette={activePalette} avatarUrl={authorAvatarUrl} onProfile={() => protectDraft(() => profile?.user_id ? router.push('/(tabs)/profile' as never) : signIn())} onMenu={() => setMenuVisible(true)} />
      </View>
      <MilestoneCelebration
        milestone={milestone}
        onDismiss={() => setMilestone(null)}
      />
      <HomeFeedFlow
        listRef={listRef}
        quoteStacks={ambient.visibleStacks}
        frameWidth={Math.max(1, layout.cardWidth)}
        contentTop={feedLayout.contentTop}
        contentHeight={feedLayout.contentHeight}
        viewerUserId={authUserId}
        viewerGuestId={guestId}
        activeQuoteId={ambient.active?.card.id ?? null}
        interactionLocked={busy}
        horizontalLocked={ambient.isDragging}
        onBeginDrag={ambient.beginDrag}
        onCommitPage={ambient.commitPage}
        onSelectQuote={ambient.selectQuote}
        onRegisterShare={activeShare.register}
        isCaptureFlowActive={isCaptureFlowActive}
        flatListExtraData={flatListExtraData}
        snapOffsets={snapOffsets}
        getItemLayout={getItemLayout}
        isFeedRefreshing={isFeedRefreshing}
        refreshFeed={refreshFeed}
        viewportHeight={viewportHeight}
        authorName={authorName}
        authorAvatarUrl={authorAvatarUrl}
        currentFeedIndex={currentFeedIndex}
        isOnFeed={isOnFeed}
        header={
          <HomeCaptureFlow
            viewportHeight={viewportHeight}
            contentTop={layout.contentTop}
            contentHeight={layout.contentHeight}
            feedError={feedHasError && ambient.visibleStacks.length === 0}
            onRetryFeed={() => void refreshFeed()}
            cameraSectionProps={{
              externalCameraControls: true,
              frameWidth: layout.cardWidth,
              interactionLocked: exportLocked,
              cameraRef,
              cameraSessionKey,
              pinchGesture,
              cameraError,
              isCameraActive,
              cameraPermissionGranted,
              selectedImageUri,
              quotePosition,
              onQuotePositionChange: setQuotePosition,
              canDeleteImage: !hasSavedCurrentPhoto && !isSavingPhoto,
              isSavingPhoto,
              canCreatePhotoStack,
              photoStackCount,
              facing,
              zoom,
              zoomFactor,
              activePreset,
              hideQuote,
              dailyQuoteText,
              isGenerating,
              generationProgress,
              generationStage,
              quoteFontSize,
              quoteColorScheme,
              onChangeQuoteFontSize: setQuoteFontSize,
              onChangeQuoteColorScheme: setQuoteColorScheme,
              onRetryGeneration: handleRetryGeneration,
              captureRefView,
              watermarkForExport,
              onSubmitQuoteEdit: handleSubmitQuoteEdit,
              onQuoteDraftChange: setQuoteDraftForSave,
              onInvalidQuoteEdit: handleInvalidQuoteEdit,
              authorName,
              authorAvatarUrl,
              onCameraReady: handleCameraReady,
              onCameraMountError: handleCameraMountError,
              onZoomPresetPress: handleZoomPreset,
              onToggleFacing: handleToggleFacing,
              onClearImage: handleClearCurrentImage,
              onFinishPhotoStack: finishPhotoStack,
              onRewriteQuote: handleRewriteQuote,
              onFutureQuotePress: handleFutureQuotePress,
              selectedAiTool,
              pendingAiTool,
              aiResultTitle: aiResult?.title ?? null,
              aiResultBody: aiResult?.body ?? null,
              aiToolsLoading: isAiToolLoading,
              aiToolsLoadingLabel,
              cardPalette: draftPalette,
              pendingQuoteText: rewriteReviewText ?? futureReviewText ?? null,
              pendingQuoteTitle: futureReviewText
                ? t("home.aiTools.futureReviewTitle")
                : null,
              onApprovePendingQuote: rewriteReviewText
                ? handleApproveRewrite
                : handleApproveFutureQuote,
              onCancelPendingQuote: rewriteReviewText
                ? handleCancelRewrite
                : handleCancelFutureQuote,
            }}
          />
        }
      />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + HOME_AMBIENT_LAYOUT.dockClearance, zIndex: 10 }} onLayout={e => setFooterHeight(e.nativeEvent.layout.height)}>
        <View style={{ minHeight: HOME_AMBIENT_LAYOUT.actionRowMinHeight }}>
          {!isOnFeed && !selectedImageUri ? <HomeCameraControls disabled={busy || ambient.isDragging} activePreset={activePreset} onZoom={handleZoomPreset} onFlip={handleToggleFacing} stackCount={canCreatePhotoStack ? photoStackCount : 0} onFinish={finishPhotoStack} /> : null}
          {ambient.active || selectedImageUri ? <HomeMomentToolbar
            context={ambient.active ? isOwned ? 'mine' : 'friends' : 'draft'}
            index={ambient.active?.index ?? 0} count={ambient.active?.count ?? 1}
            heartMode={ambient.active && !busy && !ambient.isDragging && ambient.active.card.imageUrl ? isDemoFriend ? 'reaction' : heart.mode : 'hidden'}
            isFavorite={heart.isFavorite} isHeartBusy={heart.isBusy}
            canShare={!isDemoFriend && !busy && !ambient.isDragging && (ambient.active ? Boolean(ambient.active.card.imageUrl) && activeShare.canShare(ambient.active.card.id) : Boolean(dailyQuoteText && selectedImageUri && !hideQuote && quoteDraftForSave === null))}
            isSharing={exportLocked}
            canPrevious={!busy && !ambient.isDragging && Boolean(ambient.active && ambient.active.index > 0)}
            canNext={!busy && !ambient.isDragging && Boolean(ambient.active && ambient.active.index < ambient.active.count - 1)}
            onHeart={() => { if (!busy && !ambient.isDragging) { if (isDemoFriend) previewReaction('love'); else void heart.press(); } }}
            onShare={() => { if (isDemoFriend || busy || ambient.isDragging) return; if (ambient.active) void activeShare.share(ambient.active.card.id); else void shareMoment(); }}
            onPrevious={() => { const card = ambient.visibleStacks[currentFeedIndex]?.quotes[(ambient.active?.index ?? 0) - 1]; if (card) ambient.selectQuote(card.id); }}
            onNext={() => { const card = ambient.visibleStacks[currentFeedIndex]?.quotes[(ambient.active?.index ?? 0) + 1]; if (card) ambient.selectQuote(card.id); }}
          /> : null}
        </View>
        {ambient.active && (isDemoFriend || shouldShowReactions) ? <HomeReactionRow disabled={busy || ambient.isDragging} onReact={type => { if (busy || ambient.isDragging) return; if (isDemoFriend) previewReaction(type); else void handleReact(type); }} /> : null}
        <View style={{ height: HOME_AMBIENT_LAYOUT.regionGap }} />
        <HomeAmbientDock mode={busy ? 'busy' : isOnFeed ? 'feed' : selectedImageUri ? 'draft' : 'capture'}
          canCapture={isOnFeed || !cameraPermissionGranted || cameraReady} canSave={canSaveDraft}
          busyLabel={isGenerating ? t('home.ambient.generating') : isSavingPhoto ? t('home.ambient.saving') : t('home.ambient.working')}
          onGallery={handleOpenGalleryPress} onMemories={handleOpenMemories}
          onPrimary={() => { if (busy) return; if (selectedImageUri && !isOnFeed) void handleSavePhoto(quoteDraftForSave); else handleCameraButtonPress(); }} />
      </View>
      <Modal visible={menuVisible} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={() => setMenuVisible(false)}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('home.ambient.closeMenu')} onPress={() => setMenuVisible(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 28 }}>
          <Pressable accessibilityViewIsModal onPress={() => {}} style={{ backgroundColor: '#141a24', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', width: '100%', maxWidth: 420, alignSelf: 'center', maxHeight: '80%' }}>
            <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} showsVerticalScrollIndicator={false}>
              <Text accessibilityRole="header" style={{ color: 'white', fontSize: 24, fontWeight: '600', marginBottom: 24 }}>{t('home.ambient.menu')}</Text>
              <Pressable accessibilityRole="button" style={{ paddingVertical: 18, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, marginBottom: 10 }} onPress={() => { setMenuVisible(false); protectDraft(() => router.push('/(tabs)/friends' as never)); }}><Text style={{ color: 'white' }}>{t('home.ambient.friends')}</Text></Pressable>
              <Pressable accessibilityRole="button" style={{ paddingVertical: 18, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, marginBottom: 10 }} onPress={() => { setMenuVisible(false); setStreakModalVisible(true); }}><Text style={{ color: 'white' }}>{t('home.ambient.streak', { count: displayStreak })}</Text></Pressable>
              {pastMemories[0] ? <Pressable accessibilityRole="button" style={{ paddingVertical: 18, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, marginBottom: 10 }} onPress={() => { setMenuVisible(false); protectDraft(() => router.push({ pathname: '/memories/day', params: { date: pastMemories[0].date } } as never)); }}><Text style={{ color: 'white' }}>{t('memories.thisDayInMemoriesLabel')}</Text></Pressable> : null}
              {__DEV__ ? <Pressable accessibilityRole="button" style={{ padding: 18, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16 }} onPress={() => {
                if (!feedItems[0]) { useUIStore.getState().showToast('Save a photo first to test the friend feed.', 'info'); return; }
                setMenuVisible(false);
                protectDraft(() => { ambient.returnToCapture(); listRef.current?.scrollToOffset({ offset: 0, animated: false }); setDemoFriendEnabled(value => !value); });
              }}><Text style={{ color: 'white' }}>{demoFriendEnabled ? 'Remove demo friend' : 'Test friend feed'} · DEV</Text></Pressable> : null}
            </ScrollView>
            <View style={{ flexShrink: 0, alignItems: 'flex-end', paddingTop: 16, marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' }}>
              <Pressable accessibilityRole="button" style={{ height: 48, minWidth: 112, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: '#ffffff', backgroundColor: '#ffffff' }} onPress={() => setMenuVisible(false)}><Text style={{ color: '#141a24', fontWeight: '700' }}>{t('home.ambient.closeMenu')}</Text></Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <HomeEmojiOverlay bursts={emojiBursts} screenHeight={screenHeight} />
      <StreakModal
        visible={streakModalVisible}
        onClose={() => setStreakModalVisible(false)}
      />
    </View>
  );
}
