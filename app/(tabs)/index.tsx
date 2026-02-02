import { CameraView } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCameraPermission } from "../../hooks/useCameraPermission";

export default function HomeScreen() {
  const { isLoading, isGranted, requestPermission } = useCameraPermission();
  const [cameraReady, setCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

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
          className="rounded-full bg-white px-6 py-3"
        >
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

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <View className="flex-1 items-center justify-center px-4 py-6">
        <View className="aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl bg-black">
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing="back"
            onCameraReady={() => setCameraReady(true)}
          />
        </View>
      </View>
      <View
        className="items-center pb-8"
        style={{ paddingBottom: Math.max(insets.bottom, 32) }}
      >
        <Pressable
          onPress={handleCapture}
          disabled={!cameraReady || isCapturing}
          className="h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/20"
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
          })}
        >
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
