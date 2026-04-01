import { shouldOpenPaywall } from "@/features/paywall/openPaywall";

describe("shouldOpenPaywall", () => {
  it("blocks duplicate opens for the same reason and source within the guard window", () => {
    expect(
      shouldOpenPaywall(
        { reason: "ai_limit", source: "ai_generate" },
        1000,
      ),
    ).toBe(true);
    expect(
      shouldOpenPaywall(
        { reason: "ai_limit", source: "ai_generate" },
        1500,
      ),
    ).toBe(false);
  });

  it("allows another source or reason immediately", () => {
    expect(
      shouldOpenPaywall(
        { reason: "ai_limit", source: "ai_generate" },
        3000,
      ),
    ).toBe(true);
    expect(
      shouldOpenPaywall(
        { reason: "persona_locked", source: "persona_gate" },
        3200,
      ),
    ).toBe(true);
  });
});
