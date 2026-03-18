import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { revenuecatClient } from "@/services/paywall/revenuecatClient";
import {
  type RevenueCatOffering,
  type RevenueCatCustomerInfo,
  type RevenueCatPackageId,
} from "@/services/paywall/types";
import { type SubscriptionPlanId } from "@/domain/subscription/subscriptionConstants";
import {
  resolvePlanFromSnapshot,
  type SubscriptionSnapshot,
} from "@/domain/subscription/subscriptionResolver";

type SubscriptionState = {
  customerInfo: RevenueCatCustomerInfo | null;
  isPro: boolean;
  activeEntitlementId: string | null;
  offerings: RevenueCatOffering | null;
  selectedPackageId: RevenueCatPackageId | null;
  lastSyncedAt: number | null;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  errorMessage: string | null;
  plan: SubscriptionPlanId;
  setSelectedPackageId: (id: RevenueCatPackageId) => void;
  initSubscription: () => Promise<void>;
  loadOfferings: () => Promise<void>;
  purchaseSelectedPackage: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  refreshCustomerInfo: () => Promise<void>;
};

const createSnapshotFromCustomerInfo = (
  info: RevenueCatCustomerInfo | null,
): SubscriptionSnapshot | null => {
  if (!info) {
    return null;
  }
  return {
    activeEntitlementIds: info.activeEntitlementIds,
  };
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      customerInfo: null,
      isPro: false,
      activeEntitlementId: null,
      offerings: null,
      selectedPackageId: null,
      lastSyncedAt: null,
      isLoading: false,
      isPurchasing: false,
      isRestoring: false,
      errorMessage: null,
      plan: "free",
      setSelectedPackageId: (id) => set({ selectedPackageId: id }),
      initSubscription: async () => {
        const current = get();
        if (current.isLoading) {
          return;
        }
        set({ isLoading: true, errorMessage: null });
        try {
          const customerInfo = await revenuecatClient.getCustomerInfo();
          const snapshot = createSnapshotFromCustomerInfo(customerInfo);
          const plan = resolvePlanFromSnapshot(snapshot);
          set({
            customerInfo,
            isPro: plan === "pro",
            activeEntitlementId: snapshot?.activeEntitlementIds[0] ?? null,
            plan,
            lastSyncedAt: Date.now(),
          });
        } catch (error) {
          set({
            errorMessage:
              error instanceof Error ? error.message : "Failed to sync subscription",
          });
        } finally {
          set({ isLoading: false });
        }
      },
      loadOfferings: async () => {
        set({ isLoading: true, errorMessage: null });
        try {
          const { currentOffering } = await revenuecatClient.getOfferings();
          set({
            offerings: currentOffering,
            selectedPackageId:
              currentOffering?.availablePackages[0]?.identifier ?? null,
          });
        } catch (error) {
          set({
            errorMessage:
              error instanceof Error ? error.message : "Failed to load offerings",
          });
        } finally {
          set({ isLoading: false });
        }
      },
      purchaseSelectedPackage: async () => {
        const { selectedPackageId } = get();
        if (!selectedPackageId) {
          return;
        }
        set({ isPurchasing: true, errorMessage: null });
        try {
          if (
            __DEV__ &&
            process.env.EXPO_PUBLIC_SUBSCRIPTION_TEST_MODE === "mock_failure"
          ) {
            set({
              isPurchasing: false,
              errorMessage: "Simulated purchase failure (debug)",
            });
            return;
          }
          if (
            __DEV__ &&
            process.env.EXPO_PUBLIC_SUBSCRIPTION_TEST_MODE === "mock_success"
          ) {
            set({
              customerInfo: null,
              isPro: true,
              activeEntitlementId: "debug_pro",
              plan: "pro",
              lastSyncedAt: Date.now(),
              isPurchasing: false,
              errorMessage: null,
            });
            return;
          }
          const { customerInfo } = await revenuecatClient.purchasePackage(
            selectedPackageId,
          );
          const snapshot = createSnapshotFromCustomerInfo(customerInfo);
          const plan = resolvePlanFromSnapshot(snapshot);
          set({
            customerInfo,
            isPro: plan === "pro",
            activeEntitlementId: snapshot?.activeEntitlementIds[0] ?? null,
            plan,
            lastSyncedAt: Date.now(),
          });
        } catch (error) {
          set({
            errorMessage:
              error instanceof Error ? error.message : "Failed to complete purchase",
          });
        } finally {
          set({ isPurchasing: false });
        }
      },
      restorePurchases: async () => {
        set({ isRestoring: true, errorMessage: null });
        try {
          const { customerInfo } = await revenuecatClient.restorePurchases();
          const snapshot = createSnapshotFromCustomerInfo(customerInfo);
          const plan = resolvePlanFromSnapshot(snapshot);
          set({
            customerInfo,
            isPro: plan === "pro",
            activeEntitlementId: snapshot?.activeEntitlementIds[0] ?? null,
            plan,
            lastSyncedAt: Date.now(),
          });
        } catch (error) {
          set({
            errorMessage:
              error instanceof Error ? error.message : "Failed to restore purchases",
          });
        } finally {
          set({ isRestoring: false });
        }
      },
      refreshCustomerInfo: async () => {
        set({ isLoading: true, errorMessage: null });
        try {
          const customerInfo = await revenuecatClient.getCustomerInfo();
          const snapshot = createSnapshotFromCustomerInfo(customerInfo);
          const plan = resolvePlanFromSnapshot(snapshot);
          set({
            customerInfo,
            isPro: plan === "pro",
            activeEntitlementId: snapshot?.activeEntitlementIds[0] ?? null,
            plan,
            lastSyncedAt: Date.now(),
          });
        } catch (error) {
          set({
            errorMessage:
              error instanceof Error ? error.message : "Failed to refresh subscription",
          });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "subscription-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        customerInfo: state.customerInfo,
        isPro: state.isPro,
        activeEntitlementId: state.activeEntitlementId,
        lastSyncedAt: state.lastSyncedAt,
        plan: state.plan,
      }),
    },
  ),
);

