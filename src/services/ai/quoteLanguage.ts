import * as Localization from "expo-localization";
import type { QuoteLanguage } from "./types";

export function getQuoteLanguage(): QuoteLanguage {
  const locales = Localization.getLocales();
  const code = locales[0]?.languageCode?.toLowerCase();
  if (code === "en") return "en";
  return "vi";
}
