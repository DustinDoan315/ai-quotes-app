import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";

import { PaywallFeatureComparison } from "@/features/paywall/PaywallFeatureComparison";
import { PaywallPackageList } from "@/features/paywall/PaywallPackageList";
import { PaywallPlansSkeleton } from "@/features/paywall/PaywallPlansSkeleton";
import { PaywallValueBullets } from "@/features/paywall/PaywallValueBullets";
import {
  type RevenueCatPackageId,
  type RevenueCatOffering,
} from "@/services/paywall/types";
import { strings } from "@/theme/strings";

type Props = {
  headline: string;
  contextBody: string;
  showOfferingsLoading: boolean;
  showOfferingsError: boolean;
  offerings: RevenueCatOffering | null;
  hasPackages: boolean;
  bestValuePackageId: string | null;
  selectedPackageId: RevenueCatPackageId | null;
  onSelectPackage: (id: RevenueCatPackageId) => void;
  errorMessage: string | null;
  isPro: boolean;
};

export const PaywallScrollContent = ({
  headline,
  contextBody,
  showOfferingsLoading,
  showOfferingsError,
  offerings,
  hasPackages,
  bestValuePackageId,
  selectedPackageId,
  onSelectPackage,
  errorMessage,
  isPro,
}: Props) => {
  return (
    <ScrollView
      className="flex-1 w-full max-w-full self-stretch"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        width: "100%",
        maxWidth: "100%",
        alignSelf: "stretch",
        paddingHorizontal: 16,
        paddingBottom: 24,
      }}>
      <View className="w-full max-w-full rounded-3xl border border-white/10 bg-slate-950/95 p-4">
        <View className="mb-3 items-center">
          <View className="h-[76px] w-[76px] items-center justify-center rounded-[24px] border border-amber-400/40 bg-slate-900">
            <Text className="text-[42px]">✨</Text>
          </View>
          <View className="mt-3 rounded-full border border-amber-400/35 bg-amber-500/20 px-4 py-1.5">
            <Text className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-amber-100">
              {strings.subscription.heroEyebrow}
            </Text>
          </View>
        </View>

        <Text className="w-full text-center text-[26px] font-extrabold leading-[32px] text-slate-50">
          {headline}
        </Text>
        <Text className="mt-3 w-full text-center text-[15px] leading-[23px] text-slate-300">
          {contextBody}
        </Text>

        <PaywallValueBullets />
      </View>

      {showOfferingsLoading && !showOfferingsError ? (
        <View className="mt-6 w-full max-w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4">
          <PaywallPlansSkeleton />
        </View>
      ) : null}

      {!showOfferingsLoading && offerings && hasPackages ? (
        <View className="mt-6 w-full max-w-full">
          <PaywallPackageList
            offerings={offerings}
            selectedPackageId={selectedPackageId}
            bestValuePackageId={bestValuePackageId}
            onSelectPackage={onSelectPackage}
          />
        </View>
      ) : null}

      {!showOfferingsLoading && !hasPackages && !showOfferingsError ? (
        <View className="mt-6 w-full max-w-full rounded-2xl border border-amber-400/20 bg-slate-950/95 px-4 py-4">
          <Text className="w-full text-center text-sm leading-[22px] text-slate-200">
            {strings.subscription.noPlansAvailable}
          </Text>
        </View>
      ) : null}

      <View className="mt-6 w-full max-w-full">
        <PaywallFeatureComparison />
      </View>

      <View className="mt-5 w-full max-w-full flex-row items-start gap-3 rounded-2xl border border-sky-500/25 bg-slate-950/95 px-4 py-3">
        <Ionicons name="shield-checkmark" size={22} color="#38bdf8" />
        <Text className="min-w-0 flex-1 text-[13px] leading-[19px] text-slate-200">
          {strings.subscription.footerReassurance}
        </Text>
      </View>

      {__DEV__ && process.env.EXPO_PUBLIC_SUBSCRIPTION_TEST_MODE ? (
        <View className="mt-5 w-full max-w-full rounded-2xl border border-dashed border-amber-400/50 bg-amber-950/40 p-3">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">
            Test purchase mode
          </Text>
          <Text className="mt-1 text-[11px] text-amber-100">
            Mode: {process.env.EXPO_PUBLIC_SUBSCRIPTION_TEST_MODE}
          </Text>
          {errorMessage ? (
            <Text className="mt-1 text-[11px] text-red-300">{errorMessage}</Text>
          ) : null}
          <Text className="mt-1 text-[10px] text-slate-400">
            isPro: {isPro ? "yes" : "no"}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
};
