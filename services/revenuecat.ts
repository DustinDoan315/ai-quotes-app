import { RevenueCatConfig } from '../config/revenuecat';
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';


let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

export function isRevenueCatInitialized(): boolean {
  return isInitialized;
}

export function waitForInitialization(): Promise<void> {
  if (isInitialized) {
    return Promise.resolve();
  }
  if (initializationPromise) {
    return initializationPromise;
  }
  throw new Error('RevenueCat has not been initialized. Call initializeRevenueCat() first.');
}

export async function initializeRevenueCat(userId?: string): Promise<void> {
  if (isInitialized) {
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  const apiKey = RevenueCatConfig.apiKey?.trim() || '';
  if (!apiKey) {
    const error = new Error(
      'RevenueCat API key is missing. Please set EXPO_PUBLIC_REVENUECAT_API_KEY environment variable or update config/revenuecat.ts'
    );
    console.error(error.message);
    throw error;
  }

  if (apiKey.startsWith('sk_') || apiKey.startsWith('rcsk_')) {
    const error = new Error(
      'SECRET API key detected! Secret keys (sk_... or rcsk_...) should NEVER be used in mobile apps.\n\n' +
      'To fix:\n' +
      '1. Go to RevenueCat Dashboard > Apps > Your App > API Keys\n' +
      '2. Copy the PUBLIC API key (starts with appl_ for iOS or goog_ for Android)\n' +
      '3. For testing, use a Test Store key (starts with rcb_)\n' +
      '4. Set EXPO_PUBLIC_REVENUECAT_API_KEY in your .env file\n' +
      '5. Restart your development server'
    );
    console.error('❌', error.message);
    throw error;
  }

  if (!apiKey.startsWith('appl_') && !apiKey.startsWith('goog_') && !apiKey.startsWith('rcb_') && !apiKey.startsWith('test_')) {
    console.warn(
      '⚠️ RevenueCat API key format may be incorrect. ' +
      'Expected: appl_... (iOS), goog_... (Android), rcb_... or test_... (Test Store)'
    );
  }

  initializationPromise = (async () => {
    try {
      // Log API key info for debugging (without exposing full key)
      const apiKeyPreview = apiKey.length > 10 
        ? `${apiKey.substring(0, 10)}...` 
        : 'MISSING';
      console.log(`[RevenueCat] Initializing with API key: ${apiKeyPreview}`);
      
      // Determine API key type
      let apiKeyType = 'Unknown';
      if (apiKey.startsWith('test_')) {
        apiKeyType = 'Test Store';
      } else if (apiKey.startsWith('appl_')) {
        apiKeyType = 'iOS';
      } else if (apiKey.startsWith('goog_')) {
        apiKeyType = 'Android';
      }
      console.log(`[RevenueCat] API key type: ${apiKeyType}`);
      
      await Purchases.configure({
        apiKey: RevenueCatConfig.apiKey,
        appUserID: userId || RevenueCatConfig.appUserId,
      });

      isInitialized = true;
      console.log('✅ RevenueCat initialized successfully');
    } catch (error) {
      isInitialized = false;
      initializationPromise = null;
      console.error('❌ Error initializing RevenueCat:', error);
      
      // Provide helpful error message for Test Store issues
      if (error instanceof Error && error.message.includes('App Store Connect')) {
        console.error('\n⚠️ Test Store Configuration Issue:');
        console.error('If you\'re using a Test Store (test_... API key), make sure:');
        console.error('1. You\'re using a development build (not Expo Go)');
        console.error('2. The StoreKit Configuration file has been removed');
        console.error('3. Your API key is correct: test_mRkcodvVQxGmBemsQTGAyxIwtOx');
        console.error('4. You\'ve rebuilt the app after configuration changes\n');
      }
      
      throw error;
    }
  })();

  return initializationPromise;
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  await waitForInitialization();
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Error getting customer info:', error);
    throw error;
  }
}

export async function hasActiveEntitlement(entitlementId: string): Promise<boolean> {
  await waitForInitialization();
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[entitlementId] !== undefined;
  } catch (error) {
    console.error('Error checking entitlement:', error);
    return false;
  }
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  await waitForInitialization();
  try {
    console.log('[RevenueCat] Fetching offerings...');
    const offerings = await Purchases.getOfferings();
    
    if (offerings.current) {
      console.log(`[RevenueCat] ✅ Found current offering: ${offerings.current.identifier}`);
      console.log(`[RevenueCat] Packages available: ${offerings.current.availablePackages.length}`);
    } else {
      console.warn('[RevenueCat] ⚠️ No current offering found');
      console.warn('[RevenueCat] Available offerings:', Object.keys(offerings.all));
    }
    
    return offerings.current;
  } catch (error) {
    console.error('❌ Error getting offerings:', error);
    
    // Provide helpful context for Test Store
    if (error instanceof Error && error.message.includes('App Store Connect')) {
      console.error('\n🔍 Troubleshooting Test Store Issues:');
      console.error('1. Verify API key is set: EXPO_PUBLIC_REVENUECAT_API_KEY=test_mRkcodvVQxGmBemsQTGAyxIwtOx');
      console.error('2. Ensure you\'re using a development build (npx expo run:ios)');
      console.error('3. Check that Products.storekit file has been removed');
      console.error('4. Verify products have prices configured in RevenueCat dashboard');
      console.error('5. Make sure packages have products attached\n');
    }
    
    return null;
  }
}

export async function purchasePackage(
  packageToPurchase: PurchasesPackage
): Promise<CustomerInfo> {
  await waitForInitialization();
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    return customerInfo;
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('User cancelled purchase');
    } else {
      console.error('Error purchasing package:', error);
    }
    throw error;
  }
}

export async function restorePurchases(): Promise<CustomerInfo> {
  await waitForInitialization();
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    throw error;
  }
}

export async function setUserId(userId: string): Promise<void> {
  await waitForInitialization();
  try {
    await Purchases.logIn(userId);
    console.log('User ID set:', userId);
  } catch (error) {
    console.error('Error setting user ID:', error);
    throw error;
  }
}

export async function logOut(): Promise<CustomerInfo> {
  await waitForInitialization();
  try {
    const customerInfo = await Purchases.logOut();
    return customerInfo;
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
}
