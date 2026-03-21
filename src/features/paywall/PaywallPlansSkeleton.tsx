import { View } from "react-native";

export const PaywallPlansSkeleton = () => {
  return (
    <View className="mb-6">
      <View className="mb-3 h-3 w-28 rounded bg-white/15" />
      <View className="space-y-3">
        <View className="h-[88px] rounded-2xl bg-white/10" />
        <View className="h-[88px] rounded-2xl bg-white/10" />
        <View className="h-[88px] rounded-2xl bg-white/8" />
      </View>
    </View>
  );
};
