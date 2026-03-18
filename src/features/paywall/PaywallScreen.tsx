import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { strings } from "@/theme/strings";
import { useSubscriptionStore } from "@/appState/subscriptionStore";
import { MotiView } from "moti";

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
    await purchaseSelectedPackage();
  };

  const handleRestorePress = async () => {
    await restorePurchases();
  };

  return (
    <View className="flex-1 bg-black/90">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 64,
          paddingBottom: 40,
        }}>
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

        <View className="mb-5 rounded-3xl bg-white/5 p-4">
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

        {offerings ? (
          <View className="mb-5 space-y-3">
            {offerings.availablePackages.map((pkg) => {
              const isSelected = pkg.identifier === selectedPackageId;
              const isBestValue = pkg.identifier === "pro_yearly";
              return (
                <Pressable
                  key={pkg.identifier}
                  onPress={() => setSelectedPackageId(pkg.identifier)}
                  className="rounded-2xl border px-4 py-3"
                  style={{
                    borderColor: isSelected ? "#FBBF24" : "rgba(148,163,184,0.6)",
                    backgroundColor: isSelected
                      ? "rgba(15,23,42,0.95)"
                      : "rgba(15,23,42,0.85)",
                  }}>
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-sm font-semibold text-white">
                        {pkg.title}
                      </Text>
                      <Text className="mt-0.5 text-xs text-white/70">
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

        <View className="mt-2 space-y-3">
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
            className="h-11 items-center justify-center rounded-full border border-white/30 bg-transparent"
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

