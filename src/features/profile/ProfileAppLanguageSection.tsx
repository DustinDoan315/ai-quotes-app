import { useUserStore } from "@/appState/userStore";
import { strings } from "@/theme/strings";
import { Pressable, Text, View } from "react-native";

export function ProfileAppLanguageSection() {
  const appLanguage = useUserStore((s) => s.appLanguage);
  const setAppLanguage = useUserStore((s) => s.setAppLanguage);

  return (
    <View className="mb-6">
      <Text className="mb-2 text-sm font-medium text-white/70">
        {strings.profile.appLanguage}
      </Text>
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => setAppLanguage("vi")}
          className={`flex-1 rounded-xl border py-3 ${
            appLanguage === "vi"
              ? "border-white/50 bg-white/15"
              : "border-white/20 bg-white/5"
          }`}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Text
            className="text-center text-base text-white"
            style={{ fontWeight: appLanguage === "vi" ? "600" : "400" }}>
            {strings.languages.vi}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setAppLanguage("en")}
          className={`flex-1 rounded-xl border py-3 ${
            appLanguage === "en"
              ? "border-white/50 bg-white/15"
              : "border-white/20 bg-white/5"
          }`}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Text
            className="text-center text-base text-white"
            style={{ fontWeight: appLanguage === "en" ? "600" : "400" }}>
            {strings.languages.en}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
