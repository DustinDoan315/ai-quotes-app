import { router } from "expo-router";
import { openProfileUpgradePaywall } from "@/features/paywall/openPaywall";

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));

describe("openProfileUpgradePaywall", () => {
  it("opens the generic paywall from the visible Profile upgrade entry point", () => {
    openProfileUpgradePaywall();

    expect(router.push).toHaveBeenCalledWith({
      pathname: "/modal/paywall",
      params: {
        reason: "generic",
        source: "profile_upgrade",
      },
    });
  });
});
