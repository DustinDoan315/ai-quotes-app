import { OnboardingStepShell } from "@/features/onboarding/components/OnboardingStepShell";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  onContinue: () => void;
};

const PRO_FEATURES: Array<{
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  color: string;
}> = [
  {
    icon: "sparkles-outline",
    title: "Unlimited AI Quotes",
    subtitle: "Generate as many quotes as you want, every day.",
    color: "#FBBF24",
  },
  {
    icon: "brush-outline",
    title: "Rewrite & Remix",
    subtitle: "Rewrite any quote in calm, funny, or savage tones.",
    color: "#A78BFA",
  },
  {
    icon: "time-outline",
    title: "Future Quotes",
    subtitle: "See where your mindset could take you tomorrow.",
    color: "#34D399",
  },
  {
    icon: "share-social-outline",
    title: "Watermark-Free Sharing",
    subtitle: "Share your moments without the Inkly badge.",
    color: "#60A5FA",
  },
];

export function ProTeaserStep({ onContinue }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <OnboardingStepShell>
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 80 }}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-8 mt-4 items-center">
          <MotiView
            from={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 100 }}>
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-[28px] bg-white/10">
              <Ionicons name="rocket-outline" size={38} color="#FBBF24" />
            </View>
          </MotiView>
          <Text className="text-center text-2xl font-bold text-white">
            You're all set!
          </Text>
          <Text className="mt-2 text-center text-sm text-white/60">
            Free plan gets you started. Upgrade anytime to unlock everything.
          </Text>
        </View>

        {/* Feature list */}
        <View className="mb-6 gap-3">
          {PRO_FEATURES.map((feature, i) => (
            <MotiView
              key={feature.title}
              from={{ opacity: 0, translateX: -16 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: "timing", duration: 320, delay: 150 + i * 80 }}>
              <View className="flex-row items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <View
                  className="mr-4 h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${feature.color}22` }}>
                  <Ionicons name={feature.icon} size={20} color={feature.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-white">
                    {feature.title}
                  </Text>
                  <Text className="mt-0.5 text-xs text-white/55">
                    {feature.subtitle}
                  </Text>
                </View>
                <View className="ml-2 rounded-md bg-white/10 px-2 py-0.5">
                  <Text className="text-[10px] font-bold uppercase tracking-wide text-white/60">
                    Pro
                  </Text>
                </View>
              </View>
            </MotiView>
          ))}
        </View>
      </ScrollView>

      {/* Fixed bottom CTA */}
      <View
        className="absolute bottom-0 left-0 right-0 px-6"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
        <Pressable
          onPress={onContinue}
          className="w-full items-center rounded-2xl bg-white py-4"
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <Text className="text-base font-bold text-black">Start for Free</Text>
        </Pressable>
        <Text className="mt-2 text-center text-xs text-white/40">
          Upgrade anytime from your profile
        </Text>
      </View>
    </OnboardingStepShell>
  );
}
