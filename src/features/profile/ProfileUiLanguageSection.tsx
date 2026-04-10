import { useUserStore } from "@/appState/userStore";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

export function ProfileUiLanguageSection() {
  const { t } = useTranslation();
  const uiLanguage = useUserStore((s) => s.uiLanguage) ?? "en";
  const setUiLanguage = useUserStore((s) => s.setUiLanguage);

  return (
    <View className="mb-6">
      <Text className="mb-2 text-sm font-medium text-white/70">
        {t("profile.appLanguageLabel")}
      </Text>
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => setUiLanguage("vi")}
          className={`flex-1 rounded-xl border py-3 ${
            uiLanguage === "vi"
              ? "border-white/50 bg-white/15"
              : "border-white/20 bg-white/5"
          }`}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Text
            className="text-center text-base text-white"
            style={{ fontWeight: uiLanguage === "vi" ? "600" : "400" }}>
            {t("profile.languageVietnamese")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setUiLanguage("en")}
          className={`flex-1 rounded-xl border py-3 ${
            uiLanguage === "en"
              ? "border-white/50 bg-white/15"
              : "border-white/20 bg-white/5"
          }`}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Text
            className="text-center text-base text-white"
            style={{ fontWeight: uiLanguage === "en" ? "600" : "400" }}>
            {t("profile.languageEnglish")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
