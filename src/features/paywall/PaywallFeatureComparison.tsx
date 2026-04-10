import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { useTranslation } from "react-i18next";

type FeatureRowProps = {
  label: string;
  freeValue: string;
  proValue: string;
  isLast: boolean;
};

export const PaywallFeatureComparison = () => {
  const { t } = useTranslation();
  return (
    <View className="mb-5 w-full max-w-full overflow-hidden rounded-3xl border border-amber-400/25 bg-slate-950/95">
      <View className="border-b border-amber-400/20 bg-amber-500/15 px-3 py-3">
        <Text className="text-center text-[11px] font-bold uppercase tracking-[0.12em] text-amber-100">
          {t("subscription.featureHeaderHighlight")}
        </Text>
      </View>

      <View className="flex-row border-b border-white/10 px-2 pb-2 pt-3">
        <View className="min-w-0 flex-1" />
        <View className="w-[68px] shrink-0 items-center">
          <Text className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {t("subscription.freeLabel")}
          </Text>
        </View>
        <View className="w-[68px] shrink-0 items-center">
          <Text className="text-[10px] font-bold uppercase tracking-wide text-amber-200">
            {t("subscription.proLabel")}
          </Text>
        </View>
      </View>

      <View className="px-1 pb-3 pt-1">
        <FeatureRow
          label={t("subscription.featureDailyQuotes")}
          freeValue={t("subscription.freeDailyQuotesValue")}
          proValue={t("subscription.proDailyQuotesValue")}
          isLast={false}
        />
        <FeatureRow
          label={t("subscription.featureExports")}
          freeValue={t("subscription.freeExportsValue")}
          proValue={t("subscription.proExportsValue")}
          isLast={false}
        />
        <FeatureRow
          label={t("subscription.featurePremiumThemes")}
          freeValue={t("subscription.freePremiumThemesValue")}
          proValue={t("subscription.proPremiumThemesValue")}
          isLast={false}
        />
        <FeatureRow
          label={t("subscription.featureAdvancedPersona")}
          freeValue={t("subscription.freeAdvancedPersonaValue")}
          proValue={t("subscription.proAdvancedPersonaValue")}
          isLast={false}
        />
        <FeatureRow
          label={t("subscription.featureWatermark")}
          freeValue={t("subscription.freeWatermarkValue")}
          proValue={t("subscription.proWatermarkValue")}
          isLast
        />
      </View>
    </View>
  );
};

const FeatureRow = ({ label, freeValue, proValue, isLast }: FeatureRowProps) => {
  return (
    <View
      className={`flex-row items-start py-2.5 ${isLast ? "" : "border-b border-white/10"}`}>
      <View className="min-w-0 flex-1 pr-1">
        <Text className="text-[13px] font-medium leading-[18px] text-slate-100">
          {label}
        </Text>
      </View>
      <View className="w-[68px] shrink-0 items-center pt-0.5">
        <View className="flex-col items-center gap-0.5">
          <Ionicons name="close-circle" size={16} color="#f87171" />
          <Text className="text-center text-[10px] leading-3 text-slate-400">
            {freeValue}
          </Text>
        </View>
      </View>
      <View className="w-[68px] shrink-0 items-center pt-0.5">
        <View className="flex-col items-center gap-0.5">
          <Ionicons name="checkmark-circle" size={17} color="#34d399" />
          <Text className="text-center text-[10px] font-semibold leading-3 text-emerald-200">
            {proValue}
          </Text>
        </View>
      </View>
    </View>
  );
};
