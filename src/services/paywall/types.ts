export type RevenueCatPackageId = "$rc_monthly" | "$rc_annual" | "$rc_lifetime";

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

