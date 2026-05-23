import { OnboardingStepShell } from "@/features/onboarding/components/OnboardingStepShell";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

const QUOTE_LINES = [
  { key: "line1", opacity: 0.6 },
  { key: "line2", opacity: 0.8 },
  { key: "line3", opacity: 1.0 },
] as const;

type Props = {
  onContinue: () => void;
};

export function HowItWorksSaveStep({ onContinue }: Props) {
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
            {t("onboarding.howItWorks.save.sectionLabel")}
          </Text>
        </MotiView>

        {/* Stacked quote snippets */}
        <View style={{ gap: 10, marginBottom: 28 }}>
          {QUOTE_LINES.map(({ key, opacity }, i) => (
            <MotiView
              key={key}
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "spring", delay: 80 + i * 80, damping: 20, stiffness: 180 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: `rgba(109,40,217,${opacity * 0.28})`,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: `rgba(255,255,255,${opacity * 0.15})`,
                  paddingVertical: 16,
                  paddingHorizontal: 18,
                  gap: 12,
                }}>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: "500",
                    fontStyle: "italic",
                    lineHeight: 22,
                    color: "#fff",
                  }}>
                  {t(`onboarding.howItWorks.save.${key}`)}
                </Text>
                <Ionicons
                  name="heart-outline"
                  size={18}
                  color="rgba(255,255,255,0.4)"
                />
              </View>
            </MotiView>
          ))}
        </View>

        {/* Headline + subtitle */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 360, delay: 320 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              lineHeight: 34,
              color: "#fff",
              marginBottom: 10,
            }}>
            {t("onboarding.howItWorks.save.title")}
          </Text>
          <Text
            style={{
              fontSize: 15,
              lineHeight: 22,
              color: "rgba(255,255,255,0.5)",
            }}>
            {t("onboarding.howItWorks.save.subtitle")}
          </Text>
        </MotiView>

        {/* Mini progress dots */}
        <HowItWorksDots active={3} />

        <View className="flex-1" />

        {/* CTA */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 340, delay: 440 }}>
          <Pressable
            onPress={onContinue}
            className="rounded-2xl bg-white py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <Text className="text-center text-base font-bold text-black">
              {t("onboarding.howItWorks.save.cta")} →
            </Text>
          </Pressable>
        </MotiView>
      </View>
    </OnboardingStepShell>
  );
}
