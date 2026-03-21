import { Text, View } from "react-native";

interface ProfilePhoneCardProps {
  phoneDisplay: string;
  phoneVerified: boolean;
}

export function ProfilePhoneCard({
  phoneDisplay,
  phoneVerified,
}: ProfilePhoneCardProps) {
  return (
    <View className="mb-6 flex-row items-center justify-between overflow-hidden rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5">
      <View>
        <Text className="text-xs font-medium uppercase tracking-wide text-white/50">
          Phone
        </Text>
        <Text className="mt-0.5 text-sm text-white">{phoneDisplay}</Text>
      </View>
      <Text
        className={
          phoneVerified
            ? "text-xs font-semibold text-emerald-400"
            : "text-xs text-white/60"
        }>
        {phoneVerified ? "Verified" : "Not verified"}
      </Text>
    </View>
  );
}
