import { HomeBackground } from "@/features/home/HomeBackground";
import { OnboardingStepShell } from "@/features/onboarding/components/OnboardingStepShell";
import { HOME_BACKGROUNDS } from "@/theme/homeBackgrounds";
import { MotiView } from "moti";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DAWN_PALETTE = HOME_BACKGROUNDS[0]; // dawn — purple/orange

// Tags shown in the preview card. Two are "selected" (focused, bold) to demonstrate the concept.
const PREVIEW_TAGS = [
  { label: "calm", selected: false },
  { label: "focused", selected: true },
  { label: "tender", selected: false },
  { label: "restless", selected: false },
  { label: "bold", selected: true },
  { label: "curious", selected: false },
  { label: "steady", selected: false },
  { label: "searching", selected: false },
];

// Mini 3-dot progress indicator for the How It Works sub-flow
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

export function HowItWorksToneStep({ onContinue }: Props) {
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
            {t("onboarding.howItWorks.tone.sectionLabel")}
          </Text>
        </MotiView>

        {/* Preview card */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", delay: 100, damping: 20, stiffness: 160 }}>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
              padding: 24,
              marginBottom: 28,
              minHeight: 200,
              justifyContent: "center",
            }}>
            {/* Ambient orb */}
            <View
              style={{
                position: "absolute",
                width: 140,
                height: 140,
                borderRadius: 70,
                backgroundColor: "rgba(109,40,217,0.18)",
                top: 20,
                right: -20,
              }}
              pointerEvents="none"
            />
            <View className="flex-row flex-wrap gap-2">
              {PREVIEW_TAGS.map(({ label, selected }, i) => (
                <MotiView
                  key={label}
                  from={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: "spring",
                    delay: 120 + i * 45,
                    damping: 18,
                    stiffness: 180,
                  }}>
                  <View
                    style={{
                      overflow: "hidden",
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: selected
                        ? "rgba(255,255,255,0.45)"
                        : "rgba(255,255,255,0.25)",
                    }}>
                    {selected && <HomeBackground palette={DAWN_PALETTE} />}
                    {selected && (
                      <View
                        style={[
                          StyleSheet.absoluteFillObject,
                          { backgroundColor: "rgba(0,0,0,0.22)" },
                        ]}
                        pointerEvents="none"
                      />
                    )}
                    <View
                      style={{
                        paddingHorizontal: 18,
                        paddingVertical: 9,
                        backgroundColor: selected ? "transparent" : "rgba(255,255,255,0.05)",
                      }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "500",
                          color: "#fff",
                          textTransform: "capitalize",
                        }}>
                        {label}
                      </Text>
                    </View>
                  </View>
                </MotiView>
              ))}
            </View>
          </View>
        </MotiView>

        {/* Headline + subtitle */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 360, delay: 300 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              lineHeight: 34,
              color: "#fff",
              marginBottom: 10,
            }}>
            {t("onboarding.howItWorks.tone.title")}
          </Text>
          <Text
            style={{
              fontSize: 15,
              lineHeight: 22,
              color: "rgba(255,255,255,0.5)",
            }}>
            {t("onboarding.howItWorks.tone.subtitle")}
          </Text>
        </MotiView>

        {/* Mini progress dots */}
        <HowItWorksDots active={1} />

        <View className="flex-1" />

        {/* CTA */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 340, delay: 420 }}>
          <Pressable
            onPress={onContinue}
            className="rounded-2xl bg-white py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <Text className="text-center text-base font-bold text-black">
              {t("onboarding.howItWorks.tone.cta")} →
            </Text>
          </Pressable>
        </MotiView>
      </View>
    </OnboardingStepShell>
  );
}
