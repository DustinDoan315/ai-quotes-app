export type OfferingsFetchStatus = "idle" | "loading" | "success" | "error";

export type RevenueCatPackageId = string;

export type RevenueCatOffering = {
  identifier: string;
  availablePackages: {
    identifier: RevenueCatPackageId;
    title: string;
    description: string;
    priceString: string;
  }[];
};

export type RevenueCatCustomerInfo = {
  activeEntitlementIds: string[];
  latestExpirationAt: string | null;
};

