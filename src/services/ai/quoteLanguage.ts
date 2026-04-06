import { useUserStore } from "@/appState/userStore";
import { getDeviceAppLanguage } from "@/utils/appLanguage";
import type { QuoteLanguage } from "./types";

export function getQuoteLanguage(): QuoteLanguage {
  const { quoteLanguage, appLanguage } = useUserStore.getState();
  return quoteLanguage ?? appLanguage ?? getDeviceAppLanguage();
}
