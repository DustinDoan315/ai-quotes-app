import { useCameraPermission } from "@/hooks/useCameraPermission";
import { parseInviteCode } from "@/utils/invite";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, type BarcodeScanningResult } from "expo-camera";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ScanQrModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLoading, isGranted, requestPermission } = useCameraPermission();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastValueRef = useRef<string | null>(null);

  const handleClose = useCallback(() => {
    router.back();
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
        setError("That doesn’t look like an invite QR. Try again.");
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
        <View className="absolute inset-0 items-center justify-center">
          <View className="h-64 w-64 rounded-3xl border border-white/50 bg-black/10" />
          <Text className="mt-6 text-center text-sm text-white/80">
            Scan your friend’s invite QR
          </Text>
          {error ? (
            <Text className="mt-2 text-center text-sm text-red-400">{error}</Text>
          ) : null}
          <Pressable
            onPress={() => {
              setScanned(false);
              setError(null);
              lastValueRef.current = null;
            }}
            className="mt-5 rounded-full bg-white/15 px-5 py-2.5"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <Text className="text-sm font-semibold text-white">Scan again</Text>
          </Pressable>
        </View>
      </View>
    );
  }, [error, handleResult, isGranted, isLoading, requestPermission]);

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
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

