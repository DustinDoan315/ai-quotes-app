import { resolvePlanFromSnapshot } from "@/domain/subscription/subscriptionResolver";
import { SUBSCRIPTION_ENTITLEMENT_ID } from "@/domain/subscription/subscriptionConstants";

describe("resolvePlanFromSnapshot", () => {
  it("returns free when snapshot is null", () => {
    expect(resolvePlanFromSnapshot(null)).toBe("free");
  });

  it("returns pro when entitlement id matches", () => {
    expect(
      resolvePlanFromSnapshot({
        activeEntitlementIds: [SUBSCRIPTION_ENTITLEMENT_ID],
      }),
    ).toBe("pro");
  });

  it("returns free when entitlement id does not match", () => {
    expect(
      resolvePlanFromSnapshot({
        activeEntitlementIds: ["premium"],
      }),
    ).toBe("free");
  });
});
