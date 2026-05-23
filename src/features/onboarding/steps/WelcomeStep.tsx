import { AppIcon } from "@/components/AppIcon";
import { HomeBackground } from "@/features/home/HomeBackground";
import { OnboardingStepShell } from "@/features/onboarding/components/OnboardingStepShell";
import { APP_BRAND_MARK } from "@/theme/appBrand";
import { HOME_BACKGROUNDS } from "@/theme/homeBackgrounds";
import { MotiView } from "moti";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const DAWN_PALETTE = HOME_BACKGROUNDS[0]; // dawn — purple/orange

type Props = {
  onContinue: () => void;
};

export function WelcomeStep({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <OnboardingStepShell>
      <View
        className="flex-1 px-6"
        style={{ paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }}>

        {/* Brand mark */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 380, delay: 60 }}
          style={{
            marginBottom: 32,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}>
          <AppIcon size={34} borderRadius={9} />
          <Text className="text-sm font-semibold uppercase tracking-widest text-white/60">
            {APP_BRAND_MARK}
          </Text>
        </MotiView>

        {/* Quote card — yesterday's vibe */}
        <MotiView
          from={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", delay: 120, damping: 18, stiffness: 120 }}>
          <View
            style={{
              height: 220,
              borderRadius: 24,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
              marginBottom: 36,
            }}>
            <HomeBackground palette={DAWN_PALETTE} />
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: "rgba(0,0,0,0.18)" },
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
                {t("onboarding.welcome.previewQuote")}
              </Text>
            </View>
            {/* Attribution label — bottom left */}
            <View
              style={{
                position: "absolute",
                bottom: 14,
                left: 16,
              }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 1.2,
                  color: "rgba(255,255,255,0.55)",
                }}>
                {t("onboarding.welcome.previewAttribution")}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Headline */}
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 260 }}>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "800",
              lineHeight: 38,
              color: "#fff",
              marginBottom: 12,
            }}>
            {t("onboarding.welcome.headline")}
          </Text>
        </MotiView>

        {/* Sub-copy */}
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 340 }}>
          <Text
            style={{
              fontSize: 16,
              lineHeight: 24,
              color: "rgba(255,255,255,0.55)",
              marginBottom: 0,
            }}>
            {t("onboarding.welcome.subheadline")}
          </Text>
        </MotiView>

        <View className="flex-1" />

        {/* CTAs */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 380, delay: 460 }}>
          <Pressable
            onPress={onContinue}
            className="rounded-2xl bg-white py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <Text className="text-center text-base font-bold text-black">
              {t("onboarding.welcome.cta")} →
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/login")}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, paddingVertical: 14 })}>
            <Text
              style={{
                textAlign: "center",
                fontSize: 14,
                fontWeight: "500",
                color: "rgba(255,255,255,0.35)",
              }}>
              {t("onboarding.welcome.alreadyHaveAccount")}
            </Text>
          </Pressable>
        </MotiView>
      </View>
    </OnboardingStepShell>
  );
}
