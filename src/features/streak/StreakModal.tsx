import { getDisplayStreak, useStreakStore } from "@/appState/streakStore";
import { getStreakTier } from "@/utils/streakMilestones";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function StreakModal({ visible, onClose }: Props) {
  const { i18n, t } = useTranslation();
  const insets = useSafeAreaInsets();
  const currentStreak = useStreakStore((s) => getDisplayStreak(s));
  const longestStreak = useStreakStore((s) => s.longestStreak);
  const lastQuoteDate = useStreakStore((s) => s.lastQuoteDate);
  const tier = getStreakTier(currentStreak);

  const lastDateLabel = lastQuoteDate
    ? new Date(lastQuoteDate).toLocaleDateString(i18n.language, {
        month: "long",
        day: "numeric",
      })
    : null;

  const statusMessage =
    currentStreak === 0
      ? t("streak.modalEmptyMessage")
      : currentStreak === 1
        ? t("streak.modalFirstDayMessage")
        : t("streak.modalActiveMessage", { count: currentStreak });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-end bg-black/60"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full rounded-3xl border border-white/10 bg-[#111] px-6 py-8 mx-4"
          style={{ maxWidth: 400 }}>
          {/* Header */}
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-white">
              {t("streak.modalTitle")}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              className="h-8 w-8 items-center justify-center rounded-full bg-white/10"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Ionicons name="close" size={18} color="#fff" />
            </Pressable>
          </View>

          {/* Current streak */}
          <View className="mb-6 items-center">
            <View className="mb-3 h-20 w-20 items-center justify-center rounded-[28px] border border-white/15 bg-white/8">
              <Ionicons name={tier.icon} size={36} color={tier.color} />
            </View>
            <Text className="text-6xl font-bold text-white">{currentStreak}</Text>
            <Text className="mt-1 text-base text-white/60">
              {t("streak.modalDayStreak", { count: currentStreak })}
            </Text>
          </View>

          {/* Status message */}
          <Text className="mb-6 text-center text-sm text-white/70">
            {statusMessage}
          </Text>

          {/* Stats row */}
          <View className="flex-row gap-3">
            <View className="flex-1 items-center rounded-2xl border border-white/10 bg-white/5 py-4">
              <Ionicons name="trophy-outline" size={20} color="#ffd700" />
              <Text className="mt-2 text-xl font-bold text-white">{longestStreak}</Text>
              <Text className="mt-0.5 text-xs text-white/50">
                {t("profile.streakLongestLabel")}
              </Text>
            </View>
            <View className="flex-1 items-center rounded-2xl border border-white/10 bg-white/5 py-4">
              <Ionicons name="calendar-outline" size={20} color="rgba(255,255,255,0.6)" />
              <Text className="mt-2 text-sm font-semibold text-white">
                {lastDateLabel ?? t("profile.streakNoLastQuote")}
              </Text>
              <Text className="mt-0.5 text-xs text-white/50">
                {t("profile.streakLastQuoteLabel")}
              </Text>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
