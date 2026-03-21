import { useStreakStore } from "@/appState/streakStore";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useMemoryStore } from "@/appState";
import type { MemoryState } from "@/appState/memoryStore";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

type DaySummary = {
  date: string;
  hasMine: boolean;
  hasFavorite: boolean;
  isStreak: boolean;
  thumbnailUri: string | null;
};

type CalendarDayProps = {
  summary: DaySummary | null;
  onPress: (date: string) => void;
  isToday: boolean;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function formatDateKey(date: Date) {
  return date.toISOString().split("T")[0];
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
  thumbnails: Record<string, string>,
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
      thumbnailUri: thumbnails[dateKey] ?? null,
    });
  }
  return days;
}

function CalendarDay({ summary, onPress, isToday }: CalendarDayProps) {
  if (!summary) {
    return <View className="h-14 w-14 items-center justify-center" />;
  }
  const hasMine = summary.hasMine;
  const hasFavorite = summary.hasFavorite;
  const isStreak = summary.isStreak;
  const hasThumb = Boolean(summary.thumbnailUri);
  const dayNumber = new Date(summary.date).getDate();
  return (
    <Pressable
      onPress={() => onPress(summary.date)}
      className="h-14 w-14 items-center justify-center rounded-2xl overflow-hidden"
      style={({ pressed }) => ({
        backgroundColor: "transparent",
        borderWidth: 0,
        borderColor: "transparent",
        opacity: pressed ? 0.85 : 1,
      })}>
      {hasThumb && summary.thumbnailUri ? (
        <>
          <Image
            source={{ uri: summary.thumbnailUri }}
            className="absolute inset-0 h-full w-full"
            contentFit="cover"
          />
          <View className="absolute inset-0 bg-black/40" />
        </>
      ) : null}
      <View className="z-10 items-center justify-center">
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: 28,
            height: 28,
            backgroundColor: isToday ? "rgba(250, 204, 21, 0.95)" : "transparent",
          }}>
          <Text
            className="font-bold"
            style={{
              fontSize: 16,
              color: isToday ? "#000000" : "#ffffff",
            }}>
            {dayNumber}
          </Text>
        </View>
      </View>
      <View className="mt-1 h-4 flex-row items-center justify-center gap-1">
        {hasMine ? (
          <View className="h-1.5 w-1.5 rounded-full bg-white" />
        ) : null}
        {isStreak ? <Text className="text-xs">🔥</Text> : null}
        {hasFavorite ? <Text className="text-xs">⭐</Text> : null}
      </View>
    </Pressable>
  );
}

type Props = {
  onPressDay: (date: string) => void;
};

const MONTH_KEY_LEN = 7;

function getThumbnailsForMonth(
  memories: { date: string; photoBackgroundUri: string | null }[],
  monthKey: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  memories.forEach((m) => {
    if (m.date.slice(0, MONTH_KEY_LEN) !== monthKey || !m.photoBackgroundUri)
      return;
    if (!out[m.date]) out[m.date] = m.photoBackgroundUri;
  });
  return out;
}

export function MemoriesCalendarScreen({ onPressDay }: Props) {
  const router = useRouter();
  const [cursorMonth, setCursorMonth] = useState(() => new Date());
  const memories = useMemoryStore((s: MemoryState) => s.memories);
  const getCalendarSummaryForMonth = useMemoryStore(
    (s: MemoryState) => s.getCalendarSummaryForMonth,
  );
  const currentStreak = useStreakStore((s) => s.currentStreak);
  const lastQuoteDate = useStreakStore((s) => s.lastQuoteDate);

  const monthKey = getMonthKey(cursorMonth);
  const summarySelector = useMemo(
    () => getCalendarSummaryForMonth(monthKey),
    [getCalendarSummaryForMonth, monthKey],
  );

  const thumbnails = useMemo(
    () => getThumbnailsForMonth(memories, monthKey),
    [memories, monthKey],
  );

  const streakDates = useMemo(() => {
    const dates = new Set<string>();
    if (!lastQuoteDate || currentStreak === 0) {
      return dates;
    }
    const lastDate = new Date(lastQuoteDate);
    for (let i = 0; i < currentStreak; i += 1) {
      const d = new Date(lastDate);
      d.setDate(lastDate.getDate() - i);
      dates.add(formatDateKey(d));
    }
    return dates;
  }, [lastQuoteDate, currentStreak]);

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

  const todayKey = formatDateKey(new Date());

  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const gridDays: (DaySummary | null)[] = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    gridDays.push(null);
  }
  monthDays.forEach((d) => gridDays.push(d));

  function handleChangeMonth(offset: number) {
    setCursorMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + offset);
      return next;
    });
  }

  const monthLabel = cursorMonth.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });

  return (
    <View className="flex-1 bg-transparent">
      <View className="border-b border-white/10 bg-transparent px-5 pt-14 pb-6">
        <View className="mb-3 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <Ionicons name="chevron-back" size={22} color="#ffffff" />
          </Pressable>
          <Text className="text-xs font-semibold uppercase tracking-wide text-white/60">
            Memories
          </Text>
          <View className="h-10 w-10" />
        </View>
        <Text className="text-2xl font-bold tracking-tight text-white">
          Quote calendar
        </Text>
        <Text className="mt-0.5 text-sm text-white/70">
          Tap a day to revisit your saved quotes.
        </Text>
        <View className="mt-5 flex-row items-center justify-between">
          <Pressable
            onPress={() => handleChangeMonth(-1)}
            className="h-11 w-11 items-center justify-center rounded-xl bg-white/10">
            <Text className="text-lg font-semibold text-white">‹</Text>
          </Pressable>
          <Text className="text-lg font-semibold text-white">{monthLabel}</Text>
          <Pressable
            onPress={() => handleChangeMonth(1)}
            className="h-11 w-11 items-center justify-center rounded-xl bg-white/10">
            <Text className="text-lg font-semibold text-white">›</Text>
          </Pressable>
        </View>
      </View>

      <View className="mb-1 flex-row justify-between px-1 pt-4">
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
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 4 }}>
        <View className="flex-row flex-wrap">
          {gridDays.map((day, index) => (
            <View
              key={day ? day.date : `empty-${index}`}
              className="w-[14.28%] items-center pb-3 px-0.5">
              <CalendarDay
                summary={day}
                onPress={onPressDay}
                isToday={day ? day.date === todayKey : false}
              />
            </View>
          ))}
        </View>
        <View className="mt-6 flex-row flex-wrap items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <View className="flex-row items-center gap-2">
            <View className="h-2.5 w-2.5 rounded-full bg-white" />
            <Text className="text-xs text-white/80">Your quote</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text className="text-sm">🔥</Text>
            <Text className="text-xs text-white/80">Streak day</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text className="text-sm">⭐</Text>
            <Text className="text-xs text-white/80">Favorite</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
