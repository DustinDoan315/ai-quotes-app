import { type SubscriptionPlanId, SUBSCRIPTION_ENTITLEMENT_ID } from "./subscriptionConstants";

export type SubscriptionSnapshot = {
  activeEntitlementIds: string[];
};

export const resolvePlanFromSnapshot = (
  snapshot: SubscriptionSnapshot | null,
): SubscriptionPlanId => {
  if (!snapshot) {
    return "free";
  }

  if (snapshot.activeEntitlementIds.includes(SUBSCRIPTION_ENTITLEMENT_ID)) {
    return "pro";
  }

  return "free";
};

