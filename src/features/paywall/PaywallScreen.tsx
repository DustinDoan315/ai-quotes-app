import { Pressable, ScrollView, Text, View } from "react-native";

import { useSubscriptionStore } from "@/appState/subscriptionStore";
import { strings } from "@/theme/strings";
import { MotiView } from "moti";
import { useEffect, useMemo } from "react";

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
  const {
    offerings,
    selectedPackageId,
    setSelectedPackageId,
    purchaseSelectedPackage,
    restorePurchases,
    isPurchasing,
    isRestoring,
    errorMessage,
    isLoading,
    loadOfferings,
  } = useSubscriptionStore();

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

  const handlePrimaryPress = async () => {
    if (!selectedPackageId && offerings?.availablePackages[0]) {
      setSelectedPackageId(offerings.availablePackages[0].identifier);
    }
    await purchaseSelectedPackage();
  };

  const handleRestorePress = async () => {
    await restorePurchases();
  };

  useEffect(() => {
    if (!offerings && !isLoading) {
      void loadOfferings();
    }
  }, [offerings, isLoading, loadOfferings]);

  return (
    <View className="flex-1 bg-black">
      <View className="absolute inset-0 opacity-60">
        <View className="h-1/3 bg-amber-500/20" />
        <View className="h-1/3 bg-fuchsia-500/10" />
        <View className="h-1/3 bg-sky-500/10" />
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 64,
          paddingBottom: 40,
        }}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 400 }}
          className="mb-4 items-center">
          <View className="h-16 w-16 items-center justify-center rounded-3xl bg-black/70 shadow-lg shadow-amber-500/40">
            <Text className="text-3xl">✨</Text>
          </View>
          <Text className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/90">
            Pro Experience
          </Text>
        </MotiView>
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 350 }}
          className="mb-6">
          <Text className="text-center text-xl font-semibold text-white">
            {headline}
          </Text>
          <Text className="mt-2 text-center text-sm text-white/70">
            {strings.subscription.paywallHeroSubtitle}
          </Text>
        </MotiView>

        <View className="mb-5 rounded-3xl bg-black/70 p-4 shadow-lg shadow-black/60">
          <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/60">
            {strings.subscription.featureHeader}
          </Text>

          <View className="flex-row border-b border-white/10 pb-2">
            <View className="flex-1" />
            <View className="w-16 items-center">
              <Text className="text-[11px] font-semibold text-white/70">
                {strings.subscription.freeLabel}
              </Text>
            </View>
            <View className="w-16 items-center">
              <Text className="text-[11px] font-semibold text-amber-300">
                {strings.subscription.proLabel}
              </Text>
            </View>
          </View>

          <View className="mt-2 space-y-2">
            <FeatureRow
              label={strings.subscription.featureDailyQuotes}
              freeValue={strings.subscription.freeDailyQuotesValue}
              proValue={strings.subscription.proDailyQuotesValue}
            />
            <FeatureRow
              label={strings.subscription.featureExports}
              freeValue={strings.subscription.freeExportsValue}
              proValue={strings.subscription.proExportsValue}
            />
            <FeatureRow
              label={strings.subscription.featurePremiumThemes}
              freeValue={strings.subscription.freePremiumThemesValue}
              proValue={strings.subscription.proPremiumThemesValue}
            />
            <FeatureRow
              label={strings.subscription.featureAdvancedPersona}
              freeValue={strings.subscription.freeAdvancedPersonaValue}
              proValue={strings.subscription.proAdvancedPersonaValue}
            />
            <FeatureRow
              label={strings.subscription.featureWatermark}
              freeValue={strings.subscription.freeWatermarkValue}
              proValue={strings.subscription.proWatermarkValue}
            />
          </View>
        </View>

        <View className="mb-5 space-y-2">
          <View className="flex-row items-center gap-x-3">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-emerald-400/15">
              <Text className="text-lg">🔒</Text>
            </View>
            <Text className="flex-1 text-xs text-white/85">
              Secure purchase handled by the App Store or Google Play.
            </Text>
          </View>
          <View className="flex-row items-center gap-x-3">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-amber-400/15">
              <Text className="text-lg">⏰</Text>
            </View>
            <Text className="flex-1 text-xs text-white/85">
              Cancel anytime in your subscription settings.
            </Text>
          </View>
          <View className="flex-row items-center gap-x-3">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-sky-400/15">
              <Text className="text-lg">⭐️</Text>
            </View>
            <Text className="flex-1 text-xs text-white/85">
              Designed to keep your quote ritual fast, focused, and fun.
            </Text>
          </View>
        </View>

        {offerings ? (
          <View className="mb-5 space-y-3">
            {offerings.availablePackages.map((pkg) => {
              const isSelected = pkg.identifier === selectedPackageId;
              const isBestValue = pkg.identifier === "$rc_annual";
              const planLabel =
                pkg.identifier === "$rc_monthly"
                  ? "Monthly Pro"
                  : pkg.identifier === "$rc_annual"
                  ? "Yearly Pro"
                  : "Lifetime Pro";
              const samplePriceText =
                pkg.identifier === "$rc_monthly"
                  ? "$4.99 billed monthly"
                  : pkg.identifier === "$rc_annual"
                  ? "$29.99 billed yearly"
                  : "$59.99 one-time purchase";
              return (
                <Pressable
                  key={pkg.identifier}
                  onPress={() => setSelectedPackageId(pkg.identifier)}
                  className="rounded-2xl border px-4 py-3"
                  style={{
                    borderColor: isSelected
                      ? "#FBBF24"
                      : "rgba(148,163,184,0.6)",
                    backgroundColor: isSelected
                      ? "rgba(15,23,42,0.95)"
                      : "rgba(15,23,42,0.85)",
                  }}>
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-sm font-semibold text-white">
                        {planLabel}
                      </Text>
                      <Text className="mt-0.5 text-xs text-white/70">
                        {samplePriceText}
                      </Text>
                      <Text className="mt-0.5 text-[11px] text-white/60">
                        {pkg.description}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-sm font-semibold text-white">
                        {pkg.priceString}
                      </Text>
                      {isBestValue ? (
                        <View className="mt-1 rounded-full bg-amber-400/20 px-2 py-0.5">
                          <Text className="text-[10px] font-semibold text-amber-300">
                            {strings.subscription.bestValueTag}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View className="mt-4 space-y-3">
          <Pressable
            onPress={handlePrimaryPress}
            disabled={isPurchasing}
            className="h-12 items-center justify-center rounded-full bg-amber-400"
            style={({ pressed }) => ({
              opacity: pressed || isPurchasing ? 0.7 : 1,
            })}>
            <Text className="text-sm font-semibold text-black">
              {strings.subscription.primaryCta}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleRestorePress}
            disabled={isRestoring}
            className="mt-2 h-11 items-center justify-center rounded-full border border-white/30 bg-transparent"
            style={({ pressed }) => ({
              opacity: pressed || isRestoring ? 0.7 : 1,
            })}>
            <Text className="text-xs font-semibold text-white">
              {strings.subscription.restoreCta}
            </Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            className="h-11 items-center justify-center rounded-full bg-transparent">
            <Text className="text-xs font-medium text-white/70">
              {strings.subscription.maybeLaterCta}
            </Text>
          </Pressable>
        </View>
        {__DEV__ && process.env.EXPO_PUBLIC_SUBSCRIPTION_TEST_MODE ? (
          <View className="mt-5 rounded-2xl border border-dashed border-amber-400/60 bg-amber-500/10 p-3">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">
              Test purchase mode
            </Text>
            <Text className="mt-1 text-[11px] text-amber-100/90">
              Mode: {process.env.EXPO_PUBLIC_SUBSCRIPTION_TEST_MODE}
            </Text>
            {errorMessage ? (
              <Text className="mt-1 text-[11px] text-red-300">
                {errorMessage}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

type FeatureRowProps = {
  label: string;
  freeValue: string;
  proValue: string;
};

const FeatureRow = ({ label, freeValue, proValue }: FeatureRowProps) => {
  return (
    <View className="flex-row items-center py-1.5">
      <View className="flex-1">
        <Text className="text-xs font-medium text-white/85">{label}</Text>
      </View>
      <View className="w-16 items-center">
        <Text className="text-[11px] text-white/60">{freeValue}</Text>
      </View>
      <View className="w-16 items-center">
        <Text className="text-[11px] font-semibold text-amber-300">
          {proValue}
        </Text>
      </View>
    </View>
  );
};
