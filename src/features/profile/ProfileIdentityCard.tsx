import { useMemoryStore } from "@/appState";
import type { MemoryState } from "@/appState/memoryStore";
import { useStreakStore } from "@/appState/streakStore";
import { useUserStore } from "@/appState/userStore";
import { strings } from "@/theme/strings";
import { Text, View } from "react-native";

export function ProfileIdentityCard() {
  const persona = useUserStore((s) => s.persona);
  const currentStreak = useStreakStore((s) => s.currentStreak);
  const memories = useMemoryStore((s: MemoryState) => s.memories);
  const identityTitle =
    persona && persona.traits.length > 0
      ? persona.traits.includes("disciplined")
        ? strings.profile.identity.disciplined
        : persona.traits.includes("quiet")
          ? strings.profile.identity.quiet
          : strings.profile.identity.rebuilder
      : strings.profile.identity.growing;

  return (
    <View className="mb-6 overflow-hidden rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5">
      <Text className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
        {strings.profile.identity.label}
      </Text>
      <Text className="text-base font-semibold text-white">{identityTitle}</Text>
      <Text className="mt-1.5 text-xs text-white/55">
        {strings.profile.identity.statsSummary(currentStreak, memories.length)}
      </Text>
    </View>
  );
}
