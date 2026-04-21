import { useMemoryStore } from "@/appState";
import type { MemoryState } from "@/appState/memoryStore";
import { useStreakStore } from "@/appState/streakStore";
import { useUserStore } from "@/appState/userStore";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export function ProfileIdentityCard() {
  const { t } = useTranslation();
  const persona = useUserStore((s) => s.persona);
  const currentStreak = useStreakStore((s) => s.currentStreak);
  const memories = useMemoryStore((s: MemoryState) => s.memories);
  const identityTitle =
    persona && persona.traits.length > 0
      ? persona.traits.includes("disciplined")
        ? t("profile.identityDisciplined")
        : persona.traits.includes("quiet")
          ? t("profile.identityQuiet")
          : t("profile.identityRebuilder")
      : t("profile.identityDefault");

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 400 }}
      className="mb-6 overflow-hidden rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5">
      <Text className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
        {t("profile.identityLabel")}
      </Text>
      <Text className="text-base font-semibold text-white">{identityTitle}</Text>
      <View className="mt-2 flex-row gap-3">
        <View className="flex-row items-center gap-1">
          <Ionicons name="flame-outline" size={13} color="rgba(255,255,255,0.5)" />
          <Text className="text-xs text-white/55">
            {t("profile.identityStreakDays", { count: currentStreak })}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Ionicons name="images-outline" size={13} color="rgba(255,255,255,0.5)" />
          <Text className="text-xs text-white/55">
            {t("profile.identityMemories", { count: memories.length })}
          </Text>
        </View>
      </View>
    </MotiView>
  );
}
