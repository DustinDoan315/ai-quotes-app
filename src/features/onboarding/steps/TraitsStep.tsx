import { HomeBackground } from "@/features/home/HomeBackground";
import { OnboardingStepShell } from "@/features/onboarding/components/OnboardingStepShell";
import { HOME_BACKGROUNDS } from "@/theme/homeBackgrounds";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TRAIT_OPTIONS = [
  "ambitious", "calm", "creative", "curious", "determined",
  "empathetic", "energetic", "focused", "grateful", "hopeful",
  "humorous", "independent", "mindful", "motivated", "optimistic",
  "passionate", "patient", "resilient", "spiritual", "thoughtful",
];

const MAX_TRAITS = 5;
const SELECTED_PALETTE = HOME_BACKGROUNDS[8]; // aurora — vibrant multi-color

type Props = {
  onContinue: (traits: string[]) => void;
};

export function TraitsStep({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);

  function toggleTrait(trait: string) {
    setSelected((prev) => {
      if (prev.includes(trait)) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return prev.filter((t) => t !== trait);
      }
      if (prev.length >= MAX_TRAITS) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return prev;
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return [...prev, trait];
    });
  }

  const canContinue = selected.length >= 1;

  return (
    <OnboardingStepShell>
      <View
        className="flex-1"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <ScrollView
          className="flex-1 px-6"
          contentContainerClassName="pb-4"
          showsVerticalScrollIndicator={false}>
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 360, delay: 40 }}>
            <Text className="mb-2 text-[28px] font-extrabold leading-[34px] text-white">
              {t("onboarding.traits.title")}
            </Text>
            <Text className="mb-8 text-base leading-6 text-white/50">
              {t("onboarding.traits.subtitle")}
            </Text>
          </MotiView>

          <View className="flex-row flex-wrap gap-3">
            {TRAIT_OPTIONS.map((trait, index) => {
              const isSelected = selected.includes(trait);
              return (
                <MotiView
                  key={trait}
                  from={{ opacity: 0, scale: 0.82 }}
                  animate={{
                    opacity: 1,
                    scale: isSelected ? 1.06 : 1,
                  }}
                  transition={{
                    opacity: {
                      type: "spring",
                      delay: index * 35,
                      damping: 18,
                      stiffness: 160,
                    },
                    scale: {
                      type: "spring",
                      damping: 14,
                      stiffness: 220,
                    },
                  }}>
                  <Pressable
                    onPress={() => toggleTrait(trait)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
                    <View
                      style={{
                        overflow: "hidden",
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: isSelected
                          ? "rgba(255,255,255,0.5)"
                          : "rgba(255,255,255,0.3)",
                      }}>
                      {isSelected && (
                        <HomeBackground palette={SELECTED_PALETTE} />
                      )}
                      {isSelected && (
                        <View
                          style={[
                            StyleSheet.absoluteFillObject,
                            { backgroundColor: "rgba(0,0,0,0.25)" },
                          ]}
                          pointerEvents="none"
                        />
                      )}
                      <View
                        style={{
                          paddingHorizontal: 20,
                          paddingVertical: 10,
                          backgroundColor: isSelected
                            ? "transparent"
                            : "rgba(255,255,255,0.05)",
                        }}>
                        <Text className="text-sm font-medium capitalize text-white">
                          {trait}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                </MotiView>
              );
            })}
          </View>

          <MotiView
            animate={{ scale: selected.length > 0 ? [1, 1.15, 1] : 1 }}
            transition={{ type: "timing", duration: 300 }}>
            <Text className="mt-4 text-center text-xs text-white/40">
              {t("onboarding.traits.counter", {
                selected: selected.length,
                max: MAX_TRAITS,
              })}
            </Text>
          </MotiView>
        </ScrollView>

        <View className="px-6 pt-4">
          <Pressable
            onPress={() => canContinue && onContinue(selected)}
            disabled={!canContinue}
            className={`rounded-2xl py-4 ${canContinue ? "bg-white" : "bg-white/20"}`}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <Text
              className={`text-center text-base font-bold ${
                canContinue ? "text-black" : "text-white/40"
              }`}>
              {t("onboarding.traits.cta")}
            </Text>
          </Pressable>
        </View>
      </View>
    </OnboardingStepShell>
  );
}
