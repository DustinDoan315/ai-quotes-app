import { useUserStore } from "@/appState/userStore";
import { HowItWorksSaveStep } from "@/features/onboarding/steps/HowItWorksSaveStep";
import { HowItWorksToneStep } from "@/features/onboarding/steps/HowItWorksToneStep";
import { WelcomeStep } from "@/features/onboarding/steps/WelcomeStep";
import { Redirect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useUserStoreHydrated } from "@/utils/useUserStoreHydrated";

export default function OnboardingScreen() {
  const router = useRouter();
  const setPersona = useUserStore((s) => s.setPersona);
  const persona = useUserStore((s) => s.persona);
  const hydrated = useUserStoreHydrated();
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const handleComplete = useCallback(() => {
    setPersona({
      id: "starter",
      traits: ["curious", "optimistic"],
      preferences: {
        stylePreference: "dark-minimal",
        goals: [],
      },
    });

    router.replace("/(tabs)" as never);
  }, [setPersona, router]);

  if (!hydrated) {
    return null;
  }

  if (persona) {
    return <Redirect href="/(tabs)" />;
  }

  if (step === 0) {
    return <WelcomeStep onContinue={() => setStep(1)} />;
  }

  if (step === 1) {
    return <HowItWorksToneStep onContinue={() => setStep(2)} />;
  }

  return <HowItWorksSaveStep onContinue={handleComplete} />;
}
