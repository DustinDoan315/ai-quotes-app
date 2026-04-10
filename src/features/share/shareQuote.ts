import { Share } from "react-native";
import { APP_BRAND_MARK } from "@/theme/appBrand";

export async function shareQuote(quoteText: string): Promise<void> {
  await Share.share({
    message: `"${quoteText}"\n\n— via ${APP_BRAND_MARK}`,
  });
}
