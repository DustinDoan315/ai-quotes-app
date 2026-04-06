import { strings } from "@/theme/strings";
import { Pressable, Text, View } from "react-native";

type LanguageOption = "vi" | "en";

interface ProfileLanguageSelectorProps {
  title: string;
  description: string;
  value: LanguageOption;
  onChange: (language: LanguageOption) => void;
}

const LANGUAGE_OPTIONS: LanguageOption[] = ["vi", "en"];

export function ProfileLanguageSelector({
  title,
  description,
  value,
  onChange,
}: ProfileLanguageSelectorProps) {
  return (
    <View className="mb-6 overflow-hidden rounded-2xl border border-white/15 bg-white/5 px-4 py-4">
      <Text className="text-sm font-medium text-white/80">{title}</Text>
      <Text className="mt-1 text-xs leading-5 text-white/45">{description}</Text>

      <View className="mt-3 flex-row gap-2">
        {LANGUAGE_OPTIONS.map((language) => {
          const selected = value === language;

          return (
            <Pressable
              key={language}
              onPress={() => onChange(language)}
              className={`flex-1 rounded-xl border px-3 py-3 ${
                selected
                  ? "border-white/55 bg-white/15"
                  : "border-white/20 bg-white/5"
              }`}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
              <Text
                className="text-center text-base text-white"
                style={{ fontWeight: selected ? "700" : "500" }}>
                {strings.languages[language]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
