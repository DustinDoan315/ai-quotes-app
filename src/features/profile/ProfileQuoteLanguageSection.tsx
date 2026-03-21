import { useUserStore } from "@/appState/userStore";
import { Pressable, Text, View } from "react-native";

export function ProfileQuoteLanguageSection() {
  const quoteLanguage = useUserStore((s) => s.quoteLanguage) ?? "vi";
  const setQuoteLanguage = useUserStore((s) => s.setQuoteLanguage);

  return (
    <View className="mb-6">
      <Text className="mb-2 text-sm font-medium text-white/70">
        Quote language
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
            Tiếng Việt
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
            English
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
