import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
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

type Props = {
  onContinue: () => void;
};

export function GoalStep({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<OnboardingGoal | null>(null);

  return (
    <View
      className="flex-1"
      style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}>
        <Text className="mb-2 text-[28px] font-extrabold leading-[34px] text-white">
          {t("onboarding.goal.title")}
        </Text>
        <Text className="mb-8 text-base leading-6 text-white/50">
          {t("onboarding.goal.subtitle")}
        </Text>

        <View className="gap-3">
          {GOAL_IDS.map((id) => {
            const isSelected = selected === id;
            return (
              <Pressable
                key={id}
                onPress={() => setSelected(id)}
                className={`flex-row items-center gap-4 rounded-2xl border px-5 py-4 ${
                  isSelected ? "border-white bg-white" : "border-white/15 bg-white/5"
                }`}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                <Text className="text-2xl">{GOAL_EMOJIS[id]}</Text>
                <Text
                  className={`flex-1 text-base font-medium ${
                    isSelected ? "text-black" : "text-white"
                  }`}>
                  {t(`onboarding.goal.option_${id}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-6 pt-4">
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
      </View>
    </View>
  );
}
