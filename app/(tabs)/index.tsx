import { CameraActionsBar } from '@/components/CameraActionsBar';
import { HomeCameraSection } from '@/features/home/HomeCameraSection';
import { HomeHeader } from '@/components/HomeHeader';
import { QuoteMomentsFeed } from '@/features/quotes/QuoteMomentsFeed';
import { useHomeCamera } from '@/features/home/useHomeCamera';
import { useQuotePhotoFeed } from '@/features/quotes/useQuotePhotoFeed';
import { useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStreakStore } from '@/appState/streakStore';
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


const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function HomeScreen() {
  const scrollRef = useRef<ScrollView | null>(null);
  const [feedOffsetY, setFeedOffsetY] = useState(0);
  const scrollStartOffsetRef = useRef(0);
  const insets = useSafeAreaInsets();
  const { currentStreak } = useStreakStore();
  const {
    items: feedItems,
    isRefreshing: isFeedRefreshing,
    refresh: refreshFeed,
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
  } = useHomeCamera();

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
          }}>
          <HomeHeader currentStreak={currentStreak} />
          <View className="flex-1">
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
