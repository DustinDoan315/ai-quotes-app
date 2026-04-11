import { useQuoteStore } from "@/appState/quoteStore";
import { useUserStore } from "@/appState/userStore";
import { OnboardingProgressBar } from "@/features/onboarding/OnboardingProgressBar";
import { GoalStep } from "@/features/onboarding/steps/GoalStep";
import { NotificationStep } from "@/features/onboarding/steps/NotificationStep";
import { PaywallStep } from "@/features/onboarding/steps/PaywallStep";
import { ProcessingStep } from "@/features/onboarding/steps/ProcessingStep";
import { QuoteRevealStep } from "@/features/onboarding/steps/QuoteRevealStep";
import { StyleStep } from "@/features/onboarding/steps/StyleStep";
import { TraitsStep } from "@/features/onboarding/steps/TraitsStep";
import { WelcomeStep } from "@/features/onboarding/steps/WelcomeStep";
import type { StylePreference } from "@/features/onboarding/steps/StyleStep";
import { Ionicons } from "@expo/vector-icons";
import { getLocales } from "expo-localization";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { BackHandler, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TOTAL_STEPS = 8;
const onboardingQuoteLanguage = getLocales()[0]?.languageCode === "vi" ? "vi" : "en";

// Steps where we hide the header (full-screen experiences)
const HIDE_HEADER_STEPS = new Set([5, 8]);
// Steps where the back button is suppressed
const HIDE_BACK_STEPS = new Set([1, 5, 8]);

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setPersona = useUserStore((s) => s.setPersona);
  const setDailyQuote = useQuoteStore((s) => s.setDailyQuote);
  const addToHistory = useQuoteStore((s) => s.addToHistory);

  const [step, setStep] = useState(1);
  const [traits, setTraits] = useState<string[]>([]);
  const [stylePreference, setStylePreference] = useState<StylePreference | null>(null);
  const [generatedQuote, setGeneratedQuote] = useState<string | null>(null);

  // Android hardware back interception
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (step > 1 && !HIDE_BACK_STEPS.has(step)) {
        setStep((s) => s - 1);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [step]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(1, s - 1));
  }, []);

  const handleComplete = useCallback(() => {
    const selectedTraits =
      traits.length > 0 ? traits : ["curious", "optimistic"];

    setPersona({
      id: "custom",
      traits: selectedTraits,
      preferences: { stylePreference: stylePreference ?? "dark-minimal" },
    });

    if (generatedQuote) {
      const quote = {
        id: `onb-${Date.now().toString(36)}`,
        text: generatedQuote,
        personaId: "custom",
        createdAt: Date.now(),
      };
      setDailyQuote(quote);
      addToHistory(quote);
    }

    router.replace("/(tabs)" as never);
  }, [
    traits,
    stylePreference,
    generatedQuote,
    setPersona,
    setDailyQuote,
    addToHistory,
    router,
  ]);

  const showHeader = !HIDE_HEADER_STEPS.has(step);
  const showBack = !HIDE_BACK_STEPS.has(step);

  function renderStep() {
    switch (step) {
      case 1:
        return <WelcomeStep onContinue={() => setStep(2)} />;

      case 2:
        return <GoalStep onContinue={() => setStep(3)} />;

      case 3:
        return (
          <TraitsStep
            onContinue={(t) => {
              setTraits(t);
              setStep(4);
            }}
          />
        );

      case 4:
        return (
          <StyleStep
            onContinue={(s) => {
              setStylePreference(s);
              setStep(5);
            }}
          />
        );

      case 5:
        return (
          <ProcessingStep
            traits={traits}
            language={onboardingQuoteLanguage}
            onComplete={(quote) => {
              setGeneratedQuote(quote);
              setStep(6);
            }}
          />
        );

      case 6:
        return (
          <QuoteRevealStep
            quoteText={generatedQuote ?? ""}
            stylePreference={stylePreference ?? "dark-minimal"}
            onContinue={() => setStep(7)}
          />
        );

      case 7:
        return <NotificationStep onContinue={() => setStep(8)} />;

      case 8:
        return <PaywallStep onComplete={handleComplete} />;

      default:
        return null;
    }
  }

  // Paywall step is full-screen — render without wrapper
  if (step === 8) {
    return <PaywallStep onComplete={handleComplete} />;
  }

  return (
    <View
      className="flex-1"
      style={{ paddingTop: insets.top }}>
      {showHeader ? (
        <View className="flex-row items-center gap-3 px-5 pb-4 pt-3">
          {showBack ? (
            <Pressable
              onPress={handleBack}
              hitSlop={12}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <Ionicons name="chevron-back" size={26} color="rgba(255,255,255,0.85)" />
            </Pressable>
          ) : (
            <View className="w-[26px]" />
          )}
          <OnboardingProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />
        </View>
      ) : null}

      {renderStep()}
    </View>
  );
}
