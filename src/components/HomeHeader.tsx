import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getStreakTier } from "@/utils/streakMilestones";
import { useUserStore } from "@/appState/userStore";
import { useTranslation } from "react-i18next";

interface HomeHeaderProps {
  readonly currentStreak: number;
  readonly onPressProfile?: () => void;
  readonly onPressFriends?: () => void;
  readonly onPressSignIn?: () => void;
  readonly onPressStreak?: () => void;
}

export function HomeHeader({
  currentStreak,
  onPressProfile,
  onPressFriends,
  onPressSignIn,
  onPressStreak,
}: HomeHeaderProps) {
  const { t } = useTranslation();
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
            disabled={!handleProfilePress}
            accessibilityRole="button"
            accessibilityLabel={t(showSignInCta ? "friends.signInButton" : "home.accessibility.profile")}
            accessibilityState={{ disabled: !handleProfilePress }}
            className="h-12 w-12 items-center justify-center rounded-full bg-black/30"
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
              borderWidth: 1.5,
              borderColor: "rgba(255,255,255,0.28)",
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
              accessibilityRole="button"
              className="min-h-12 justify-center rounded-full bg-white/20 px-3 py-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
              <Text className="text-sm font-semibold text-white">
                {t("friends.signInButton")}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={onPressFriends}
            disabled={!onPressFriends}
            accessibilityRole="button"
            accessibilityLabel={t("home.accessibility.inviteFriends")}
            accessibilityState={{ disabled: !onPressFriends }}
            className="h-12 flex-row items-center rounded-full bg-black/40 px-3"
            style={({ pressed }) => ({
              opacity: onPressFriends ? (pressed ? 0.8 : 1) : 0.5,
            })}>
            <Ionicons name="share-social-outline" size={18} color="#ffffff" />
            <Text className="ml-2 text-sm font-semibold text-white">
              {t("home.inviteCta")}
            </Text>
          </Pressable>
          <Pressable
            onPress={onPressStreak}
            disabled={!onPressStreak}
            accessibilityRole="button"
            accessibilityLabel={t("home.accessibility.streak", { count: currentStreak })}
            accessibilityState={{ disabled: !onPressStreak }}
            className="h-12 min-w-12 flex-row items-center rounded-full px-3 py-1.5"
            style={({ pressed }) => ({
              opacity: pressed ? 0.75 : 1,
              backgroundColor: `${tier.color}22`,
              borderWidth: 1,
              borderColor: `${tier.color}44`,
            })}>
            <Ionicons name={tier.icon} size={tier.size} color={tier.color} />
            <Text className="ml-1.5 text-sm font-semibold text-white">
              {currentStreak}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
