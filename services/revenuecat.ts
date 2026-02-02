import { RevenueCatConfig } from '../config/revenuecat';
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

export function isRevenueCatInitialized(): boolean {
  return isInitialized;
}

export async function initializeRevenueCat(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  const apiKey = RevenueCatConfig.apiKey?.trim() || '';
  if (!apiKey) {
    return;
  }

  initPromise = (async () => {
    try {
      Purchases.configure({ apiKey });
      isInitialized = true;
    } catch (error) {
      initPromise = null;
      console.error('RevenueCat init failed:', error);
    }
  })();

  return initPromise;
}

async function ensureInit(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) await initPromise;
  if (!isInitialized) throw new Error('RevenueCat not initialized');
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  await ensureInit();
  return Purchases.getCustomerInfo();
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  await ensureInit();
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  await ensureInit();
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  await ensureInit();
  return Purchases.restorePurchases();
}
