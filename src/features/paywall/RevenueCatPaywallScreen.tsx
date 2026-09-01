import RevenueCatUI from "react-native-purchases-ui";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { useSubscriptionStore } from "@/appState/subscriptionStore";
import { useUIStore } from "@/appState/uiStore";
import type { PaywallReason, PaywallSource } from "@/features/paywall/types";
import { analyticsEvents } from "@/services/analytics/events";

type Props = {
  reason: PaywallReason;
  source: PaywallSource;
  onClose: () => void;
};

export function RevenueCatPaywallScreen({ reason, source, onClose }: Props) {
  const { t } = useTranslation();
  const plan = useSubscriptionStore((state) => state.plan);
  const refreshCustomerInfo = useSubscriptionStore(
    (state) => state.refreshCustomerInfo,
  );
  const showToast = useUIStore((state) => state.showToast);
  const closeScheduledRef = useRef(false);

  const closeAfterSuccess = useCallback(() => {
    if (closeScheduledRef.current) {
      return;
    }
    closeScheduledRef.current = true;
    setTimeout(onClose, 450);
  }, [onClose]);

  useEffect(() => {
    if (plan !== "pro") {
      return;
    }

    showToast(t("subscription.alreadyProToast"), "success", 3000);
    onClose();
  }, [onClose, plan, showToast, t]);

  const handlePurchaseStarted = useCallback(
    ({ packageBeingPurchased }: { packageBeingPurchased: { identifier: string } }) => {
      analyticsEvents.paywallCheckoutStarted(
        reason,
        source,
        packageBeingPurchased.identifier,
      );
    },
    [reason, source],
  );

  const handlePurchaseCompleted = useCallback(
    ({ storeTransaction }: { storeTransaction: { productIdentifier: string } }) => {
      analyticsEvents.paywallPurchaseSucceeded(
        reason,
        source,
        storeTransaction.productIdentifier,
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(t("subscription.purchaseSuccessToast"), "success", 5200);
      void refreshCustomerInfo();
      closeAfterSuccess();
    },
    [closeAfterSuccess, reason, refreshCustomerInfo, showToast, source, t],
  );

  const handlePurchaseError = useCallback(
    ({ error }: { error: { message: string } }) => {
      console.error("RevenueCat Paywall UI purchase failed:", error);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(error.message || t("subscription.purchaseFailedToast"), "error", 4500);
    },
    [showToast, t],
  );

  const handleRestoreCompleted = useCallback(async () => {
    const result = await refreshCustomerInfo();
    if (!result.becamePro) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast(t("subscription.restoreNoActiveToast"), "info", 4000);
      return;
    }

    analyticsEvents.paywallRestoreSucceeded(reason, source);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast(t("subscription.restoreSuccessToast"), "success", 5200);
    closeAfterSuccess();
  }, [closeAfterSuccess, reason, refreshCustomerInfo, showToast, source, t]);

  const handleRestoreError = useCallback(
    ({ error }: { error: { message: string } }) => {
      console.error("RevenueCat Paywall UI restore failed:", error);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(error.message || t("subscription.restoreFailedToast"), "error", 4500);
    },
    [showToast, t],
  );

  const handleDismiss = useCallback(() => {
    if (!closeScheduledRef.current) {
      onClose();
    }
  }, [onClose]);

  return (
    <View className="flex-1 bg-[#020617]">
      <RevenueCatUI.Paywall
        style={{ flex: 1 }}
        options={{ displayCloseButton: true }}
        onPurchaseStarted={handlePurchaseStarted}
        onPurchaseCompleted={handlePurchaseCompleted}
        onPurchaseError={handlePurchaseError}
        onRestoreCompleted={handleRestoreCompleted}
        onRestoreError={handleRestoreError}
        onDismiss={handleDismiss}
      />
    </View>
  );
}
