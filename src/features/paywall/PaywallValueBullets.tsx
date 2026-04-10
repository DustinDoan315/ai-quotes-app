import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { useTranslation } from "react-i18next";

type Item = { key: string; text: string };

export const PaywallValueBullets = () => {
  const { t } = useTranslation();
  const items: Item[] = [
    { key: "a", text: t("subscription.paywallBullet1") },
    { key: "b", text: t("subscription.paywallBullet2") },
    { key: "c", text: t("subscription.paywallBullet3") },
  ];
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
