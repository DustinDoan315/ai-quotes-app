import { LEGAL_LINKS } from "@/config/legalLinks";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, Text, View } from "react-native";

export function ProfileLegalLinks() {
  const { t } = useTranslation();
  const privacyUrl = LEGAL_LINKS.privacyPolicyUrl;
  const termsUrl = LEGAL_LINKS.termsOfServiceUrl;

  if (!privacyUrl && !termsUrl) {
    return null;
  }
  return (
    <View className="mt-5 flex-row flex-wrap justify-center gap-x-4 px-2">
      {privacyUrl ? (
        <Pressable
          accessibilityRole="link"
          style={{ minHeight: 44, justifyContent: "center" }}
          onPress={() => {
            void Linking.openURL(privacyUrl);
          }}>
          <Text className="text-xs text-white/60">
            {t("subscription.privacyPolicyLink")}
          </Text>
        </Pressable>
      ) : null}
      {termsUrl ? (
        <Pressable
          accessibilityRole="link"
          style={{ minHeight: 44, justifyContent: "center" }}
          onPress={() => {
            void Linking.openURL(termsUrl);
          }}>
          <Text className="text-xs text-white/60">
            {t("subscription.subscriptionTermsLink")}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
