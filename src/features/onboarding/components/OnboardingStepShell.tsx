import { MotiView } from "moti";

type Props = {
  children: React.ReactNode;
};

export function OnboardingStepShell({ children }: Props) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 340 }}
      style={{ flex: 1 }}>
      {children}
    </MotiView>
  );
}
