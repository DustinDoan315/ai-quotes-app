import { useUserStore } from "@/appState/userStore";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

export function ProfileQuoteLanguageSection() {
  const { t } = useTranslation();
  const quoteLanguage = useUserStore((s) => s.quoteLanguage) ?? "en";
  const setQuoteLanguage = useUserStore((s) => s.setQuoteLanguage);

  return (
    <View className="mb-6">
      <Text className="mb-2 text-sm font-medium text-white/70">
        {t("profile.quoteLanguageLabel")}
      </Text>
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => setQuoteLanguage("vi")}
          className={`flex-1 rounded-xl border py-3 ${
            quoteLanguage === "vi"
              ? "border-white/50 bg-white/15"
              : "border-white/20 bg-white/5"
          }`}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Text
            className="text-center text-base text-white"
            style={{ fontWeight: quoteLanguage === "vi" ? "600" : "400" }}>
            {t("profile.languageVietnamese")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setQuoteLanguage("en")}
          className={`flex-1 rounded-xl border py-3 ${
            quoteLanguage === "en"
              ? "border-white/50 bg-white/15"
              : "border-white/20 bg-white/5"
          }`}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Text
            className="text-center text-base text-white"
            style={{ fontWeight: quoteLanguage === "en" ? "600" : "400" }}>
            {t("profile.languageEnglish")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
