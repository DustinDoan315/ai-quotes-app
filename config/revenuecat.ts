export const RevenueCatConfig = {
  apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '',
};

export const Entitlements = {
  PREMIUM: 'premium',
} as const;
