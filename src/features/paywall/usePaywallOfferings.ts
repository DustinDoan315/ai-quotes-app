import { useSubscriptionStore } from "@/appState/subscriptionStore";
import { analyticsEvents } from "@/services/analytics/events";
import { useEffect } from "react";

export function usePaywallOfferings() {
  const offeringsFetchStatus = useSubscriptionStore(
    (s) => s.offeringsFetchStatus,
  );
  const loadOfferings = useSubscriptionStore((s) => s.loadOfferings);

  useEffect(() => {
    analyticsEvents.paywallViewed();
  }, []);

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
