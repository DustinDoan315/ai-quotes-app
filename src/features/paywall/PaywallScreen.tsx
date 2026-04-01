import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSubscriptionStore } from "@/appState/subscriptionStore";
import { useUIStore } from "@/appState/uiStore";
import { PaywallAmbientBackground } from "@/features/paywall/PaywallAmbientBackground";
import { PaywallInfoStrip } from "@/features/paywall/PaywallInfoStrip";
import { PaywallScrollContent } from "@/features/paywall/PaywallScrollContent";
import { PaywallStickyFooter } from "@/features/paywall/PaywallStickyFooter";
import type { PaywallReason } from "@/features/paywall/types";
import { usePaywallOfferings } from "@/features/paywall/usePaywallOfferings";
import { analyticsEvents } from "@/services/analytics/events";
import { strings } from "@/theme/strings";
import { pickBestValuePackageId } from "@/utils/paywallPackage";

type Props = {
  reason?: PaywallReason;
  onClose: () => void;
};

export const PaywallScreen = ({ reason = "generic", onClose }: Props) => {
  const plan = useSubscriptionStore((s) => s.plan);
  const offerings = useSubscriptionStore((s) => s.offerings);
  const selectedPackageId = useSubscriptionStore((s) => s.selectedPackageId);
  const setSelectedPackageId = useSubscriptionStore(
    (s) => s.setSelectedPackageId,
  );
  const purchaseSelectedPackage = useSubscriptionStore(
    (s) => s.purchaseSelectedPackage,
  );
  const restorePurchases = useSubscriptionStore((s) => s.restorePurchases);
  const isPurchasing = useSubscriptionStore((s) => s.isPurchasing);
  const isRestoring = useSubscriptionStore((s) => s.isRestoring);
  const errorMessage = useSubscriptionStore((s) => s.errorMessage);
  const isLoading = useSubscriptionStore((s) => s.isLoading);

  const showToast = useUIStore((s) => s.showToast);

  const { offeringsFetchStatus, loadOfferings } = usePaywallOfferings(reason);

  useEffect(() => {
    if (plan !== "pro" || isPurchasing || isRestoring) {
      return;
    }
    showToast(strings.subscription.alreadyProToast, "success", 3000);
    onClose();
  }, [plan, isPurchasing, isRestoring, onClose, showToast]);

  const headline = useMemo(() => {
    if (reason === "ai_limit") return strings.subscription.contextAiLimitTitle;
    if (reason === "export_limit") {
      return strings.subscription.contextExportLimitTitle;
    }
    if (reason === "premium_theme") {
      return strings.subscription.contextPremiumThemeTitle;
    }
    if (reason === "persona_locked") {
      return strings.subscription.contextPersonaLockedTitle;
    }
    return strings.subscription.paywallHeroTitle;
  }, [reason]);

  const contextBody = useMemo(() => {
    if (reason === "ai_limit") return strings.subscription.aiLimitPaywallBody;
    if (reason === "export_limit") {
      return strings.subscription.exportLimitPaywallBody;
    }
    if (reason === "premium_theme") {
      return strings.subscription.premiumThemePaywallBody;
    }
    if (reason === "persona_locked") {
      return strings.subscription.personaPaywallBody;
    }
    return strings.subscription.paywallHeroSubtitle;
  }, [reason]);

  const bestValuePackageId = useMemo(() => {
    if (!offerings?.availablePackages.length) {
      return null;
    }
    return pickBestValuePackageId(
      offerings.availablePackages.map((p) => p.identifier),
    );
  }, [offerings]);

  const showOfferingsError =
    offeringsFetchStatus === "error" && Boolean(errorMessage);
  const showOfferingsLoading =
    offeringsFetchStatus === "loading" || (isLoading && !offerings);
  const hasPackages = Boolean(offerings?.availablePackages?.length);
  const canPurchase = hasPackages;
  const primaryLabel = isPurchasing
    ? strings.subscription.processingCta
    : selectedPackageId
      ? strings.subscription.primaryCta
      : strings.subscription.selectPlanCta;

  const infoStrip = useMemo(() => {
    if (isPurchasing) {
      return { variant: "purchasing" as const, error: null as string | null };
    }
    if (isRestoring) {
      return { variant: "restoring" as const, error: null as string | null };
    }
    if (showOfferingsLoading && !showOfferingsError) {
      return { variant: "loadingPlans" as const, error: null as string | null };
    }
    if (showOfferingsError) {
      return {
        variant: "error" as const,
        error: errorMessage ?? null,
      };
    }
    return null;
  }, [
    isPurchasing,
    isRestoring,
    showOfferingsLoading,
    showOfferingsError,
    errorMessage,
  ]);

  const handlePrimaryPress = async () => {
    const fallbackPackageId =
      selectedPackageId ??
      bestValuePackageId ??
      offerings?.availablePackages[0]?.identifier ??
      null;

    if (!fallbackPackageId) {
      const result = await loadOfferings();
      if (!result.ok) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast(
          result.errorMessage ?? strings.subscription.noPlansAvailable,
          "error",
          4500,
        );
      }
      return;
    }

    if (fallbackPackageId !== selectedPackageId) {
      setSelectedPackageId(fallbackPackageId);
    }

    analyticsEvents.paywallCheckoutStarted(reason, fallbackPackageId);
    const result = await purchaseSelectedPackage();
    if (!result.ok) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(
        result.errorMessage ?? strings.subscription.purchaseFailedToast,
        "error",
        4500,
      );
      return;
    }
    if (result.becamePro) {
      analyticsEvents.paywallPurchaseSucceeded(reason, fallbackPackageId);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(strings.subscription.purchaseSuccessToast, "success", 5200);
      setTimeout(() => {
        onClose();
      }, 450);
      return;
    }
    showToast(strings.subscription.purchaseVerifyLater, "info", 5000);
  };

  const handleRestorePress = async () => {
    const result = await restorePurchases();
    if (!result.ok) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(
        result.errorMessage ?? strings.subscription.restoreFailedToast,
        "error",
        4500,
      );
      return;
    }
    if (result.becamePro) {
      analyticsEvents.paywallRestoreSucceeded(reason);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(strings.subscription.restoreSuccessToast, "success", 5200);
      setTimeout(() => {
        onClose();
      }, 450);
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showToast(strings.subscription.restoreNoActiveToast, "info", 4000);
  };

  return (
    <View className="flex-1 bg-transparent">
      <PaywallAmbientBackground />
      <SafeAreaView className="flex-1 w-full max-w-full" edges={["top"]}>
        <View className="flex-row items-center justify-end px-4 pb-2">
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={14}
            className="h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10">
            <Ionicons name="close" size={24} color="#f8fafc" />
          </Pressable>
        </View>

        {infoStrip ? (
          <PaywallInfoStrip
            variant={infoStrip.variant}
            errorDetail={infoStrip.error}
            onRetryLoad={() => {
              loadOfferings().catch(() => undefined);
            }}
          />
        ) : null}

        <PaywallScrollContent
          headline={headline}
          contextBody={contextBody}
          showOfferingsLoading={showOfferingsLoading}
          showOfferingsError={showOfferingsError}
          offerings={offerings}
          hasPackages={hasPackages}
          bestValuePackageId={bestValuePackageId}
          selectedPackageId={selectedPackageId}
          onSelectPackage={setSelectedPackageId}
        />

        <PaywallStickyFooter
          primaryLabel={primaryLabel}
          primaryDisabled={isPurchasing || !canPurchase || plan === "pro"}
          isPurchasing={isPurchasing}
          isRestoring={isRestoring}
          onPurchase={() => {
            handlePrimaryPress().catch(() => undefined);
          }}
          onRestore={() => {
            handleRestorePress().catch(() => undefined);
          }}
          onDismiss={onClose}
        />
      </SafeAreaView>
    </View>
  );
};
