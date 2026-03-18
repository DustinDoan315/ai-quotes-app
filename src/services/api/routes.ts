import { apiClient } from "./client";
import { QuoteResponse } from "./types";

type BillingOfferingsResponse = {
  currentOffering: {
    identifier: string;
    availablePackages: {
      identifier: "pro_monthly" | "pro_yearly";
      title: string;
      description: string;
      priceString: string;
    }[];
  } | null;
};

type BillingCustomerResponse = {
  activeEntitlementIds: string[];
  latestExpirationAt: string | null;
};

export const apiRoutes = {
  quotes: {
    daily: () => apiClient.get<QuoteResponse>("/quotes/daily"),
    generate: (personaId: string, imageContext?: string) =>
      apiClient.post<QuoteResponse>("/quotes/generate", {
        personaId,
        imageContext,
      }),
  },
  billing: {
    offerings: () =>
      apiClient.get<BillingOfferingsResponse>("/billing/offerings"),
    customer: () =>
      apiClient.get<BillingCustomerResponse>("/billing/customer"),
    purchase: (packageId: "pro_monthly" | "pro_yearly") =>
      apiClient.post<{ customerInfo: BillingCustomerResponse }>(
        "/billing/purchase",
        { packageId },
      ),
    restore: () =>
      apiClient.post<{ customerInfo: BillingCustomerResponse }>(
        "/billing/restore",
      ),
  },
};
