import { PaywallScreen } from "@/features/paywall/PaywallScreen";

type Props = {
  onComplete: () => void;
};

export function PaywallStep({ onComplete }: Props) {
  return (
    <PaywallScreen reason="generic" source="onboarding" onClose={onComplete} />
  );
}
