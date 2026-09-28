import { OnboardingStepShell } from "@/features/onboarding/components/OnboardingStepShell";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const QUOTE_LINES = [
  { key: "line1", opacity: 0.6 },
  { key: "line2", opacity: 0.8 },
  { key: "line3", opacity: 1.0 },
] as const;

type Props = {
  onBack: () => void;
  onSkip: () => void;
  onComplete: () => void;
};

export function HowItWorksSaveStep({ onBack, onSkip, onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <OnboardingStepShell>
      <View
        className="flex-1 px-6"
        style={{
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom, 24),
        }}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            className="min-h-11 min-w-14 flex-row items-center justify-start"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.7)" />
            <Text className="ml-1 text-sm font-medium text-white/70">
              {t("onboarding.navigation.back")}
            </Text>
          </Pressable>
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 300, delay: 60 }}
          >
            <Text className="text-[11px] font-bold tracking-[1.2px] text-amber-300/90">
              {t("onboarding.howItWorks.save.sectionLabel")}
            </Text>
          </MotiView>
          <Pressable
            onPress={onSkip}
            accessibilityRole="button"
            className="min-h-11 min-w-14 items-end justify-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text className="text-sm font-medium text-white/60">
              {t("onboarding.navigation.skip")}
            </Text>
          </Pressable>
        </View>

        {/* Stacked quote snippets */}
        <View style={{ gap: 10, marginBottom: 28 }}>
          {QUOTE_LINES.map(({ key, opacity }, i) => (
            <MotiView
              key={key}
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: "spring",
                delay: 80 + i * 80,
                damping: 20,
                stiffness: 180,
              }}
            >
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
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: "500",
                    fontStyle: "italic",
                    lineHeight: 22,
                    color: "#fff",
                  }}
                >
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
          transition={{ type: "timing", duration: 360, delay: 320 }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              lineHeight: 34,
              color: "#fff",
              marginBottom: 10,
            }}
          >
            {t("onboarding.howItWorks.save.title")}
          </Text>
          <Text
            style={{
              fontSize: 15,
              lineHeight: 22,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {t("onboarding.howItWorks.save.subtitle")}
          </Text>
        </MotiView>

        <View className="flex-1" />

        {/* CTA */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 340, delay: 440 }}
        >
          <Pressable
            onPress={onComplete}
            className="rounded-2xl bg-white py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <Text className="text-center text-base font-bold text-black">
              {t("onboarding.howItWorks.save.cta")} →
            </Text>
          </Pressable>
        </MotiView>
      </View>
    </OnboardingStepShell>
  );
}
