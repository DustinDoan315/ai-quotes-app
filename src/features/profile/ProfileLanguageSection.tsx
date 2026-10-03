import { useUserStore } from "@/appState/userStore";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

type LangCode = "vi" | "en";
const TOGGLE_PADDING = 4;
const TOGGLE_GAP = 10;

const LANGUAGES: {
  code: LangCode;
  flag: string;
  shortLabel: string;
  labelKey: "profile.languageVietnamese" | "profile.languageEnglish";
}[] = [
  { code: "vi", flag: "🇻🇳", shortLabel: "VI", labelKey: "profile.languageVietnamese" },
  { code: "en", flag: "🇺🇸", shortLabel: "EN", labelKey: "profile.languageEnglish" },
];

function LanguageOption({
  active,
  flag,
  label,
  onPress,
}: {
  active: boolean;
  flag: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: "100%",
        minHeight: 92,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: active
          ? "rgba(255,255,255,0.22)"
          : "rgba(255,255,255,0.08)",
        backgroundColor: active
          ? "rgba(255,255,255,0.16)"
          : "rgba(255,255,255,0.04)",
        paddingHorizontal: 8,
        paddingVertical: 12,
        opacity: pressed ? 0.9 : 1,
      })}>
      <MotiView
        animate={{ scale: active ? 1.04 : 1 }}
        transition={{ type: "timing", duration: 180 }}
        style={{ width: "100%", alignItems: "center", gap: 5 }}>
        <Text style={{ fontSize: 22 }}>{flag}</Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          style={{
            width: "100%",
            fontSize: 13,
            fontWeight: active ? "700" : "500",
            color: active ? "#FFFFFF" : "rgba(255,255,255,0.55)",
            includeFontPadding: false,
            letterSpacing: 0,
            textAlign: "center",
          }}>
          {label}
        </Text>
      </MotiView>
    </Pressable>
  );
}

function LanguageToggle({
  value,
  onChange,
}: {
  value: LangCode;
  onChange: (lang: LangCode) => void;
}) {
  const { t } = useTranslation();
  const vietnamese = LANGUAGES[0];
  const english = LANGUAGES[1];

  const handlePress = (lang: LangCode) => {
    if (lang === value) {
      return;
    }
    void Haptics.selectionAsync();
    onChange(lang);
  };

  return (
    <View
      style={{
        alignSelf: "stretch",
        width: "100%",
        flexDirection: "row",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
        backgroundColor: "rgba(255,255,255,0.05)",
        padding: TOGGLE_PADDING,
        overflow: "hidden",
      }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <LanguageOption
          active={value === vietnamese.code}
          flag={vietnamese.flag}
          label={t(vietnamese.labelKey)}
          onPress={() => handlePress(vietnamese.code)}
        />
      </View>
      <View style={{ width: TOGGLE_GAP }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <LanguageOption
          active={value === english.code}
          flag={english.flag}
          label={t(english.labelKey)}
          onPress={() => handlePress(english.code)}
        />
      </View>
    </View>
  );
}

export function ProfileLanguageSection() {
  const { t } = useTranslation();
  const uiLanguage = (useUserStore((s) => s.uiLanguage) ?? "en") as LangCode;
  const setUiLanguage = useUserStore((s) => s.setUiLanguage);
  const setQuoteLanguage = useUserStore((s) => s.setQuoteLanguage);
  const effectiveLanguage = uiLanguage;

  const handleLanguageChange = (lang: LangCode) => {
    setUiLanguage(lang);
    setQuoteLanguage(lang);
  };

  return (
    <View className="mb-6">
      <View className="mb-3 flex-row items-center gap-2">
        <Ionicons name="language-outline" size={15} color="rgba(255,255,255,0.5)" />
        <Text className="text-sm font-semibold uppercase tracking-widest text-white/50">
          {t("profile.languageLabel")}
        </Text>
      </View>

      <View
        style={{
          alignSelf: "stretch",
          borderRadius: 18,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.10)",
          backgroundColor: "rgba(255,255,255,0.04)",
          padding: 16,
          gap: 10,
        }}>
        <Text
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: 0.2,
          }}>
          {t("profile.languageCombinedDescription")}
        </Text>
        <LanguageToggle value={effectiveLanguage} onChange={handleLanguageChange} />
      </View>
    </View>
  );
}
