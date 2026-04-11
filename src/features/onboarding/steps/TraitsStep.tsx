import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TRAIT_OPTIONS = [
  "ambitious", "calm", "creative", "curious", "determined",
  "empathetic", "energetic", "focused", "grateful", "hopeful",
  "humorous", "independent", "mindful", "motivated", "optimistic",
  "passionate", "patient", "resilient", "spiritual", "thoughtful",
];

const MAX_TRAITS = 5;

type Props = {
  onContinue: (traits: string[]) => void;
};

export function TraitsStep({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);

  function toggleTrait(trait: string) {
    setSelected((prev) => {
      if (prev.includes(trait)) return prev.filter((t) => t !== trait);
      if (prev.length >= MAX_TRAITS) return prev;
      return [...prev, trait];
    });
  }

  const canContinue = selected.length >= 1;

  return (
    <View
      className="flex-1"
      style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="pb-4"
        showsVerticalScrollIndicator={false}>
        <Text className="mb-2 text-[28px] font-extrabold leading-[34px] text-white">
          {t("onboarding.traits.title")}
        </Text>
        <Text className="mb-8 text-base leading-6 text-white/50">
          {t("onboarding.traits.subtitle")}
        </Text>

        <View className="flex-row flex-wrap gap-3">
          {TRAIT_OPTIONS.map((trait) => {
            const isSelected = selected.includes(trait);
            return (
              <Pressable
                key={trait}
                onPress={() => toggleTrait(trait)}
                className={`rounded-full border px-5 py-2.5 ${
                  isSelected
                    ? "border-white bg-white"
                    : "border-white/30 bg-white/5"
                }`}
                style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
                <Text
                  className={`text-sm font-medium capitalize ${
                    isSelected ? "text-black" : "text-white/80"
                  }`}>
                  {trait}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="mt-4 text-center text-xs text-white/40">
          {t("onboarding.traits.counter", { selected: selected.length, max: MAX_TRAITS })}
        </Text>
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
  );
}
