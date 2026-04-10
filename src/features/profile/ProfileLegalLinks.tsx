import { useTranslation } from "react-i18next";
import { Linking, Pressable, Text, View } from "react-native";

export function ProfileLegalLinks() {
  const { t } = useTranslation();
  const privacyUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim();
  const termsUrl = process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL?.trim();
  if (!privacyUrl && !termsUrl) {
    return null;
  }
  return (
    <View className="mt-8 flex-row flex-wrap justify-center gap-x-4 gap-y-2 px-2">
      {privacyUrl ? (
        <Pressable
          onPress={() => {
            void Linking.openURL(privacyUrl);
          }}>
          <Text className="text-sm text-white/55 underline">
            {t("subscription.privacyPolicyLink")}
          </Text>
        </Pressable>
      ) : null}
      {termsUrl ? (
        <Pressable
          onPress={() => {
            void Linking.openURL(termsUrl);
          }}>
          <Text className="text-sm text-white/55 underline">
            {t("subscription.subscriptionTermsLink")}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
