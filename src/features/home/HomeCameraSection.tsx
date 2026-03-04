import { CameraView } from 'expo-camera';
import { Easing } from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { PinchGesture } from '@/features/home/useHomeCamera';
import { Pressable, Text, View } from 'react-native';


type Props = {
  cameraRef: React.RefObject<CameraView | null>;
  pinchGesture: PinchGesture;
  isPortrait: boolean;
  orientationTransitioning: boolean;
  selectedImageUri: string | null;
  canDeleteImage: boolean;
  zoom: number;
  zoomFactor: number;
  activePreset: number;
  hideQuote: boolean;
  dailyQuoteText: string | null;
  onCameraReady: () => void;
  onZoomPresetPress: (preset: 0.5 | 1 | 2) => void;
  onToggleOrientation: () => void;
  onClearImage: () => void;
};

export const HomeCameraSection = ({
  cameraRef,
  pinchGesture,
  isPortrait,
  orientationTransitioning,
  selectedImageUri,
  canDeleteImage,
  zoom,
  zoomFactor,
  activePreset,
  hideQuote,
  dailyQuoteText,
  onCameraReady,
  onZoomPresetPress,
  onToggleOrientation,
  onClearImage,
}: Props) => {
  return (
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
              {canDeleteImage ? (
                <Pressable
                  onPress={onClearImage}
                  className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-black/60"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.8 : 1,
                  })}>
                  <Ionicons name="trash-outline" size={18} color="#ffffff" />
                </Pressable>
              ) : null}
            </View>
          ) : (
            <CameraView
              ref={cameraRef}
              style={{ flex: 1 }}
              facing="back"
              zoom={zoom}
              onCameraReady={onCameraReady}
            />
          )}
        </MotiView>
      </GestureDetector>

      <View className="items-center pb-4">
        <Text className="mb-3 text-xs font-medium text-white/70">
          Capture your moment
        </Text>
        {!hideQuote && dailyQuoteText ? (
          <Text className="mb-3 text-center text-base font-semibold text-white">
            {dailyQuoteText}
          </Text>
        ) : null}
        {selectedImageUri === null ? (
          <View className="mb-4 w-full items-center gap-2">
            <Text
              className="text-sm font-medium text-white"
              style={{ opacity: 0.9 }}>
              {zoomFactor % 1 === 0
                ? `${zoomFactor}×`
                : `${zoomFactor.toFixed(1)}×`}
            </Text>
            <View className="mt-1 w-full flex-row items-center justify-center gap-4">
              <View className="flex-row items-center gap-1 rounded-full border border-white/40 bg-black/40 px-2 py-1">
                {[0.5, 1, 2].map((preset) => {
                  const isActive = activePreset === preset;
                  return (
                    <Pressable
                      key={preset}
                      onPress={() => onZoomPresetPress(preset as 0.5 | 1 | 2)}
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
                onPress={onToggleOrientation}
                className="h-10 w-10 items-center justify-center rounded-full border-2 border-white/60 bg-white/15"
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
    </View>
  );
};
