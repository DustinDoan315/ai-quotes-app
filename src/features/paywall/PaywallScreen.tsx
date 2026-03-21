import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSubscriptionStore } from "@/appState/subscriptionStore";
import { useUIStore } from "@/appState/uiStore";
import { PaywallFeatureComparison } from "@/features/paywall/PaywallFeatureComparison";
import { PaywallPackageList } from "@/features/paywall/PaywallPackageList";
import { PaywallPlansSkeleton } from "@/features/paywall/PaywallPlansSkeleton";
import { PaywallStickyFooter } from "@/features/paywall/PaywallStickyFooter";
import { usePaywallOfferings } from "@/features/paywall/usePaywallOfferings";
import { strings } from "@/theme/strings";
import { pickBestValuePackageId } from "@/utils/paywallPackage";

type PaywallReason =
  | "ai_limit"
  | "export_limit"
  | "premium_theme"
  | "persona_locked"
  | "generic";

type Props = {
  reason?: PaywallReason;
  onClose: () => void;
};

export const PaywallScreen = ({ reason = "generic", onClose }: Props) => {
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
  const isPro = useSubscriptionStore((s) => s.isPro);

  const showToast = useUIStore((s) => s.showToast);

  const { offeringsFetchStatus, loadOfferings } = usePaywallOfferings();

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

  const bestValuePackageId = useMemo(() => {
    if (!offerings?.availablePackages.length) {
      return null;
    }
    return pickBestValuePackageId(
      offerings.availablePackages.map((p) => p.identifier),
    );
  }, [offerings]);

  const handlePrimaryPress = async () => {
    if (!selectedPackageId && offerings?.availablePackages[0]) {
      setSelectedPackageId(offerings.availablePackages[0].identifier);
    }
    await purchaseSelectedPackage();
    const state = useSubscriptionStore.getState();
    if (state.errorMessage) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(state.errorMessage, "error", 4000);
      return;
    }
    if (state.isPro) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(strings.subscription.purchaseSuccessToast, "success");
      onClose();
    }
  };

  const handleRestorePress = async () => {
    await restorePurchases();
    const state = useSubscriptionStore.getState();
    if (state.errorMessage) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(state.errorMessage, "error", 4000);
      return;
    }
    if (state.isPro) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(strings.subscription.restoreSuccessToast, "success");
      onClose();
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showToast(strings.subscription.restoreNoActiveToast, "info", 3500);
  };

  const showOfferingsError =
    offeringsFetchStatus === "error" && Boolean(errorMessage);
  const showOfferingsLoading =
    offeringsFetchStatus === "loading" || (isLoading && !offerings);
  const hasPackages = Boolean(offerings?.availablePackages?.length);
  const canUseDevPurchaseMock =
    __DEV__ && Boolean(process.env.EXPO_PUBLIC_SUBSCRIPTION_TEST_MODE);
  const canPurchase = hasPackages || canUseDevPurchaseMock;
  const primaryLabel = isPurchasing
    ? strings.subscription.processingCta
    : strings.subscription.primaryCta;

  return (
    <View className="flex-1 bg-black">
      <View className="absolute inset-0 opacity-60">
        <View className="h-1/3 bg-amber-500/20" />
        <View className="h-1/3 bg-fuchsia-500/10" />
        <View className="h-1/3 bg-sky-500/10" />
      </View>
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="flex-row items-center justify-end px-4 pb-2">
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={14}
            className="h-11 w-11 items-center justify-center rounded-full bg-white/12">
            <Ionicons name="close" size={24} color="#f8fafc" />
          </Pressable>
        </View>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 16,
          }}>
          <View className="mb-5 items-center px-1">
            <View className="h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-black/70 shadow-lg shadow-amber-500/30">
              <Text className="text-[40px]">✨</Text>
            </View>
            <Text className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200/90">
              Pro
            </Text>
          </View>
          <Text className="text-center text-[26px] font-bold leading-8 text-white">
            {headline}
          </Text>
          <Text className="mt-2 text-center text-[15px] leading-[22px] text-white/65">
            {strings.subscription.paywallHeroSubtitle}
          </Text>

          {showOfferingsError ? (
            <View className="mt-6 rounded-2xl border border-red-400/35 bg-red-950/45 p-4">
              <Text className="text-center text-sm leading-5 text-red-100">
                {errorMessage}
              </Text>
              <Pressable
                onPress={() => {
                  loadOfferings().catch(() => undefined);
                }}
                className="mt-4 h-11 items-center justify-center rounded-full bg-white/12">
                <Text className="text-sm font-semibold text-white">Try again</Text>
              </Pressable>
            </View>
          ) : null}

          {showOfferingsLoading && !showOfferingsError ? (
            <View className="mt-8">
              <PaywallPlansSkeleton />
            </View>
          ) : null}

          {!showOfferingsLoading && offerings && hasPackages ? (
            <View className="mt-8">
              <PaywallPackageList
                offerings={offerings}
                selectedPackageId={selectedPackageId}
                bestValuePackageId={bestValuePackageId}
                onSelectPackage={setSelectedPackageId}
              />
            </View>
          ) : null}

          <View className="mt-8">
            <PaywallFeatureComparison />
          </View>

          <View className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <Text className="text-center text-[12px] leading-[18px] text-white/55">
              {strings.subscription.footerReassurance}
            </Text>
          </View>

          {__DEV__ && process.env.EXPO_PUBLIC_SUBSCRIPTION_TEST_MODE ? (
            <View className="mt-5 rounded-2xl border border-dashed border-amber-400/50 bg-amber-500/10 p-3">
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">
                Test purchase mode
              </Text>
              <Text className="mt-1 text-[11px] text-amber-100/90">
                Mode: {process.env.EXPO_PUBLIC_SUBSCRIPTION_TEST_MODE}
              </Text>
              {errorMessage ? (
                <Text className="mt-1 text-[11px] text-red-300">{errorMessage}</Text>
              ) : null}
              <Text className="mt-1 text-[10px] text-white/40">
                isPro: {isPro ? "yes" : "no"}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <PaywallStickyFooter
          primaryLabel={primaryLabel}
          primaryDisabled={isPurchasing || !canPurchase}
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
