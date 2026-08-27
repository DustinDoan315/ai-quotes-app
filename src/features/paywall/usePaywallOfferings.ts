import { useSubscriptionStore } from "@/appState/subscriptionStore";
import { analyticsEvents } from "@/services/analytics/events";
import { useEffect } from "react";
import type { PaywallReason, PaywallSource } from "@/features/paywall/types";

export function usePaywallOfferings(
  reason: PaywallReason,
  source: PaywallSource,
) {
  const offeringsFetchStatus = useSubscriptionStore(
    (s) => s.offeringsFetchStatus,
  );
  const loadOfferings = useSubscriptionStore((s) => s.loadOfferings);
  const refreshCustomerInfo = useSubscriptionStore((s) => s.refreshCustomerInfo);

  useEffect(() => {
    analyticsEvents.paywallViewed(reason, source);
    refreshCustomerInfo().catch(() => undefined);
  }, [reason, source, refreshCustomerInfo]);

  useEffect(() => {
    if (offeringsFetchStatus === "idle") {
      loadOfferings().catch(() => undefined);
    }
  }, [offeringsFetchStatus, loadOfferings]);

  return {
    offeringsFetchStatus,
    loadOfferings,
  };
}
