import { openProfileUpgradePaywall } from "@/features/paywall/openPaywall";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

export function ProfileUpgradeCard() {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={openProfileUpgradePaywall}
      accessibilityRole="button"
      accessibilityLabel={t("profile.upgradeToPro")}
      accessibilityHint={t("profile.upgradeToProHint")}
      className="mb-6 overflow-hidden rounded-2xl border border-amber-300/40 bg-amber-400/15 px-4 py-4"
      style={({ pressed }) => ({ opacity: pressed ? 0.84 : 1 })}>
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-amber-300/20">
          <Ionicons name="star" size={20} color="#FCD34D" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-white">
            {t("profile.upgradeToPro")}
          </Text>
          <Text className="mt-0.5 text-xs leading-4 text-white/70">
            {t("profile.upgradeToProDescription")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#FCD34D" />
      </View>
    </Pressable>
  );
}
