import {
  incrementUsageCounter,
  resetUsageForDate,
} from "@/domain/usage/usageState";

describe("usageState", () => {
  it("resets counts when the stored date is stale", () => {
    expect(
      resetUsageForDate(
        {
          dailyAiCount: 3,
          dailyExportCount: 2,
          lastResetDate: "2026-03-31",
        },
        "2026-04-01",
      ),
    ).toEqual({
      dailyAiCount: 0,
      dailyExportCount: 0,
      lastResetDate: "2026-04-01",
    });
  });

  it("increments the selected counter after resetting for a new day", () => {
    expect(
      incrementUsageCounter(
        {
          dailyAiCount: 3,
          dailyExportCount: 2,
          lastResetDate: "2026-03-31",
        },
        "2026-04-01",
        "dailyAiCount",
      ),
    ).toEqual({
      dailyAiCount: 1,
      dailyExportCount: 0,
      lastResetDate: "2026-04-01",
    });
  });
});
