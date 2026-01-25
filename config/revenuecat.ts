export const RevenueCatConfig = {
  apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '',
  userId: undefined as string | undefined,
  appUserId: undefined as string | undefined,
};

if (__DEV__ && RevenueCatConfig.apiKey && RevenueCatConfig.apiKey.trim() !== '') {
  const apiKey = RevenueCatConfig.apiKey.trim();
  
  if (apiKey.startsWith('sk_') || apiKey.startsWith('rcsk_')) {
    console.error(
      '❌ ERROR: You are using a SECRET API key in your app!\n' +
      'Secret keys (sk_... or rcsk_...) should NEVER be used in mobile apps.\n' +
      'They are only for backend/server use.\n\n' +
      'To fix this:\n' +
      '1. Go to RevenueCat Dashboard > Apps > Your App > API Keys\n' +
      '2. Copy the PUBLIC API key (starts with appl_ for iOS or goog_ for Android)\n' +
      '3. For testing, you can use a Test Store key (starts with rcb_)\n' +
      '4. Set it as EXPO_PUBLIC_REVENUECAT_API_KEY in your .env file\n' +
      '5. Restart your development server\n\n' +
      'The app will show an error screen until you fix this.'
    );
  }
  
  const isValidFormat = apiKey.startsWith('appl_') || 
                        apiKey.startsWith('goog_') ||
                        apiKey.startsWith('rcb_') ||
                        apiKey.startsWith('test_');
  if (!isValidFormat && !apiKey.startsWith('sk_') && !apiKey.startsWith('rcsk_')) {
    console.warn(
      '⚠️ RevenueCat API key format may be incorrect. ' +
      'Expected format: appl_... (iOS), goog_... (Android), rcb_... or test_... (Test Store)'
    );
  }
}

export const Entitlements = {
  PREMIUM: 'premium',
} as const;

export const Products = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  LIFETIME: 'lifetime',
  MONTHLY_PREMIUM: 'monthly_premium',
  ANNUAL_PREMIUM: 'annual_premium',
} as const;
