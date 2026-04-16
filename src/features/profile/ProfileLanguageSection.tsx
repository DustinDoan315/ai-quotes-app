import { useUserStore } from "@/appState/userStore";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

type LangCode = "vi" | "en";
const TOGGLE_PADDING = 4;
const TOGGLE_GAP = 12;

const LANGUAGES: {
  code: LangCode;
  flag: string;
  shortLabel: string;
  labelKey: "profile.languageVietnamese" | "profile.languageEnglish";
}[] = [
  { code: "vi", flag: "🇻🇳", shortLabel: "VI", labelKey: "profile.languageVietnamese" },
  { code: "en", flag: "🇺🇸", shortLabel: "EN", labelKey: "profile.languageEnglish" },
];

function LanguageToggle({
  value,
  onChange,
}: {
  value: LangCode;
  onChange: (lang: LangCode) => void;
}) {
  const { t } = useTranslation();
  const [trackWidth, setTrackWidth] = useState(0);
  const activeIndex = Math.max(
    LANGUAGES.findIndex((lang) => lang.code === value),
    0,
  );
  const thumbWidth =
    trackWidth > 0
      ? (trackWidth - TOGGLE_PADDING * 2 - TOGGLE_GAP * (LANGUAGES.length - 1)) /
        LANGUAGES.length
      : 0;

  return (
    <View
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      style={{
        position: "relative",
        flexDirection: "row",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
        backgroundColor: "rgba(255,255,255,0.05)",
        padding: TOGGLE_PADDING,
        overflow: "hidden",
      }}>
      {thumbWidth > 0 ? (
        <MotiView
          animate={{ translateX: activeIndex * (thumbWidth + TOGGLE_GAP) }}
          transition={{ type: "timing", duration: 220 }}
          style={{
            position: "absolute",
            top: TOGGLE_PADDING,
            bottom: TOGGLE_PADDING,
            left: TOGGLE_PADDING,
            width: thumbWidth,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.22)",
            backgroundColor: "rgba(255,255,255,0.16)",
          }}
        />
      ) : null}
      {LANGUAGES.map((lang, index) => {
        const active = value === lang.code;
        return (
          <Pressable
            key={lang.code}
            onPress={() => {
              if (lang.code === value) {
                return;
              }
              void Haptics.selectionAsync();
              onChange(lang.code);
            }}
            style={({ pressed }) => ({
              flex: 1,
              borderRadius: 14,
              paddingHorizontal: 10,
              paddingVertical: 14,
              marginLeft: index === 0 ? 0 : TOGGLE_GAP,
              opacity: pressed ? 0.9 : 1,
            })}>
            <MotiView
              animate={{ scale: active ? 1.04 : 1 }}
              transition={{ type: "timing", duration: 180 }}
              style={{ alignItems: "center", gap: 5 }}>
              <Text style={{ fontSize: 22 }}>{lang.flag}</Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: active ? "700" : "500",
                  color: active ? "#FFFFFF" : "rgba(255,255,255,0.55)",
                  letterSpacing: 0.6,
                }}>
                {t(lang.labelKey)}
              </Text>
            </MotiView>
          </Pressable>
        );
      })}
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
