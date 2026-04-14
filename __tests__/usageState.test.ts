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

  it("does NOT reset when the stored date equals today", () => {
    const snapshot = {
      dailyAiCount: 3,
      dailyExportCount: 2,
      lastResetDate: "2026-04-01",
    };
    expect(resetUsageForDate(snapshot, "2026-04-01")).toBe(snapshot);
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

  it("increments export counter on the same day without resetting ai count", () => {
    expect(
      incrementUsageCounter(
        {
          dailyAiCount: 2,
          dailyExportCount: 0,
          lastResetDate: "2026-04-01",
        },
        "2026-04-01",
        "dailyExportCount",
      ),
    ).toEqual({
      dailyAiCount: 2,
      dailyExportCount: 1,
      lastResetDate: "2026-04-01",
    });
  });

  it("accumulates multiple ai increments within the same day", () => {
    const base = { dailyAiCount: 0, dailyExportCount: 0, lastResetDate: "2026-04-01" };
    const after1 = incrementUsageCounter(base, "2026-04-01", "dailyAiCount");
    const after2 = incrementUsageCounter(after1, "2026-04-01", "dailyAiCount");
    expect(after2.dailyAiCount).toBe(2);
  });
});
