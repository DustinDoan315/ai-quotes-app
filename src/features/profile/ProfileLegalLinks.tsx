import { LEGAL_LINKS } from "@/config/legalLinks";
import { useTranslation } from "react-i18next";
import * as WebBrowser from "expo-web-browser";
import { Alert, Pressable, Text, View } from "react-native";

export function ProfileLegalLinks() {
  const { t } = useTranslation();
  const openLink = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert(t("profile.legalLinkError"));
    }
  };
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
          style={{ minHeight: 48, paddingHorizontal: 12, justifyContent: "center" }}
          onPress={() => {
            void openLink(privacyUrl);
          }}>
          <Text className="text-sm text-white/75 underline">
            {t("subscription.privacyPolicyLink")}
          </Text>
        </Pressable>
      ) : null}
      {termsUrl ? (
        <Pressable
          accessibilityRole="link"
          style={{ minHeight: 48, paddingHorizontal: 12, justifyContent: "center" }}
          onPress={() => {
            void openLink(termsUrl);
          }}>
          <Text className="text-sm text-white/75 underline">
            {t("subscription.subscriptionTermsLink")}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
