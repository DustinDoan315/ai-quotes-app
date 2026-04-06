import * as Localization from "expo-localization";

export type SupportedAppLanguage = "vi" | "en";

export function normalizeSupportedAppLanguage(
  value: string | null | undefined,
): SupportedAppLanguage {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized.startsWith("vi") ? "vi" : "en";
}

export function getDeviceAppLanguage(): SupportedAppLanguage {
  const locale = Localization.getLocales()[0];
  return normalizeSupportedAppLanguage(
    locale?.languageCode ?? locale?.languageTag ?? null,
  );
}

export function getLanguageTag(language: SupportedAppLanguage): string {
  return language === "vi" ? "vi-VN" : "en-US";
}
