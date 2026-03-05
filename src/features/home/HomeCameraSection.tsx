import { PinchGesture } from "@/features/home/useHomeCamera";
import { Ionicons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import { Image } from "expo-image";
import { MotiView } from "moti";
import { Pressable, Text, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { Easing } from "react-native-reanimated";

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
    <View className="flex-1 w-full flex-col px-2 py-6">
      <View className="min-h-0 flex-1 items-center justify-center">
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
                ? "aspect-[3/3.75] w-full max-w-md overflow-hidden rounded-3xl bg-black"
                : "aspect-[3.5/3] w-full max-w-2xl overflow-hidden rounded-3xl bg-black"
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
      </View>

      <View className="items-center">
        {!hideQuote && dailyQuoteText ? (
          <Text className="my-3 text-center text-base font-semibold text-white">
            {dailyQuoteText}
          </Text>
        ) : null}
        {selectedImageUri === null ? (
          <View className="my-4 w-full max-w-md items-center gap-2 self-center">
            <Text
              className="text-sm font-medium text-white"
              style={{ opacity: 0.8 }}>
              {zoomFactor % 1 === 0
                ? `${zoomFactor}x`
                : `${zoomFactor.toFixed(1)}x`}
            </Text>
            <View
              className="mt-1 w-full flex-row items-center"
              style={{ justifyContent: "space-between" }}>
              <View className="flex-1" />
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
                          ? "rgba(255, 204, 0, 0.4)"
                          : "transparent",
                      })}>
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: isActive ? "#FFCC00" : "#fff" }}>
                        {preset}x
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View className="flex-1 items-end">
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
          </View>
        ) : null}
      </View>
    </View>
  );
};
