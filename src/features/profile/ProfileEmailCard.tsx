import { strings } from "@/theme/strings";
import { Text, View } from "react-native";

interface ProfileEmailCardProps {
  emailDisplay: string;
  emailVerified: boolean;
}

export function ProfileEmailCard({
  emailDisplay,
  emailVerified,
}: ProfileEmailCardProps) {
  return (
    <View className="mb-6 flex-row items-center justify-between overflow-hidden rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5">
      <View>
        <Text className="text-xs font-medium uppercase tracking-wide text-white/50">
          {strings.profile.email}
        </Text>
        <Text className="mt-0.5 text-sm text-white">{emailDisplay}</Text>
      </View>
      <Text
        className={
          emailVerified
            ? "text-xs font-semibold text-emerald-400"
            : "text-xs text-white/60"
        }>
        {emailVerified ? strings.profile.verified : strings.profile.notVerified}
      </Text>
    </View>
  );
}
