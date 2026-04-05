import { createSubscriptionGuards } from "@/domain/subscription/subscriptionGuards";
import { SUBSCRIPTION_ENTITLEMENT_ID } from "@/domain/subscription/subscriptionConstants";

describe("createSubscriptionGuards", () => {
  const freeSnapshot = { activeEntitlementIds: [] as string[] };
  const proSnapshot = { activeEntitlementIds: [SUBSCRIPTION_ENTITLEMENT_ID] };

  it("blocks AI at free daily limit", () => {
    const g = createSubscriptionGuards(freeSnapshot);
    expect(g.canGenerateQuote(2).allowed).toBe(false);
    expect(g.canGenerateQuote(2).reason).toBe("ai_limit");
    expect(g.canGenerateQuote(1).allowed).toBe(true);
  });

  it("does not block AI for pro at high count", () => {
    const g = createSubscriptionGuards(proSnapshot);
    expect(g.canGenerateQuote(999_999).allowed).toBe(true);
  });

  it("blocks export at free daily limit", () => {
    const g = createSubscriptionGuards(freeSnapshot);
    expect(g.canExportQuote(2).allowed).toBe(false);
    expect(g.canExportQuote(2).reason).toBe("export_limit");
  });

  it("blocks premium theme for free", () => {
    const g = createSubscriptionGuards(freeSnapshot);
    expect(g.canUseTheme(true).allowed).toBe(false);
    expect(g.canUseTheme(false).allowed).toBe(true);
  });

  it("allows premium theme for pro", () => {
    const g = createSubscriptionGuards(proSnapshot);
    expect(g.canUseTheme(true).allowed).toBe(true);
  });

  it("blocks advanced persona for free", () => {
    const g = createSubscriptionGuards(freeSnapshot);
    expect(g.canUsePersonaLevel(true).allowed).toBe(false);
    expect(g.canUsePersonaLevel(false).allowed).toBe(true);
  });
});
