import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { revenuecatClient } from "@/services/paywall/revenuecatClient";
import {
  type OfferingsFetchStatus,
  type RevenueCatOffering,
  type RevenueCatCustomerInfo,
  type RevenueCatPackageId,
} from "@/services/paywall/types";
import { type SubscriptionPlanId } from "@/domain/subscription/subscriptionConstants";
import {
  resolvePlanFromSnapshot,
  type SubscriptionSnapshot,
} from "@/domain/subscription/subscriptionResolver";
import { pickBestValuePackageId } from "@/utils/paywallPackage";

type SubscriptionActionResult = {
  ok: boolean;
  becamePro?: boolean;
  errorMessage?: string;
};

type SubscriptionState = {
  customerInfo: RevenueCatCustomerInfo | null;
  isPro: boolean;
  activeEntitlementId: string | null;
  offeringsFetchStatus: OfferingsFetchStatus;
  offerings: RevenueCatOffering | null;
  selectedPackageId: RevenueCatPackageId | null;
  lastSyncedAt: number | null;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  errorMessage: string | null;
  plan: SubscriptionPlanId;
  setSelectedPackageId: (id: RevenueCatPackageId) => void;
  initSubscription: () => Promise<SubscriptionActionResult>;
  loadOfferings: () => Promise<SubscriptionActionResult>;
  purchaseSelectedPackage: (
    packageId?: RevenueCatPackageId | null,
  ) => Promise<SubscriptionActionResult>;
  restorePurchases: () => Promise<SubscriptionActionResult>;
  refreshCustomerInfo: () => Promise<SubscriptionActionResult>;
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
      offeringsFetchStatus: "idle",
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
          return { ok: true, becamePro: current.plan === "pro" };
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
          return { ok: true, becamePro: plan === "pro" };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to sync subscription";
          set({
            errorMessage,
          });
          return { ok: false, errorMessage };
        } finally {
          set({ isLoading: false });
        }
      },
      loadOfferings: async () => {
        if (get().offeringsFetchStatus === "loading") {
          return { ok: true };
        }
        set({
          isLoading: true,
          errorMessage: null,
          offeringsFetchStatus: "loading",
        });
        try {
          const { currentOffering } = await revenuecatClient.getOfferings();
          if (!currentOffering?.availablePackages?.length) {
            const errorMessage = "No subscription plans are available right now.";
            set({
              offerings: null,
              selectedPackageId: null,
              errorMessage,
              offeringsFetchStatus: "error",
            });
            return { ok: false, errorMessage };
          }
          const packageIds =
            currentOffering.availablePackages.map((p) => p.identifier);
          const preferredId =
            pickBestValuePackageId(packageIds) ??
            currentOffering.availablePackages[0]?.identifier ??
            null;
          set({
            offerings: currentOffering,
            selectedPackageId: preferredId,
            offeringsFetchStatus: "success",
          });
          return { ok: true };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to load offerings";
          set({
            offerings: null,
            selectedPackageId: null,
            errorMessage,
            offeringsFetchStatus: "error",
          });
          return { ok: false, errorMessage };
        } finally {
          set({ isLoading: false });
        }
      },
      purchaseSelectedPackage: async (packageId) => {
        set({ isPurchasing: true, errorMessage: null });
        try {
          const selectedPackageId = packageId ?? get().selectedPackageId;
          if (!selectedPackageId) {
            const errorMessage = "Select a plan before continuing.";
            set({ errorMessage });
            return { ok: false, errorMessage };
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
          return { ok: true, becamePro: plan === "pro" };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to complete purchase";
          set({
            errorMessage,
          });
          return { ok: false, errorMessage };
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
          return { ok: true, becamePro: plan === "pro" };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to restore purchases";
          set({
            errorMessage,
          });
          return { ok: false, errorMessage };
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
          return { ok: true, becamePro: plan === "pro" };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to refresh subscription";
          set({
            errorMessage,
          });
          return { ok: false, errorMessage };
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
