import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HOME_VIBE_RARITY_STYLE } from "@/theme/homeVibeRarity";
import { strings } from "@/theme/strings";
import type { HomeVibeHintParts } from "@/types/homeBackground";
import { getStreakTier } from "@/utils/streakMilestones";
import { useUserStore } from "@/appState/userStore";

interface HomeHeaderProps {
  readonly currentStreak: number;
  readonly onPressProfile?: () => void;
  readonly onPressFriends?: () => void;
  readonly onPressSignIn?: () => void;
  readonly vibeHint?: HomeVibeHintParts | null;
}

export function HomeHeader({
  currentStreak,
  onPressProfile,
  onPressFriends,
  onPressSignIn,
  vibeHint,
}: HomeHeaderProps) {
  const tier = getStreakTier(currentStreak);
  const profile = useUserStore((state) => state.profile);
  const avatarUrl = profile?.avatar_url ?? null;
  const isGuest = !profile?.user_id;
  const showSignInCta = isGuest && Boolean(onPressSignIn);
  const handleProfilePress = showSignInCta ? onPressSignIn : onPressProfile;
  return (
    <View className="px-4 pt-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={handleProfilePress}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/30"
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
            })}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <Ionicons name="person-circle-outline" size={26} color="#ffffff" />
            )}
          </Pressable>
          {showSignInCta ? (
            <Pressable
              onPress={onPressSignIn}
              className="rounded-full bg-white/20 px-3 py-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
              <Text className="text-sm font-semibold text-white">Sign in with phone</Text>
            </Pressable>
          ) : null}
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={onPressFriends}
            disabled={!onPressFriends}
            className="h-10 flex-row items-center rounded-full bg-black/40 px-3"
            style={({ pressed }) => ({
              opacity: onPressFriends ? (pressed ? 0.8 : 1) : 0.5,
            })}>
            <Ionicons name="share-social-outline" size={18} color="#ffffff" />
            <Text className="ml-2 text-sm font-semibold text-white">Invite</Text>
          </Pressable>
          <View className="flex-row items-center rounded-full bg-black/40 px-3 py-1.5">
            <Ionicons name={tier.icon} size={tier.size} color={tier.color} />
            <Text className="ml-1.5 text-sm font-semibold text-white">
              {currentStreak}
            </Text>
          </View>
        </View>
      </View>
      {vibeHint ? (
        <View className="mt-1.5 flex-row flex-wrap items-center gap-x-1 px-1">
          <Text className="text-[11px] font-medium text-white/85">
            {vibeHint.vibeName}
          </Text>
          <Text className="text-[11px] text-white/45">·</Text>
          <View className="flex-row items-center gap-1">
            <View
              className={`h-1.5 w-1.5 rounded-full ${
                HOME_VIBE_RARITY_STYLE[vibeHint.rarity].dot
              }`}
            />
            <Text
              className={`text-[11px] font-semibold ${
                HOME_VIBE_RARITY_STYLE[vibeHint.rarity].text
              }`}>
              {vibeHint.rarityLabel}
            </Text>
          </View>
          <Text className="text-[11px] text-white/45">·</Text>
          <Text className="text-[11px] font-medium text-white/70">
            {strings.home.luckLabel} {vibeHint.luckPercent}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

