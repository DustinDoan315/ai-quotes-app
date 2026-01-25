import * as RevenueCatService from '../services/revenuecat';
import { Entitlements } from '../config/revenuecat';
import { useCallback, useEffect, useState } from 'react';

import {
    CustomerInfo,
    PurchasesOffering,
    PurchasesPackage,
} from 'react-native-purchases';


interface UseRevenueCatReturn {
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  isLoading: boolean;
  isPremium: boolean;
  error: Error | null;
  refreshCustomerInfo: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
}

export function useRevenueCat(): UseRevenueCatReturn {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshCustomerInfo = useCallback(async () => {
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
      console.error('Error refreshing customer info:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedInfo = await RevenueCatService.purchasePackage(pkg);
      setCustomerInfo(updatedInfo);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const restoredInfo = await RevenueCatService.restorePurchases();
      setCustomerInfo(restoredInfo);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshCustomerInfo();
    }, 500);

    return () => clearTimeout(timer);
  }, [refreshCustomerInfo]);

  const isPremium = customerInfo?.entitlements.active[Entitlements.PREMIUM] !== undefined;

  return {
    customerInfo,
    currentOffering,
    isLoading,
    isPremium,
    error,
    refreshCustomerInfo,
    purchasePackage,
    restorePurchases,
  };
}
