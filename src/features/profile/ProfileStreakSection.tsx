import { getDisplayStreak, useStreakStore } from "@/appState/streakStore";
import { getStreakTier, STREAK_MILESTONES } from "@/utils/streakMilestones";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";

export function ProfileStreakSection() {
  const currentStreak = useStreakStore((s) => getDisplayStreak(s));
  const longestStreak = useStreakStore((s) => s.longestStreak);
  const lastQuoteDate = useStreakStore((s) => s.lastQuoteDate);
  const tier = getStreakTier(currentStreak);

  const lastDateLabel = lastQuoteDate
    ? new Date(lastQuoteDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  // Progress to next milestone
  const nextMilestone = STREAK_MILESTONES.find((m) => m > currentStreak) ?? null;
  const prevMilestone =
    [...STREAK_MILESTONES].reverse().find((m) => m <= currentStreak) ?? 0;
  const progressRatio =
    nextMilestone !== null && nextMilestone > prevMilestone
      ? (currentStreak - prevMilestone) / (nextMilestone - prevMilestone)
      : 1;

  // Animated progress bar
  const animatedWidth = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: Math.min(progressRatio * 100, 100),
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedWidth, progressRatio]);

  return (
    <View className="mb-6">
      <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
        Streak
      </Text>
      <View className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {/* Current streak row */}
        <View className="flex-row items-center px-4 py-4">
          <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <Ionicons name={tier.icon} size={26} color={tier.color} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white">
              {currentStreak}{" "}
              <Text className="text-base font-normal text-white/60">
                {currentStreak === 1 ? "day" : "days"}
              </Text>
            </Text>
            <Text className="mt-0.5 text-xs text-white/50">Current streak</Text>
          </View>
          <View className="items-end">
            <Text className="text-lg font-bold text-white">{longestStreak}</Text>
            <Text className="mt-0.5 text-xs text-white/50">Longest</Text>
          </View>
        </View>

        {/* Divider */}
        <View className="mx-4 border-t border-white/8" />

        {/* Last quote + next milestone */}
        <View className="flex-row px-4 py-3">
          <View className="flex-1">
            <Text className="text-xs text-white/50">Last quote</Text>
            <Text className="mt-0.5 text-sm font-medium text-white/80">
              {lastDateLabel}
            </Text>
          </View>
          {nextMilestone !== null ? (
            <View className="flex-1 items-end">
              <Text className="text-xs text-white/50">Next milestone</Text>
              <Text className="mt-0.5 text-sm font-medium text-white/80">
                {nextMilestone} days
              </Text>
            </View>
          ) : null}
        </View>

        {/* Animated progress bar toward next milestone */}
        {nextMilestone !== null ? (
          <View className="mx-4 mb-4">
            <View className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <Animated.View
                style={{
                  height: "100%",
                  borderRadius: 99,
                  backgroundColor: tier.color,
                  width: animatedWidth.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                }}
              />
            </View>
            <Text className="mt-1 text-right text-[10px] text-white/40">
              {currentStreak}/{nextMilestone}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
