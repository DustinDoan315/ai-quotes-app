import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";

import { strings } from "@/theme/strings";
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
  return (
    <View className="mb-2">
      <Text className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
        {strings.subscription.choosePlanHeader}
      </Text>
      <View className="space-y-3">
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
              className="overflow-hidden rounded-2xl border-2"
              style={{
                borderColor: isSelected ? "#FBBF24" : "rgba(148,163,184,0.35)",
                backgroundColor: isSelected
                  ? "rgba(251,191,36,0.12)"
                  : "rgba(15,23,42,0.92)",
              }}>
              {isBest ? (
                <View className="bg-amber-400 px-3 py-1">
                  <Text className="text-center text-[10px] font-bold uppercase tracking-wide text-black">
                    {strings.subscription.bestValueTag}
                  </Text>
                </View>
              ) : null}
              <View className="flex-row items-center px-4 py-3.5">
                <View
                  className="mr-3 h-6 w-6 items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: isSelected ? "#FBBF24" : "rgba(255,255,255,0.35)",
                    backgroundColor: isSelected ? "#FBBF24" : "transparent",
                  }}>
                  {isSelected ? (
                    <View className="h-2.5 w-2.5 rounded-full bg-black" />
                  ) : null}
                </View>
                <View className="min-w-0 flex-1 pr-2">
                  <Text className="text-base font-semibold text-white" numberOfLines={2}>
                    {title}
                  </Text>
                  {pkg.description ? (
                    <Text
                      className="mt-0.5 text-xs text-white/60"
                      numberOfLines={2}>
                      {pkg.description}
                    </Text>
                  ) : null}
                </View>
                <View className="items-end">
                  <Text className="text-base font-bold text-white">
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
