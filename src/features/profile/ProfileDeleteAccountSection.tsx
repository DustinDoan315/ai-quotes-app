import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, Text, View } from "react-native";

const APPLE_SUBSCRIPTIONS_URL = "https://apps.apple.com/account/subscriptions";

interface ProfileDeleteAccountSectionProps {
  deleting: boolean;
  onDeleteAccount: () => void;
}

export function ProfileDeleteAccountSection({
  deleting,
  onDeleteAccount,
}: ProfileDeleteAccountSectionProps) {
  const { t } = useTranslation();

  return (
    <View
      className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4"
      accessibilityRole="summary"
      accessibilityLabel={t("profile.deleteAccountTitle")}>
      <View className="flex-row items-start gap-3">
        <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-red-500/15">
          <Ionicons name="warning-outline" size={18} color="#fca5a5" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-red-100">
            {t("profile.deleteAccountTitle")}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-red-100/75">
            {t("profile.deleteAccountDescription")}
          </Text>
        </View>
      </View>

      <Text className="mt-4 text-xs leading-4 text-red-100/65">
        {t("profile.deleteAccountSubscriptionNotice")}{" "}
        <Text
          className="font-semibold text-red-200 underline"
          accessibilityRole="link"
          onPress={() => {
            void Linking.openURL(APPLE_SUBSCRIPTIONS_URL);
          }}>
          {t("profile.manageAppleSubscriptions")}
        </Text>
      </Text>

      <Pressable
        onPress={onDeleteAccount}
        disabled={deleting}
        accessibilityRole="button"
        accessibilityLabel={t("profile.deleteAccountButton")}
        accessibilityHint={t("profile.deleteAccountAccessibilityHint")}
        className="mt-5 min-h-12 items-center justify-center rounded-xl border border-red-400/60 bg-red-500/20 px-4"
        style={({ pressed }) => ({
          opacity: deleting ? 0.5 : pressed ? 0.75 : 1,
        })}>
        <Text className="text-base font-semibold text-red-100">
          {t("profile.deleteAccountButton")}
        </Text>
      </Pressable>
    </View>
  );
}
