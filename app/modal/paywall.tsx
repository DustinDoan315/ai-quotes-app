import { RevenueCatPaywallScreen } from "@/features/paywall/RevenueCatPaywallScreen";
import type { PaywallReason, PaywallSource } from "@/features/paywall/types";
import { goBackOrReplace } from "@/utils/goBackOrReplace";
import { useLocalSearchParams, useRouter } from "expo-router";

type PaywallParams = {
  reason?: Exclude<PaywallReason, "generic">;
  source?: PaywallSource;
};

export default function PaywallModal() {
  const router = useRouter();
  const params = useLocalSearchParams<PaywallParams>();

  const handleClose = () => {
    goBackOrReplace(router, "/(tabs)");
  };

  const reason = params.reason ?? "generic";
  const source = params.source ?? "manual";

  return (
    <RevenueCatPaywallScreen
      reason={reason}
      source={source}
      onClose={handleClose}
    />
  );
}
