import { useMemoryStore } from "@/appState";
import { getDisplayStreak, useStreakStore } from "@/appState/streakStore";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type DaySummary = {
  date: string;
  hasMine: boolean;
  hasFavorite: boolean;
  isStreak: boolean;
};

type CalendarDayProps = {
  summary: DaySummary | null;
  onPress: (date: string) => void;
};

const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

function getMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function formatDateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

function buildMonthDays(
  year: number,
  monthIndex: number,
  summaries: Record<string, Omit<DaySummary, "isStreak">>,
  streakDates: Set<string>,
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
    });
  }
  return days;
}

function CalendarDay({ summary, onPress }: CalendarDayProps) {
  if (!summary) {
    return <View className="h-10 w-10 items-center justify-center" />;
  }
  const hasMine = summary.hasMine;
  const hasFavorite = summary.hasFavorite;
  const isStreak = summary.isStreak;
  return (
    <Pressable
      onPress={() => onPress(summary.date)}
      className="h-10 w-10 items-center justify-center rounded-full"
      style={({ pressed }) => ({
        backgroundColor: pressed ? "rgba(255,255,255,0.12)" : "transparent",
      })}>
      <Text className="text-xs font-semibold text-white">
        {new Date(summary.date).getDate()}
      </Text>
      <View className="mt-0.5 flex-row items-center gap-0.5">
        {hasMine ? <Text className="text-[8px] text-white">•</Text> : null}
        {isStreak ? <Text className="text-[8px] text-amber-300">🔥</Text> : null}
        {hasFavorite ? <Text className="text-[8px] text-amber-200">⭐</Text> : null}
      </View>
    </Pressable>
  );
}

export default function MemoriesScreen() {
  const router = useRouter();
  const [cursorMonth, setCursorMonth] = useState(() => new Date());
  const summarySelector = useMemoryStore((s) =>
    s.getCalendarSummaryForMonth(getMonthKey(cursorMonth)),
  );
  const streakState = useStreakStore((s) => ({
    currentStreak: s.currentStreak,
    lastQuoteDate: s.lastQuoteDate,
  }));
  const displayStreak = getDisplayStreak(streakState);

  const streakDates = useMemo(() => {
    const dates = new Set<string>();
    if (!streakState.lastQuoteDate || displayStreak === 0) {
      return dates;
    }
    const lastDate = new Date(streakState.lastQuoteDate);
    for (let i = 0; i < displayStreak; i += 1) {
      const d = new Date(lastDate);
      d.setDate(lastDate.getDate() - i);
      dates.add(formatDateKey(d));
    }
    return dates;
  }, [streakState.lastQuoteDate, displayStreak]);

  const year = cursorMonth.getFullYear();
  const monthIndex = cursorMonth.getMonth();
  const monthDays = buildMonthDays(
    year,
    monthIndex,
    Object.keys(summarySelector).reduce((acc, key) => {
      const value = summarySelector[key];
      acc[key] = {
        date: key,
        hasMine: value.hasMine,
        hasFavorite: value.hasFavorite,
      };
      return acc;
    }, {} as Record<string, { date: string; hasMine: boolean; hasFavorite: boolean }>),
    streakDates,
  );

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

  function handlePressDay(date: string) {
    router.push({
      pathname: "/memories/day",
      params: { date },
    } as never);
  }

  const monthLabel = cursorMonth.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });

  return (
    <View className="flex-1 bg-black px-4 pt-12">
      <View className="mb-6 flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-white">Memories</Text>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => handleChangeMonth(-1)}
            className="h-8 w-8 items-center justify-center rounded-full bg-white/10">
            <Text className="text-base text-white">{"<"}</Text>
          </Pressable>
          <Text className="text-sm font-medium text-white">{monthLabel}</Text>
          <Pressable
            onPress={() => handleChangeMonth(1)}
            className="h-8 w-8 items-center justify-center rounded-full bg-white/10">
            <Text className="text-base text-white">{">"}</Text>
          </Pressable>
        </View>
      </View>

      <View className="mb-2 flex-row justify-between px-2">
        {weekdayLabels.map((label) => (
          <Text
            key={label}
            className="w-10 text-center text-[10px] font-medium text-white/60">
            {label}
          </Text>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="flex-row flex-wrap justify-between px-2">
          {gridDays.map((day) => (
            <View
              key={day ? day.date : `empty-${Math.random().toString(36).slice(2, 8)}`}
              className="mb-2 w-[13.5%] items-center">
              <CalendarDay summary={day} onPress={handlePressDay} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

