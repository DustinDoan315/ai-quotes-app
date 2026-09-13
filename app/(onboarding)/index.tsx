import { useUserStore } from "@/appState/userStore";
import { HowItWorksSaveStep } from "@/features/onboarding/steps/HowItWorksSaveStep";
import { HowItWorksToneStep } from "@/features/onboarding/steps/HowItWorksToneStep";
import { WelcomeStep } from "@/features/onboarding/steps/WelcomeStep";
import { Redirect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useUserStoreHydrated } from "@/utils/useUserStoreHydrated";
import { shouldShowOnboarding } from "@/utils/onboardingGate";

export default function OnboardingScreen() {
  const router = useRouter();
  const persona = useUserStore((s) => s.persona);
  const profile = useUserStore((s) => s.profile);
  const onboardingCompleted = useUserStore((s) => s.onboardingCompleted);
  const hydrated = useUserStoreHydrated();
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const completeOnboarding = useUserStore((s) => s.completeOnboarding);

  const handleComplete = useCallback(() => {
    completeOnboarding();

    router.replace("/(tabs)" as never);
  }, [completeOnboarding, router]);

  if (!hydrated) {
    return null;
  }

  if (
    !shouldShowOnboarding({ persona, profile, onboardingCompleted })
  ) {
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
