import { Text, View } from "react-native";

import { strings } from "@/theme/strings";

export const PaywallPlansSkeleton = () => {
  return (
    <View className="mb-2 w-full max-w-full">
      <Text className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-amber-200/90">
        {strings.subscription.choosePlanHeader}
      </Text>
      <Text className="mb-4 text-sm leading-[21px] text-slate-300">
        {strings.subscription.statusLoadingPlansBody}
      </Text>
      <View className="w-full gap-3">
        <View className="h-[92px] w-full overflow-hidden rounded-2xl border border-white/15 bg-slate-900/80">
          <View className="h-2 w-full bg-amber-400/25" />
          <View className="flex-1 flex-row items-center px-3">
            <View className="h-6 w-6 rounded-full border border-white/25 bg-white/10" />
            <View className="ml-3 min-w-0 flex-1">
              <View className="h-3.5 w-full max-w-[180px] rounded bg-slate-600/50" />
              <View className="mt-2 h-2.5 w-full max-w-[120px] rounded bg-slate-700/50" />
            </View>
            <View className="h-5 w-14 shrink-0 rounded bg-slate-600/40" />
          </View>
        </View>
        <View className="h-[92px] w-full overflow-hidden rounded-2xl border border-white/12 bg-slate-900/60">
          <View className="flex-1 flex-row items-center px-3">
            <View className="h-6 w-6 rounded-full border border-white/20 bg-white/5" />
            <View className="ml-3 min-w-0 flex-1">
              <View className="h-3.5 w-full max-w-[160px] rounded bg-slate-600/40" />
              <View className="mt-2 h-2.5 w-full max-w-[100px] rounded bg-slate-700/40" />
            </View>
            <View className="h-5 w-12 shrink-0 rounded bg-slate-600/35" />
          </View>
        </View>
        <View className="h-[88px] w-full rounded-2xl border border-white/10 bg-slate-900/50" />
      </View>
    </View>
  );
};
