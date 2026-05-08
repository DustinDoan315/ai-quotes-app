import { HomeBackground } from "@/features/home/HomeBackground";
import { OnboardingStepShell } from "@/features/onboarding/components/OnboardingStepShell";
import { HOME_BACKGROUNDS } from "@/theme/homeBackgrounds";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";

const DAWN_PALETTE = HOME_BACKGROUNDS[0]; // dawn — purple/orange

type PersonaId = "calm" | "focused" | "tender" | "bold" | "curious" | "restless";

const PERSONAS: PersonaId[] = ["calm", "focused", "tender", "bold", "curious", "restless"];

type Props = {
  onContinue: (personas: string[]) => void;
};

export function PersonaStep({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<PersonaId[]>([]);

  function toggle(id: PersonaId) {
    setSelected((prev) => {
      if (prev.includes(id)) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return prev.filter((p) => p !== id);
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
              {t("onboarding.persona.sectionLabel")}
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
              {t("onboarding.persona.title")}
            </Text>
            <Text
              style={{
                fontSize: 15,
                lineHeight: 22,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 24,
              }}>
              {t("onboarding.persona.subtitle")}
            </Text>
          </MotiView>

          {/* 2-column grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {PERSONAS.map((id, index) => {
              const isSelected = selected.includes(id);
              return (
                <MotiView
                  key={id}
                  from={{ opacity: 0, translateY: 16 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: "spring",
                    delay: 120 + index * 50,
                    damping: 18,
                    stiffness: 180,
                  }}
                  style={{ width: "47%" }}>
                  <Pressable
                    onPress={() => toggle(id)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                    <View
                      style={{
                        overflow: "hidden",
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: isSelected
                          ? "rgba(255,255,255,0.4)"
                          : "rgba(255,255,255,0.12)",
                        minHeight: 88,
                        justifyContent: "center",
                      }}>
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
                          padding: 14,
                          backgroundColor: isSelected ? "transparent" : "rgba(255,255,255,0.04)",
                          minHeight: 88,
                          justifyContent: "center",
                        }}>
                        {/* Check icon — top right when selected */}
                        {isSelected && (
                          <View
                            style={{
                              position: "absolute",
                              top: 10,
                              right: 10,
                            }}>
                            <View
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                backgroundColor: "#c2410c",
                                alignItems: "center",
                                justifyContent: "center",
                              }}>
                              <Ionicons name="checkmark" size={12} color="#fff" />
                            </View>
                          </View>
                        )}
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "600",
                            color: "#fff",
                            marginBottom: 4,
                          }}>
                          {t(`onboarding.persona.option_${id}`)}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            lineHeight: 17,
                            color: "rgba(255,255,255,0.55)",
                          }}>
                          {t(`onboarding.persona.option_${id}_desc`)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                </MotiView>
              );
            })}
          </View>

          {/* Counter */}
          <MotiView
            animate={{ opacity: selected.length > 0 ? 1 : 0.4 }}
            transition={{ type: "timing", duration: 200 }}>
            <Text
              style={{
                textAlign: "center",
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
                marginTop: 16,
              }}>
              {t("onboarding.persona.counter", { n: selected.length })}
            </Text>
          </MotiView>
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
              {t("onboarding.persona.cta")} →
            </Text>
          </Pressable>
        </View>
      </View>
    </OnboardingStepShell>
  );
}
