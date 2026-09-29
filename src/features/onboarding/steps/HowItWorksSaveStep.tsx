import { OnboardingQuotePreview } from "@/features/onboarding/components/OnboardingQuotePreview";
import { OnboardingStepShell } from "@/features/onboarding/components/OnboardingStepShell";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  onBack: () => void;
  onSkip: () => void;
  onComplete: () => void;
};

export function HowItWorksSaveStep({ onBack, onSkip, onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const reduceMotion = useReducedMotionPreference();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const availableHeight =
    windowHeight - Math.max(insets.top, 24) - Math.max(insets.bottom, 24);
  const previewWidth = Math.min(
    windowWidth - 64,
    Math.max(180, (availableHeight - 290) * (3 / 5)),
  );

  return (
    <OnboardingStepShell>
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom, 24),
        }}
      >
        <View className="mb-3 flex-row items-center justify-between">
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            className="min-h-11 min-w-14 flex-row items-center justify-start"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons
              name="arrow-back"
              size={18}
              color="rgba(255,255,255,0.7)"
            />
            <Text className="ml-1 text-sm font-medium text-white/70">
              {t("onboarding.navigation.back")}
            </Text>
          </Pressable>
          <MotiView
            from={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              type: "timing",
              duration: reduceMotion ? 0 : 300,
              delay: reduceMotion ? 0 : 60,
            }}
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

        <MotiView
          from={
            reduceMotion
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.96 }
          }
          animate={{ opacity: 1, scale: 1 }}
          transition={
            reduceMotion
              ? { type: "timing", duration: 0 }
              : { type: "spring", delay: 100, damping: 20, stiffness: 160 }
          }
          style={{ alignItems: "center", marginBottom: 20 }}
        >
          <OnboardingQuotePreview
            width={previewWidth}
            quote={t("onboarding.howItWorks.save.previewQuote")}
            attribution={t("onboarding.howItWorks.save.previewAttribution")}
            sampleLabel={t("onboarding.previewLabel")}
            quotePositionY={38}
            reduceMotion={reduceMotion}
            stage="personalize"
            detailLabel={t("onboarding.howItWorks.save.previewEditedLabel")}
            outcomeLabel={t("onboarding.howItWorks.save.previewOutcome")}
          />
        </MotiView>

        <MotiView
          from={
            reduceMotion
              ? { opacity: 1, translateY: 0 }
              : { opacity: 0, translateY: 12 }
          }
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: "timing",
            duration: reduceMotion ? 0 : 360,
            delay: reduceMotion ? 0 : 320,
          }}
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
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {t("onboarding.howItWorks.save.subtitle")}
          </Text>
        </MotiView>

        <View className="flex-1" />

        <MotiView
          from={
            reduceMotion
              ? { opacity: 1, translateY: 0 }
              : { opacity: 0, translateY: 16 }
          }
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: "timing",
            duration: reduceMotion ? 0 : 340,
            delay: reduceMotion ? 0 : 440,
          }}
        >
          <Pressable
            onPress={onComplete}
            accessibilityRole="button"
            className="rounded-2xl bg-white py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <Text className="text-center text-base font-bold text-black">
              {t("onboarding.howItWorks.save.cta")} →
            </Text>
          </Pressable>
        </MotiView>
      </ScrollView>
    </OnboardingStepShell>
  );
}
