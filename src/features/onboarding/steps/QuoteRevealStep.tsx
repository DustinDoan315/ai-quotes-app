import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Pressable, Share, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { HomeBackground } from "@/features/home/HomeBackground";
import { getHomeBackgroundPaletteByKey } from "@/theme/homeBackgrounds";
import { STYLE_VIBE_MAP, type StylePreference } from "./StyleStep";

type Props = {
  quoteText: string;
  stylePreference: StylePreference;
  onContinue: () => void;
};

export function QuoteRevealStep({ quoteText, stylePreference, onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const palette = getHomeBackgroundPaletteByKey(STYLE_VIBE_MAP[stylePreference]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 480,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  function handleShare() {
    Share.share({ message: `"${quoteText}" — Inkly` }).catch(() => undefined);
  }

  return (
    <View
      className="flex-1 px-6"
      style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
      <Text className="mb-2 text-center text-base font-semibold text-white/55">
        {t("onboarding.quoteReveal.eyebrow")}
      </Text>

      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          marginBottom: 20,
        }}>
        <View className="flex-1 overflow-hidden rounded-3xl border border-white/20">
          <HomeBackground palette={palette} />
          <View className="absolute inset-0 items-center justify-center p-10">
            <Text className="text-center text-[18px] font-semibold leading-8 text-white">
              {`\u201C${quoteText}\u201D`}
            </Text>
            <Text className="mt-4 text-xs font-semibold uppercase tracking-widest text-white/60">
              {"\u2014 Inkly"}
            </Text>
          </View>

          <Pressable
            onPress={handleShare}
            className="absolute right-4 top-4 h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/30"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Ionicons name="share-outline" size={18} color="white" />
          </Pressable>
        </View>
      </Animated.View>

      <Pressable
        onPress={onContinue}
        className="rounded-2xl bg-white py-4"
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <Text className="text-center text-base font-bold text-black">
          {t("onboarding.quoteReveal.cta")}
        </Text>
      </Pressable>
    </View>
  );
}
