import { MotiView } from "moti";
import { View } from "react-native";

type Props = {
  currentStep: number;
  totalSteps: number;
};

export function OnboardingProgressBar({ currentStep, totalSteps }: Props) {
  return (
    <View className="flex-1 flex-row gap-1.5">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const isActive = i < currentStep;
        return (
          <View
            key={i}
            className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
            <MotiView
              animate={{ opacity: isActive ? 1 : 0, scaleX: isActive ? 1 : 0 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 180,
                delay: i === currentStep - 1 ? 60 : 0,
              }}
              style={{
                flex: 1,
                backgroundColor: "#ffffff",
                borderRadius: 999,
                transformOrigin: "left",
              }}
            />
          </View>
        );
      })}
    </View>
  );
}
