import { AppIcon } from "@/components/AppIcon";
import { OnboardingQuotePreview } from "@/features/onboarding/components/OnboardingQuotePreview";
import { OnboardingStepShell } from "@/features/onboarding/components/OnboardingStepShell";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { APP_BRAND_MARK } from "@/theme/appBrand";
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
import { useRouter } from "expo-router";

type Props = {
  onContinue: () => void;
  onSkip: () => void;
};

export function WelcomeStep({ onContinue, onSkip }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const reduceMotion = useReducedMotionPreference();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const availableHeight =
    windowHeight - Math.max(insets.top, 24) - Math.max(insets.bottom, 24);
  const previewWidth = Math.min(
    windowWidth - 48,
    Math.max(120, (availableHeight - 360) * (3 / 5)),
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
        {/* Brand mark */}
        <MotiView
          from={
            reduceMotion
              ? { opacity: 1, translateY: 0 }
              : { opacity: 0, translateY: 8 }
          }
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: "timing",
            duration: reduceMotion ? 0 : 380,
            delay: reduceMotion ? 0 : 60,
          }}
          style={{
            marginBottom: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <AppIcon size={34} borderRadius={9} />
          <Text className="text-sm font-semibold uppercase tracking-widest text-white/60">
            {APP_BRAND_MARK}
          </Text>
        </MotiView>

        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-[11px] font-bold tracking-[1.2px] text-amber-300/90">
            {t("onboarding.welcome.progress")}
          </Text>
          <Pressable
            onPress={onSkip}
            accessibilityRole="button"
            className="min-h-11 justify-center px-2"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text className="text-sm font-medium text-white/60">
              {t("onboarding.navigation.skip")}
            </Text>
          </Pressable>
        </View>

        {/* The photo card arrives before its sample quote. */}
        <MotiView
          from={
            reduceMotion
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.94 }
          }
          animate={{ opacity: 1, scale: 1 }}
          transition={
            reduceMotion
              ? { type: "timing", duration: 0 }
              : {
                  type: "spring",
                  delay: 120,
                  damping: 18,
                  stiffness: 120,
                }
          }
          style={{ alignItems: "center", marginBottom: 18 }}
        >
          <OnboardingQuotePreview
            width={previewWidth}
            quote={t("onboarding.welcome.previewQuote")}
            attribution={t("onboarding.welcome.previewAttribution")}
            sampleLabel={t("onboarding.previewLabel")}
            quotePositionY={47}
            reduceMotion={reduceMotion}
          />
        </MotiView>

        {/* Headline */}
        <MotiView
          from={
            reduceMotion
              ? { opacity: 1, translateY: 0 }
              : { opacity: 0, translateY: 14 }
          }
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: "timing",
            duration: reduceMotion ? 0 : 400,
            delay: reduceMotion ? 0 : 260,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              lineHeight: 34,
              color: "#fff",
              marginBottom: 8,
            }}
          >
            {t("onboarding.welcome.headline")}
          </Text>
        </MotiView>

        {/* Sub-copy */}
        <MotiView
          from={
            reduceMotion
              ? { opacity: 1, translateY: 0 }
              : { opacity: 0, translateY: 14 }
          }
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: "timing",
            duration: reduceMotion ? 0 : 400,
            delay: reduceMotion ? 0 : 340,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              lineHeight: 24,
              color: "rgba(255,255,255,0.55)",
              marginBottom: 0,
            }}
          >
            {t("onboarding.welcome.subheadline")}
          </Text>
        </MotiView>

        <View className="flex-1" />

        {/* CTAs */}
        <MotiView
          from={
            reduceMotion
              ? { opacity: 1, translateY: 0 }
              : { opacity: 0, translateY: 20 }
          }
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: "timing",
            duration: reduceMotion ? 0 : 380,
            delay: reduceMotion ? 0 : 460,
          }}
        >
          <Pressable
            onPress={onContinue}
            accessibilityRole="button"
            className="rounded-2xl bg-white py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <Text className="text-center text-base font-bold text-black">
              {t("onboarding.welcome.cta")} →
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/login",
                params: {
                  returnTo: "/(tabs)",
                  fromOnboarding: "true",
                },
              } as never)
            }
            accessibilityRole="button"
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              paddingVertical: 14,
            })}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: 14,
                fontWeight: "500",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              {t("onboarding.welcome.alreadyHaveAccount")}
            </Text>
          </Pressable>
        </MotiView>
      </ScrollView>
    </OnboardingStepShell>
  );
}
