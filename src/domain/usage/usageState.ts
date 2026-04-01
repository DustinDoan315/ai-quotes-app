export type UsageSnapshot = {
  dailyAiCount: number;
  dailyExportCount: number;
  lastResetDate: string | null;
};

export type UsageCounterKey = "dailyAiCount" | "dailyExportCount";

export function resetUsageForDate(
  snapshot: UsageSnapshot,
  today: string,
): UsageSnapshot {
  if (snapshot.lastResetDate === today) {
    return snapshot;
  }

  return {
    dailyAiCount: 0,
    dailyExportCount: 0,
    lastResetDate: today,
  };
}

export function incrementUsageCounter(
  snapshot: UsageSnapshot,
  today: string,
  key: UsageCounterKey,
): UsageSnapshot {
  const next = resetUsageForDate(snapshot, today);
  return {
    ...next,
    [key]: next[key] + 1,
  };
}
