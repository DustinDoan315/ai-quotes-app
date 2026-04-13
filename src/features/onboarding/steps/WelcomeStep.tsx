import { HomeBackground } from "@/features/home/HomeBackground";
import { OnboardingStepShell } from "@/features/onboarding/components/OnboardingStepShell";
import { APP_BRAND_MARK } from "@/theme/appBrand";
import { HOME_BACKGROUNDS } from "@/theme/homeBackgrounds";
import { MotiView } from "moti";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CYCLE_PALETTES = [
  HOME_BACKGROUNDS[0], // dawn — purple/orange
  HOME_BACKGROUNDS[8], // aurora — multi-color
  HOME_BACKGROUNDS[9], // prism — vibrant
];

const SPARKLES = [
  { left: "12%", top: "18%", emoji: "✦", delay: 0,   duration: 2800 },
  { left: "80%", top: "14%", emoji: "✧", delay: 500,  duration: 3200 },
  { left: "65%", top: "58%", emoji: "✦", delay: 900,  duration: 2600 },
  { left: "22%", top: "70%", emoji: "✧", delay: 300,  duration: 3600 },
  { left: "88%", top: "42%", emoji: "✦", delay: 700,  duration: 3000 },
] as const;

type Props = {
  onContinue: () => void;
};

export function WelcomeStep({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [paletteIdx, setPaletteIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPaletteIdx((i) => (i + 1) % CYCLE_PALETTES.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const prevIdx =
    (paletteIdx - 1 + CYCLE_PALETTES.length) % CYCLE_PALETTES.length;

  return (
    <OnboardingStepShell>
      <View
        className="flex-1 px-6"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        {/* Cycling gradient background */}
        <HomeBackground palette={CYCLE_PALETTES[paletteIdx]} />
        <MotiView
          key={paletteIdx}
          from={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ type: "timing", duration: 1200 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none">
          <HomeBackground palette={CYCLE_PALETTES[prevIdx]} />
        </MotiView>
        {/* Dark overlay for readability */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: "rgba(9,9,11,0.72)" },
          ]}
          pointerEvents="none"
        />

        {/* Floating sparkles */}
        {SPARKLES.map((s, i) => (
          <MotiView
            key={i}
            from={{ translateY: 0, opacity: 0.25 }}
            animate={{ translateY: -10, opacity: 0.5 }}
            transition={{
              type: "timing",
              duration: s.duration,
              delay: s.delay,
              loop: true,
              repeatReverse: true,
            }}
            style={{ position: "absolute", left: s.left, top: s.top }}
            pointerEvents="none">
            <Text style={{ fontSize: 12, color: "white" }}>{s.emoji}</Text>
          </MotiView>
        ))}

        {/* Brand mark */}
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 420, delay: 80 }}>
          <Text className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-white/50">
            {APP_BRAND_MARK}
          </Text>
        </MotiView>

        {/* Headline */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 440, delay: 180 }}>
          <Text className="mb-3 text-center text-[34px] font-extrabold leading-[40px] text-white">
            {t("onboarding.welcome.headline")}
          </Text>
        </MotiView>

        {/* Subheadline */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 440, delay: 280 }}>
          <Text className="mb-8 text-center text-lg leading-7 text-white/55">
            {t("onboarding.welcome.subheadline")}
          </Text>
        </MotiView>

        {/* Preview card */}
        <MotiView
          from={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", delay: 380, damping: 18, stiffness: 120 }}>
          <View className="mx-auto mb-10 h-56 w-full max-w-sm overflow-hidden rounded-3xl border border-white/15">
            <HomeBackground palette={CYCLE_PALETTES[paletteIdx]} />
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: "rgba(0,0,0,0.2)" },
              ]}
              pointerEvents="none"
            />
            <View className="absolute inset-0 items-center justify-center p-8">
              <Text className="text-center text-[17px] font-semibold leading-7 text-white">
                {t("onboarding.welcome.previewQuote")}
              </Text>
              <Text className="mt-3 text-xs font-semibold uppercase tracking-widest text-white/60">
                {t("onboarding.welcome.previewAttribution")}
              </Text>
            </View>
          </View>
        </MotiView>

        <View className="flex-1" />

        {/* CTA */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 380, delay: 520 }}>
          <Pressable
            onPress={onContinue}
            className="rounded-2xl bg-white py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <Text className="text-center text-base font-bold text-black">
              {t("onboarding.welcome.cta")}
            </Text>
          </Pressable>

          <Text className="mt-4 text-center text-xs text-white/30">
            {t("onboarding.welcome.disclaimer")}
          </Text>
        </MotiView>
      </View>
    </OnboardingStepShell>
  );
}
