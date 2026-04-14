import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AnimatePresence, MotiView } from "moti";
import { useEffect, useRef } from "react";
import { Animated as RNAnimated, Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUIStore } from "@/appState/uiStore";

type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
};

const CONFIG = {
  success: {
    bg: "rgba(2,44,34,0.97)",
    borderColor: "rgba(52,211,153,0.30)",
    accentColor: "#34d399",
    iconName: "checkmark-circle" as const,
    iconColor: "#6ee7b7",
    progressColor: "#34d399",
  },
  error: {
    bg: "rgba(69,10,10,0.97)",
    borderColor: "rgba(248,113,113,0.30)",
    accentColor: "#f87171",
    iconName: "close-circle" as const,
    iconColor: "#fca5a5",
    progressColor: "#f87171",
  },
  info: {
    bg: "rgba(8,15,35,0.97)",
    borderColor: "rgba(245,158,11,0.25)",
    accentColor: "#f59e0b",
    iconName: "information-circle" as const,
    iconColor: "#fcd34d",
    progressColor: "#f59e0b",
  },
};

function triggerHaptic(type: Toast["type"]) {
  try {
    if (type === "error") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (type === "success") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    // haptics not available on all devices
  }
}

function ToastItem({ toast }: { toast: Toast }) {
  const hideToast = useUIStore((s) => s.hideToast);
  const cfg = CONFIG[toast.type];
  const duration = toast.duration ?? 3000;

  // Swipe — Reanimated for gesture-driven translation
  const translateX = useSharedValue(0);
  const swipeOpacity = useSharedValue(1);

  // Progress bar — RN Animated (width % requires non-native driver)
  const progress = useRef(new RNAnimated.Value(1)).current;
  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  useEffect(() => {
    triggerHaptic(toast.type);
    RNAnimated.timing(progress, {
      toValue: 0,
      duration,
      useNativeDriver: false,
    }).start();
  }, []);

  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: Math.max(0, 1 - Math.abs(translateX.value) / 160),
  }));

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > 80) {
        runOnJS(hideToast)(toast.id);
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  return (
    <MotiView
      from={{ opacity: 0, translateY: -14, scale: 0.95 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      exit={{ opacity: 0, translateY: -10, scale: 0.96 }}
      transition={{ type: "spring", damping: 22, stiffness: 260 }}>
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            swipeStyle,
            {
              borderRadius: 18,
              overflow: "hidden",
              backgroundColor: cfg.bg,
              borderWidth: 1,
              borderColor: cfg.borderColor,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 10,
            },
          ]}>
          {/* Left accent stripe */}
          <View
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              backgroundColor: cfg.accentColor,
            }}
          />

          {/* Main content row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingLeft: 20,
              paddingRight: 14,
              paddingTop: 14,
              paddingBottom: 14,
            }}>
            {/* Icon badge */}
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: cfg.accentColor + "22",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
              <Ionicons name={cfg.iconName} size={20} color={cfg.iconColor} />
            </View>

            {/* Message */}
            <Text
              style={{
                flex: 1,
                color: "#f8fafc",
                fontSize: 14,
                fontWeight: "600",
                lineHeight: 20,
              }}>
              {toast.message}
            </Text>

            {/* Dismiss button */}
            <Pressable
              onPress={() => hideToast(toast.id)}
              hitSlop={10}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                <Ionicons
                  name="close"
                  size={14}
                  color="rgba(255,255,255,0.55)"
                />
              </View>
            </Pressable>
          </View>

          {/* Progress bar (drains left-to-right over duration) */}
          <View
            style={{
              height: 2,
              backgroundColor: "rgba(255,255,255,0.06)",
            }}>
            <RNAnimated.View
              style={{
                width: progressWidth,
                height: "100%",
                backgroundColor: cfg.progressColor,
                opacity: 0.75,
              }}
            />
          </View>
        </Animated.View>
      </GestureDetector>
    </MotiView>
  );
}

export const ToastHost = () => {
  const toasts = useUIStore((s) => s.toasts);
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-0 z-[100]"
      style={{ elevation: 100 }}>
      <View
        pointerEvents="box-none"
        style={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 16,
          gap: 8,
        }}>
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} />
          ))}
        </AnimatePresence>
      </View>
    </View>
  );
};
