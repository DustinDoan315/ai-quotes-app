import { getDisplayStreak, useStreakStore } from "@/appState/streakStore";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { HOME_AMBIENT_CHROME, HOME_AMBIENT_LAYOUT } from "@/theme/homeAmbient";
import { getStreakTier } from "@/utils/streakMilestones";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function StreakModal({ visible, onClose }: Props) {
  const { i18n, t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotionPreference();
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
      animationType={reduceMotion ? "none" : "fade"}
      onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("home.ambient.closeMenu")}
        onPress={onClose}
        style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 24, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          accessibilityViewIsModal
          style={{ width: "100%", maxWidth: 400, maxHeight: Math.max(180, height - insets.top - insets.bottom - 32), borderRadius: HOME_AMBIENT_LAYOUT.radius, borderWidth: 1, borderColor: HOME_AMBIENT_CHROME.border, backgroundColor: "#15121c", overflow: "hidden" }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24 }}>
            <Text accessibilityRole="header" style={{ color: HOME_AMBIENT_CHROME.text, fontSize: 20, fontWeight: "700" }}>
              {t("streak.modalTitle")}
            </Text>

            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <View style={{ width: 76, height: 76, borderRadius: 26, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: `${tier.color}40`, backgroundColor: `${tier.color}12`, marginBottom: 12 }}>
                <Ionicons name={tier.icon} size={36} color={tier.color} />
              </View>
              <Text style={{ fontSize: 64, lineHeight: 72, fontWeight: "700", color: HOME_AMBIENT_CHROME.text }}>{currentStreak}</Text>
              <Text style={{ marginTop: 4, fontSize: 16, color: HOME_AMBIENT_CHROME.muted }}>
                {t("streak.modalDayStreak", { count: currentStreak })}
              </Text>
            </View>

            <Text style={{ color: HOME_AMBIENT_CHROME.muted, fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 24 }}>
              {statusMessage}
            </Text>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1, alignItems: "center", borderRadius: 18, backgroundColor: HOME_AMBIENT_CHROME.surface, borderColor: HOME_AMBIENT_CHROME.border, borderWidth: 1, paddingVertical: 18, paddingHorizontal: 8 }}>
                <Ionicons name="trophy-outline" size={22} color={tier.color} />
                <Text style={{ marginTop: 10, color: HOME_AMBIENT_CHROME.text, fontSize: 22, fontWeight: "700" }}>{longestStreak}</Text>
                <Text style={{ marginTop: 4, color: HOME_AMBIENT_CHROME.muted, fontSize: 12, textAlign: "center" }}>{t("profile.streakLongestLabel")}</Text>
              </View>
              <View style={{ flex: 1, alignItems: "center", borderRadius: 18, backgroundColor: HOME_AMBIENT_CHROME.surface, borderColor: HOME_AMBIENT_CHROME.border, borderWidth: 1, paddingVertical: 18, paddingHorizontal: 8 }}>
                <Ionicons name="calendar-outline" size={22} color={HOME_AMBIENT_CHROME.muted} />
                <Text style={{ marginTop: 10, color: HOME_AMBIENT_CHROME.text, fontSize: 14, lineHeight: 20, fontWeight: "600", textAlign: "center" }}>{lastDateLabel ?? t("profile.streakNoLastQuote")}</Text>
                <Text style={{ marginTop: 4, color: HOME_AMBIENT_CHROME.muted, fontSize: 12, textAlign: "center" }}>{t("profile.streakLastQuoteLabel")}</Text>
              </View>
            </View>
          </ScrollView>
          <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: HOME_AMBIENT_CHROME.border, alignItems: "flex-end" }}>
            <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => ({ minHeight: HOME_AMBIENT_LAYOUT.hitArea, paddingHorizontal: 24, borderRadius: 24, justifyContent: "center", backgroundColor: "rgba(255,255,255,0.12)", opacity: pressed ? 0.7 : 1 })}>
              <Text style={{ color: HOME_AMBIENT_CHROME.text, fontWeight: "600", fontSize: 15 }}>{t("home.ambient.closeMenu")}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
