import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { strings } from "@/theme/strings";

type Item = { key: string; text: string };

const items: Item[] = [
  { key: "a", text: strings.subscription.paywallBullet1 },
  { key: "b", text: strings.subscription.paywallBullet2 },
  { key: "c", text: strings.subscription.paywallBullet3 },
];

export const PaywallValueBullets = () => {
  return (
    <View className="mt-5 w-full max-w-full gap-3">
      {items.map(({ key, text }) => (
        <View key={key} className="w-full flex-row items-start gap-3">
          <View className="mt-0.5 h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/25">
            <Ionicons name="checkmark" size={18} color="#6ee7b7" />
          </View>
          <Text className="min-w-0 flex-1 shrink text-[15px] leading-[22px] text-slate-100">
            {text}
          </Text>
        </View>
      ))}
    </View>
  );
};
