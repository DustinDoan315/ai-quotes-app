import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";

import { useTranslation } from "react-i18next";
import {
  type RevenueCatOffering,
  type RevenueCatPackageId,
} from "@/services/paywall/types";
import { displayTitleForPackage } from "@/utils/paywallPackage";

type Props = {
  offerings: RevenueCatOffering;
  selectedPackageId: RevenueCatPackageId | null;
  bestValuePackageId: string | null;
  onSelectPackage: (id: RevenueCatPackageId) => void;
};

export const PaywallPackageList = ({
  offerings,
  selectedPackageId,
  bestValuePackageId,
  onSelectPackage,
}: Props) => {
  const { t } = useTranslation();
  return (
    <View className="mb-2 w-full max-w-full">
      <Text className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-amber-200/90">
        {t("subscription.choosePlanHeader")}
      </Text>
      <View className="w-full gap-3">
        {offerings.availablePackages.map((pkg) => {
          const isSelected = pkg.identifier === selectedPackageId;
          const isBest = pkg.identifier === bestValuePackageId;
          const title = displayTitleForPackage(pkg);
          return (
            <Pressable
              key={pkg.identifier}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectPackage(pkg.identifier);
              }}
              className="w-full max-w-full overflow-hidden rounded-2xl border-2"
              style={{
                borderColor: isSelected ? "#FBBF24" : "rgba(148,163,184,0.4)",
                backgroundColor: isSelected
                  ? "rgba(251,191,36,0.16)"
                  : "rgba(15,23,42,0.98)",
                shadowColor: isSelected ? "#fbbf24" : "transparent",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: isSelected ? 0.35 : 0,
                shadowRadius: 14,
                elevation: isSelected ? 8 : 0,
              }}>
              {isBest ? (
                <View className="bg-amber-400 px-3 py-1.5">
                  <Text className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-950">
                    {t("subscription.bestValueTag")}
                  </Text>
                </View>
              ) : null}
              <View className="w-full flex-row items-start px-3 py-3.5">
                <View
                  className="mr-2.5 mt-1 h-6 w-6 shrink-0 items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: isSelected ? "#FBBF24" : "rgba(255,255,255,0.45)",
                    backgroundColor: isSelected ? "#FBBF24" : "transparent",
                  }}>
                  {isSelected ? (
                    <View className="h-2.5 w-2.5 rounded-full bg-slate-950" />
                  ) : null}
                </View>
                <View className="min-w-0 flex-1 pr-2">
                  <Text
                    className="text-base font-semibold text-slate-50"
                    numberOfLines={3}>
                    {title}
                  </Text>
                  {pkg.description ? (
                    <Text
                      className="mt-1 text-xs leading-4 text-slate-400"
                      numberOfLines={3}>
                      {pkg.description}
                    </Text>
                  ) : null}
                </View>
                <View className="max-w-[38%] shrink-0 items-end pl-1">
                  <Text
                    className="text-right text-base font-bold text-amber-200"
                    numberOfLines={2}>
                    {pkg.priceString}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
