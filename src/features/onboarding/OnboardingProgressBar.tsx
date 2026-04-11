import { View } from "react-native";

type Props = {
  currentStep: number;
  totalSteps: number;
};

export function OnboardingProgressBar({ currentStep, totalSteps }: Props) {
  return (
    <View className="flex-1 flex-row gap-1.5">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View
          key={i}
          className={`h-1 flex-1 rounded-full ${
            i < currentStep ? "bg-white" : "bg-white/20"
          }`}
        />
      ))}
    </View>
  );
}
