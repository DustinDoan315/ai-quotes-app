import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "react-native";
import { useUserStore } from "@/appState/userStore";
import { ProfileAuthedView } from "@/features/profile/ProfileAuthedView";
import { ProfileGuestView } from "@/features/profile/ProfileGuestView";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const isGuest = !profile?.user_id;

  if (isGuest) {
    return (
      <View
        className="flex-1 bg-transparent"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <ProfileGuestView
          onBack={() => router.back()}
          onLogin={() =>
            router.push({
              pathname: "/login",
              params: { returnTo: "/(tabs)/friends?autoShare=1" },
            } as never)
          }
          onInviteFriends={() => router.push("/(tabs)/friends" as never)}
        />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-transparent"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <ProfileAuthedView
        onBack={() => router.back()}
        onSignedOut={() => router.replace("/(tabs)" as never)}
      />
    </View>
  );
}

