import { HomeBackground } from "@/features/home/HomeBackground";
import { OnboardingStepShell } from "@/features/onboarding/components/OnboardingStepShell";
import { HOME_BACKGROUNDS } from "@/theme/homeBackgrounds";
import type { HomeBackgroundPalette } from "@/types/homeBackground";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type OnboardingGoal =
  | "motivation"
  | "reflection"
  | "sharing"
  | "creative"
  | "different";

const GOAL_EMOJIS: Record<OnboardingGoal, string> = {
  motivation: "✨",
  reflection: "🪞",
  sharing: "📸",
  creative: "🎨",
  different: "💬",
};

const GOAL_IDS: OnboardingGoal[] = [
  "motivation",
  "reflection",
  "sharing",
  "creative",
  "different",
];

const GOAL_GRADIENTS: Record<OnboardingGoal, HomeBackgroundPalette> = {
  motivation: HOME_BACKGROUNDS[0], // dawn — purple/orange
  reflection: HOME_BACKGROUNDS[1], // mist — slate
  sharing: HOME_BACKGROUNDS[8],    // aurora — multi-color
  creative: HOME_BACKGROUNDS[9],   // prism — vibrant
  different: HOME_BACKGROUNDS[3],  // indigo — blue
};

type Props = {
  onContinue: () => void;
};

export function GoalStep({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<OnboardingGoal | null>(null);

  function handleSelect(id: OnboardingGoal) {
    setSelected(id);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  return (
    <OnboardingStepShell>
      <View
        className="flex-1"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}>
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 360, delay: 40 }}>
            <Text className="mb-2 text-[28px] font-extrabold leading-[34px] text-white">
              {t("onboarding.goal.title")}
            </Text>
            <Text className="mb-8 text-base leading-6 text-white/50">
              {t("onboarding.goal.subtitle")}
            </Text>
          </MotiView>

          <View className="gap-3">
            {GOAL_IDS.map((id, index) => {
              const isSelected = selected === id;
              return (
                <MotiView
                  key={id}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{
                    opacity: 1,
                    translateX: 0,
                    scale: isSelected ? 1.025 : 1,
                  }}
                  transition={{
                    opacity: { type: "timing", duration: 380, delay: index * 70 },
                    translateX: { type: "timing", duration: 380, delay: index * 70 },
                    scale: { type: "spring", damping: 15, stiffness: 200 },
                  }}>
                  <View className="overflow-hidden rounded-2xl">
                    {isSelected && (
                      <HomeBackground palette={GOAL_GRADIENTS[id]} />
                    )}
                    {isSelected && (
                      <View
                        style={[
                          StyleSheet.absoluteFillObject,
                          { backgroundColor: "rgba(0,0,0,0.3)" },
                        ]}
                        pointerEvents="none"
                      />
                    )}
                    <Pressable
                      onPress={() => handleSelect(id)}
                      className={`flex-row items-center gap-4 rounded-2xl border px-5 py-4 ${
                        isSelected
                          ? "border-white/40"
                          : "border-white/15 bg-white/5"
                      }`}
                      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                      <Text className="text-2xl">{GOAL_EMOJIS[id]}</Text>
                      <Text className="flex-1 text-base font-medium text-white">
                        {t(`onboarding.goal.option_${id}`)}
                      </Text>
                    </Pressable>
                  </View>
                </MotiView>
              );
            })}
          </View>
        </ScrollView>

        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: "timing",
            duration: 360,
            delay: GOAL_IDS.length * 70 + 60,
          }}
          className="px-6 pt-4">
          <Pressable
            onPress={() => selected && onContinue()}
            disabled={!selected}
            className={`rounded-2xl py-4 ${selected ? "bg-white" : "bg-white/20"}`}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <Text
              className={`text-center text-base font-bold ${
                selected ? "text-black" : "text-white/40"
              }`}>
              {t("onboarding.goal.cta")}
            </Text>
          </Pressable>
        </MotiView>
      </View>
    </OnboardingStepShell>
  );
}
