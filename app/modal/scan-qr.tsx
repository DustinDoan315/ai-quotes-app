import { useCameraPermission } from "@/hooks/useCameraPermission";
import { goBackOrReplace } from "@/utils/goBackOrReplace";
import { parseInviteCode } from "@/utils/invite";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, type BarcodeScanningResult } from "expo-camera";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FINDER_SIZE = 256;

function ScannerOverlay({ error }: { error: string | null }) {
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [scanAnim]);

  const scanLineTranslate = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-FINDER_SIZE / 2 + 4, FINDER_SIZE / 2 - 4],
  });

  const cornerColor = "rgba(251,191,36,0.9)";
  const cornerSize = 22;
  const cornerThickness = 3;

  return (
    <View className="absolute inset-0 items-center justify-center">
      {/* Dark overlay with transparent finder window */}
      <View
        style={{
          width: FINDER_SIZE,
          height: FINDER_SIZE,
          position: "relative",
        }}>
        {/* Corner: top-left */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: cornerSize,
            height: cornerSize,
            borderTopWidth: cornerThickness,
            borderLeftWidth: cornerThickness,
            borderColor: cornerColor,
            borderTopLeftRadius: 6,
          }}
        />
        {/* Corner: top-right */}
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: cornerSize,
            height: cornerSize,
            borderTopWidth: cornerThickness,
            borderRightWidth: cornerThickness,
            borderColor: cornerColor,
            borderTopRightRadius: 6,
          }}
        />
        {/* Corner: bottom-left */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: cornerSize,
            height: cornerSize,
            borderBottomWidth: cornerThickness,
            borderLeftWidth: cornerThickness,
            borderColor: cornerColor,
            borderBottomLeftRadius: 6,
          }}
        />
        {/* Corner: bottom-right */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: cornerSize,
            height: cornerSize,
            borderBottomWidth: cornerThickness,
            borderRightWidth: cornerThickness,
            borderColor: cornerColor,
            borderBottomRightRadius: 6,
          }}
        />
        {/* Animated scan line */}
        <View
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            top: "50%",
            overflow: "hidden",
          }}>
          <Animated.View
            style={{
              height: 2,
              borderRadius: 1,
              backgroundColor: "#FBBF24",
              opacity: 0.85,
              transform: [{ translateY: scanLineTranslate }],
            }}
          />
        </View>
      </View>
      <Text className="mt-6 text-center text-sm text-white/80">
        Scan your friend's invite QR
      </Text>
      {error ? (
        <Text className="mt-2 text-center text-sm text-red-400">{error}</Text>
      ) : null}
    </View>
  );
}

export default function ScanQrModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLoading, isGranted, requestPermission } = useCameraPermission();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastValueRef = useRef<string | null>(null);

  const handleClose = useCallback(() => {
    goBackOrReplace(router, "/(tabs)/friends");
  }, [router]);

  const handleResult = useCallback(
    (result: BarcodeScanningResult) => {
      const value = String(result.data ?? "").trim();
      if (!value) return;
      if (scanned) return;
      if (lastValueRef.current === value) return;
      lastValueRef.current = value;

      const code = parseInviteCode(value);
      if (!code) {
        setError("That doesn't look like an invite QR. Try again.");
        return;
      }

      setScanned(true);
      setError(null);
      router.replace(`/invite/${code}` as never);
    },
    [router, scanned],
  );

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      );
    }

    if (!isGranted) {
      return (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-white">
            We need camera access to scan QR codes.
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
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleResult}
        />
        <ScannerOverlay error={error} />
        <View className="absolute bottom-10 left-0 right-0 items-center">
          <Pressable
            onPress={() => {
              setScanned(false);
              setError(null);
              lastValueRef.current = null;
            }}
            className="rounded-full bg-white/15 px-5 py-2.5"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <Text className="text-sm font-semibold text-white">Scan again</Text>
          </Pressable>
        </View>
      </View>
    );
  }, [error, handleResult, isGranted, isLoading, requestPermission]);

  return (
    <View className="flex-1 bg-transparent" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          onPress={handleClose}
          className="h-10 w-10 items-center justify-center rounded-full bg-black/30"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>
        <Text className="text-base font-semibold text-white">Scan QR</Text>
        <View className="h-10 w-10" />
      </View>
      <View className="flex-1">{content}</View>
    </View>
  );
}
