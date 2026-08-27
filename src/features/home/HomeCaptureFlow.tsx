import { HomeHeader } from "@/components/HomeHeader";
import { HomeCameraSection, type HomeCameraSectionProps } from "@/features/home/HomeCameraSection";
import { useTranslation } from "react-i18next";
import type { QuoteMemory } from "@/types/memory";
import { Pressable, Text, View } from "react-native";

type Props = {
  viewportHeight: number;
  topInset: number;
  displayStreak: number;
  pastMemory: QuoteMemory | null;
  onPressProfile: () => void;
  onPressFriends: () => void;
  onPressSignIn: () => void;
  onPressStreak: () => void;
  onPressPastMemory: (date: string) => void;
  cameraSectionProps: HomeCameraSectionProps;
};

export function HomeCaptureFlow({
  viewportHeight,
  topInset,
  displayStreak,
  pastMemory,
  onPressProfile,
  onPressFriends,
  onPressSignIn,
  onPressStreak,
  onPressPastMemory,
  cameraSectionProps,
}: Props) {
  const { t } = useTranslation();
  const shouldShowHeader = !cameraSectionProps.dailyQuoteText;

  return (
    <View
      style={{
        height: viewportHeight,
        paddingTop: topInset,
      }}>
      {shouldShowHeader ? (
        <HomeHeader
          currentStreak={displayStreak}
          onPressProfile={onPressProfile}
          onPressFriends={onPressFriends}
          onPressSignIn={onPressSignIn}
          onPressStreak={onPressStreak}
        />
      ) : null}
      {pastMemory ? (
        <Pressable
          onPress={() => onPressPastMemory(pastMemory.date)}
          className="mx-4 mb-3 rounded-xl border border-white/15 bg-white/8 px-4 py-3"
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <Text className="text-xs font-semibold uppercase tracking-wide text-amber-300">
            {t("memories.thisDayInMemoriesLabel")}
          </Text>
          <Text
            className="mt-1 text-sm font-medium text-white"
            numberOfLines={2}>
            {pastMemory.quoteText}
          </Text>
        </Pressable>
      ) : null}
      <View className="w-full flex-1">
        <HomeCameraSection {...cameraSectionProps} />
      </View>
    </View>
  );
}
