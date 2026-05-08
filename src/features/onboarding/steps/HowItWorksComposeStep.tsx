import { HomeBackground } from "@/features/home/HomeBackground";
import { OnboardingStepShell } from "@/features/onboarding/components/OnboardingStepShell";
import { HOME_BACKGROUNDS } from "@/theme/homeBackgrounds";
import { MotiView } from "moti";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DAWN_PALETTE = HOME_BACKGROUNDS[0]; // dawn — purple/orange

function HowItWorksDots({ active }: { active: 1 | 2 | 3 }) {
  return (
    <View style={{ flexDirection: "row", gap: 6, justifyContent: "center", marginVertical: 16 }}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            width: i === active ? 20 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i === active ? "#c2410c" : "rgba(255,255,255,0.2)",
          }}
        />
      ))}
    </View>
  );
}

type Props = {
  onContinue: () => void;
};

export function HowItWorksComposeStep({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <OnboardingStepShell>
      <View
        className="flex-1 px-6"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}>

        {/* Section label */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 300, delay: 60 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 1.2,
              color: "#c2410c",
              marginBottom: 20,
            }}>
            {t("onboarding.howItWorks.compose.sectionLabel")}
          </Text>
        </MotiView>

        {/* Quote card preview */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", delay: 100, damping: 20, stiffness: 160 }}>
          <View
            style={{
              height: 220,
              borderRadius: 20,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
              marginBottom: 28,
            }}>
            <HomeBackground palette={DAWN_PALETTE} />
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: "rgba(0,0,0,0.15)" },
              ]}
              pointerEvents="none"
            />
            {/* Quote text */}
            <View className="absolute inset-0 justify-center p-6">
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  fontStyle: "italic",
                  lineHeight: 28,
                  color: "#fff",
                }}>
                {t("onboarding.howItWorks.compose.previewQuote")}
              </Text>
            </View>
            {/* Bottom metadata row */}
            <View
              style={{
                position: "absolute",
                bottom: 14,
                left: 16,
                right: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: 1.1,
                  color: "rgba(255,255,255,0.5)",
                }}>
                {t("onboarding.howItWorks.compose.previewTag")}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: 1.1,
                  color: "rgba(255,255,255,0.5)",
                }}>
                {t("onboarding.howItWorks.compose.previewVibeKey")}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Headline + subtitle */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 360, delay: 260 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              lineHeight: 34,
              color: "#fff",
              marginBottom: 10,
            }}>
            {t("onboarding.howItWorks.compose.title")}
          </Text>
          <Text
            style={{
              fontSize: 15,
              lineHeight: 22,
              color: "rgba(255,255,255,0.5)",
            }}>
            {t("onboarding.howItWorks.compose.subtitle")}
          </Text>
        </MotiView>

        {/* Mini progress dots */}
        <HowItWorksDots active={2} />

        <View className="flex-1" />

        {/* CTA */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 340, delay: 380 }}>
          <Pressable
            onPress={onContinue}
            className="rounded-2xl bg-white py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <Text className="text-center text-base font-bold text-black">
              {t("onboarding.howItWorks.compose.cta")} →
            </Text>
          </Pressable>
        </MotiView>
      </View>
    </OnboardingStepShell>
  );
}
