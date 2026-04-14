import { useUserStore } from "@/appState/userStore";
import { Ionicons } from "@expo/vector-icons";
import { AnimatePresence, MotiView } from "moti";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

type LangCode = "vi" | "en";

const LANGUAGES: { code: LangCode; flag: string; label: string }[] = [
  { code: "vi", flag: "🇻🇳", label: "VI" },
  { code: "en", flag: "🇺🇸", label: "EN" },
];

function LanguageToggle({
  value,
  loading,
  onChange,
}: {
  value: LangCode;
  loading: boolean;
  onChange: (lang: LangCode) => void;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {LANGUAGES.map((lang) => {
        const active = value === lang.code;
        return (
          <Pressable
            key={lang.code}
            onPress={() => onChange(lang.code)}
            disabled={loading}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 52,
              gap: 4,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 99,
              borderWidth: 1,
              borderColor: active
                ? "rgba(255,255,255,0.45)"
                : "rgba(255,255,255,0.12)",
              backgroundColor: active
                ? "rgba(255,255,255,0.14)"
                : "rgba(255,255,255,0.04)",
              opacity: pressed ? 0.75 : 1,
            })}>
            {/* Show spinner on the active pill while loading, normal content otherwise */}
            <AnimatePresence>
              {loading && active ? (
                <MotiView
                  key="spinner"
                  from={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ type: "timing", duration: 150 }}>
                  <ActivityIndicator size="small" color="#fff" style={{ width: 28 }} />
                </MotiView>
              ) : (
                <MotiView
                  key="label"
                  from={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: loading && !active ? 0.35 : 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "timing", duration: 150 }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ fontSize: 13 }}>{lang.flag}</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: active ? "700" : "400",
                      color: active ? "#fff" : "rgba(255,255,255,0.45)",
                      letterSpacing: 0.3,
                    }}>
                    {lang.label}
                  </Text>
                </MotiView>
              )}
            </AnimatePresence>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProfileLanguageSection() {
  const { t } = useTranslation();
  const uiLanguage = (useUserStore((s) => s.uiLanguage) ?? "en") as LangCode;
  const quoteLanguage = (useUserStore((s) => s.quoteLanguage) ?? "vi") as LangCode;
  const setUiLanguage = useUserStore((s) => s.setUiLanguage);
  const setQuoteLanguage = useUserStore((s) => s.setQuoteLanguage);

  const [switchingUi, setSwitchingUi] = useState(false);
  const [switchingQuote, setSwitchingQuote] = useState(false);

  const handleUiLanguage = async (lang: LangCode) => {
    if (lang === uiLanguage || switchingUi) return;
    setSwitchingUi(true);
    await new Promise<void>((r) => setTimeout(r, 400));
    setUiLanguage(lang);
    setSwitchingUi(false);
  };

  const handleQuoteLanguage = async (lang: LangCode) => {
    if (lang === quoteLanguage || switchingQuote) return;
    setSwitchingQuote(true);
    await new Promise<void>((r) => setTimeout(r, 400));
    setQuoteLanguage(lang);
    setSwitchingQuote(false);
  };

  return (
    <View className="mb-6">
      <View className="mb-3 flex-row items-center gap-2">
        <Ionicons name="language-outline" size={15} color="rgba(255,255,255,0.5)" />
        <Text className="text-sm font-semibold uppercase tracking-widest text-white/50">
          Language
        </Text>
      </View>

      <View
        style={{
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.10)",
          backgroundColor: "rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}>
        {/* App language row */}
        <View className="flex-row items-center justify-between px-4 py-3.5">
          <View className="flex-row items-center gap-3">
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: "rgba(255,255,255,0.08)",
                alignItems: "center",
                justifyContent: "center",
              }}>
              <Ionicons
                name="phone-portrait-outline"
                size={15}
                color="rgba(255,255,255,0.55)"
              />
            </View>
            <View>
              <Text className="text-[15px] font-medium text-white/85">
                {t("profile.appLanguageLabel")}
              </Text>
              {switchingUi ? (
                <Text className="text-[11px] text-white/40">Applying…</Text>
              ) : null}
            </View>
          </View>
          <LanguageToggle
            value={uiLanguage}
            loading={switchingUi}
            onChange={handleUiLanguage}
          />
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: "rgba(255,255,255,0.07)",
            marginHorizontal: 16,
          }}
        />

        {/* Quote language row */}
        <View className="flex-row items-center justify-between px-4 py-3.5">
          <View className="flex-row items-center gap-3">
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: "rgba(255,255,255,0.08)",
                alignItems: "center",
                justifyContent: "center",
              }}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={15}
                color="rgba(255,255,255,0.55)"
              />
            </View>
            <View>
              <Text className="text-[15px] font-medium text-white/85">
                {t("profile.quoteLanguageLabel")}
              </Text>
              {switchingQuote ? (
                <Text className="text-[11px] text-white/40">Applying…</Text>
              ) : null}
            </View>
          </View>
          <LanguageToggle
            value={quoteLanguage}
            loading={switchingQuote}
            onChange={handleQuoteLanguage}
          />
        </View>
      </View>
    </View>
  );
}
