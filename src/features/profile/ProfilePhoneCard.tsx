import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

interface ProfilePhoneCardProps {
  phoneDisplay: string;
  phoneVerified: boolean;
}

export function ProfilePhoneCard({
  phoneDisplay,
  phoneVerified,
}: ProfilePhoneCardProps) {
  const { t } = useTranslation();
  return (
    <View className="mb-6 flex-row items-center justify-between overflow-hidden rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5">
      <View>
        <View className="flex-row items-center gap-1">
          <Ionicons name="shield-checkmark-outline" size={12} color="rgba(255,255,255,0.45)" />
          <Text className="text-xs font-medium uppercase tracking-wide text-white/50">
            {t("profile.phoneLabel")}
          </Text>
        </View>
        <Text className="mt-0.5 text-sm text-white">{phoneDisplay}</Text>
      </View>
      {phoneVerified ? (
        <View className="flex-row items-center gap-1">
          <Ionicons name="checkmark-circle" size={13} color="#34d399" />
          <Text className="text-xs font-semibold text-emerald-400">
            {t("profile.phoneVerified")}
          </Text>
        </View>
      ) : (
        <Text className="text-xs text-white/60">
          {t("profile.phoneNotVerified")}
        </Text>
      )}
    </View>
  );
}
