import { PaywallScreen } from "@/features/paywall/PaywallScreen";
import { useLocalSearchParams, useRouter } from "expo-router";

type PaywallParams = {
  reason?: "ai_limit" | "export_limit" | "premium_theme" | "persona_locked";
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
      onClose={handleClose}
    />
  );
}

