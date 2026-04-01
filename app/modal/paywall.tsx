import { PaywallScreen } from "@/features/paywall/PaywallScreen";
import type { PaywallReason, PaywallSource } from "@/features/paywall/types";
import { useLocalSearchParams, useRouter } from "expo-router";

type PaywallParams = {
  reason?: Exclude<PaywallReason, "generic">;
  source?: PaywallSource;
};

export default function PaywallModal() {
  const router = useRouter();
  const params = useLocalSearchParams<PaywallParams>();

  const handleClose = () => {
    router.back();
  };

  return (
    <PaywallScreen
      reason={params.reason ?? "generic"}
      source={params.source ?? "manual"}
      onClose={handleClose}
    />
  );
}
