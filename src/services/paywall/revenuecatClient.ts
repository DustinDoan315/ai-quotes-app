import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";

import {
  getCustomerInfo as fetchNativeCustomerInfo,
  getOfferings as fetchNativeOfferings,
  purchasePackage as purchaseNativePackage,
  restorePurchases as restoreNativePurchases,
} from "../../../services/revenuecat";
import { PaywallError } from "./errors";
import {
  type RevenueCatCustomerInfo,
  type RevenueCatOffering,
  type RevenueCatPackageId,
} from "./types";

type GetOfferingsResponse = {
  currentOffering: RevenueCatOffering | null;
};

type PurchaseResponse = {
  customerInfo: RevenueCatCustomerInfo;
};

type RestoreResponse = {
  customerInfo: RevenueCatCustomerInfo;
};

const mapCustomerInfo = (info: CustomerInfo): RevenueCatCustomerInfo => ({
  activeEntitlementIds: Object.keys(info.entitlements.active),
  latestExpirationAt: info.latestExpirationDate,
});

const mapOffering = (
  offering: PurchasesOffering | null,
): RevenueCatOffering | null => {
  if (!offering) {
    return null;
  }
  return {
    identifier: offering.identifier,
    availablePackages: offering.availablePackages.map((pkg) => ({
      identifier: pkg.identifier,
      title: pkg.product.title,
      description: pkg.product.description,
      priceString: pkg.product.priceString,
    })),
  };
};

const findPackage = async (
  packageId: RevenueCatPackageId,
): Promise<PurchasesPackage> => {
  const offering = await fetchNativeOfferings();
  if (!offering) {
    throw new PaywallError("No subscription packages are available yet.");
  }
  const pkg = offering.availablePackages.find((p) => p.identifier === packageId);
  if (!pkg) {
    throw new PaywallError("Selected plan is no longer available.");
  }
  return pkg;
};

export const revenuecatClient = {
  getOfferings: async (): Promise<GetOfferingsResponse> => {
    try {
      const current = await fetchNativeOfferings();
      return { currentOffering: mapOffering(current) };
    } catch (error) {
      throw new PaywallError(
        error instanceof Error ? error.message : "Failed to load offerings",
      );
    }
  },

  getCustomerInfo: async (): Promise<RevenueCatCustomerInfo> => {
    try {
      const info = await fetchNativeCustomerInfo();
      return mapCustomerInfo(info);
    } catch (error) {
      throw new PaywallError(
        error instanceof Error ? error.message : "Failed to load subscription",
      );
    }
  },

  purchasePackage: async (
    packageId: RevenueCatPackageId,
  ): Promise<PurchaseResponse> => {
    try {
      const pkg = await findPackage(packageId);
      const info = await purchaseNativePackage(pkg);
      return { customerInfo: mapCustomerInfo(info) };
    } catch (error) {
      if (error instanceof PaywallError) {
        throw error;
      }
      throw new PaywallError(
        error instanceof Error ? error.message : "Failed to purchase",
      );
    }
  },

  restorePurchases: async (): Promise<RestoreResponse> => {
    try {
      const info = await restoreNativePurchases();
      return { customerInfo: mapCustomerInfo(info) };
    } catch (error) {
      throw new PaywallError(
        error instanceof Error ? error.message : "Failed to restore purchases",
      );
    }
  },
};
