/* eslint-disable import/first */

const mockInvoke = jest.fn();
let consoleErrorSpy: jest.SpyInstance;

jest.mock("@/config/supabase", () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

import { syncSubscriptionWithServer } from "@/services/paywall/subscriptionSync";

describe("syncSubscriptionWithServer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("invokes the protected sync function without a client-supplied user id", async () => {
    const response = { isPro: true, expiresAt: null };
    mockInvoke.mockResolvedValue({ data: response, error: null });

    await expect(syncSubscriptionWithServer()).resolves.toEqual(response);
    expect(mockInvoke).toHaveBeenCalledWith("sync-subscription");
  });

  it("returns null when the sync function reports an error", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: new Error("not configured"),
    });

    await expect(syncSubscriptionWithServer()).resolves.toBeNull();
  });

  it("returns null when invocation throws", async () => {
    mockInvoke.mockRejectedValue(new Error("network unavailable"));

    await expect(syncSubscriptionWithServer()).resolves.toBeNull();
  });
});
