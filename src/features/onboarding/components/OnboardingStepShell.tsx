import { MotiView } from "moti";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";

type Props = {
  children: React.ReactNode;
};

export function OnboardingStepShell({ children }: Props) {
  const reduceMotion = useReducedMotionPreference();

  return (
    <MotiView
      from={reduceMotion ? { opacity: 1 } : { opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: reduceMotion ? 0 : 240 }}
      style={{ flex: 1 }}
    >
      {children}
    </MotiView>
  );
}
