import * as RevenueCatService from '../services/revenuecat';
import { Entitlements } from '../config/revenuecat';
import { useCallback, useEffect, useState } from 'react';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

export function useRevenueCat() {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!RevenueCatService.isRevenueCatInitialized()) {
      setCustomerInfo(null);
      setCurrentOffering(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const [info, offering] = await Promise.all([
        RevenueCatService.getCustomerInfo(),
        RevenueCatService.getOfferings(),
      ]);
      setCustomerInfo(info);
      setCurrentOffering(offering);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setCustomerInfo(null);
      setCurrentOffering(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage) => {
    const info = await RevenueCatService.purchasePackage(pkg);
    setCustomerInfo(info);
  }, []);

  const restorePurchases = useCallback(async () => {
    const info = await RevenueCatService.restorePurchases();
    setCustomerInfo(info);
  }, []);

  useEffect(() => {
    const t = setTimeout(refresh, 300);
    return () => clearTimeout(t);
  }, [refresh]);

  const isPremium = customerInfo?.entitlements?.active?.[Entitlements.PREMIUM] != null;

  return {
    customerInfo,
    currentOffering,
    isLoading,
    isPremium,
    error,
    refresh,
    purchasePackage,
    restorePurchases,
  };
}
