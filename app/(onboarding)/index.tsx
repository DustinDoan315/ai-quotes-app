import { useUserStore } from "@/appState/userStore";
import { APP_BRAND_MARK } from "@/theme/appBrand";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TRAIT_OPTIONS = [
  "ambitious", "calm", "creative", "curious", "determined",
  "empathetic", "energetic", "focused", "grateful", "hopeful",
  "humorous", "independent", "mindful", "motivated", "optimistic",
  "passionate", "patient", "resilient", "spiritual", "thoughtful",
];

const MIN_TRAITS = 1;
const MAX_TRAITS = 5;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setPersona = useUserStore((s) => s.setPersona);
  const [selected, setSelected] = useState<string[]>([]);

  function toggleTrait(trait: string) {
    setSelected((prev) => {
      if (prev.includes(trait)) {
        return prev.filter((t) => t !== trait);
      }
      if (prev.length >= MAX_TRAITS) return prev;
      return [...prev, trait];
    });
  }

  function handleContinue() {
    const traits = selected.length > 0 ? selected : ["curious", "optimistic"];
    setPersona({
      id: "custom",
      traits,
      preferences: {},
    });
    router.replace("/(tabs)" as never);
  }

  const canContinue = selected.length >= MIN_TRAITS;

  return (
    <View
      className="flex-1 bg-black"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-10"
        showsVerticalScrollIndicator={false}>
        <View className="mb-8 mt-10">
          <Text className="mb-2 text-center text-3xl font-bold text-white">
            {APP_BRAND_MARK}
          </Text>
          <Text className="text-center text-xl font-semibold text-white">
            What describes you?
          </Text>
          <Text className="mt-2 text-center text-sm text-white/60">
            Pick up to {MAX_TRAITS} traits. Your AI quotes will match your vibe.
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-3 justify-center">
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

        <View className="mt-3 items-center">
          <Text className="text-xs text-white/40">
            {selected.length}/{MAX_TRAITS} selected
          </Text>
        </View>
      </ScrollView>

      <View className="px-6 pb-2">
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          className={`rounded-2xl py-4 ${canContinue ? "bg-white" : "bg-white/20"}`}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <Text
            className={`text-center text-base font-semibold ${
              canContinue ? "text-black" : "text-white/40"
            }`}>
            Get my daily quotes
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
