import { HomeBackground } from "@/features/home/HomeBackground";
import { OnboardingStepShell } from "@/features/onboarding/components/OnboardingStepShell";
import { HOME_BACKGROUNDS } from "@/theme/homeBackgrounds";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DAWN_PALETTE = HOME_BACKGROUNDS[0]; // dawn — purple/orange

type GoalId =
  | "present"
  | "habit"
  | "peace"
  | "push"
  | "reconnect"
  | "rest";

const GOAL_IDS: GoalId[] = ["present", "habit", "peace", "push", "reconnect", "rest"];

type Props = {
  onContinue: (goals: string[]) => void;
};

export function GoalsStep({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<GoalId[]>([]);

  function toggle(id: GoalId) {
    setSelected((prev) => {
      if (prev.includes(id)) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return prev.filter((g) => g !== id);
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return [...prev, id];
    });
  }

  const canContinue = selected.length >= 1;

  return (
    <OnboardingStepShell>
      <View className="flex-1" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}>

          {/* Section label */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 300, delay: 40 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1.2,
                color: "#c2410c",
                marginBottom: 12,
              }}>
              {t("onboarding.goals.sectionLabel")}
            </Text>
          </MotiView>

          {/* Title + subtitle */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 360, delay: 80 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "800",
                lineHeight: 34,
                color: "#fff",
                marginBottom: 8,
              }}>
              {t("onboarding.goals.title")}
            </Text>
            <Text
              style={{
                fontSize: 15,
                lineHeight: 22,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 24,
              }}>
              {t("onboarding.goals.subtitle")}
            </Text>
          </MotiView>

          {/* Goal list */}
          <View style={{ gap: 10 }}>
            {GOAL_IDS.map((id, index) => {
              const isSelected = selected.includes(id);
              return (
                <MotiView
                  key={id}
                  from={{ opacity: 0, translateX: -16 }}
                  animate={{
                    opacity: 1,
                    translateX: 0,
                    scale: isSelected ? 1.015 : 1,
                  }}
                  transition={{
                    opacity: { type: "timing", duration: 340, delay: 120 + index * 60 },
                    translateX: { type: "timing", duration: 340, delay: 120 + index * 60 },
                    scale: { type: "spring", damping: 16, stiffness: 200 },
                  }}>
                  <Pressable
                    onPress={() => toggle(id)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                    <View style={{ overflow: "hidden", borderRadius: 16 }}>
                      {isSelected && <HomeBackground palette={DAWN_PALETTE} />}
                      {isSelected && (
                        <View
                          style={[
                            StyleSheet.absoluteFillObject,
                            { backgroundColor: "rgba(0,0,0,0.3)" },
                          ]}
                          pointerEvents="none"
                        />
                      )}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: isSelected
                            ? "rgba(255,255,255,0.38)"
                            : "rgba(255,255,255,0.12)",
                          backgroundColor: isSelected ? "transparent" : "rgba(255,255,255,0.04)",
                        }}>
                        {/* Text block */}
                        <View style={{ flex: 1 }}>
                          {/* Line 1: label (bold) */}
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "700",
                              color: "#fff",
                              lineHeight: 21,
                            }}>
                            {t(`onboarding.goals.option_${id}_label`)}
                          </Text>
                          {/* Line 2: description (lighter) */}
                          <Text
                            style={{
                              fontSize: 13,
                              lineHeight: 18,
                              color: "rgba(255,255,255,0.5)",
                              marginTop: 2,
                            }}>
                            {t(`onboarding.goals.option_${id}_desc`)}
                          </Text>
                        </View>

                        {/* Check indicator */}
                        <View
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            borderWidth: isSelected ? 0 : 1.5,
                            borderColor: "rgba(255,255,255,0.25)",
                            backgroundColor: isSelected ? "#c2410c" : "transparent",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={13} color="#fff" />
                          )}
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </MotiView>
              );
            })}
          </View>

          {/* Counter */}
          {selected.length > 0 && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: "timing", duration: 200 }}>
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                  marginTop: 16,
                }}>
                {t("onboarding.goals.counter", { n: selected.length })}
              </Text>
            </MotiView>
          )}
        </ScrollView>

        {/* CTA */}
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
              {t("onboarding.goals.cta")} →
            </Text>
          </Pressable>
        </View>
      </View>
    </OnboardingStepShell>
  );
}
