import { useMemoryStore } from "@/appState";
import type { MemoryState } from "@/appState/memoryStore";
import { useUserStore } from "@/appState/userStore";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export function ProfileIdentityCard() {
  const { t } = useTranslation();
  const persona = useUserStore((s) => s.persona);
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
    <View className="border-t border-white/10 pt-4">
      <Text className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">
        {t("profile.identityLabel")}
      </Text>
      <Text className="text-lg font-medium text-white">{identityTitle}</Text>
      <View className="mt-2 flex-row gap-3">
        <View className="flex-row items-center gap-1">
          <Ionicons name="images-outline" size={13} color="rgba(255,255,255,0.5)" />
          <Text className="text-xs text-white/65">
            {t("profile.identityMemories", { count: memories.length })}
          </Text>
        </View>
      </View>
    </View>
  );
}
