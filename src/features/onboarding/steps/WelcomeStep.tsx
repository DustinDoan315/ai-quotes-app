import { HomeBackground } from "@/features/home/HomeBackground";
import { APP_BRAND_MARK } from "@/theme/appBrand";
import { HOME_BACKGROUNDS } from "@/theme/homeBackgrounds";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  onContinue: () => void;
};

const PREVIEW_PALETTE = HOME_BACKGROUNDS[0]; // dawn — purple/orange

export function WelcomeStep({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View
      className="flex-1 px-6"
      style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
      <Text className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-white/50">
        {APP_BRAND_MARK}
      </Text>

      <Text className="mb-3 text-center text-[34px] font-extrabold leading-[40px] text-white">
        {t("onboarding.welcome.headline")}
      </Text>
      <Text className="mb-8 text-center text-lg leading-7 text-white/55">
        {t("onboarding.welcome.subheadline")}
      </Text>

      {/* Preview card */}
      <View className="mx-auto mb-10 h-56 w-full max-w-sm overflow-hidden rounded-3xl border border-white/15">
        <HomeBackground palette={PREVIEW_PALETTE} />
        <View className="absolute inset-0 items-center justify-center p-8">
          <Text className="text-center text-[17px] font-semibold leading-7 text-white">
            {t("onboarding.welcome.previewQuote")}
          </Text>
          <Text className="mt-3 text-xs font-semibold uppercase tracking-widest text-white/60">
            {t("onboarding.welcome.previewAttribution")}
          </Text>
        </View>
      </View>

      <View className="flex-1" />

      <Pressable
        onPress={onContinue}
        className="rounded-2xl bg-white py-4"
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <Text className="text-center text-base font-bold text-black">
          {t("onboarding.welcome.cta")}
        </Text>
      </Pressable>

      <Text className="mt-4 text-center text-xs text-white/30">
        {t("onboarding.welcome.disclaimer")}
      </Text>
    </View>
  );
}
