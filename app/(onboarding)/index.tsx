import { useUserStore } from "@/appState/userStore";
import { OnboardingProgressBar } from "@/features/onboarding/OnboardingProgressBar";
import { GoalStep } from "@/features/onboarding/steps/GoalStep";
import { NotificationStep } from "@/features/onboarding/steps/NotificationStep";
import { TraitsStep } from "@/features/onboarding/steps/TraitsStep";
import { WelcomeStep } from "@/features/onboarding/steps/WelcomeStep";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AnimatePresence } from "moti";
import { useCallback, useEffect, useState } from "react";
import { BackHandler, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TOTAL_STEPS = 4;

// Steps where the back button is suppressed
const HIDE_BACK_STEPS = new Set([1]);

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setPersona = useUserStore((s) => s.setPersona);

  const [step, setStep] = useState(1);
  const [traits, setTraits] = useState<string[]>([]);

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
    const selectedTraits = traits.length > 0 ? traits : ["curious", "optimistic"];

    setPersona({
      id: "custom",
      traits: selectedTraits,
      preferences: { stylePreference: "dark-minimal" },
    });

    router.replace("/(tabs)" as never);
  }, [traits, setPersona, router]);

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
        return <NotificationStep onContinue={handleComplete} />;

      default:
        return null;
    }
  }

  return (
    <View className="flex-1" style={{ paddingTop: insets.top }}>
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

      <AnimatePresence>
        <View key={step} style={{ flex: 1 }}>
          {renderStep()}
        </View>
      </AnimatePresence>
    </View>
  );
}
