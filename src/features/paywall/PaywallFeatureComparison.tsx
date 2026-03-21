import { Text, View } from "react-native";

import { strings } from "@/theme/strings";

type FeatureRowProps = {
  label: string;
  freeValue: string;
  proValue: string;
};

export const PaywallFeatureComparison = () => {
  return (
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
  );
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
