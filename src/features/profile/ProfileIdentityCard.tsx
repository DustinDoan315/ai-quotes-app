import { useMemoryStore } from "@/appState";
import type { MemoryState } from "@/appState/memoryStore";
import { useStreakStore } from "@/appState/streakStore";
import { useUserStore } from "@/appState/userStore";
import { Text, View } from "react-native";

export function ProfileIdentityCard() {
  const persona = useUserStore((s) => s.persona);
  const currentStreak = useStreakStore((s) => s.currentStreak);
  const memories = useMemoryStore((s: MemoryState) => s.memories);
  const identityTitle =
    persona && persona.traits.length > 0
      ? persona.traits.includes("disciplined")
        ? "The Disciplined One"
        : persona.traits.includes("quiet")
          ? "The Quiet Thinker"
          : "The Rebuilder"
      : "Growing Through Moments";

  return (
    <View className="mb-6 overflow-hidden rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5">
      <Text className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
        Identity
      </Text>
      <Text className="text-base font-semibold text-white">{identityTitle}</Text>
      <Text className="mt-1.5 text-xs text-white/55">
        Streak: {currentStreak} day{currentStreak === 1 ? "" : "s"} · Memories:{" "}
        {memories.length}
      </Text>
    </View>
  );
}
