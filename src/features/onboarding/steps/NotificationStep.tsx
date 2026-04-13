import { useReminderStore } from "@/appState/reminderStore";
import { OnboardingStepShell } from "@/features/onboarding/components/OnboardingStepShell";
import { MotiView } from "moti";
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
    <OnboardingStepShell>
      <View
        className="flex-1 px-6"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <MotiView
          from={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 160, delay: 100 }}
          className="mb-8 items-center">
          <MotiView
            animate={{
              rotate: ["0deg", "-12deg", "12deg", "-8deg", "8deg", "0deg"],
            }}
            transition={{
              type: "timing",
              duration: 700,
              delay: 800,
              loop: true,
              repeatDelay: 3000,
            }}>
            <View className="h-20 w-20 items-center justify-center rounded-[28px] border border-white/20 bg-white/10">
              <Text className="text-4xl">🔔</Text>
            </View>
          </MotiView>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 360, delay: 220 }}>
          <Text className="mb-3 text-center text-[28px] font-extrabold leading-[34px] text-white">
            {t("onboarding.notification.title")}
          </Text>
          <Text className="mb-10 text-center text-base leading-6 text-white/50">
            {t("onboarding.notification.subtitle")}
          </Text>
        </MotiView>

        <View className="mb-8 gap-5">
          {BULLET_EMOJIS.map((emoji, i) => (
            <MotiView
              key={emoji}
              from={{ opacity: 0, translateX: -16 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: "timing", duration: 340, delay: 340 + i * 90 }}>
              <View className="flex-row items-start gap-4">
                <Text className="text-xl">{emoji}</Text>
                <Text className="flex-1 text-base leading-6 text-white/80">
                  {t(`onboarding.notification.bullet${i + 1}`)}
                </Text>
              </View>
            </MotiView>
          ))}
        </View>

        <View className="flex-1" />

        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 380, delay: 560 }}>
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
        </MotiView>
      </View>
    </OnboardingStepShell>
  );
}
