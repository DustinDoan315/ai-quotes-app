import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

interface ProfileSignOutButtonProps {
  onPress: () => void;
}

export function ProfileSignOutButton({ onPress }: ProfileSignOutButtonProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t("profile.signOutButton")}
      className="mt-2 min-h-14 justify-center rounded-3xl border border-white/10 bg-white/5 py-3.5"
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <View className="flex-row items-center justify-center gap-2">
        <Ionicons name="log-out-outline" size={17} color="rgba(255,255,255,0.7)" />
        <Text className="text-base font-medium text-white/80">{t("profile.signOutButton")}</Text>
      </View>
    </Pressable>
  );
}
