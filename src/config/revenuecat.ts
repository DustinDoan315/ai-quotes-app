import { Platform } from "react-native";

export { SUBSCRIPTION_ENTITLEMENT_ID } from "@/domain/subscription/subscriptionConstants";

const appEnvironment = process.env.EXPO_PUBLIC_APP_ENV ?? "development";
const platform = Platform.OS;
const platformApiKey =
  platform === "ios"
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
    : platform === "android"
      ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY
      : undefined;
const legacyApiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

// Release builds must use their store's app-specific key. The generic key is
// retained solely for existing local/Test Store development configurations.
const apiKey =
  appEnvironment === "production"
    ? platformApiKey?.trim() || ""
    : platformApiKey?.trim() || legacyApiKey?.trim() || "";

const configurationError =
  !apiKey && (platform === "ios" || platform === "android")
    ? appEnvironment === "production"
      ? `Missing RevenueCat ${platform} production API key. Set ${
          platform === "ios"
            ? "EXPO_PUBLIC_REVENUECAT_IOS_API_KEY"
            : "EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY"
        } in the EAS production environment.`
      : `Missing RevenueCat ${platform} API key. Set the platform-specific key or EXPO_PUBLIC_REVENUECAT_API_KEY for local development.`
    : null;

export const RevenueCatConfig = {
  apiKey,
  appEnvironment,
  platform,
  configurationError,
};
