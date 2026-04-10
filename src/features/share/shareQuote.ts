import { Share } from "react-native";
import { APP_BRAND_MARK } from "@/theme/appBrand";
import { analyticsEvents } from "@/services/analytics/events";

export async function shareQuote(quoteText: string, quoteId = ""): Promise<void> {
  const result = await Share.share({
    message: `"${quoteText}"\n\n— via ${APP_BRAND_MARK}`,
    title: APP_BRAND_MARK,
  });
  if (result.action === Share.sharedAction) {
    analyticsEvents.quoteShared(quoteId);
  }
}
