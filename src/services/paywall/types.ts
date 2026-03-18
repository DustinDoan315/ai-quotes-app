export type RevenueCatPackageId = "pro_monthly" | "pro_yearly";

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

