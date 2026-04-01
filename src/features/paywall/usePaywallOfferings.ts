import { useSubscriptionStore } from "@/appState/subscriptionStore";
import { analyticsEvents } from "@/services/analytics/events";
import { useEffect } from "react";
import type { PaywallReason } from "@/features/paywall/types";

export function usePaywallOfferings(reason: PaywallReason) {
  const offeringsFetchStatus = useSubscriptionStore(
    (s) => s.offeringsFetchStatus,
  );
  const offerings = useSubscriptionStore((s) => s.offerings);
  const loadOfferings = useSubscriptionStore((s) => s.loadOfferings);
  const refreshCustomerInfo = useSubscriptionStore((s) => s.refreshCustomerInfo);

  useEffect(() => {
    analyticsEvents.paywallViewed(reason);
    refreshCustomerInfo().catch(() => undefined);
  }, [reason, refreshCustomerInfo]);

  useEffect(() => {
    if (
      offeringsFetchStatus === "idle" ||
      offeringsFetchStatus === "error" ||
      !offerings?.availablePackages?.length
    ) {
      loadOfferings().catch(() => undefined);
    }
  }, [offerings?.availablePackages?.length, offeringsFetchStatus, loadOfferings]);

  return {
    offeringsFetchStatus,
    loadOfferings,
  };
}
