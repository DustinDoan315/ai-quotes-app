import { useUserStore } from "@/appState/userStore";
import { OnboardingProgressBar } from "@/features/onboarding/OnboardingProgressBar";
import { CameraStep } from "@/features/onboarding/steps/CameraStep";
import { GoalsStep } from "@/features/onboarding/steps/GoalsStep";
import { HowItWorksComposeStep } from "@/features/onboarding/steps/HowItWorksComposeStep";
import { HowItWorksSaveStep } from "@/features/onboarding/steps/HowItWorksSaveStep";
import { HowItWorksToneStep } from "@/features/onboarding/steps/HowItWorksToneStep";
import { NotificationStep } from "@/features/onboarding/steps/NotificationStep";
import { PersonaStep } from "@/features/onboarding/steps/PersonaStep";
import { WelcomeStep } from "@/features/onboarding/steps/WelcomeStep";
import { PaywallScreen } from "@/features/paywall/PaywallScreen";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AnimatePresence } from "moti";
import { useCallback, useEffect, useState } from "react";
import { BackHandler, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Steps:
// 1 = Welcome (cold open)
// 2 = How it Works: Tone
// 3 = How it Works: Compose
// 4 = How it Works: Save
// 5 = Persona
// 6 = Goals
// 7 = Notifications
// 8 = Camera
// 9 = Paywall

// Steps that hide the entire header (progress bar + back arrow)
const HIDE_HEADER_STEPS = new Set([1, 9]);

// Steps where the back arrow is hidden (replaced with a spacer)
const HIDE_BACK_STEPS = new Set([2]);

// Progress bar covers steps 2–8 (7 segments).
// segment index = step - 2, so currentStep passed to bar = step - 1, totalSteps = 7
const PROGRESS_BAR_TOTAL = 7;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setPersona = useUserStore((s) => s.setPersona);

  const [step, setStep] = useState(1);
  const [personas, setPersonas] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);

  // Android hardware back interception
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!HIDE_BACK_STEPS.has(step) && !HIDE_HEADER_STEPS.has(step) && step > 1) {
        setStep((s) => s - 1);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [step]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(2, s - 1));
  }, []);

  const handleComplete = useCallback(() => {
    const selectedPersonas = personas.length > 0 ? personas : ["curious"];

    setPersona({
      id: "custom",
      traits: selectedPersonas,
      preferences: {
        stylePreference: "dark-minimal",
        goals: goals.length > 0 ? goals : [],
      },
    });

    router.replace("/(tabs)" as never);
  }, [personas, goals, setPersona, router]);

  const showHeader = !HIDE_HEADER_STEPS.has(step);
  const showBack = showHeader && !HIDE_BACK_STEPS.has(step);

  // Progress bar: steps 2–7 fill segments 1–6
  const progressCurrentStep = step - 1;

  function renderStep() {
    switch (step) {
      case 1:
        return <WelcomeStep onContinue={() => setStep(2)} />;

      case 2:
        return <HowItWorksToneStep onContinue={() => setStep(3)} />;

      case 3:
        return <HowItWorksComposeStep onContinue={() => setStep(4)} />;

      case 4:
        return <HowItWorksSaveStep onContinue={() => setStep(5)} />;

      case 5:
        return (
          <PersonaStep
            onContinue={(p) => {
              setPersonas(p);
              setStep(6);
            }}
          />
        );

      case 6:
        return (
          <GoalsStep
            onContinue={(g) => {
              setGoals(g);
              setStep(7);
            }}
          />
        );

      case 7:
        return <NotificationStep onContinue={() => setStep(8)} />;

      case 8:
        return <CameraStep onContinue={() => setStep(9)} />;

      case 9:
        return (
          <PaywallScreen
            reason="generic"
            source="onboarding"
            onClose={handleComplete}
          />
        );

      default:
        return null;
    }
  }

  return (
    <View
      className="flex-1"
      style={showHeader ? { paddingTop: insets.top } : undefined}>
      {showHeader && (
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
          <OnboardingProgressBar
            currentStep={progressCurrentStep}
            totalSteps={PROGRESS_BAR_TOTAL}
          />
          <View className="w-[26px]" />
        </View>
      )}

      <AnimatePresence>
        <View key={step} style={{ flex: 1 }}>
          {renderStep()}
        </View>
      </AnimatePresence>
    </View>
  );
}
