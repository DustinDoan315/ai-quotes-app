import { useReminderStore } from "@/appState/reminderStore";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BULLET_EMOJIS = ["🌅", "⏰", "🔕"] as const;

type Props = {
  onContinue: () => void;
};

export function NotificationStep({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const enableReminder = useReminderStore((s) => s.enableReminder);

  async function handleEnable() {
    await enableReminder();
    onContinue();
  }

  return (
    <View
      className="flex-1 px-6"
      style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
      <View className="mb-8 items-center">
        <View className="h-20 w-20 items-center justify-center rounded-[28px] border border-white/20 bg-white/10">
          <Text className="text-4xl">🔔</Text>
        </View>
      </View>

      <Text className="mb-3 text-center text-[28px] font-extrabold leading-[34px] text-white">
        {t("onboarding.notification.title")}
      </Text>
      <Text className="mb-10 text-center text-base leading-6 text-white/50">
        {t("onboarding.notification.subtitle")}
      </Text>

      <View className="mb-8 gap-5">
        {BULLET_EMOJIS.map((emoji, i) => (
          <View key={emoji} className="flex-row items-start gap-4">
            <Text className="text-xl">{emoji}</Text>
            <Text className="flex-1 text-base leading-6 text-white/80">
              {t(`onboarding.notification.bullet${i + 1}`)}
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-1" />

      <Pressable
        onPress={() => {
          void handleEnable();
        }}
        className="mb-3 rounded-2xl bg-white py-4"
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <Text className="text-center text-base font-bold text-black">
          {t("onboarding.notification.ctaEnable")}
        </Text>
      </Pressable>

      <Pressable
        onPress={onContinue}
        className="py-3"
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
        <Text className="text-center text-sm font-medium text-white/40">
          {t("onboarding.notification.ctaSkip")}
        </Text>
      </Pressable>
    </View>
  );
}
