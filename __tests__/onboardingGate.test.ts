import { shouldShowOnboarding } from "@/utils/onboardingGate";

describe("shouldShowOnboarding", () => {
  it("shows onboarding for a new guest without a persona", () => {
    expect(
      shouldShowOnboarding({
        persona: null,
        profile: null,
        onboardingCompleted: false,
      }),
    ).toBe(true);
  });

  it("skips onboarding when a persona is already stored", () => {
    expect(
      shouldShowOnboarding({
        persona: { id: "starter" },
        profile: null,
        onboardingCompleted: false,
      }),
    ).toBe(false);
  });

  it("skips onboarding for an authenticated user with a profile", () => {
    expect(
      shouldShowOnboarding({
        persona: null,
        profile: { user_id: "user-1" },
        onboardingCompleted: false,
      }),
    ).toBe(false);
  });

  it("skips onboarding for a persisted guest completion", () => {
    expect(
      shouldShowOnboarding({
        persona: null,
        profile: null,
        onboardingCompleted: true,
      }),
    ).toBe(false);
  });
});
