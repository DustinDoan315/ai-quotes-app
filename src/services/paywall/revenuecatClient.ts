import { apiClient } from "@/services/api/client";
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

export const revenuecatClient = {
  getOfferings: async (): Promise<GetOfferingsResponse> => {
    try {
      return await apiClient.get<GetOfferingsResponse>("/billing/offerings");
    } catch (error) {
      throw new PaywallError(
        error instanceof Error ? error.message : "Failed to load offerings",
      );
    }
  },

  getCustomerInfo: async (): Promise<RevenueCatCustomerInfo> => {
    try {
      return await apiClient.get<RevenueCatCustomerInfo>("/billing/customer");
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
      return await apiClient.post<PurchaseResponse>("/billing/purchase", {
        packageId,
      });
    } catch (error) {
      throw new PaywallError(
        error instanceof Error ? error.message : "Failed to purchase",
      );
    }
  },

  restorePurchases: async (): Promise<RestoreResponse> => {
    try {
      return await apiClient.post<RestoreResponse>("/billing/restore");
    } catch (error) {
      throw new PaywallError(
        error instanceof Error ? error.message : "Failed to restore purchases",
      );
    }
  },
};

