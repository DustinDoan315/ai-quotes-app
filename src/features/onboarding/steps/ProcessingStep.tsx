import { generateQuote } from "@/services/ai/client";
import type { QuoteLanguage } from "@/services/ai/types";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Text, View } from "react-native";

const FALLBACK_QUOTE =
  "The most powerful version of you is the one who chooses to show up today.";

const MIN_DISPLAY_MS = 2200;

type Props = {
  traits: string[];
  language: QuoteLanguage;
  onComplete: (quoteText: string) => void;
};

export function ProcessingStep({ traits, language, onComplete }: Props) {
  const { t } = useTranslation();
  const pulseAnim = useRef(new Animated.Value(0.65)).current;
  // Capture stable refs so the effect doesn't need them in deps
  const traitsRef = useRef(traits);
  const languageRef = useRef(language);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.65,
          duration: 850,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    let cancelled = false;
    const startTime = Date.now();
    const effectiveTraits =
      traitsRef.current.length > 0
        ? traitsRef.current
        : ["curious", "optimistic"];

    generateQuote({
      personaId: "custom",
      personaTraits: effectiveTraits,
      language: languageRef.current,
      visionLanguage: languageRef.current,
    })
      .then((result) => {
        if (cancelled) return;
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
        setTimeout(() => {
          if (!cancelled) {
            onCompleteRef.current(
              result.isValid && result.quote ? result.quote : FALLBACK_QUOTE,
            );
          }
        }, remaining);
      })
      .catch(() => {
        if (cancelled) return;
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
        setTimeout(() => {
          if (!cancelled) onCompleteRef.current(FALLBACK_QUOTE);
        }, remaining);
      });

    return () => {
      cancelled = true;
    };
  }, []); // intentionally run once — traits and onComplete are captured via refs

  return (
    <View className="flex-1 items-center justify-center px-8">
      <Animated.View
        style={{
          opacity: pulseAnim,
          transform: [{ scale: pulseAnim }],
        }}>
        <View className="h-20 w-20 items-center justify-center rounded-[28px] border border-white/20 bg-white/10">
          <Text className="text-4xl">✨</Text>
        </View>
      </Animated.View>

      <Text className="mt-8 text-center text-[20px] font-bold text-white">
        {t("onboarding.processing.title")}
      </Text>
      <Text className="mt-2 text-center text-sm text-white/45">
        {t("onboarding.processing.subtitle")}
      </Text>
    </View>
  );
}
