import { useStreakStore, getDisplayStreak } from "@/appState/streakStore";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

import { useUserStore } from "@/appState/userStore";
import { useMemoryStore } from "@/appState";
import type { MemoryState } from "@/appState/memoryStore";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { goBackOrReplace } from "@/utils/goBackOrReplace";
import {
  formatLocalDateKey,
  formatLocalMonthKey,
  getTodayLocalDateKey,
  parseLocalDateKey,
} from "@/utils/dateKey";
import { useSignedStorageUrl } from "@/hooks/useSignedStorageUrl";

type DaySummary = {
  date: string;
  hasMine: boolean;
  hasFavorite: boolean;
  isStreak: boolean;
  thumbnailUri: string | null;
  thumbnailStoragePath: string | null;
};

type CalendarDayProps = {
  summary: DaySummary | null;
  onPress: (date: string) => void;
  isToday: boolean;
  count: number;
};

function getMonthKey(date: Date) {
  return formatLocalMonthKey(date);
}

function formatDateKey(date: Date) {
  return formatLocalDateKey(date);
}

type MonthSummaryWithoutStreak = {
  date: string;
  hasMine: boolean;
  hasFavorite: boolean;
};

function buildMonthDays(
  year: number,
  monthIndex: number,
  summaries: Record<string, MonthSummaryWithoutStreak>,
  streakDates: Set<string>,
  thumbnails: Record<string, { uri: string | null; storagePath: string | null }>,
): DaySummary[] {
  const days: DaySummary[] = [];
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = new Date(year, monthIndex, day);
    const dateKey = formatDateKey(d);
    const base = summaries[dateKey];
    days.push({
      date: dateKey,
      hasMine: base?.hasMine ?? false,
      hasFavorite: base?.hasFavorite ?? false,
      isStreak: streakDates.has(dateKey),
      thumbnailUri: thumbnails[dateKey]?.uri ?? null,
      thumbnailStoragePath: thumbnails[dateKey]?.storagePath ?? null,
    });
  }
  return days;
}

function CalendarDay({ summary, onPress, isToday, count }: CalendarDayProps) {
  const thumbnailUrl = useSignedStorageUrl(
    "user-photos",
    summary?.thumbnailStoragePath,
    summary?.thumbnailUri ?? null,
  );
  if (!summary) {
    return (
      <View style={{ width: "100%", aspectRatio: 1 }} />
    );
  }
  const hasMine = summary.hasMine;
  const hasFavorite = summary.hasFavorite;
  const isStreak = summary.isStreak;
  const hasThumb = Boolean(thumbnailUrl);
  const dayNumber = parseLocalDateKey(summary.date).getDate();
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(summary.date);
      }}
      accessibilityRole="button"
      accessibilityLabel={`${summary.date}, ${count}`}
      accessibilityState={{ selected: isToday }}
      className="items-center justify-center rounded-xl overflow-hidden border border-white/10 bg-white/5"
      style={({ pressed }) => ({
        width: "100%",
        aspectRatio: 1,
        borderColor: isToday ? "#C4B5FD" : "rgba(255,255,255,0.08)",
        opacity: pressed ? 0.75 : 1,
      })}>
      {hasThumb && thumbnailUrl ? (
        <>
          <Image
            source={{ uri: thumbnailUrl }}
            className="absolute inset-0 h-full w-full"
            contentFit="cover"
          />
          <View className="absolute inset-0 bg-black/40" />
        </>
      ) : null}
      {count > 1 ? (
        <View
          className="absolute right-1 top-1 z-20 rounded-full bg-white/80 px-1"
          style={{ minWidth: 16, alignItems: "center" }}>
          <Text style={{ fontSize: 9, fontWeight: "700", color: "#000" }}>
            {count}
          </Text>
        </View>
      ) : null}
      <View className="z-10 items-center justify-center">
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: 24,
            height: 24,
            backgroundColor: isToday ? "#C4B5FD" : "transparent",
          }}>
          <Text
            className="font-bold"
            style={{
              fontSize: 14,
              color: isToday ? "#000000" : "#ffffff",
            }}>
            {dayNumber}
          </Text>
        </View>
      </View>
      <View className="h-3 flex-row items-center justify-center gap-1">
        {hasMine ? (
          <View className="h-1.5 w-1.5 rounded-full bg-white" />
        ) : null}
        {isStreak ? <Ionicons name="flame-outline" size={11} color="#C4B5FD" /> : null}
        {hasFavorite ? <Ionicons name="star" size={10} color="#C4B5FD" /> : null}
      </View>
    </Pressable>
  );
}

type Props = {
  onPressDay: (date: string) => void;
};

const MONTH_KEY_LEN = 7;

function getThumbnailsForMonth(
  memories: {
    date: string;
    photoBackgroundUri: string | null;
    photoStoragePath?: string | null;
  }[],
  monthKey: string,
): Record<string, { uri: string | null; storagePath: string | null }> {
  const out: Record<string, { uri: string | null; storagePath: string | null }> = {};
  memories.forEach((m) => {
    if (
      m.date.slice(0, MONTH_KEY_LEN) !== monthKey ||
      (!m.photoBackgroundUri && !m.photoStoragePath)
    ) {
      return;
    }
    if (!out[m.date]) {
      out[m.date] = {
        uri: m.photoBackgroundUri,
        storagePath: m.photoStoragePath ?? null,
      };
    }
  });
  return out;
}

function getHistoricalStreakDates(
  memories: { date: string }[],
  activeStreakDate: string | null,
  activeStreakLength: number,
): Set<string> {
  const uniqueDates = Array.from(new Set(memories.map((memory) => memory.date))).sort();
  const streakDates = new Set<string>();

  for (let index = 0; index < uniqueDates.length; index += 1) {
    const current = uniqueDates[index];
    const previous = uniqueDates[index - 1] ?? null;
    const next = uniqueDates[index + 1] ?? null;

    const currentDate = new Date(`${current}T12:00:00`);
    const previousDate = previous ? new Date(`${previous}T12:00:00`) : null;
    const nextDate = next ? new Date(`${next}T12:00:00`) : null;

    const hasPreviousNeighbor =
      previousDate != null &&
      formatDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1)) ===
        previous;
    const hasNextNeighbor =
      nextDate != null &&
      formatDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)) ===
        next;

    if (hasPreviousNeighbor || hasNextNeighbor) {
      streakDates.add(current);
    }
  }

  if (activeStreakDate && activeStreakLength > 0) {
    streakDates.add(activeStreakDate);
  }

  return streakDates;
}

export function MemoriesCalendarScreen({ onPressDay }: Props) {
  const { i18n, t } = useTranslation();
  const router = useRouter();
  const [cursorMonth, setCursorMonth] = useState(() => new Date());
  const allMemories = useMemoryStore((s: MemoryState) => s.memories);
  const profileUserId = useUserStore((s) => s.profile?.user_id);
  const authUserId = useUserStore((s) => s.authUserId);
  const guestId = useUserStore((s) => s.guestId);
  const userId = profileUserId ?? authUserId;
  const memories = useMemo(() => allMemories.filter(memory => userId
    ? memory.ownerUserId === userId
    : Boolean(guestId && !memory.ownerUserId && memory.ownerGuestId === guestId)), [allMemories, userId, guestId]);
  const displayStreak = useStreakStore((s) => getDisplayStreak(s));
  const lastQuoteDate = useStreakStore((s) => s.lastQuoteDate);

  const monthKey = getMonthKey(cursorMonth);
  const summarySelector = useMemo(() => {
    const result: Record<string, MonthSummaryWithoutStreak> = {};
    memories.forEach(memory => {
      if (!memory.date.startsWith(monthKey)) return;
      result[memory.date] = { date: memory.date, hasMine: true,
        hasFavorite: Boolean(result[memory.date]?.hasFavorite || memory.isFavorite) };
    });
    return result;
  }, [memories, monthKey]);

  const thumbnails = useMemo(
    () => getThumbnailsForMonth(memories, monthKey),
    [memories, monthKey],
  );

  const streakDates = useMemo(() => {
    return getHistoricalStreakDates(memories, lastQuoteDate, displayStreak);
  }, [displayStreak, lastQuoteDate, memories]);

  const dayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    memories.forEach((m) => {
      if (m.date.slice(0, 7) !== monthKey) return;
      counts[m.date] = (counts[m.date] ?? 0) + 1;
    });
    return counts;
  }, [memories, monthKey]);

  const monthMemoryCount = useMemo(
    () => memories.filter((m) => m.date.slice(0, 7) === monthKey).length,
    [memories, monthKey],
  );

  const isCurrentMonth = monthKey === formatLocalMonthKey(new Date());

  const year = cursorMonth.getFullYear();
  const monthIndex = cursorMonth.getMonth();
  const summariesWithDate = useMemo(
    () =>
      Object.keys(summarySelector).reduce(
        (acc, key) => {
          const value = summarySelector[key];
          acc[key] = {
            date: key,
            hasMine: value.hasMine,
            hasFavorite: value.hasFavorite,
          };
          return acc;
        },
        {} as Record<
          string,
          { date: string; hasMine: boolean; hasFavorite: boolean }
        >,
      ),
    [summarySelector],
  );

  const monthDays = buildMonthDays(
    year,
    monthIndex,
    summariesWithDate,
    streakDates,
    thumbnails,
  );

  const todayKey = getTodayLocalDateKey();

  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const gridDays: (DaySummary | null)[] = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    gridDays.push(null);
  }
  monthDays.forEach((d) => gridDays.push(d));

  function handleChangeMonth(offset: number) {
    void Haptics.selectionAsync();
    setCursorMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
      return next;
    });
  }

  function handleGoToToday() {
    void Haptics.selectionAsync();
    setCursorMonth(new Date());
  }

  const monthLabel = cursorMonth.toLocaleDateString(i18n.language, {
    year: "numeric",
    month: "long",
  });

  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        new Date(2024, 0, 7 + index).toLocaleDateString(i18n.language, {
          weekday: "short",
        }),
      ),
    [i18n.language],
  );

  return (
    <View className="flex-1 bg-transparent">
      <View className="border-b border-white/10 bg-transparent px-5 pt-14 pb-6">
        <View className="mb-3 flex-row items-center justify-between">
          <Pressable
            onPress={() => goBackOrReplace(router, "/(tabs)")}
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full bg-white/5"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <Ionicons name="chevron-back" size={22} color="#ffffff" />
          </Pressable>
          <Text className="text-xs font-semibold uppercase tracking-wide text-white/60">
            {t("memories.title")}
          </Text>
          <View className="h-10 w-10" />
        </View>
        <Text className="text-2xl font-bold tracking-tight text-white">
          {t("memories.calendarTitle")}
        </Text>
        <Text className="mt-0.5 text-sm text-white/70">
          {t("memories.calendarSubtitle")}
        </Text>
        <View className="mt-5 flex-row items-center justify-between">
          <Pressable
            onPress={() => handleChangeMonth(-1)}
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Ionicons name="chevron-back" size={20} color="#C4B5FD" />
          </Pressable>
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-semibold text-white">{monthLabel}</Text>
            {!isCurrentMonth ? (
              <Pressable
                onPress={handleGoToToday}
                accessibilityRole="button"
                className="min-h-11 items-center justify-center rounded-full bg-violet-300/10 px-2.5"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <Text className="text-[11px] font-semibold text-white/90">
                  {t("memories.todayButton")}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => handleChangeMonth(1)}
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Ionicons name="chevron-forward" size={20} color="#C4B5FD" />
          </Pressable>
        </View>
        <View className="mt-3 flex-row items-center gap-2">
          <View className="flex-row items-center rounded-full bg-white/10 px-3 py-1">
            <Text className="text-xs font-medium text-white/80">
              {t("memories.calendarMonthCount", {
                count: monthMemoryCount,
              })}
            </Text>
          </View>
          {displayStreak > 0 ? (
            <View className="flex-row items-center gap-1 rounded-full bg-white/10 px-3 py-1">
              <Ionicons name="flame-outline" size={13} color="#C4B5FD" />
              <Text className="text-xs font-medium text-white/80">
                {t("memories.calendarStreakCount", {
                  count: displayStreak,
                })}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className="mb-2 flex-row justify-between px-4 pt-5">
        {weekdayLabels.map((label, index) => (
          <Text
            key={`${label}-${index}`}
            className="flex-1 text-center text-xs font-semibold text-white/60">
            {label}
          </Text>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 14 }}>
        <View className="flex-row flex-wrap">
          {gridDays.map((day, index) => (
            <View
              key={day ? `${monthKey}-${day.date}` : `${monthKey}-empty-${index}`}
              style={{ width: `${100 / 7}%`, paddingHorizontal: 2, paddingBottom: 6 }}>
              <CalendarDay
                summary={day}
                onPress={onPressDay}
                isToday={day ? day.date === todayKey : false}
                count={day ? (dayCounts[day.date] ?? 0) : 0}
              />
            </View>
          ))}
        </View>
        <View className="mt-5 flex-row flex-wrap items-center justify-center gap-4 px-2 py-3">
          <View className="flex-row items-center gap-2">
            <View className="h-2.5 w-2.5 rounded-full bg-white" />
            <Text className="text-xs text-white/80">
              {t("memories.calendarLegendYourQuote")}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="flame-outline" size={13} color="#C4B5FD" />
            <Text className="text-xs text-white/80">
              {t("memories.calendarLegendStreakDay")}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="star" size={12} color="#C4B5FD" />
            <Text className="text-xs text-white/80">
              {t("memories.calendarLegendFavorite")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
