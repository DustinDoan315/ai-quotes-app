import { HomeHeader } from "@/components/HomeHeader";
import { HomeCameraSection, type HomeCameraSectionProps } from "@/features/home/HomeCameraSection";
import { strings } from "@/theme/strings";
import type { QuoteMemory } from "@/types/memory";
import { Pressable, Text, View } from "react-native";

type Props = {
  viewportHeight: number;
  topInset: number;
  displayStreak: number;
  pastMemory: QuoteMemory | null;
  showInviteNudge: boolean;
  onPressProfile: () => void;
  onPressFriends: () => void;
  onPressSignIn: () => void;
  onPressPastMemory: (date: string) => void;
  onDismissInviteNudge: () => void;
  onPressInviteNudge: () => void;
  cameraSectionProps: HomeCameraSectionProps;
};

export function HomeCaptureFlow({
  viewportHeight,
  topInset,
  displayStreak,
  pastMemory,
  showInviteNudge,
  onPressProfile,
  onPressFriends,
  onPressSignIn,
  onPressPastMemory,
  onDismissInviteNudge,
  onPressInviteNudge,
  cameraSectionProps,
}: Props) {
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
        />
      ) : null}
      {pastMemory ? (
        <Pressable
          onPress={() => onPressPastMemory(pastMemory.date)}
          className="mx-4 mb-3 rounded-xl border border-white/15 bg-white/8 px-4 py-3"
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <Text className="text-xs font-semibold uppercase tracking-wide text-amber-300">
            {strings.memories.thisDayInMemoriesLabel}
          </Text>
          <Text
            className="mt-1 text-sm font-medium text-white"
            numberOfLines={2}>
            {pastMemory.quoteText}
          </Text>
        </Pressable>
      ) : null}
      {showInviteNudge ? (
        <View className="mx-4 mb-2 flex-row items-center justify-between rounded-xl border border-white/20 bg-white/10 px-4 py-3">
          <Text className="flex-1 text-sm text-white" numberOfLines={2}>
            {strings.home.inviteFriendsTitle}
          </Text>
          <View className="ml-2 flex-row gap-2">
            <Pressable
              onPress={onDismissInviteNudge}
              className="rounded-lg bg-white/20 px-3 py-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
              <Text className="text-xs font-medium text-white">
                {strings.home.inviteSkip}
              </Text>
            </Pressable>
            <Pressable
              onPress={onPressInviteNudge}
              className="rounded-lg bg-amber-400 px-3 py-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
              <Text className="text-xs font-semibold text-black">
                {strings.home.inviteCta}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <View className="w-full flex-1">
        <HomeCameraSection {...cameraSectionProps} />
      </View>
    </View>
  );
}
