import { RevenueCatConfig } from "@/config/revenuecat";
import { getDeviceUiLanguage } from "@/i18n";
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";

let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * RevenueCat renders hosted paywalls in the locale we hand it: the override
 * wins over the SDK's own device-locale resolution, so the Vietnamese (or
 * English) paywall copy added in the dashboard is used for this language.
 *
 * Never throws: a locale problem must not take down subscription init.
 */
async function applyPreferredLocale(locale: string): Promise<void> {
  try {
    await Purchases.overridePreferredLocale(locale);
  } catch (error) {
    console.warn("[RevenueCat] Failed to set the preferred paywall locale:", error);
  }
}

function installRevenueCatLogHandler(): void {
  Purchases.setLogHandler((logLevel, message) => {
    const line = `[RevenueCat] ${message}`;
    if (logLevel === LOG_LEVEL.ERROR && message.includes("simulated successfully")) {
      console.info(line);
      return;
    }

    switch (logLevel) {
      case LOG_LEVEL.DEBUG:
        console.debug(line);
        break;
      case LOG_LEVEL.INFO:
        console.info(line);
        break;
      case LOG_LEVEL.WARN:
        console.warn(line);
        break;
      case LOG_LEVEL.ERROR:
        console.error(line);
        break;
      default:
        console.log(line);
    }
  });
}

export function isRevenueCatInitialized(): boolean {
  return isInitialized;
}

export async function initializeRevenueCat(appUserId?: string): Promise<void> {
  if (isInitialized) {
    return;
  }
  if (initPromise) {
    return initPromise;
  }

  const apiKey = RevenueCatConfig.apiKey?.trim() || "";
  if (!apiKey) {
    console.error(
      "RevenueCat init skipped:",
      RevenueCatConfig.configurationError ?? "No API key was configured.",
    );
    return;
  }

  initPromise = (async () => {
    try {
      installRevenueCatLogHandler();
      const preferredLocale = getDeviceUiLanguage();
      const alreadyConfigured = await Purchases.isConfigured();
      if (!alreadyConfigured) {
        Purchases.configure({
          apiKey,
          appUserID: appUserId?.trim() || undefined,
          preferredUILocaleOverride: preferredLocale,
        });
      }
      // configure() is skipped when Purchases is already set up (fast refresh,
      // re-init), so apply the locale explicitly as well.
      await applyPreferredLocale(preferredLocale);
      isInitialized = true;
    } catch (error) {
      initPromise = null;
      console.error("RevenueCat init failed:", error);
    }
  })();

  return initPromise;
}

async function ensureInit(): Promise<void> {
  if (isInitialized) {
    return;
  }
  if (initPromise) {
    await initPromise;
  }
  if (!isInitialized) {
    throw new Error(
      RevenueCatConfig.configurationError ?? "RevenueCat not initialized",
    );
  }
}

export async function logInRevenueCat(appUserId: string): Promise<CustomerInfo> {
  await ensureInit();
  const { customerInfo } = await Purchases.logIn(appUserId);
  return customerInfo;
}

export async function logOutRevenueCat(): Promise<CustomerInfo> {
  await ensureInit();
  const isAnonymous = await Purchases.isAnonymous();
  if (isAnonymous) {
    return Purchases.getCustomerInfo();
  }
  return Purchases.logOut();
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  await ensureInit();
  return Purchases.getCustomerInfo();
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  await ensureInit();
  const offerings = await Purchases.getOfferings();
  const current = offerings.current ?? null;

  if (!current) {
    console.error(
      "[RevenueCat] No current offering was returned. In RevenueCat, make an offering current and attach an Apple/Google product to one of its packages.",
      { availableOfferingIds: Object.keys(offerings.all) },
    );
    return null;
  }

  if (!current.availablePackages.length) {
    console.error(
      "[RevenueCat] The current offering has no available packages. Check that each package uses a product from this store app and that the product is active in App Store Connect or Google Play.",
      { offeringId: current.identifier },
    );
  }
  return current;
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
