import { useUserStore } from "@/appState/userStore";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

type LangCode = "vi" | "en";
const TOGGLE_PADDING = 4;
const TOGGLE_GAP = 6;

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
        borderColor: "rgba(255,255,255,0.08)",
        backgroundColor: "rgba(255,255,255,0.04)",
        padding: TOGGLE_PADDING,
        gap: TOGGLE_GAP,
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
            borderColor: "rgba(255,255,255,0.18)",
            backgroundColor: "rgba(255,255,255,0.14)",
          }}
        />
      ) : null}
      {LANGUAGES.map((lang) => {
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
              paddingVertical: 12,
              opacity: pressed ? 0.9 : 1,
            })}>
            <MotiView
              animate={{ scale: active ? 1.02 : 1 }}
              transition={{ type: "timing", duration: 180 }}
              style={{ alignItems: "center", gap: 3 }}>
              <Text style={{ fontSize: 16 }}>{lang.flag}</Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: active ? "700" : "500",
                  color: active ? "#FFFFFF" : "rgba(255,255,255,0.7)",
                  letterSpacing: 0.4,
                }}>
                {lang.shortLabel}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 11,
                  color: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)",
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

function LanguagePreferenceCard({
  icon,
  title,
  description,
  value,
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: LangCode;
  onChange: (lang: LangCode) => void;
}) {
  const { t } = useTranslation();
  const selectedLanguage = LANGUAGES.find((lang) => lang.code === value) ?? LANGUAGES[0];

  return (
    <View
      style={{
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
        backgroundColor: "rgba(255,255,255,0.04)",
        padding: 16,
        gap: 14,
      }}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-row flex-1 items-start gap-3">
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.08)",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Ionicons name={icon} size={17} color="rgba(255,255,255,0.72)" />
          </View>
          <View style={{ flex: 1 }}>
            <Text className="text-[15px] font-semibold text-white">{title}</Text>
            <Text className="mt-1 text-[12px] leading-5 text-white/55">{description}</Text>
          </View>
        </View>

        <MotiView
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 180 }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.10)",
            backgroundColor: "rgba(255,255,255,0.06)",
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}>
          <Text style={{ fontSize: 13 }}>{selectedLanguage.flag}</Text>
          <Text className="text-[11px] font-semibold text-white/80">
            {t(selectedLanguage.labelKey)}
          </Text>
        </MotiView>
      </View>

      <LanguageToggle value={value} onChange={onChange} />
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
          gap: 12,
        }}>
        <LanguagePreferenceCard
          icon="language-outline"
          title={t("profile.languageLabel")}
          description={t("profile.languageCombinedDescription")}
          value={effectiveLanguage}
          onChange={handleLanguageChange}
        />
      </View>
    </View>
  );
}
