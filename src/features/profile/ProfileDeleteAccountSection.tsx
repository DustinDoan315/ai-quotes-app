import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
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
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="mt-3 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <Pressable
        onPress={() => setExpanded((value) => !value)}
        accessibilityRole="button"
        accessibilityLabel={t("profile.deleteAccountTitle")}
        accessibilityState={{ expanded }}
        style={({ pressed }) => ({
          minHeight: 56,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          gap: 10,
          opacity: pressed ? 0.7 : 1,
        })}>
        <Ionicons name="trash-outline" size={18} color="#fca5a5" />
        <Text className="flex-1 text-sm font-medium text-red-200">
          {t("profile.deleteAccountTitle")}
        </Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color="rgba(255,255,255,0.5)"
        />
      </Pressable>
      {expanded ? (
        <View className="px-4 pb-4">
          <Text className="text-sm leading-5 text-white/70">
            {t("profile.deleteAccountDescription")}
          </Text>
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
      ) : null}
    </View>
  );
}
